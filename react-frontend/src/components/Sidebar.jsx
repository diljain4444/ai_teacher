import { motion } from 'framer-motion'
import {
  Home, Play, FileText, Brain,
  History, Settings, Info, Bot, Zap, Database, Network,
} from 'lucide-react'
import useStore from '../store/useStore.js'
import clsx from 'clsx'

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',       icon: Home },
  { id: 'player',   label: 'Player',     icon: Play },
  { id: 'qa-sheet', label: 'Q&A Sheet',  icon: FileText },
  { id: 'quiz',     label: 'Quiz',       icon: Brain },
]

const TECH_STACK = [
  { icon: Zap,      label: 'Groq LLaMA 4' },
  { icon: Bot,      label: 'Azure Neural TTS' },
  { icon: Network,  label: 'LangGraph + RAG' },
  { icon: Database, label: 'FAISS + BM25' },
]

export default function Sidebar() {
  const { currentPage, setPage } = useStore()

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col flex-shrink-0 h-screen overflow-y-auto"
      style={{
        width: 260,
        background: 'rgba(11,16,32,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 42, height: 42,
            background: 'linear-gradient(135deg,#5B5CFF,#8B5CF6,#C026D3)',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}
        >
          <Bot size={22} color="white" />
        </div>
        <div>
          <div className="font-bold text-sm text-white leading-tight">AI Slide Explainer</div>
          <div className="text-xs mt-0.5 leading-tight" style={{ color: '#6B7280', fontSize: 10 }}>
            Understand Any Doc. Any Language.
          </div>
        </div>
      </div>

      <div className="px-4 mb-2">
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        <div className="text-xs font-semibold uppercase tracking-widest px-2 mb-3" style={{ color: '#4B5563' }}>
          Navigation
        </div>

        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id
          return (
            <motion.button
              key={id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPage(id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200',
              )}
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg,rgba(91,92,255,0.2),rgba(139,92,246,0.15))',
                      border: '1px solid rgba(139,92,246,0.4)',
                      boxShadow: '0 0 15px rgba(139,92,246,0.15)',
                    }
                  : { background: 'transparent', border: '1px solid transparent' }
              }
            >
              <Icon
                size={17}
                style={{ color: active ? '#8B5CF6' : 'currentColor' }}
              />
              {label}
              {active && (
                <motion.div
                  layoutId="activeDot"
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: '#8B5CF6', boxShadow: '0 0 6px #8B5CF6' }}
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* ── Powered by AI card ── */}
      <div className="px-3 pb-4">
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} style={{ color: '#8B5CF6' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>
              Powered by AI
            </span>
          </div>
          <div className="space-y-2">
            {TECH_STACK.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={11} style={{ color: '#6B7280' }} />
                <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
