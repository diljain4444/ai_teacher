import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, RefreshCw, ChevronDown, ChevronUp, Loader, Layers, AlignJustify } from 'lucide-react'
import { generateQABank, downloadQADocx } from '../api/client.js'
import useStore from '../store/useStore.js'

function AccordionItem({ item, index }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left transition-colors"
        style={{
          background: open ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
        }}
      >
        <div
          className="flex-shrink-0 text-xs font-bold rounded-lg px-2 py-0.5 mt-0.5"
          style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          {(item.page_no != null ? item.page_no + 1 : index + 1)}
        </div>
        <p className="flex-1 text-sm font-medium text-white leading-relaxed">{item.question}</p>
        <div className="flex-shrink-0 mt-0.5" style={{ color: '#4B5563' }}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="px-5 py-4"
              style={{
                background: 'rgba(255,255,255,0.01)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full flex-shrink-0"
                  style={{ background: 'linear-gradient(to bottom,#5B5CFF,#C026D3)' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>Answer</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB', paddingLeft: 12 }}>
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function QASheet() {
  const { fileInfo, task, qaBank, setQABank } = useStore()
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [downloading, setDownloading] = useState(false)

  // Page scope state
  const [pageScope, setPageScope] = useState('all')   // 'all' | 'range'
  const totalPages = fileInfo?.pages ?? 1
  const [fromPage, setFromPage] = useState(1)
  const [toPage,   setToPage]   = useState(totalPages)

  const buildPagesArg = () => {
    if (pageScope === 'all') return null
    const from = Math.max(1, Math.min(fromPage, totalPages))
    const to   = Math.max(from, Math.min(toPage, totalPages))
    // backend uses 0-based page_no
    return Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i)
  }

  const loadQA = async () => {
    if (!fileInfo) { setError('No document loaded.'); return }
    setLoading(true); setError('')
    try {
      const result = await generateQABank({ file_id: fileInfo.file_id, pages: buildPagesArg(), task })
      setQABank(result.qa ?? [])
    } catch (e) {
      setError(e?.response?.data?.detail ?? 'Failed to generate Q&A bank')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try { await downloadQADocx(qaBank, 'Practice Questions') }
    catch { /* silent */ }
    finally { setDownloading(false) }
  }

  return (
    <div className="min-h-full px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText size={18} style={{ color: '#8B5CF6' }} />
          <h2 className="text-white font-bold text-lg">Q&A Sheet</h2>
          {qaBank.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}>
              {qaBank.length} questions
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {qaBank.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#9CA3AF',
              }}
            >
              {downloading ? <Loader size={12} className="animate-spin" /> : <Download size={12} />}
              DOCX
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={loadQA}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#8B5CF6',
            }}
          >
            {loading ? <Loader size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {qaBank.length ? 'Regenerate' : 'Generate Q&A'}
          </motion.button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 rounded-xl p-4"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}>
          <p className="text-sm" style={{ color: '#F87171' }}>{error}</p>
        </motion.div>
      )}

      {/* Page Scope Selector */}
      {fileInfo && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl p-4"
          style={{ background: 'rgba(11,16,32,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>
            Page Scope
          </p>
          <div className="flex gap-2 mb-3">
            {/* All Pages */}
            <button
              onClick={() => setPageScope('all')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium flex-1 justify-center transition-all"
              style={{
                background: pageScope === 'all' ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
                border: pageScope === 'all' ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color:   pageScope === 'all' ? '#C4B5FD' : '#6B7280',
              }}
            >
              <AlignJustify size={14} />
              All Pages
            </button>
            {/* Page Range */}
            <button
              onClick={() => { setPageScope('range'); setToPage(totalPages) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium flex-1 justify-center transition-all"
              style={{
                background: pageScope === 'range' ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
                border: pageScope === 'range' ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color:   pageScope === 'range' ? '#C4B5FD' : '#6B7280',
              }}
            >
              <Layers size={14} />
              Page Range
            </button>
          </div>

          <AnimatePresence>
            {pageScope === 'range' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>From page</label>
                  <input
                    type="number"
                    min={1}
                    max={toPage}
                    value={fromPage}
                    onChange={(e) => setFromPage(Math.max(1, Math.min(Number(e.target.value), toPage)))}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="text-xs mt-5" style={{ color: '#4B5563' }}>—</div>
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>To page</label>
                  <input
                    type="number"
                    min={fromPage}
                    max={totalPages}
                    value={toPage}
                    onChange={(e) => setToPage(Math.max(fromPage, Math.min(Number(e.target.value), totalPages)))}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="mt-5 text-xs" style={{ color: '#4B5563' }}>
                  of&nbsp;{totalPages}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(139,92,246,0.6)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: '#6B7280' }}>Generating Q&A bank with AI…</p>
        </div>
      )}

      {!loading && qaBank.length > 0 && (
        <div className="space-y-2">
          {qaBank.map((item, i) => (
            <AccordionItem key={i} item={item} index={i} />
          ))}
        </div>
      )}

      {!loading && qaBank.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: '#4B5563' }}>
          <FileText size={40} style={{ opacity: 0.3 }} />
          <p className="text-sm">Click "Generate Q&A" to create practice questions from your document.</p>
        </div>
      )}
    </div>
  )
}
