import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Download, RefreshCw, CheckCircle, XCircle, Trophy, Loader,
  Layers, AlignJustify, Bookmark, BookmarkCheck, ChevronLeft,
  ChevronRight, LayoutGrid, Send, RotateCcw, AlertCircle, Zap,
} from 'lucide-react'
import { generateQuiz, downloadQuizDocx } from '../api/client.js'
import useStore from '../store/useStore.js'

const OPTION_LABELS  = ['A', 'B', 'C', 'D']
const QS_PER_PAGE    = 10

const C = {
  answered  : { bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.45)',   text: '#4ade80' },
  marked    : { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.45)',  text: '#fbbf24' },
  unanswered: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#6b7280' },
  currentRing: '2px solid #3b82f6',
  accent    : 'linear-gradient(135deg,#3b82f6,#6366f1)',
  accentGlow: '0 0 24px rgba(99,102,241,0.35)',
  glass     : 'rgba(15,23,42,0.72)',
  glassBorder: 'rgba(255,255,255,0.07)',
}

function OptionBtn({ label, text, selected, correct, wrong, disabled, onClick }) {
  let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.08)'
  let labelBg = 'rgba(255,255,255,0.06)', color = '#94a3b8', labelColor = '#64748b'
  if (selected && !correct && !wrong) {
    bg = 'rgba(99,102,241,0.14)'; border = 'rgba(99,102,241,0.5)'
    color = '#e2e8f0'; labelBg = 'rgba(99,102,241,0.25)'; labelColor = '#818cf8'
  }
  if (correct) { bg = 'rgba(34,197,94,0.12)'; border = 'rgba(34,197,94,0.5)'; color = '#e2e8f0'; labelBg = 'rgba(34,197,94,0.2)'; labelColor = '#4ade80' }
  if (wrong)   { bg = 'rgba(248,113,113,0.1)'; border = 'rgba(248,113,113,0.45)'; color = '#e2e8f0'; labelBg = 'rgba(248,113,113,0.18)'; labelColor = '#f87171' }
  return (
    <motion.button
      whileHover={!disabled ? { x: 4, scale: 1.005 } : {}}
      whileTap={!disabled ? { scale: 0.995 } : {}}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-150"
      style={{ background: bg, border: `1px solid ${border}`, cursor: disabled ? 'default' : 'pointer' }}
    >
      <div className="flex items-center justify-center rounded-xl flex-shrink-0 text-xs font-bold transition-all"
        style={{ width: 32, height: 32, background: labelBg, color: labelColor, border: `1px solid ${border}` }}>
        {label}
      </div>
      <span className="text-sm flex-1 font-medium" style={{ color }}>{text}</span>
      {correct && <CheckCircle size={16} style={{ color: '#4ade80', flexShrink: 0 }} />}
      {wrong   && <XCircle    size={16} style={{ color: '#f87171', flexShrink: 0 }} />}
    </motion.button>
  )
}

function QNavBox({ num, state, isCurrent, onClick }) {
  const s = state === 'answered' ? C.answered : state === 'marked' ? C.marked : C.unanswered
  return (
    <motion.button
      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
      onClick={onClick} title={`Question ${num}`}
      className="flex items-center justify-center rounded-xl text-xs font-bold transition-all"
      style={{ width: 36, height: 36, background: s.bg, border: isCurrent ? C.currentRing : `1px solid ${s.border}`, color: isCurrent ? '#93c5fd' : s.text, boxShadow: isCurrent ? '0 0 12px rgba(59,130,246,0.45)' : 'none' }}
    >
      {num}
    </motion.button>
  )
}

function GenerateScreen({ fileInfo, loading, error, pageScope, setPageScope, fromPage, setFromPage, toPage, setToPage, totalDocPages, onGenerate }) {
  return (
    <div className="flex items-center justify-center min-h-full px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center rounded-3xl" style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#3b82f6,#6366f1,#8b5cf6)', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
            <Brain size={34} color="white" />
          </div>
        </div>
        <h1 className="text-center text-2xl font-black text-white mb-1">AI Quiz Generator</h1>
        <p className="text-center text-sm mb-8" style={{ color: '#64748b' }}>Configure and generate a smart quiz from your document</p>
        <div className="rounded-3xl p-6 space-y-5" style={{ background: C.glass, border: `1px solid ${C.glassBorder}`, backdropFilter: 'blur(20px)' }}>
          {fileInfo && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Page Scope</p>
              <div className="flex gap-2 mb-3">
                {[{ val: 'all', label: 'All Pages' }, { val: 'range', label: 'Page Range' }].map(({ val, label }) => (
                  <button key={val} onClick={() => { setPageScope(val); if (val === 'range') setToPage(totalDocPages) }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold flex-1 justify-center transition-all"
                    style={{ background: pageScope === val ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)', border: pageScope === val ? '1px solid rgba(99,102,241,0.55)' : '1px solid rgba(255,255,255,0.07)', color: pageScope === val ? '#a5b4fc' : '#64748b' }}>
                    {val === 'all' ? <AlignJustify size={14} /> : <Layers size={14} />}{label}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {pageScope === 'range' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="flex items-end gap-3 overflow-hidden">
                    <div className="flex-1">
                        <label className="text-xs mb-1.5 block" style={{ color: '#475569' }}>From page</label>
                        <input type="number" min={1} max={toPage} value={fromPage}
                          onChange={(e) => {
                            const v = Math.max(1, Math.min(Number(e.target.value), toPage))
                            setFromPage(v)
                          }}
                          className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs mb-1.5 block" style={{ color: '#475569' }}>To page</label>
                        <input type="number" min={fromPage} max={totalDocPages} value={toPage}
                          onChange={(e) => {
                            const v = Math.max(fromPage, Math.min(Number(e.target.value), totalDocPages))
                            setToPage(v)
                          }}
                          className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    <div className="pb-2.5 text-xs" style={{ color: '#334155' }}>/ {totalDocPages}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
            </div>
          )}
          <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(99,102,241,0.5)' }} whileTap={{ scale: 0.97 }} onClick={onGenerate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
            style={{ background: C.accent, boxShadow: C.accentGlow, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader size={16} className="animate-spin" /> Generating Quiz...</> : <><Zap size={16} /> Generate Quiz</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

function ScoreCard({ score, total, quizData, quizAnswers, downloading, onRetry, onDownload }) {
  const pct   = Math.round((score / total) * 100)
  const grade = pct >= 80 ? { emoji: '🎉', label: 'Excellent!',    color: '#4ade80' }
              : pct >= 60 ? { emoji: '👍', label: 'Good Job!',     color: '#60a5fa' }
              : pct >= 40 ? { emoji: '📚', label: 'Keep Going!',   color: '#fbbf24' }
              :             { emoji: '💪', label: 'Practice More', color: '#f87171' }
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} className="w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <motion.div initial={{ rotate: -10 }} animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center rounded-full"
            style={{ width: 88, height: 88, background: 'linear-gradient(135deg,#3b82f6,#6366f1,#8b5cf6)', boxShadow: '0 0 50px rgba(99,102,241,0.5)' }}>
            <Trophy size={40} color="white" />
          </motion.div>
        </div>
        <div className="text-center mb-8">
          <p className="text-5xl mb-1">{grade.emoji}</p>
          <h2 className="text-3xl font-black text-white mb-2">{grade.label}</h2>
          <p className="text-base" style={{ color: '#64748b' }}>You scored <span className="font-black text-xl" style={{ color: grade.color }}>{score}</span><span style={{ color: '#475569' }}> / {total}</span></p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="relative" style={{ width: 120, height: 120 }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <motion.circle cx="60" cy="60" r="50" fill="none" stroke="url(#sg)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={String(2 * Math.PI * 50)}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - pct / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }} />
              <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-black text-white">{pct}%</span></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6 rounded-2xl p-4" style={{ background: C.glass, border: `1px solid ${C.glassBorder}` }}>
          {[{ label: 'Correct', val: score, color: '#4ade80' }, { label: 'Wrong', val: total - score, color: '#f87171' }, { label: 'Total', val: total, color: '#93c5fd' }].map(({ label, val, color }) => (
            <div key={label} className="text-center"><div className="text-2xl font-black mb-0.5" style={{ color }}>{val}</div><div className="text-xs" style={{ color: '#475569' }}>{label}</div></div>
          ))}
        </div>
        {(() => {
          const problemQs = quizData
            .map((q, i) => ({ q, i, ua: quizAnswers[i] }))
            .filter(({ q, ua }) => !ua || ua.trim().toLowerCase() !== q.answer.trim().toLowerCase())
          if (problemQs.length === 0) return (
            <div className="flex items-center justify-center gap-2 mb-6 py-4 rounded-2xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle size={16} style={{ color: '#4ade80' }} />
              <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>All answers correct!</span>
            </div>
          )
          return (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={14} style={{ color: '#f87171' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Missed &amp; Incorrect ({problemQs.length})</span>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {problemQs.map(({ q, i, ua }) => {
                  const missed = !ua
                  return (
                    <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${missed ? 'rgba(99,102,241,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                      <div className="flex items-start gap-2.5 mb-3">
                        <div className="flex-shrink-0 flex items-center justify-center rounded-xl text-xs font-black mt-0.5"
                          style={{ width: 28, height: 28, background: missed ? 'rgba(99,102,241,0.18)' : 'rgba(248,113,113,0.15)', color: missed ? '#818cf8' : '#f87171', border: missed ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(248,113,113,0.35)' }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white leading-relaxed mb-0.5">{q.question}</p>
                          <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: missed ? 'rgba(99,102,241,0.12)' : 'rgba(248,113,113,0.1)', color: missed ? '#818cf8' : '#f87171' }}>
                            {missed ? 'Not answered' : 'Incorrect'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {(q.options ?? []).map((opt, oi) => {
                          const isCorrect = opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
                          const isWrong   = !missed && ua && ua.trim().toLowerCase() === opt.trim().toLowerCase() && !isCorrect
                          let bg = 'rgba(255,255,255,0.02)', border = 'rgba(255,255,255,0.06)', color = '#475569', lbg = 'rgba(255,255,255,0.04)', lcolor = '#334155'
                          if (isCorrect) { bg = 'rgba(34,197,94,0.1)'; border = 'rgba(34,197,94,0.45)'; color = '#e2e8f0'; lbg = 'rgba(34,197,94,0.2)'; lcolor = '#4ade80' }
                          if (isWrong)   { bg = 'rgba(248,113,113,0.08)'; border = 'rgba(248,113,113,0.4)'; color = '#e2e8f0'; lbg = 'rgba(248,113,113,0.18)'; lcolor = '#f87171' }
                          return (
                            <div key={oi} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                              style={{ background: bg, border: `1px solid ${border}` }}>
                              <div className="flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold"
                                style={{ width: 24, height: 24, background: lbg, color: lcolor }}>
                                {OPTION_LABELS[oi] ?? oi}
                              </div>
                              <span className="text-xs flex-1" style={{ color }}>{opt}</span>
                              {isCorrect && <CheckCircle size={13} style={{ color: '#4ade80', flexShrink: 0 }} />}
                              {isWrong   && <XCircle    size={13} style={{ color: '#f87171', flexShrink: 0 }} />}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8' }}>
            <RotateCcw size={14} /> Try Again
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onDownload} disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
            style={{ background: C.accent, boxShadow: C.accentGlow }}>
            {downloading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />} Download Quiz
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Quiz() {
  const { fileInfo, slides, task, quizData, quizAnswers, quizSubmitted, quizScore,
          setQuizData, setQuizAnswer, submitQuiz } = useStore()
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [current,     setCurrent]     = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [marked,      setMarked]      = useState(new Set())
  const [pageScope, setPageScope] = useState('all')
  const totalDocPages = fileInfo?.pages ?? 1
  const [fromPage, setFromPage]   = useState(1)
  const [toPage,   setToPage]     = useState(totalDocPages)

  const totalQs        = quizData.length
  const quizPage       = Math.floor(current / QS_PER_PAGE)
  const totalQuizPages = Math.ceil(totalQs / QS_PER_PAGE) || 1
  const pageStart      = quizPage * QS_PER_PAGE
  const pageEnd        = Math.min(pageStart + QS_PER_PAGE, totalQs)
  const answeredCount  = Object.keys(quizAnswers).filter(k => quizAnswers[k] !== undefined).length
  const markedCount    = marked.size
  const unanswered     = totalQs - answeredCount
  const q              = quizData[current]
  const answered       = quizAnswers[current]
  const isMarked       = marked.has(current)

  const buildPagesArg = () => {
    if (pageScope === 'all') return null
    const from = Math.max(1, Math.min(fromPage, totalDocPages))
    const to   = Math.max(from, Math.min(toPage, totalDocPages))
    return Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i)
  }

  const loadQuiz = async () => {
    if (!fileInfo && !slides.length) { setError('No document loaded.'); return }
    setLoading(true); setError('')
    try {
      const result = await generateQuiz({ file_id: fileInfo?.file_id ?? null, pages: buildPagesArg(), task })
      setQuizData(result.quiz ?? [])
      setCurrent(0); setMarked(new Set())
    } catch (e) { setError(e?.response?.data?.detail ?? 'Failed to generate quiz') }
    finally { setLoading(false) }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try { await downloadQuizDocx(quizData, 'Quiz') } catch { /**/ }
    finally { setDownloading(false) }
  }

  const toggleMark = useCallback(() => {
    setMarked((prev) => { const next = new Set(prev); next.has(current) ? next.delete(current) : next.add(current); return next })
  }, [current])

  const goTo = (idx) => { if (idx >= 0 && idx < totalQs) setCurrent(idx) }
  const clearResponse = () => { if (answered) setQuizAnswer(current, undefined) }
  const handleSubmit = () => { submitQuiz() }
  const handleRetry = () => { setQuizData([]); setCurrent(0); setMarked(new Set()) }

  if (!loading && totalQs === 0 && !quizSubmitted) {
    return <GenerateScreen fileInfo={fileInfo} loading={loading} error={error} pageScope={pageScope} setPageScope={setPageScope} fromPage={fromPage} setFromPage={setFromPage} toPage={toPage} setToPage={setToPage} totalDocPages={totalDocPages} onGenerate={loadQuiz} />
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-5">
        <div className="w-14 h-14 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(99,102,241,0.25)', borderTopColor: '#6366f1' }} />
        <div className="text-center"><p className="text-white font-semibold mb-1">Generating your quiz...</p><p className="text-xs" style={{ color: '#475569' }}>AI is analysing your document</p></div>
      </div>
    )
  }

  if (quizSubmitted) {
    return <ScoreCard score={quizScore} total={totalQs} quizData={quizData} quizAnswers={quizAnswers} downloading={downloading} onRetry={handleRetry} onDownload={handleDownload} />
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#060816' }}>

      {/* TOP NAVBAR */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 z-10"
        style={{ background: 'rgba(6,8,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 16px rgba(99,102,241,0.35)' }}>
            <Brain size={18} color="white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white leading-tight truncate">{fileInfo?.filename ?? 'Quiz'}</div>
            <div className="text-xs" style={{ color: '#475569' }}>{totalQs} questions &middot; {totalQuizPages} {totalQuizPages === 1 ? 'page' : 'pages'}</div>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-center gap-1.5 flex-1 px-8 max-w-xs">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs" style={{ color: '#475569' }}>Progress</span>
            <span className="text-xs font-semibold" style={{ color: '#93c5fd' }}>{answeredCount} / {totalQs}</span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full" style={{ background: C.accent }}
              animate={{ width: `${totalQs ? (answeredCount / totalQs) * 100 : 0}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
            <RefreshCw size={12} /> New Quiz
          </motion.button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Question Panel */}
        <div className="flex-1 overflow-y-auto px-4 md:px-7 py-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                Page {quizPage + 1} of {totalQuizPages}
              </span>
              <span className="text-xs" style={{ color: '#334155' }}>Q{pageStart + 1}&#x2013;{pageEnd} of {totalQs}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalQuizPages }).map((_, pi) => (
                <button key={pi} onClick={() => goTo(pi * QS_PER_PAGE)} className="rounded-full transition-all"
                  style={{ width: pi === quizPage ? 20 : 6, height: 6, background: pi === quizPage ? 'linear-gradient(90deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="rounded-3xl p-6 md:p-7 mb-5"
                style={{ background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center rounded-2xl text-sm font-black flex-shrink-0"
                      style={{ width: 40, height: 40, background: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(99,102,241,0.2))', border: '1px solid rgba(99,102,241,0.4)', color: '#93c5fd' }}>
                      {current + 1}
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: '#6366f1' }}>Question {current + 1} of {totalQs}</div>
                      {q?.page && <div className="text-xs" style={{ color: '#334155' }}>Slide {q.page}</div>}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} onClick={toggleMark}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                    style={{ background: isMarked ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: isMarked ? '1px solid rgba(245,158,11,0.45)' : '1px solid rgba(255,255,255,0.08)', color: isMarked ? '#fbbf24' : '#64748b' }}>
                    {isMarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                    {isMarked ? 'Marked' : 'Mark Review'}
                  </motion.button>
                </div>
                <p className="text-white font-semibold text-base leading-relaxed mb-7">{q?.question}</p>
                <div className="space-y-2.5">
                  {(q?.options ?? []).map((opt, oi) => {
                    const label = OPTION_LABELS[oi] ?? String(oi)
                    const sel   = answered === opt
                    const correct = quizSubmitted && opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
                    const wrong   = quizSubmitted && sel && !correct
                    return <OptionBtn key={oi} label={label} text={opt} selected={sel} correct={correct} wrong={wrong} disabled={false} onClick={() => setQuizAnswer(current, opt)} />
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <motion.button whileHover={current > 0 ? { scale: 1.03 } : {}} whileTap={current > 0 ? { scale: 0.97 } : {}}
                  onClick={() => goTo(current - 1)} disabled={current === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: current === 0 ? '#1e293b' : '#94a3b8', cursor: current === 0 ? 'not-allowed' : 'pointer' }}>
                  <ChevronLeft size={16} /> Previous
                </motion.button>
                <div className="text-xs" style={{ color: '#334155' }}>{current + 1} / {totalQs}</div>
                {current < totalQs - 1 ? (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => goTo(current + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold"
                    style={{ background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}>
                    Next <ChevronRight size={16} />
                  </motion.button>
                ) : (
                  <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(99,102,241,0.55)' }} whileTap={{ scale: 0.96 }} onClick={handleSubmit}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: C.accent, boxShadow: C.accentGlow }}>
                    <Send size={14} /> Submit Quiz
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigator Panel */}
        <div className="hidden lg:flex flex-col flex-shrink-0 overflow-y-auto py-6 px-4"
          style={{ width: 270, borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(9,13,28,0.7)' }}>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid size={14} style={{ color: '#6366f1' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Question Navigator</span>
          </div>
          {Array.from({ length: totalQuizPages }).map((_, pi) => {
            const pStart = pi * QS_PER_PAGE
            const pEnd   = Math.min(pStart + QS_PER_PAGE, totalQs)
            return (
              <div key={pi} className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold" style={{ color: '#334155' }}>Page {pi + 1}</span>
                  <span className="text-xs" style={{ color: '#1e293b' }}>Q{pStart + 1}&#x2013;{pEnd}</span>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
                  {Array.from({ length: pEnd - pStart }).map((_, off) => {
                    const idx   = pStart + off
                    const state = marked.has(idx) ? 'marked' : quizAnswers[idx] ? 'answered' : 'unanswered'
                    return <QNavBox key={idx} num={idx + 1} state={state} isCurrent={idx === current} onClick={() => goTo(idx)} />
                  })}
                </div>
                {pi < totalQuizPages - 1 && <div className="mt-4 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />}
              </div>
            )
          })}
          <div className="mt-auto rounded-2xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { color: C.answered.text,   dot: C.answered.bg,   label: 'Answered'     },
              { color: C.marked.text,     dot: C.marked.bg,     label: 'For Review'   },
              { color: C.unanswered.text, dot: C.unanswered.bg, label: 'Not Answered' },
              { color: '#93c5fd',         dot: 'rgba(59,130,246,0.2)', label: 'Current' },
            ].map(({ color, dot, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="rounded-md flex-shrink-0" style={{ width: 12, height: 12, background: dot, border: `1px solid ${color}40` }} />
                <span className="text-xs" style={{ color: '#475569' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM STATS BAR */}
      <div className="flex-shrink-0 px-5 py-3"
        style={{ background: 'rgba(6,8,22,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { val: totalQs,      label: 'Total',        color: '#93c5fd' },
              { val: answeredCount,label: 'Answered',     color: '#4ade80' },
              { val: markedCount,  label: 'For Review',   color: '#fbbf24' },
              { val: unanswered,   label: 'Not Answered', color: '#f87171' },
            ].map(({ val, label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-sm font-black" style={{ color }}>{val}</span>
                <span className="text-xs hidden sm:block" style={{ color: '#334155' }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={clearResponse} disabled={!answered}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: answered ? '#94a3b8' : '#1e293b', cursor: answered ? 'pointer' : 'not-allowed' }}>
              <RotateCcw size={11} /> Clear
            </motion.button>
            <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(99,102,241,0.5)' }} whileTap={{ scale: 0.96 }} onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: C.accent, boxShadow: C.accentGlow }}>
              <Send size={11} /> Submit Quiz
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
