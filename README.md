# AI Learner — Full-Stack AI Study App

An AI-powered study tool that ingests PDF/DOCX slides and generates slide-by-slide explanations, quizzes, and Q&A banks using LLMs (Groq/LangChain).

---

## Project Structure

```
amit_mama_1/
├── backend/              ← FastAPI Python backend
│   ├── main.py           ← API routes (was api.py)
│   ├── b_file.py         ← AI/ML business logic
│   ├── dictio.py         ← Hinglish→Devanagari dictionary
│   ├── requirements.txt  ← Python dependencies
│   └── .env.example      ← Environment variable template
│
├── react-frontend/       ← React + Vite frontend (+ Capacitor Android)
│   ├── src/
│   ├── .env.development  ← Local dev API URL
│   ├── .env.production   ← Production API URL (update before APK build)
│   ├── capacitor.config.json
│   └── android/          ← Android Studio project (Capacitor)
│
├── assets/
│   └── videos/           ← Teacher avatar MP4 files
│
├── render.yaml           ← Render.com deployment config
├── .gitignore
└── README.md
```

---

## Quick Start — Local Development

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Copy env template and fill in your keys
copy .env.example .env

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 2. Frontend

```bash
cd react-frontend
npm install
npm run dev          # http://localhost:3000
```

The Vite dev server proxies `/api/*` → `http://localhost:8000` automatically.

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (default: `*`) |
| `PORT` | Server port (Render sets this automatically) |

---

## Deploy Backend on Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo.
3. Render will auto-detect `render.yaml` and configure:
   - Root Dir: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set secret env vars in the Render dashboard:
   - `GROQ_API_KEY` — your Groq key
   - `ALLOWED_ORIGINS` — e.g. `https://your-app.com` (or leave blank to allow all)
5. After the first deploy, copy the service URL (e.g. `https://ai-learner-backend.onrender.com`).

---

## Build Android APK (Capacitor)

1. Update `react-frontend/.env.production` with your deployed backend URL:
   ```
   VITE_API_BASE_URL=https://ai-learner-backend.onrender.com
   ```

2. Build and sync:
   ```bash
   cd react-frontend
   npm run build
   npx cap sync android
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

4. In Android Studio: **Build → Generate Signed Bundle/APK → APK**.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a PDF/DOCX/image |
| `POST` | `/api/process` | Process slides (creates a background job) |
| `GET` | `/api/job/{job_id}` | Poll job status and result |
| `POST` | `/api/quiz` | Generate quiz questions for page range |
| `POST` | `/api/qa-bank` | Generate Q&A bank for page range |
| `POST` | `/api/ask` | Ask a follow-up question about a slide |
| `GET` | `/api/video/{name}` | Serve teacher avatar video |
| `GET` | `/api/health` | Health check |
