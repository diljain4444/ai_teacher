import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader, Cpu, Mic, BrainCircuit, FileText, Zap } from 'lucide-react'
import { getJobResult, getJobStatus } from '../api/client.js'
import useStore from '../store/useStore.js'

const STEPS = [
  { key: 'extract',  icon: FileText,    label: 'Extracting content' },
  { key: 'classify', icon: BrainCircuit, label: 'Classifying & analysing' },
  { key: 'explain',  icon: Cpu,          label: 'Generating explanations' },
  { key: 'audio',    icon: Mic,          label: 'Creating audio narration' },
  { key: 'done',     icon: Zap,          label: 'Finalising result' },
]

function progressToStep(pct) {
  if (pct < 20) return 0
  if (pct < 40) return 1
  if (pct < 70) return 2
  if (pct < 90) return 3
  return 4
}

export default function ProcessingScreen() {
  const {
    jobId, jobStatus, jobProgress, jobMessage, jobError,
    setJobStatus, setJobProgress, setJobMessage, setJobError,
    setSlides, setPage, language, task,
  } = useStore()

  const pollRef = useRef(null)
  const [localProgress, setLocalProgress] = useState(0)

  useEffect(() => {
    if (!jobId) return

    // Polling — SSE is unreliable on HuggingFace Spaces
    pollRef.current = setInterval(async () => {
      try {
        const data = await getJobStatus(jobId)
        if (data.progress !== undefined) {
          setJobProgress(data.progress)
          setLocalProgress(data.progress)
        }
        if (data.message) setJobMessage(data.message)
        if (data.status)  setJobStatus(data.status)
        if (data.status === 'done') {
          clearInterval(pollRef.current)
          fetchResult()
        }
        if (data.status === 'error') {
          setJobError(data.error ?? 'Unknown error')
          clearInterval(pollRef.current)
        }
      } catch {
        setJobStatus('error')
        setJobError('Lost connection to server')
        clearInterval(pollRef.current)
      }
    }, 2000)

    return () => clearInterval(pollRef.current)
  }, [jobId])

  const fetchResult = async () => {
    try {
      const result = await getJobResult(jobId)
      setSlides(result.slides ?? [])
      setPage('player')
    } catch (err) {
      setJobError('Failed to fetch result')
    }
  }

  const activeStep = progressToStep(localProgress)
  const isError    = jobStatus === 'error' || !!jobError

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-16 px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-10">
          {isError ? (
            <AlertCircle size={48} style={{ color: '#F87171', margin: '0 auto 12px' }} />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{
                width: 56, height: 56,
                background: 'linear-gradient(135deg,#5B5CFF,#8B5CF6,#C026D3)',
                boxShadow: '0 0 30px rgba(139,92,246,0.4)',
              }}
            >
              <Loader size={24} color="white" />
            </motion.div>
          )}

          <h2 className="text-2xl font-bold text-white mb-2">
            {isError ? 'Processing Failed' : 'Analysing Your Document'}
          </h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            {isError ? (jobError ?? 'An error occurred') : (jobMessage || 'Please wait while AI processes your file…')}
          </p>
        </div>

        {/* Progress bar */}
        {!isError && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium" style={{ color: '#8B5CF6' }}>Progress</span>
              <span className="text-xs font-bold text-white">{Math.round(localProgress)}%</span>
            </div>
            <div
              className="rounded-full overflow-hidden"
              style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg,#5B5CFF,#8B5CF6,#C026D3)',
                  boxShadow: '0 0 12px rgba(139,92,246,0.6)',
                }}
                animate={{ width: `${localProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const done    = idx < activeStep
            const current = idx === activeStep && !isError
            const Icon    = step.icon
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{
                  background: current
                    ? 'rgba(139,92,246,0.1)'
                    : done
                    ? 'rgba(34,197,94,0.05)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${
                    current
                      ? 'rgba(139,92,246,0.35)'
                      : done
                      ? 'rgba(34,197,94,0.2)'
                      : 'rgba(255,255,255,0.05)'
                  }`,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 34, height: 34,
                    background: current
                      ? 'rgba(139,92,246,0.2)'
                      : done
                      ? 'rgba(34,197,94,0.15)'
                      : 'rgba(255,255,255,0.04)',
                  }}
                >
                  {done ? (
                    <CheckCircle size={16} style={{ color: '#22C55E' }} />
                  ) : current ? (
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <Icon size={16} style={{ color: '#8B5CF6' }} />
                    </motion.div>
                  ) : (
                    <Icon size={16} style={{ color: '#374151' }} />
                  )}
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: done ? '#22C55E' : current ? '#E2E8F0' : '#4B5563' }}
                >
                  {step.label}
                </span>
                {current && (
                  <motion.div
                    className="ml-auto flex gap-1"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="rounded-full"
                        style={{ width: 4, height: 4, background: '#8B5CF6' }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {isError && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => useStore.getState().setPage('home')}
            className="w-full mt-8 py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)' }}
          >
            ← Go Back & Retry
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}
