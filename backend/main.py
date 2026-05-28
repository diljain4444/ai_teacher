"""
FastAPI backend for AI Slide Explainer React frontend.
Wraps all b_file.py functions as REST endpoints.
Run with: uvicorn main:app --reload --port 8000
Deploy on Render: uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import os
import sys
import json
import uuid
import base64
import asyncio
import tempfile
import threading
import traceback
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, Response
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="AI Slide Explainer API", version="1.0.0")

# Allow specific origins from env for production; default to "*" for local dev
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS: list = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins != "*"
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOWED_ORIGINS != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory stores ──────────────────────────────────────────────
jobs: dict = {}   # job_id  → {status, progress, message, result, error}
files: dict = {}  # file_id → {path, filename, pages, size_mb}


# ── Helpers ──────────────────────────────────────────────────────
def _page_count(path: str) -> int:
    ext = path.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        import fitz
        doc = fitz.open(path)
        n = len(doc)
        doc.close()
        return n
    if ext in ("png", "jpg", "jpeg"):
        return 1
    return 999  # docx — unknown


def _set_job(job_id: str, **kwargs):
    if job_id in jobs:
        jobs[job_id].update(kwargs)


def _audio_to_b64(path: str) -> str:
    if path and os.path.exists(path):
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    return ""


def _detect_question_language(text: str, fallback: str = "english") -> str:
    if not text:
        return fallback

    # Script-based detection first.
    for ch in text:
        code = ord(ch)
        if 0x0A80 <= code <= 0x0AFF:
            return "gujarati"
        if 0x0980 <= code <= 0x09FF:
            return "bengali"
        if 0x0B80 <= code <= 0x0BFF:
            return "tamil"
        if 0x0C00 <= code <= 0x0C7F:
            return "telugu"
        if 0x0600 <= code <= 0x06FF:
            return "urdu"
        if 0x0900 <= code <= 0x097F:
            # Could be Hindi/Marathi. Prefer Hindi for Devanagari default.
            return "hindi"

    # Latin-script heuristic for Hinglish.
    t = text.lower()
    hinglish_markers = (
        "kya", "kaise", "kyu", "kyun", "hai", "nahi", "samjha", "samjhao",
        "matlab", "acha", "achha", "kr", "kar", "hoga", "mera", "mujhe",
        "tum", "aap", "iska", "uska", "kaun", "kon", "ye", "wo", "haan",
    )
    if any(token in t for token in hinglish_markers):
        return "hinglish"

    return "english" if fallback == "auto" else fallback


def _compact_slide_context(explanation_text: str, max_chars: int = 6000) -> str:
    if not explanation_text:
        return ""

    drop_keys = {"audio_b64", "query_audio", "audio", "audio_path", "voice_audio"}

    def _prune(value, depth=0):
        if depth > 5:
            return None
        if isinstance(value, dict):
            out = {}
            for k, v in value.items():
                if k in drop_keys:
                    continue
                pruned = _prune(v, depth + 1)
                if pruned is not None:
                    out[k] = pruned
            return out
        if isinstance(value, list):
            return [_prune(v, depth + 1) for v in value[:10]]
        if isinstance(value, str):
            return value[:500]
        return value

    compact_text = explanation_text
    try:
        payload = json.loads(explanation_text)
        compact_text = json.dumps(_prune(payload), ensure_ascii=False)
    except (json.JSONDecodeError, TypeError):
        compact_text = explanation_text

    if len(compact_text) > max_chars:
        compact_text = compact_text[:max_chars]
    return compact_text


# ── UPLOAD ───────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx", "png", "jpg", "jpeg"):
        raise HTTPException(400, "Unsupported format. Use PDF, DOCX, PNG, or JPG.")

    content = await file.read()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
    tmp.write(content)
    tmp.close()

    pages = _page_count(tmp.name)
    size_mb = round(len(content) / (1024 * 1024), 2)
    file_id = str(uuid.uuid4())

    files[file_id] = {
        "path": tmp.name,
        "filename": file.filename,
        "pages": pages,
        "size": f"{size_mb} MB",
    }

    return {"file_id": file_id, "filename": file.filename, "pages": pages, "size": f"{size_mb} MB"}


# ── PROCESS ──────────────────────────────────────────────────────
class ProcessRequest(BaseModel):
    file_id: str
    pages: Optional[List[int]] = None  # None = all pages
    language: str = "hinglish"
    task: str = "theory"


def _serialize_theory(pages, explained_list, audio_list, voice_gender="male"):
    results = []
    for i, (theory_resp, audio_path) in enumerate(zip(explained_list, audio_list)):
        page_no = pages[i] if i < len(pages) else i
        audio_b64 = _audio_to_b64(audio_path)
        for slide in theory_resp.slides:
            results.append({
                "page": page_no + 1,
                "task": "theory",
                "slide_summary": slide.slide_summary,
                "concepts": [
                    {"name": c.name, "original": c.concept_used_original, "explanation": c.concept_used_explanation}
                    for c in slide.concepts_used
                ],
                "content_points": [
                    {"original": p.content_original, "translation": p.content_original_translation}
                    for p in slide.content_points
                ],
                "real_life_example": slide.real_life_example,
                "audio_b64": audio_b64,
                "voice_gender": voice_gender,
            })
    return results


def _serialize_maths(pages, maths_explained, audio_list, voice_gender="male"):
    results = []
    for i, (item, audio_path) in enumerate(zip(maths_explained, audio_list)):
        page_no = pages[i] if i < len(pages) else i
        audio_b64 = _audio_to_b64(audio_path)
        item_type = item.get("type", "numerical") if isinstance(item, dict) else "numerical"
        data = item.get("data") if isinstance(item, dict) else item

        if item_type == "conceptual":
            results.append({
                "page": page_no + 1, "task": "maths", "type": "conceptual",
                "page_summary": data.page_summary,
                "concepts": [
                    {
                        "name": c.name, "original": c.concept_used_original,
                        "definition": c.definition, "explanation": c.simple_explanation,
                        "formula": c.formula_or_expression,
                        "when_to_use": c.when_to_use, "common_mistakes": c.common_mistakes,
                    }
                    for c in data.concepts
                ],
                "audio_b64": audio_b64,
                "voice_gender": voice_gender,
            })
        else:
            results.append({
                "page": page_no + 1, "task": "maths", "type": "numerical",
                "concepts_used": [
                    {"name": c.name, "original": c.concept_used_original, "explanation": c.explanation}
                    for c in data.concepts_used
                ],
                "questions": [
                    {
                        "number": q.question_number,
                        "question": q.original_question_text,
                        "explanation": q.original_question_text_explanation,
                        "given": q.given_info,
                        "find": q.to_find,
                        "find_explanation": q.to_find_explanation,
                        "steps": [
                            {"number": s.step_number, "title": s.title,
                             "math": s.math_working, "explanation": s.simple_explanation}
                            for s in q.steps
                        ],
                        "answer": q.final_answer,
                    }
                    for q in data.questions
                ],
                "audio_b64": audio_b64,
                "voice_gender": voice_gender,
            })
    return results


def _run_job(job_id: str, file_id: str, page_list, language: str, task: str):
    try:
        from b_file import preprocess, data_extraction, workflow, LANGUAGE_VOICES

        file_info = files.get(file_id)
        if not file_info:
            _set_job(job_id, status="error", error="File not found")
            return

        _set_job(job_id, status="processing", progress=10, message="Reading file…")
        preprocessed = preprocess(file_info["path"])

        _set_job(job_id, progress=25, message="Indexing pages…")
        all_docs = data_extraction(preprocessed)

        pages = page_list if page_list else sorted({d["page_no"] for d in all_docs})

        voice_name = LANGUAGE_VOICES.get(language.lower(), "en-US-GuyNeural")
        voice_lower = voice_name.lower()
        female_markers = ("swara", "aarohi", "jenny", "priya", "neerja", "female")
        voice_gender = "female" if any(marker in voice_lower for marker in female_markers) else "male"

        _set_job(job_id, progress=38, message=f"AI processing {len(pages)} page(s)…")

        state = {
            "pages": pages,
            "all_documents": all_docs,
            "extracted_docs": [],
            "language": language,
            "explained_list": [],
            "audio_list": [],
            "task": task,
            "maths_explained": [],
        }

        result_state = workflow.invoke(state)

        _set_job(job_id, progress=90, message="Building response…")

        if task == "theory":
            slides = _serialize_theory(
                pages,
                result_state["explained_list"],
                result_state["audio_list"],
                voice_gender=voice_gender,
            )
        else:
            slides = _serialize_maths(
                pages,
                result_state["maths_explained"],
                result_state["audio_list"],
                voice_gender=voice_gender,
            )

        # Clean temp audio files
        for ap in result_state.get("audio_list", []):
            try:
                if ap and os.path.exists(ap):
                    os.unlink(ap)
            except OSError:
                pass

        _set_job(job_id, status="done", progress=100, message="Done!",
                 result={"slides": slides, "language": language, "task": task})

    except Exception as exc:
        _set_job(job_id, status="error", progress=0, error=str(exc))
        traceback.print_exc()


@app.post("/api/process")
async def start_processing(req: ProcessRequest):
    if req.file_id not in files:
        raise HTTPException(404, "File not found. Upload first.")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "progress": 0, "message": "Queued…", "result": None, "error": None}

    t = threading.Thread(target=_run_job,
                         args=(job_id, req.file_id, req.pages, req.language, req.task),
                         daemon=True)
    t.start()

    return {"job_id": job_id}


@app.get("/api/jobs/{job_id}/status")
async def job_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return {k: job[k] for k in ("status", "progress", "message", "error")}


@app.get("/api/jobs/{job_id}/events")
async def job_events(job_id: str):
    """SSE stream for real-time progress updates."""
    async def stream():
        while True:
            job = jobs.get(job_id)
            if not job:
                yield f"data: {json.dumps({'status': 'error', 'error': 'Job not found'})}\n\n"
                break
            payload = {k: job[k] for k in ("status", "progress", "message", "error")}
            yield f"data: {json.dumps(payload)}\n\n"
            if job["status"] in ("done", "error"):
                break
            await asyncio.sleep(1)

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/jobs/{job_id}/result")
async def job_result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job["status"] == "error":
        raise HTTPException(500, job.get("error", "Processing failed"))
    if job["status"] != "done":
        raise HTTPException(400, f"Job not complete yet (status: {job['status']})")
    return job["result"]


# ── QUIZ GENERATION ───────────────────────────────────────────────
class QuizRequest(BaseModel):
    file_id: str
    pages: Optional[List[int]] = None
    task: str = "theory"


@app.post("/api/quiz")
async def generate_quiz_endpoint(req: QuizRequest):
    file_info = files.get(req.file_id)
    if not file_info:
        raise HTTPException(404, "File not found")

    from b_file import preprocess, data_extraction, quiz_generator

    preprocessed = preprocess(file_info["path"])
    all_docs = data_extraction(preprocessed)

    unique_pages = sorted({d["page_no"] for d in all_docs})
    if req.pages:
        unique_pages = [p for p in unique_pages if p in req.pages]

    quiz_items = []
    for page_no in unique_pages:
        page_docs = [d for d in all_docs if d["page_no"] == page_no]
        results = quiz_generator(page_docs, task=req.task)
        for r in results:
            for q in r.full_ques:
                quiz_items.append({
                    "page": page_no + 1,
                    "question": q.que,
                    "answer": q.ans,
                    "options": [o.single_option for o in q.options],
                })

    return {"quiz": quiz_items, "total": len(quiz_items)}


# ── Q&A BANK ──────────────────────────────────────────────────────
class QARequest(BaseModel):
    file_id: str
    pages: Optional[List[int]] = None
    task: str = "theory"


@app.post("/api/qa-bank")
async def generate_qa_bank(req: QARequest):
    file_info = files.get(req.file_id)
    if not file_info:
        raise HTTPException(404, "File not found")

    from b_file import preprocess, data_extraction, question_generator

    preprocessed = preprocess(file_info["path"])
    all_docs = data_extraction(preprocessed)

    unique_pages = sorted({d["page_no"] for d in all_docs})
    if req.pages:
        unique_pages = [p for p in unique_pages if p in req.pages]

    qa_items = []
    for page_no in unique_pages:
        page_docs = [d for d in all_docs if d["page_no"] == page_no]
        results = question_generator(page_docs, task=req.task)
        for r in results:
            for q in r.multi_questions:
                qa_items.append({"page_no": page_no, "question": q.question, "answer": q.ans})

    return {"qa": qa_items, "total": len(qa_items)}


# ── ASK QUESTION ─────────────────────────────────────────────────
class AskRequest(BaseModel):
    explanation_text: str = ""
    question: str
    language: str = "auto"


@app.post("/api/ask")
async def ask_question(req: AskRequest):
    from b_file import answer_question_direct

    preferred = (req.language or "auto").strip().lower()
    effective_language = _detect_question_language(req.question, fallback=preferred)
    # Pure chatbot mode: do not send slide context to reduce prompt size and allow general Q&A.
    compact_context = ""
    try:
        result = await asyncio.to_thread(
            answer_question_direct,
            compact_context,
            req.question,
            effective_language,
        )
    except Exception as exc:
        # Groq sometimes rejects long prompts; retry with stricter context budget.
        if "Please reduce the length" in str(exc):
            tiny_context = ""
            result = await asyncio.to_thread(
                answer_question_direct,
                tiny_context,
                req.question,
                effective_language,
            )
        else:
            raise
    audio_b64 = _audio_to_b64(result.get("query_audio", ""))
    try:
        if result.get("query_audio") and os.path.exists(result["query_audio"]):
            os.unlink(result["query_audio"])
    except OSError:
        pass
    # Return both key styles for compatibility across frontend variants.
    return {
        "answer": result["query_ans"],
        "audio_b64": audio_b64,
        "query_ans": result["query_ans"],
        "query_audio": audio_b64,
        "language": effective_language,
    }


# ── DOWNLOAD DOCX ─────────────────────────────────────────────────
class DownloadQAReq(BaseModel):
    qa_bank: list
    title: str = "Practice Questions"


@app.post("/api/download/qa")
async def download_qa(req: DownloadQAReq):
    from b_file import generate_qa_docx
    docx_bytes = generate_qa_docx(req.qa_bank, req.title)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="practice_questions.docx"'},
    )


class DownloadQuizReq(BaseModel):
    quiz_data: list
    title: str = "Quiz"


@app.post("/api/download/quiz")
async def download_quiz(req: DownloadQuizReq):
    from b_file import generate_quiz_docx
    docx_bytes = generate_quiz_docx(req.quiz_data, req.title)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="quiz.docx"'},
    )


# ── SERVE AVATAR VIDEOS ───────────────────────────────────────────
# Videos are stored in assets/videos/ (one level above backend/)
_BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "videos")
_ALLOWED_VIDEOS = {"final_teacher.mp4", "final_female_teacher.mp4"}


@app.get("/api/video/{name}")
async def serve_video(name: str):
    if name not in _ALLOWED_VIDEOS:
        raise HTTPException(404, "Video not found")
    path = os.path.join(_BASE_DIR, name)
    if not os.path.exists(path):
        raise HTTPException(404, "Video file missing on server")
    return FileResponse(path, media_type="video/mp4")


# ── HEALTH ───────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
