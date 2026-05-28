import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Loader, Bot, User } from 'lucide-react'
import { askQuestion, audioBlobUrl } from '../api/client.js'
import useStore from '../store/useStore.js'

export default function QAInterface() {
  const { slides, language, chatHistory, addChatMessage } = useStore()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const explanationContext = slides.length
    ? slides.map((s, i) => `[Slide ${i + 1}] ${JSON.stringify(s)}`).join('\n\n')
    : ''

  const handleAsk = async () => {
    const q = question.trim()
    if (!q || loading) return
    setQuestion('')
    addChatMessage({ role: 'user', text: q })
    setLoading(true)
    try {
      const resp = await askQuestion({ explanation_text: explanationContext, question: q, language })
      addChatMessage({ role: 'ai', text: resp.query_ans, audio_b64: resp.query_audio })
    } catch (e) {
      addChatMessage({ role: 'ai', text: 'Sorry, I could not answer that right now.', error: true })
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg,#5B5CFF,#8B5CF6,#C026D3)',
            boxShadow: '0 0 15px rgba(139,92,246,0.35)',
          }}
        >
          <Bot size={16} color="white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-base">Ask AI</h2>
          <p className="text-xs" style={{ color: '#4B5563' }}>
            {slides.length ? `Context: ${slides.length} slides loaded` : 'No slides loaded yet'}
          </p>
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3" style={{ color: '#374151' }}>
            <MessageSquare size={32} style={{ opacity: 0.4 }} />
            <p className="text-sm text-center">
              Ask anything about your uploaded document. AI will answer in <span style={{ color: '#8B5CF6' }}>{language}</span>.
            </p>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'Summarise this document',
                'What are the key concepts?',
                'Give me a real-life example',
                'Explain the main topic simply',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuestion(s)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    color: '#8B5CF6',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 34, height: 34, marginTop: 2,
                  background: msg.role === 'user'
                    ? 'rgba(91,92,255,0.2)'
                    : 'linear-gradient(135deg,rgba(91,92,255,0.3),rgba(192,38,211,0.2))',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {msg.role === 'user'
                  ? <User size={15} style={{ color: '#818CF8' }} />
                  : <Bot  size={15} style={{ color: '#C4B5FD' }} />
                }
              </div>

              {/* Bubble */}
              <div className="max-w-[75%]">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg,rgba(91,92,255,0.2),rgba(139,92,246,0.15))'
                      : msg.error
                      ? 'rgba(248,113,113,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${
                      msg.role === 'user'
                        ? 'rgba(91,92,255,0.3)'
                        : msg.error
                        ? 'rgba(248,113,113,0.3)'
                        : 'rgba(255,255,255,0.08)'
                    }`,
                  }}
                >
                  <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.audio_b64 && (
                  <audio
                    controls
                    src={audioBlobUrl(msg.audio_b64)}
                    className="mt-2 w-full"
                    style={{ height: 32, borderRadius: 8, opacity: 0.85 }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg,rgba(91,92,255,0.3),rgba(192,38,211,0.2))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Bot size={15} style={{ color: '#C4B5FD' }} />
            </div>
            <div
              className="rounded-2xl px-5 py-4 flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex gap-1"
              >
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#8B5CF6' }} />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-4">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(11,16,32,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk()}
            placeholder={slides.length ? 'Ask anything about the document…' : 'Upload & process a document first…'}
            disabled={!slides.length || loading}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
          <motion.button
            whileHover={question.trim() ? { scale: 1.1 } : {}}
            whileTap={question.trim() ? { scale: 0.9 } : {}}
            onClick={handleAsk}
            disabled={loading || !question.trim() || !slides.length}
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 36, height: 36,
              background: question.trim() && slides.length
                ? 'linear-gradient(135deg,#5B5CFF,#8B5CF6,#C026D3)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: question.trim() ? '0 0 15px rgba(139,92,246,0.4)' : 'none',
              cursor: question.trim() && slides.length ? 'pointer' : 'not-allowed',
            }}
          >
            {loading
              ? <Loader size={15} color="white" className="animate-spin" />
              : <Send size={15} color="white" style={{ marginLeft: 1 }} />
            }
          </motion.button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: '#1F2937' }}>
          Press Enter to send
        </p>
      </div>
    </div>
  )
}
