import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload, Settings2, Zap, BookOpen, Calculator,
  ChevronRight, Globe, Hash, ArrowRight,
} from 'lucide-react'
import UploadZone from '../components/UploadZone.jsx'
import { startProcessing } from '../api/client.js'
import useStore from '../store/useStore.js'
import clsx from 'clsx'

const LANGUAGES = [
  'hinglish', 'hindi', 'english', 'gujarati',
  'marathi', 'bengali', 'tamil', 'telugu',
]

const PIPELINE_STEPS = [
  { icon: '📄', label: 'Upload File' },
  { icon: '🧠', label: 'AI Analysis' },
  { icon: '🎙️', label: 'Audio TTS' },
  { icon: '✨', label: 'Explanation' },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' } }),
}

export default function Home() {
  const {
    fileInfo, language, task, pageMode, startPage, endPage,
    setLanguage, setTask, setPageMode, setStartPage, setEndPage,
    setJobId, setJobStatus, setJobProgress, setJobMessage, setPage,
  } = useStore()

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const maxPages = fileInfo?.pages ?? 9999

  const handleProcess = async () => {
    if (!fileInfo) { setError('Please upload a file first.'); return }
    if (pageMode === 'range' && startPage > endPage) {
      setError('Start page cannot be greater than end page.')
      return
    }
    setError('')
    setProcessing(true)
    try {
      let pages = null
      if (pageMode === 'range')
        pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i)

      const { job_id } = await startProcessing({
        file_id: fileInfo.file_id,
        pages,
        language,
        task,
      })
      setJobId(job_id)
      setJobStatus('queued')
      setJobProgress(0)
      setJobMessage('Queued — starting soon…')
      setPage('processing')
    } catch (e) {
      setError(e?.response?.data?.detail ?? 'Failed to start. Is the backend running?')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-full px-6 py-8 max-w-4xl mx-auto">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
          style={{
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#8B5CF6',
          }}
        >
          🧠 AI-Powered Learning — Explain · Quiz · Ask
        </div>

        <h1 className="text-4xl font-black text-white mb-3 leading-tight">
          Understand Any Document
          <br />
          <span className="animated-gradient">In Any Language</span>
        </h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: '#6B7280' }}>
          Upload a PDF, DOCX, or image. Get AI-generated slide explanations, audio narration,
          quiz, and a Q&A bank — instantly.
        </p>
      </motion.div>

      {/* ── Pipeline strip ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-0 mb-10"
      >
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                minWidth: 90,
              }}
            >
              <span className="text-xl">{step.icon}</span>
              <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{step.label}</span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="pipeline-line" style={{ width: 28, height: 2, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </motion.div>

      {/* ── Upload card ── */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="card p-6 mb-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Upload size={16} style={{ color: '#8B5CF6' }} />
          <h2 className="text-white font-semibold text-sm">Upload File</h2>
        </div>
        <UploadZone />
      </motion.div>

      {/* ── Settings row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

        {/* Language */}
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={15} style={{ color: '#8B5CF6' }} />
            <h2 className="text-white font-semibold text-sm">Output Language</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: language === lang
                    ? 'linear-gradient(135deg,rgba(91,92,255,0.25),rgba(139,92,246,0.2))'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${language === lang ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  color: language === lang ? '#C4B5FD' : '#9CA3AF',
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Task + Pages */}
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className="card p-5">
          {/* Task mode */}
          <div className="flex items-center gap-2 mb-3">
            <Settings2 size={15} style={{ color: '#C026D3' }} />
            <h2 className="text-white font-semibold text-sm">Task Mode</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { value: 'theory',  label: 'Theory',  icon: BookOpen },
              { value: 'maths',   label: 'Maths',   icon: Calculator },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTask(value)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: task === value
                    ? 'linear-gradient(135deg,rgba(192,38,211,0.18),rgba(139,92,246,0.15))'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${task === value ? 'rgba(192,38,211,0.45)' : 'rgba(255,255,255,0.06)'}`,
                  color: task === value ? '#E879F9' : '#9CA3AF',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Page range */}
          <div className="flex items-center gap-2 mb-3">
            <Hash size={15} style={{ color: '#5B5CFF' }} />
            <h2 className="text-white font-semibold text-sm">Pages</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['all', 'range'].map((mode) => (
              <button
                key={mode}
                onClick={() => setPageMode(mode)}
                className="py-2 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: pageMode === mode ? 'rgba(91,92,255,0.18)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${pageMode === mode ? 'rgba(91,92,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: pageMode === mode ? '#818CF8' : '#9CA3AF',
                }}
              >
                {mode === 'all' ? 'All pages' : 'Custom range'}
              </button>
            ))}
          </div>

          {pageMode === 'range' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-2 mt-3"
            >
              {fileInfo?.pages && (
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  PDF has <span style={{ color: '#818CF8' }}>{fileInfo.pages}</span> pages
                </p>
              )}
              <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={maxPages}
                value={startPage}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(Number(e.target.value), maxPages))
                  setStartPage(val)
                  if (val > endPage) setError('Start page cannot be greater than end page.')
                  else setError('')
                }}
                placeholder="From"
                className="flex-1 rounded-lg px-3 py-2 text-sm text-white"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${startPage > endPage ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  outline: 'none',
                }}
              />
              <ArrowRight size={14} style={{ color: '#4B5563', flexShrink: 0 }} />
              <input
                type="number"
                min="1"
                max={maxPages}
                value={endPage}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(Number(e.target.value), maxPages))
                  setEndPage(val)
                  if (startPage > val) setError('Start page cannot be greater than end page.')
                  else setError('')
                }}
                placeholder="To"
                className="flex-1 rounded-lg px-3 py-2 text-sm text-white"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${startPage > endPage ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  outline: 'none',
                }}
              />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Error ── */}
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm mb-4" style={{ color: '#F87171' }}>
          {error}
        </motion.p>
      )}

      {/* ── Process button ── */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleProcess}
          disabled={processing || !fileInfo}
          className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 transition-all"
          style={{
            background: fileInfo
              ? 'linear-gradient(135deg,#5B5CFF,#8B5CF6,#C026D3)'
              : 'rgba(255,255,255,0.05)',
            boxShadow: fileInfo ? '0 0 30px rgba(139,92,246,0.35)' : 'none',
            cursor: fileInfo ? 'pointer' : 'not-allowed',
            border: fileInfo ? 'none' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting…
            </>
          ) : (
            <>
              <Zap size={18} />
              Analyse Document
              <ChevronRight size={18} />
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}
