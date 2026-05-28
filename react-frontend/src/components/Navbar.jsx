import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, BookOpen, Calculator, Bookmark, RotateCcw } from 'lucide-react'
import useStore from '../store/useStore.js'
import clsx from 'clsx'

const LANGUAGES = [
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'hindi',    label: 'Hindi' },
  { value: 'english',  label: 'English' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'marathi',  label: 'Marathi' },
  { value: 'bengali',  label: 'Bengali' },
  { value: 'tamil',    label: 'Tamil' },
  { value: 'telugu',   label: 'Telugu' },
]

const TASKS = [
  { value: 'theory', label: 'Theory',  icon: BookOpen },
  { value: 'maths',  label: 'Maths',   icon: Calculator },
]

function DropdownMenu({ open, items, onSelect, current }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full mt-2 right-0 z-50 py-1 rounded-xl overflow-hidden"
          style={{
            minWidth: 160,
            background: 'rgba(11,16,32,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => onSelect(item.value)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors"
              style={{
                color: current === item.value ? '#8B5CF6' : '#D1D5DB',
                background: current === item.value ? 'rgba(139,92,246,0.12)' : 'transparent',
              }}
            >
              {item.icon && <item.icon size={14} />}
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Navbar() {
  const { language, task, setLanguage, setTask, reset, currentPage } = useStore()
  const [langOpen, setLangOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)

  const currentLang = LANGUAGES.find((l) => l.value === language)?.label ?? language
  const currentTask = TASKS.find((t) => t.value === task)?.label ?? task

  return (
    <header
      className="flex items-center justify-between px-6 py-3 flex-shrink-0 z-40"
      style={{
        background: 'rgba(6,8,22,0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        minHeight: 56,
      }}
    >
      {/* Left: page title */}
      <div>
        <h1 className="text-white font-semibold text-base capitalize">
          {currentPage === 'home' ? 'Upload & Configure' :
           currentPage === 'processing' ? 'Processing...' :
           currentPage === 'player' ? 'Slide Player' :
           currentPage === 'quiz' ? 'Quiz' :
           currentPage === 'qa-sheet' ? 'Q&A Sheet' :
           currentPage === 'qa' ? 'Ask AI' : ''}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#4B5563' }}>AI-powered slide explainer</p>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">

        {/* Language picker */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen((o) => !o); setTaskOpen(false) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#D1D5DB',
            }}
          >
            <Globe size={14} style={{ color: '#8B5CF6' }} />
            {currentLang}
            <ChevronDown size={13} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
          <DropdownMenu
            open={langOpen}
            items={LANGUAGES}
            current={language}
            onSelect={(v) => { setLanguage(v); setLangOpen(false) }}
          />
        </div>

        {/* Task picker */}
        <div className="relative">
          <button
            onClick={() => { setTaskOpen((o) => !o); setLangOpen(false) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#D1D5DB',
            }}
          >
            <Bookmark size={14} style={{ color: '#C026D3' }} />
            {currentTask}
            <ChevronDown size={13} style={{ transform: taskOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
          <DropdownMenu
            open={taskOpen}
            items={TASKS}
            current={task}
            onSelect={(v) => { setTask(v); setTaskOpen(false) }}
          />
        </div>

        {/* Reset */}
        <motion.button
          whileHover={{ rotate: -90 }}
          transition={{ duration: 0.3 }}
          onClick={reset}
          className="p-1.5 rounded-lg"
          title="Reset"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#6B7280',
          }}
        >
          <RotateCcw size={15} />
        </motion.button>
      </div>
    </header>
  )
}
