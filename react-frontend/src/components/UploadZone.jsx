import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { uploadFile } from '../api/client.js'
import useStore from '../store/useStore.js'

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default function UploadZone({ onUploaded }) {
  const { setFileInfo } = useStore()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [error, setError] = useState('')

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx', 'png', 'jpg', 'jpeg'].includes(ext)) {
      setError('Unsupported file type. Use PDF, DOCX, or PNG/JPG.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const info = await uploadFile(file)
      setFileInfo(info)
      setUploadedFile({ name: file.name, size: file.size, ...info })
      onUploaded?.(info)
    } catch (e) {
      setError(e?.response?.data?.detail ?? 'Upload failed. Is the server running?')
    } finally {
      setUploading(false)
    }
  }, [setFileInfo, onUploaded])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const onInputChange = (e) => handleFile(e.target.files[0])

  const clear = () => { setUploadedFile(null); setFileInfo(null); setError('') }

  return (
    <div>
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            htmlFor="file-input"
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-4 rounded-2xl cursor-pointer transition-all duration-300"
            style={{
              height: 220,
              background: dragging
                ? 'rgba(139,92,246,0.1)'
                : 'rgba(255,255,255,0.02)',
              border: `2px dashed ${dragging ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: dragging ? '0 0 30px rgba(139,92,246,0.15)' : 'none',
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={onInputChange}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(139,92,246,0.6)', borderTopColor: 'transparent' }}
                />
                <span className="text-sm" style={{ color: '#8B5CF6' }}>Uploading…</span>
              </div>
            ) : (
              <>
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 52, height: 52,
                    background: 'linear-gradient(135deg,rgba(91,92,255,0.15),rgba(139,92,246,0.15))',
                    border: '1px solid rgba(139,92,246,0.3)',
                  }}
                >
                  <Upload size={22} style={{ color: '#8B5CF6' }} />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">
                    Drop file here or <span style={{ color: '#8B5CF6' }}>browse</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                    PDF, DOCX, PNG, JPG — up to 50 MB
                  </p>
                </div>
              </>
            )}
          </motion.label>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center gap-4 rounded-2xl px-5 py-4"
            style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.3)',
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 44, height: 44, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <File size={20} style={{ color: '#22C55E' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{uploadedFile.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                {formatBytes(uploadedFile.size)}
                {uploadedFile.pages ? ` · ${uploadedFile.pages} pages` : ''}
              </p>
            </div>
            <CheckCircle size={18} style={{ color: '#22C55E' }} className="flex-shrink-0" />
            <button onClick={clear} className="flex-shrink-0" style={{ color: '#6B7280' }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-center"
          style={{ color: '#F87171' }}
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
