/**
 * PipelineFunnel
 *
 * Renders the 5-stage content manufacturing line as a horizontal funnel.
 * Counts come from repo file counts (funnel) — the actual current state.
 * Drop-off percentages are derived between adjacent stages.
 *
 * Stage order mirrors the repo directory structure:
 *   signals/raw → signals/scored → signals/insights → content/drafts → content/final
 */

import { EmptyState } from './ui/EmptyState.jsx'

const STAGES = [
  { key: 'raw',      label: 'RAW SIGNALS',  path: 'signals/raw/',      icon: '⬡', color: 'cyan'    },
  { key: 'scored',   label: 'SCORED',       path: 'signals/scored/',   icon: '◈', color: 'cyan'    },
  { key: 'insights', label: 'INSIGHTS',     path: 'signals/insights/', icon: '◉', color: 'magenta' },
  { key: 'drafts',   label: 'DRAFTS',       path: 'content/drafts/',   icon: '◎', color: 'magenta' },
  { key: 'final',    label: 'FINAL',        path: 'content/final/',    icon: '★', color: 'green'   },
]

function pct(numerator, denominator) {
  if (!denominator || !numerator) return null
  return Math.round((numerator / denominator) * 100)
}

function dropColor(rate) {
  if (rate === null) return 'var(--text-muted)'
  if (rate >= 60)   return 'var(--green)'
  if (rate >= 30)   return 'var(--amber)'
  return 'var(--red)'
}

export function PipelineFunnel({ funnel, runSummary }) {
  if (!funnel) return <EmptyState icon="⬡" message="No funnel data available." />

  // Use run summary ingestion count as the "true raw" total if available,
  // since RSS polling finds more signals than what stays in signals/raw/
  const runRaw = runSummary?.ingestion?.raw_signals_found ?? null

  const stages = STAGES.map(s => ({ ...s, count: funnel[s.key] ?? 0 }))
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  // Overall conversion: final / raw_signals_from_run (or file count)
  const rawBase = runRaw ?? funnel.raw
  const overallPct = pct(funnel.final, rawBase)

  return (
    <section className="panel funnel-panel">
      <div className="panel__header">
        <h2 className="panel__title">SIGNAL → POST FUNNEL</h2>
        {overallPct !== null && (
          <span className="funnel-overall">
            Overall conversion: <strong style={{ color: overallPct >= 10 ? 'var(--green)' : 'var(--amber)' }}>{overallPct}%</strong>
            <span className="text-muted"> ({funnel.final} of {rawBase} signals became final content)</span>
          </span>
        )}
      </div>

      <div className="funnel-stages">
        {stages.map((stage, i) => {
          const prev  = i > 0 ? stages[i - 1].count : null
          const rate  = i > 0 ? pct(stage.count, prev) : null
          const barH  = Math.max((stage.count / maxCount) * 100, 4)

          return (
            <div key={stage.key} className="funnel-stage-wrap">
              {/* Drop rate arrow between stages */}
              {i > 0 && (
                <div className="funnel-arrow">
                  <div className="funnel-arrow__line" />
                  <div className="funnel-arrow__head">▶</div>
                  {rate !== null && (
                    <div
                      className="funnel-arrow__rate"
                      style={{ color: dropColor(rate) }}
                    >
                      {rate}%
                    </div>
                  )}
                </div>
              )}

              {/* Stage card */}
              <div className={`funnel-stage funnel-stage--${stage.color}`}>
                <div className="funnel-stage__icon">{stage.icon}</div>
                <div className="funnel-stage__count">{stage.count}</div>
                <div className="funnel-stage__label">{stage.label}</div>
                <div className="funnel-stage__path">{stage.path}</div>

                {/* Bar showing relative volume */}
                <div className="funnel-bar-track">
                  <div
                    className={`funnel-bar funnel-bar--${stage.color}`}
                    style={{ height: `${barH}%` }}
                  />
                </div>

                {/* Show run-summary raw count as annotation on first stage */}
                {stage.key === 'raw' && runRaw !== null && runRaw !== stage.count && (
                  <div className="funnel-stage__ann">
                    {runRaw} seen by pipeline
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottleneck callout */}
      <BottleneckCallout stages={stages} />
    </section>
  )
}

function BottleneckCallout({ stages }) {
  // Find biggest single-step drop
  let worst = null
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].count
    const curr = stages[i].count
    if (!prev) continue
    const rate = pct(curr, prev)
    if (worst === null || rate < worst.rate) {
      worst = { from: stages[i - 1].label, to: stages[i].label, rate, count: curr, prev }
    }
  }

  if (!worst || worst.rate === null || worst.rate >= 50) return null

  return (
    <div className="funnel-callout">
      <span className="funnel-callout__icon">⚠</span>
      <span>
        Bottleneck detected: <strong>{worst.from} → {worst.to}</strong> drops{' '}
        <strong style={{ color: worst.rate < 20 ? 'var(--red)' : 'var(--amber)' }}>
          {100 - worst.rate}%
        </strong>{' '}
        ({worst.prev} → {worst.count} items)
      </span>
    </div>
  )
}
