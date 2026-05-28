import { motion } from 'framer-motion'
import { Lightbulb, BookOpen, Star, Calculator, Layers, CheckSquare } from 'lucide-react'

/* ── Theory Panel ───────────────────────────────────────────── */

function ConceptCard({ concept, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl p-4 mb-3"
      style={{
        background: 'rgba(91,92,255,0.06)',
        border: '1px solid rgba(91,92,255,0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0 text-xs font-bold mt-0.5"
          style={{
            width: 28, height: 28,
            background: 'rgba(91,92,255,0.2)',
            color: '#818CF8',
            border: '1px solid rgba(91,92,255,0.3)',
          }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white mb-0.5">{concept.name}</p>
          {concept.original && concept.original !== concept.name && (
            <p className="text-xs mb-1.5" style={{ color: '#8B5CF6' }}>{concept.original}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ContentPointCard({ point, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3 p-4 rounded-xl mb-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-1.5 flex-shrink-0 rounded-full mt-1"
        style={{
          background: 'linear-gradient(to bottom,#5B5CFF,#C026D3)',
          minHeight: 40,
        }}
      />
      <div className="flex-1 min-w-0">
        {point.original && (
          <p className="font-semibold text-sm text-white mb-1">{point.original}</p>
        )}
        {!point.original && !point.translation && (
          <p className="text-sm leading-relaxed text-white">{JSON.stringify(point)}</p>
        )}
      </div>
    </motion.div>
  )
}

function TheoryPanel({ slide }) {
  const concepts     = slide.concepts      ?? []
  const contentPts   = slide.content_points ?? []

  return (
    <div className="space-y-6">
      {/* Concepts / Characters */}
      {concepts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} style={{ color: '#8B5CF6' }} />
            <h3 className="font-semibold text-white text-sm">Key Concepts</h3>
          </div>
          {concepts.map((c, i) => <ConceptCard key={i} concept={c} index={i} />)}
        </div>
      )}

      {/* Content points */}
      {contentPts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={15} style={{ color: '#5B5CFF' }} />
            <h3 className="font-semibold text-white text-sm">Content Points</h3>
          </div>
          {contentPts.map((p, i) => <ContentPointCard key={i} point={p} index={i} />)}
        </div>
      )}
    </div>
  )
}

/* ── Maths Panel ─────────────────────────────────────────────── */

function MathsNumericalPanel({ slide }) {
  const questions = slide.questions ?? []
  return (
    <div className="space-y-5">
      {questions.map((q, qi) => (
        <motion.div
          key={qi}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qi * 0.08 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(11,16,32,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(139,92,246,0.2)', color: '#8B5CF6' }}>
              Q{q.number ?? qi + 1}
            </div>
            <p className="text-sm font-semibold text-white flex-1">{q.question}</p>
          </div>
          {q.given && (
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#5B5CFF' }}>Given: </span>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{q.given}</span>
            </div>
          )}
          {q.find && (
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#C026D3' }}>Find: </span>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{q.find}</span>
            </div>
          )}
          {(q.steps ?? []).map((step, si) => (
            <div key={si} className="flex gap-3 mb-3 pl-2">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}>
                  {step.number ?? si + 1}
                </div>
                {si < (q.steps.length - 1) && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(139,92,246,0.2)' }} />}
              </div>
              <div className="pb-3 flex-1 min-w-0">
                {step.title && <p className="text-xs font-semibold text-white mb-1">{step.title}</p>}
                {step.math && (
                  <div className="rounded-lg px-3 py-2 mb-1 font-mono text-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#818CF8', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {step.math}
                  </div>
                )}
              </div>
            </div>
          ))}
          {q.answer && (
            <div className="rounded-xl px-4 py-3 mt-2"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#22C55E' }}>Answer: </span>
              <span className="text-sm font-semibold text-white">{q.answer}</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

function MathsConceptualPanel({ slide }) {
  const concepts = slide.concepts ?? []
  return (
    <div className="space-y-4">
      {concepts.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(11,16,32,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-start gap-3 mb-3">
            <Calculator size={16} style={{ color: '#8B5CF6', marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="font-bold text-white text-sm">{c.name}</p>
              {c.original && c.original !== c.name && (
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{c.original}</p>
              )}
            </div>
          </div>
          {c.formula && (
            <div className="rounded-lg px-4 py-2.5 mb-2 font-mono text-sm"
              style={{ background: 'rgba(91,92,255,0.1)', color: '#818CF8', border: '1px solid rgba(91,92,255,0.25)' }}>
              {c.formula}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

/* ── Main Export ─────────────────────────────────────────────── */

export default function ExplanationPanel({ slide }) {
  if (!slide) return (
    <div className="flex items-center justify-center h-48" style={{ color: '#4B5563' }}>
      No slide data
    </div>
  )

  if (slide.task === 'maths') {
    return slide.type === 'numerical'
      ? <MathsNumericalPanel slide={slide} />
      : <MathsConceptualPanel slide={slide} />
  }

  return <TheoryPanel slide={slide} />
}
