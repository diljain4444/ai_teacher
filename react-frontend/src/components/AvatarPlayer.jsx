import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Gauge, RotateCcw, RotateCw } from 'lucide-react'
import { audioBlobUrl } from '../api/client.js'

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2]

// gender: 'male' | 'female' (default: 'male')
// layout: 'compact' | 'split' (default: 'compact')
export default function AvatarPlayer({
  audiob64,
  slideIndex,
  gender = 'male',
  layout = 'compact',
  onStartedChange,
}) {
  const audioRef  = useRef(null)
  const videoRef  = useRef(null)
  const blobRef   = useRef(null)
  const [playing,  setPlaying]  = useState(false)
  const [muted,    setMuted]    = useState(false)
  const [speed,    setSpeed]    = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showSpeed, setShowSpeed] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [videoAspect, setVideoAspect] = useState(9 / 16)

  // When slide changes, reload audio
  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setHasStarted(false)
    if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    blobRef.current = audiob64 ? audioBlobUrl(audiob64) : null
    if (audioRef.current) {
      audioRef.current.src = blobRef.current ?? ''
      audioRef.current.load()
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    }
  }, [audiob64, slideIndex])

  useEffect(() => {
    if (onStartedChange) onStartedChange(hasStarted)
  }, [hasStarted, onStartedChange])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.playbackRate = speed
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed])

  const syncVideoToAudio = () => {
    if (!audioRef.current || !videoRef.current) return
    try {
      const audioTime = audioRef.current.currentTime || 0
      const videoDur = videoRef.current.duration || 0
      // Keep looping the avatar clip by mapping audio timeline onto video timeline.
      videoRef.current.currentTime = videoDur > 0 ? (audioTime % videoDur) : audioTime
    } catch {
      // Ignore sync errors from browser timing restrictions.
    }
  }

  const togglePlay = async () => {
    if (!audioRef.current || !blobRef.current) return
    if (playing) {
      audioRef.current.pause()
      if (videoRef.current) videoRef.current.pause()
      setPlaying(false)
    } else {
      if (!hasStarted) setHasStarted(true)
      syncVideoToAudio()
      await audioRef.current.play()
      if (videoRef.current) {
        videoRef.current.muted = true
        await videoRef.current.play()
      }
      setPlaying(true)
    }
  }

  const onTimeUpdate = () => {
    if (!audioRef.current) return
    const dur = audioRef.current.duration || 0
    const cur = audioRef.current.currentTime
    setProgress(dur ? (cur / dur) * 100 : 0)
    setDuration(dur)
    if (videoRef.current && Math.abs((videoRef.current.currentTime || 0) - cur) > 0.3) {
      syncVideoToAudio()
    }
    if (!audioRef.current.paused && videoRef.current?.paused) {
      videoRef.current.play().catch(() => {})
    }
  }

  const onEnded = () => {
    setPlaying(false)
    if (videoRef.current) videoRef.current.pause()
  }

  const seekBy = (seconds) => {
    if (!audioRef.current || !duration) return
    const nextTime = Math.max(0, Math.min(duration, (audioRef.current.currentTime || 0) + seconds))
    audioRef.current.currentTime = nextTime
    syncVideoToAudio()
  }

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (audioRef.current && duration) {
      audioRef.current.currentTime = pct * duration
      syncVideoToAudio()
    }
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const cur = duration ? (progress / 100) * duration : 0


  const isSplit = layout === 'split'
  const ctrlPadX = isSplit ? 'px-2.5' : 'px-4'
  const ctrlPadY = isSplit ? 'pt-2 pb-2' : 'pt-4 pb-4'
  const iconSize = isSplit ? 13 : 16
  const playBtnSize = isSplit ? 38 : 48
  const speedTextSize = isSplit ? '10px' : '12px'
  const clipFrameStyle = isSplit
    ? {
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: `${videoAspect}`,
      }
    : {
        width: 180,
        height: 180,
        aspectRatio: `${videoAspect}`,
      }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(11,16,32,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        height: isSplit ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Video Avatar area */}
      <div
        className="relative flex items-center justify-center"
        style={{
          height: isSplit ? '100%' : 220,
          minHeight: isSplit ? 0 : 220,
          background: isSplit ? 'transparent' : 'linear-gradient(135deg,#0B1020,#0f1535)',
          flex: isSplit ? 1 : 'unset',
          padding: isSplit ? 0 : 0,
        }}
      >
        <div style={clipFrameStyle}>
          <video
            ref={videoRef}
            src={gender === 'female' ? '/final_female_teacher.mp4' : '/final_teacher.mp4'}
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const w = e.currentTarget.videoWidth || 0
              const h = e.currentTarget.videoHeight || 0
              if (w > 0 && h > 0) setVideoAspect(w / h)
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: isSplit ? 'contain' : 'cover',
              borderRadius: isSplit ? '0.75rem' : '1.5rem',
              boxShadow: playing ? '0 0 40px rgba(139,92,246,0.6)' : '0 0 20px rgba(139,92,246,0.3)',
              background: '#222',
              border: '2px solid #8B5CF6',
              transition: 'box-shadow 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className={`${ctrlPadX} ${ctrlPadY}`}>
        {/* Progress bar */}
        <div
          className="rounded-full overflow-hidden cursor-pointer mb-2"
          style={{ height: isSplit ? 3 : 4, background: 'rgba(255,255,255,0.08)' }}
          onClick={seekTo}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg,#5B5CFF,#8B5CF6,#C026D3)',
              width: `${progress}%`,
            }}
            transition={{ duration: 0.15 }}
          />
        </div>

        <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#4B5563', fontSize: isSplit ? 10 : 12 }}>
          <span>{fmt(cur)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => seekBy(-5)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#6B7280' }}
            title="Back 5s"
          >
            <RotateCcw size={iconSize} />
          </button>

          {/* Mute */}
          <button
            onClick={() => {
              setMuted((m) => !m)
              if (audioRef.current) audioRef.current.muted = !muted
            }}
            className="p-2 rounded-lg transition-colors"
            style={{ color: muted ? '#F87171' : '#6B7280' }}
          >
            {muted ? <VolumeX size={iconSize} /> : <Volume2 size={iconSize} />}
          </button>

          {/* Play/Pause */}
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.94 }}
            onClick={togglePlay}
            disabled={!blobRef.current}
            className="flex items-center justify-center rounded-full"
            style={{
              width: playBtnSize, height: playBtnSize,
              background: blobRef.current
                ? 'linear-gradient(135deg,#5B5CFF,#8B5CF6,#C026D3)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: blobRef.current ? '0 0 20px rgba(139,92,246,0.4)' : 'none',
              cursor: blobRef.current ? 'pointer' : 'not-allowed',
            }}
          >
            {playing ? <Pause size={isSplit ? 14 : 18} color="white" /> : <Play size={isSplit ? 14 : 18} color="white" style={{ marginLeft: 2 }} />}
          </motion.button>

          <button
            onClick={() => seekBy(5)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#6B7280' }}
            title="Forward 5s"
          >
            <RotateCw size={iconSize} />
          </button>

          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeed((s) => !s)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium"
              style={{ color: '#8B5CF6', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', fontSize: speedTextSize }}
            >
              <Gauge size={isSplit ? 10 : 12} /> {speed}x
            </button>
            <AnimatePresence>
              {showSpeed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-full right-0 mb-2 rounded-xl overflow-hidden py-1"
                  style={{
                    background: 'rgba(11,16,32,0.98)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: 70,
                  }}
                >
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSpeed(s); setShowSpeed(false) }}
                      className="w-full text-center px-3 py-1.5 text-xs"
                      style={{ color: speed === s ? '#8B5CF6' : '#9CA3AF' }}
                    >
                      {s}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          <button
            onClick={togglePlay}
            disabled={!blobRef.current}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: 'rgba(139,92,246,0.14)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#C4B5FD',
              opacity: blobRef.current ? 1 : 0.6,
              cursor: blobRef.current ? 'pointer' : 'not-allowed',
              fontSize: isSplit ? 10 : 12,
            }}
          >
            {playing ? 'Pause' : hasStarted ? 'Resume' : 'Start'}
          </button>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
      />
    </div>
  )
}
