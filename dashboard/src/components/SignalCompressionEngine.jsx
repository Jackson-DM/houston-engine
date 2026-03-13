/**
 * SignalCompressionEngine
 *
 * Animated panel that shows how 912 raw signals collapse into 1 final authority post.
 * Makes the compression ratio viscerally obvious through dot density per stage.
 *
 * Data sources (from snapshot):
 *   run_summary.ingestion.raw_signals_found  → total signals seen by pipeline
 *   funnel.scored / insights / drafts / final → repo file counts per stage
 *
 * Animation: dots fade in left-to-right on first visibility (IntersectionObserver).
 * Connector particles flow rightward continuously once visible.
 * Final node pulses with a ring glow.
 *
 * No new npm dependencies — pure CSS animation + React hooks only.
 */

import { useState, useEffect, useRef } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_COLS  = 6    // dots per row
const DOT_PX     = 6    // dot size in px
const GAP_PX     = 3    // gap between dots
const MAX_DOTS   = 30   // visual max (maps to largest stage)
const SCALE_EXP  = 0.38 // power-law exponent — lower = more dramatic compression

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Map a real count to a visual dot count using a power scale.
 * A count equal to maxCount → MAX_DOTS. count=1 → always 1.
 * Power scale makes the dramatic drop from 912→24 visually obvious.
 */
function scaleDots(count, maxCount) {
  if (!count || count === 0) return 0
  if (count >= maxCount)     return MAX_DOTS
  if (count === 1)           return 1
  return Math.max(2, Math.round(Math.pow(count / maxCount, SCALE_EXP) * MAX_DOTS))
}

function filterPct(from, to) {
  if (!from || from === 0) return null
  const pct = Math.round((1 - to / from) * 100)
  return pct > 0 ? `${pct}% filtered` : null
}

function plural(n, word) {
  return `${n.toLocaleString()} ${word}${n !== 1 ? 's' : ''}`
}

// ─── DotGrid ──────────────────────────────────────────────────────────────────
function DotGrid({ dotCount, colorKey, stageDelay, visible }) {
  if (dotCount === 0) return (
    <div className="cmp-empty-stage">—</div>
  )

  const gridW = GRID_COLS * (DOT_PX + GAP_PX) - GAP_PX

  return (
    <div
      className={`cmp-dot-grid cmp-dot-grid--${colorKey}`}
      style={{ gridTemplateColumns: `repeat(${GRID_COLS}, ${DOT_PX}px)`, width: `${gridW}px` }}
    >
      {Array.from({ length: dotCount }, (_, i) => {
        // Stagger: stage delay + per-dot delay spread over 500ms window
        const perDotDelay = dotCount > 1 ? Math.min(40, 500 / dotCount) : 0
        const delay = stageDelay + i * perDotDelay
        return (
          <div
            key={i}
            className={`cmp-dot cmp-dot--${colorKey}${visible ? ' cmp-dot--on' : ''}`}
            style={{
              '--appear-delay': `${delay}ms`,
              // Drift starts after this dot has finished appearing, staggered by index mod 7
              '--drift-delay':  `${delay + 380 + (i % 7) * 260}ms`,
              // Duration varies 3.2s–5s so dots move out of phase with each other
              '--drift-dur':    `${3200 + (i % 5) * 440}ms`,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── FinalNode ────────────────────────────────────────────────────────────────
function FinalNode({ visible, stageDelay }) {
  return (
    <div
      className={`cmp-final-node${visible ? ' cmp-final-node--on' : ''}`}
      style={{ animationDelay: `${stageDelay}ms` }}
    >
      <div className="cmp-final-node__ring cmp-final-node__ring--outer" />
      <div className="cmp-final-node__ring cmp-final-node__ring--inner" />
      <div className="cmp-final-node__core">★</div>
    </div>
  )
}

// ─── Connector ────────────────────────────────────────────────────────────────
function Connector({ label, visible, index }) {
  return (
    <div className="cmp-connector">
      <div className={`cmp-connector__track${visible ? ' cmp-connector__track--on' : ''}`}
        style={{ animationDelay: `${index * 200}ms` }}
      >
        {/* Flowing particle */}
        <div
          className="cmp-connector__particle"
          style={{ animationDelay: `${index * 0.7}s` }}
        />
      </div>
      {label && (
        <div
          className={`cmp-connector__label${visible ? ' cmp-connector__label--on' : ''}`}
          style={{ transitionDelay: `${800 + index * 300}ms` }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SignalCompressionEngine({ funnel, runSummary }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  // Trigger animation when panel scrolls into view
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // ── Data ──────────────────────────────────────────────────────────────────
  // Use raw_signals_found from run summary as the true "signals seen" count.
  // Falls back to funnel.raw if run summary is unavailable.
  const rawCount     = runSummary?.ingestion?.raw_signals_found ?? funnel?.raw ?? 0
  const scoredCount  = funnel?.scored   ?? 0
  const insightCount = funnel?.insights ?? 0
  const draftCount   = funnel?.drafts   ?? 0
  const finalCount   = funnel?.final    ?? 0
  const maxCount     = Math.max(rawCount, 1)

  const stages = [
    { key: 'raw',      label: 'RAW SIGNALS', count: rawCount,     colorKey: 'raw',     dotCount: scaleDots(rawCount, maxCount)     },
    { key: 'scored',   label: 'SCORED',      count: scoredCount,  colorKey: 'cyan',    dotCount: scaleDots(scoredCount, maxCount)  },
    { key: 'insights', label: 'INSIGHTS',    count: insightCount, colorKey: 'cyan',    dotCount: scaleDots(insightCount, maxCount) },
    { key: 'drafts',   label: 'DRAFTS',      count: draftCount,   colorKey: 'magenta', dotCount: scaleDots(draftCount, maxCount)   },
    { key: 'final',    label: 'FINAL',       count: finalCount,   colorKey: 'green',   dotCount: null },
  ]

  // Auto-generated caption from real counts
  const captionParts = [
    rawCount     && plural(rawCount, 'signal') + ' scanned',
    scoredCount  && `${scoredCount} survived scoring`,
    insightCount && `${insightCount} became ${insightCount === 1 ? 'an insight' : 'insights'}`,
    finalCount   && `${finalCount} became final authority content`,
  ].filter(Boolean)
  const caption = captionParts.join('  ·  ')

  return (
    <section className="panel cmp-panel" ref={ref}>
      <div className="panel__header">
        <h2 className="panel__title">SIGNAL COMPRESSION ENGINE</h2>
        <span className="panel__sub">signal volume → distilled authority output</span>
      </div>

      {/* Stage visualization */}
      <div className="cmp-stages">
        {stages.map((stage, i) => {
          const prevCount = i > 0 ? stages[i - 1].count : null
          const label = prevCount !== null ? filterPct(prevCount, stage.count) : null
          const stageDelay = i * 280  // ms — left-to-right cascade

          return (
            <div key={stage.key} className="cmp-stage-wrap">

              {/* Connector between stages */}
              {i > 0 && (
                <Connector label={label} visible={visible} index={i - 1} />
              )}

              {/* Stage column */}
              <div className={`cmp-stage cmp-stage--${stage.colorKey}`}>

                {/* Dot cloud or final node */}
                <div className="cmp-dots-area">
                  {stage.key === 'final' ? (
                    <FinalNode visible={visible} stageDelay={stageDelay} />
                  ) : (
                    <DotGrid
                      dotCount={stage.dotCount}
                      colorKey={stage.colorKey}
                      stageDelay={stageDelay}
                      visible={visible}
                    />
                  )}
                </div>

                {/* Count */}
                <div
                  className={`cmp-stage__count cmp-stage__count--${stage.colorKey}${visible ? ' cmp-stage__count--on' : ''}`}
                  style={{ transitionDelay: `${stageDelay + 300}ms` }}
                >
                  {stage.count.toLocaleString()}
                </div>

                {/* Label */}
                <div
                  className={`cmp-stage__label${visible ? ' cmp-stage__label--on' : ''}`}
                  style={{ transitionDelay: `${stageDelay + 400}ms` }}
                >
                  {stage.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Caption */}
      {caption && (
        <div className={`cmp-caption${visible ? ' cmp-caption--on' : ''}`}>
          {caption}
        </div>
      )}
    </section>
  )
}
