import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MessageCircle, X, Send, Loader } from 'lucide-react'
import AvatarPlayer from '../components/AvatarPlayer.jsx'
import ExplanationPanel from '../components/ExplanationPanel.jsx'
import { askQuestion } from '../api/client.js'
import { audioBlobUrl } from '../api/client.js'
import useStore from '../store/useStore.js'

function QADrawer({ slide, language, open, onClose }) {
  const [question, setQuestion] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [chatLog,  setChatLog]  = useState([])

  const handleAsk = async () => {
    if (!question.trim() || loading) return
    const q = question.trim()
    setQuestion('')
    setLoading(true)
    setChatLog((prev) => [...prev, { role: 'user', text: q }])
    try {
      const resp = await askQuestion({ question: q, language })
      setChatLog((prev) => [...prev, { role: 'ai', text: resp.query_ans, audio_b64: resp.query_audio }])
    } catch (e) {
      setChatLog((prev) => [...prev, { role: 'ai', text: 'Sorry, could not get an answer right now.', error: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="absolute top-0 right-0 h-full flex flex-col z-30"
          style={{
            width: 340,
            background: 'rgba(11,16,32,0.97)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <MessageCircle size={15} style={{ color: '#8B5CF6' }} />
              <span className="text-sm font-semibold text-white">Ask AI</span>
            </div>
            <button onClick={onClose} style={{ color: '#4B5563' }}><X size={16} /></button>
          </div>

          {/* Chat log */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chatLog.length === 0 && (
              <p className="text-xs text-center mt-6" style={{ color: '#4B5563' }}>
                Ask anything about this slide
              </p>
            )}
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="rounded-xl px-4 py-2.5 max-w-[90%]"
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg,rgba(91,92,255,0.3),rgba(139,92,246,0.25))'
                      : msg.error
                      ? 'rgba(248,113,113,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(91,92,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <p className="text-sm leading-relaxed text-white">{msg.text}</p>
                  {msg.audio_b64 && (
                    <audio
                      controls
                      src={audioBlobUrl(msg.audio_b64)}
                      className="mt-2 w-full"
                      style={{ height: 28, filter: 'invert(1) opacity(0.7)' }}
                    />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2" style={{ color: '#6B7280' }}>
                <Loader size={12} className="animate-spin" />
                <span className="text-xs">Thinking…</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="Ask about this slide…"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
              <button onClick={handleAsk} disabled={loading || !question.trim()} style={{ color: '#8B5CF6' }}>
                {loading ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Player() {
  const {
    slides,
    currentSlide,
    nextSlide,
    prevSlide,
    language,
    appSidebarVisible,
    setAppSidebarVisible,
  } = useStore()
  const [qaOpen, setQaOpen] = useState(false)

  const slide = slides[currentSlide]
  const total = slides.length

  const inferGenderFromLanguage = (lang) => {
    const femaleLangs = new Set(['hindi', 'hinglish', 'marathi'])
    return femaleLangs.has((lang || '').toLowerCase()) ? 'female' : 'male'
  }

  const gender = slide?.voice_gender === 'female' || slide?.voice_gender === 'male'
    ? slide.voice_gender
    : inferGenderFromLanguage(language)

  if (!slides.length) return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: '#4B5563' }}>
      <p>No slides loaded. Process a document first.</p>
      <button
        onClick={() => useStore.getState().setPage('home')}
        className="px-5 py-2 rounded-xl text-sm font-medium"
        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6' }}
      >
        ← Go to Upload
      </button>
    </div>
  )

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* ── Top strip: slide counter & sidebar toggle ── */}
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="text-sm font-semibold text-white">
          Slide <span style={{ color: '#8B5CF6' }}>{currentSlide + 1}</span>
          <span style={{ color: '#4B5563' }}> / {total}</span>
        </span>
        <div className="flex-1 mx-6">
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((currentSlide + 1) / total) * 100}%`,
                background: 'linear-gradient(90deg,#5B5CFF,#C026D3)',
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAppSidebarVisible(!appSidebarVisible)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: appSidebarVisible ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${appSidebarVisible ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: appSidebarVisible ? '#8B5CF6' : '#9CA3AF',
              transition: 'all 0.2s',
            }}
          >
            {appSidebarVisible ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            {appSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <button
            onClick={() => setQaOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: qaOpen ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${qaOpen ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: qaOpen ? '#8B5CF6' : '#9CA3AF',
              transition: 'all 0.2s',
            }}
          >
            <MessageCircle size={13} /> Ask AI
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Compact mode: with app sidebar visible, keep old compact player panel */}
        {appSidebarVisible && (
          <div className="flex-shrink-0 flex flex-col justify-start pt-6 px-5" style={{ width: 300 }}>
            <AvatarPlayer
              audiob64={slide?.audio_b64}
              slideIndex={currentSlide}
              gender={gender}
              layout="compact"
            />
            {/* Page tag */}
            <div className="mt-4 text-center">
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.07)' }}>
                Page {slide?.page ?? currentSlide + 1}
              </span>
            </div>
          </div>
        )}

        {/* Explanation panel in compact mode */}
        {appSidebarVisible && (
          <div
            className="flex-1 overflow-y-auto px-6 py-6"
            style={{
              transition: 'margin-right 0.3s ease',
              marginRight: qaOpen ? 340 : 0,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%' }}
              >
                <ExplanationPanel slide={slide} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Split mode: sidebar hidden => left video area + right explanation area */}
        {!appSidebarVisible && (
          <div
            className="flex-1 overflow-hidden px-4 py-4"
            style={{ transition: 'margin-right 0.3s ease', marginRight: qaOpen ? 340 : 0 }}
          >
            <div className="h-full w-full flex gap-4">
              <div className="h-full flex flex-col min-w-0" style={{ flex: '1 1 50%' }}>
                <AvatarPlayer
                  audiob64={slide?.audio_b64}
                  slideIndex={currentSlide}
                  gender={gender}
                  layout="split"
                />
              </div>

              <div className="h-full min-w-0 rounded-2xl" style={{ flex: '1 1 50%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-full overflow-y-auto px-5 py-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: '100%' }}
                    >
                      <ExplanationPanel slide={slide} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legacy block removed in favor of compact/split sections */}

        {/* QA Drawer */}
        <QADrawer
          slide={slide}
          language={language}
          open={qaOpen}
          onClose={() => setQaOpen(false)}
        />
      </div>

      {/* ── Bottom navigation ── */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <motion.button
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: currentSlide === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: currentSlide === 0 ? '#374151' : '#9CA3AF',
            cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={16} /> Previous
        </motion.button>

        {/* Dot indicators (max 8) */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: Math.min(total, 8) }).map((_, i) => {
            const dotIdx = total <= 8 ? i : Math.round((i / 7) * (total - 1))
            const active = currentSlide === dotIdx
            return (
              <button
                key={i}
                onClick={() => useStore.getState().setCurrentSlide(dotIdx)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: active ? 20 : 6, height: 6,
                  background: active
                    ? 'linear-gradient(90deg,#5B5CFF,#C026D3)'
                    : 'rgba(255,255,255,0.12)',
                }}
              />
            )
          })}
        </div>

        <motion.button
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.95 }}
          onClick={nextSlide}
          disabled={currentSlide === total - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: currentSlide === total - 1
              ? 'rgba(255,255,255,0.02)'
              : 'linear-gradient(135deg,rgba(91,92,255,0.2),rgba(139,92,246,0.15))',
            border: `1px solid ${currentSlide === total - 1 ? 'rgba(255,255,255,0.08)' : 'rgba(139,92,246,0.35)'}`,
            color: currentSlide === total - 1 ? '#374151' : '#C4B5FD',
            cursor: currentSlide === total - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next <ChevronRight size={16} />
        </motion.button>
      </div>
    </div>
  )
}
