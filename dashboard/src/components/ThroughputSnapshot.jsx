/**
 * ThroughputSnapshot
 *
 * Answers: "How much is moving through the engine, and where is it piling up?"
 *
 * Uses the combination of repo file counts (funnel) and run summary
 * to produce a plain-language health sentence + stage efficiency table.
 */

import { EmptyState } from './ui/EmptyState.jsx'

function pct(a, b) {
  if (!b || a === null || a === undefined) return null
  return Math.round((a / b) * 100)
}

function EffRow({ from, to, inCount, outCount }) {
  const rate = pct(outCount, inCount)
  const color = rate === null ? 'var(--text-muted)'
    : rate >= 60 ? 'var(--green)'
    : rate >= 25 ? 'var(--amber)'
    : 'var(--red)'

  return (
    <div className="eff-row">
      <div className="eff-row__stages">
        <span className="eff-row__from">{from}</span>
        <span className="eff-row__arrow">→</span>
        <span className="eff-row__to">{to}</span>
      </div>
      <div className="eff-row__counts">
        {inCount ?? '?'} → {outCount ?? '?'}
      </div>
      <div className="eff-row__rate" style={{ color }}>
        {rate !== null ? `${rate}% pass` : 'N/A'}
      </div>
      <div className="eff-row__bar-track">
        <div
          className="eff-row__bar"
          style={{
            width: rate !== null ? `${rate}%` : '0%',
            background: color,
          }}
        />
      </div>
    </div>
  )
}

function healthStatus(finalCount, errorCount, rawCount) {
  if (finalCount > 0 && errorCount === 0) return { label: '● HEALTHY', color: 'var(--green)' }
  if (finalCount > 0 && errorCount > 0)   return { label: '◑ DEGRADED', color: 'var(--amber)' }
  if (finalCount === 0 && errorCount > 0)  return { label: '◯ BLOCKED', color: 'var(--red)' }
  if (rawCount === 0)                      return { label: '◯ IDLE', color: 'var(--text-muted)' }
  return { label: '◑ PARTIAL', color: 'var(--amber)' }
}

export function ThroughputSnapshot({ funnel, runSummary }) {
  if (!funnel) {
    return (
      <section className="panel throughput-panel">
        <div className="panel__header"><h2 className="panel__title">THROUGHPUT SNAPSHOT</h2></div>
        <EmptyState icon="◌" message="No pipeline data available." />
      </section>
    )
  }

  const rawSeen   = runSummary?.ingestion?.raw_signals_found ?? funnel.raw
  const errors    = runSummary?.errors?.count ?? 0
  const health    = healthStatus(funnel.final, errors, rawSeen)

  // Stage-to-stage efficiency table
  // Uses run summary counts where available for more accuracy
  const stages = [
    {
      from:     'Raw Signals',
      to:       'Scored',
      inCount:  rawSeen,
      outCount: runSummary?.scoring?.signals_processed ?? funnel.scored,
    },
    {
      from:     'Scored',
      to:       'Insights',
      inCount:  runSummary?.scoring?.signals_processed ?? funnel.scored,
      outCount: runSummary?.insights?.generated_count ?? funnel.insights,
    },
    {
      from:     'Insights',
      to:       'Drafts',
      inCount:  runSummary?.insights?.generated_count ?? funnel.insights,
      outCount: runSummary?.drafts?.generated_count ?? funnel.drafts,
    },
    {
      from:     'Drafts',
      to:       'Final',
      inCount:  runSummary?.drafts?.generated_count ?? funnel.drafts,
      outCount: runSummary?.humanization?.generated_count ?? funnel.final,
    },
  ]

  // Plain-language summary sentence
  const sentence = buildSentence(rawSeen, runSummary, funnel)

  return (
    <section className="panel throughput-panel">
      <div className="panel__header">
        <h2 className="panel__title">THROUGHPUT SNAPSHOT</h2>
        <span style={{ color: health.color, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          {health.label}
        </span>
      </div>

      {/* Summary sentence */}
      <div className="throughput-sentence">{sentence}</div>

      {/* Stage efficiency table */}
      <div className="eff-table">
        <div className="eff-table__head">
          <span>Stage Transition</span>
          <span>Count</span>
          <span>Efficiency</span>
          <span></span>
        </div>
        {stages.map((s, i) => <EffRow key={i} {...s} />)}
      </div>

      {/* Error note */}
      {errors > 0 && (
        <div className="throughput-note throughput-note--warn">
          ⚠ {errors} pipeline errors in last run are suppressing throughput.
          Check <code>automation/logs/latest-run-summary.json</code> for details.
        </div>
      )}

      {/* Inventory note */}
      <div className="throughput-note">
        <span className="text-muted">Current repo inventory: </span>
        {funnel.raw} raw · {funnel.scored} scored · {funnel.insights} insights · {funnel.drafts} drafts · {funnel.final} final
      </div>
    </section>
  )
}

function buildSentence(rawSeen, runSummary, funnel) {
  const scored   = runSummary?.scoring?.signals_processed ?? funnel.scored
  const insights = runSummary?.insights?.generated_count ?? funnel.insights
  const drafts   = runSummary?.drafts?.generated_count ?? funnel.drafts
  const finals   = runSummary?.humanization?.generated_count ?? funnel.final

  return `${rawSeen} signals entered the pipeline → ${scored} survived scoring → ${insights} became insights → ${drafts} became draft${drafts !== 1 ? 's' : ''} → ${finals} became final ${finals !== 1 ? 'assets' : 'asset'}.`
}
