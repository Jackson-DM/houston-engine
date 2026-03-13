/**
 * RunMetrics
 *
 * Reads automation/logs/latest-run-summary.json (via snapshot) and displays
 * key pipeline health metrics in compact cards.
 *
 * Expected shape (all fields optional — degrades gracefully):
 * {
 *   run_started_at, run_completed_at,
 *   ingestion:    { raw_signals_found, new_signals_written, duplicates_skipped },
 *   scoring:      { signals_processed, publish_count, candidate_count, archive_count, ignore_count },
 *   insights:     { eligible_signals, generated_count, skipped_count },
 *   drafts:       { eligible_insights, generated_count, skipped_count },
 *   humanization: { eligible_drafts, generated_count, skipped_count },
 *   errors:       { count, items[] }
 * }
 */

import { MetricCard } from './ui/MetricCard.jsx'
import { StatusBadge } from './ui/StatusBadge.jsx'
import { EmptyState } from './ui/EmptyState.jsx'

function formatDuration(start, end) {
  if (!start || !end) return null
  const ms = new Date(end) - new Date(start)
  if (isNaN(ms)) return null
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatTime(iso) {
  if (!iso) return 'N/A'
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    })
  } catch { return iso }
}

function runStatus(errors) {
  const n = errors?.count ?? 0
  if (n === 0)  return { label: 'SUCCESS', variant: 'ready' }
  if (n <= 5)   return { label: 'WARNING', variant: 'warning' }
  return         { label: `${n} ERRORS`, variant: 'error' }
}

export function RunMetrics({ runSummary }) {
  if (!runSummary) {
    return (
      <section className="panel metrics-panel">
        <div className="panel__header"><h2 className="panel__title">LATEST RUN</h2></div>
        <EmptyState icon="◌" message="No run summary found." sub="Run the pipeline to generate automation/logs/latest-run-summary.json" />
      </section>
    )
  }

  const { ingestion: ing, scoring: sc, insights: ins, drafts: dr, humanization: hum, errors } = runSummary
  const status   = runStatus(errors)
  const duration = formatDuration(runSummary.run_started_at, runSummary.run_completed_at)

  // Scoring pass rate (publish + candidate vs total processed)
  const passCount = (sc?.publish_count ?? 0) + (sc?.candidate_count ?? 0)
  const passRate  = sc?.signals_processed
    ? `${Math.round((passCount / sc.signals_processed) * 100)}%`
    : 'N/A'

  return (
    <section className="panel metrics-panel">
      <div className="panel__header">
        <h2 className="panel__title">LATEST RUN</h2>
        <div className="metrics-status-row">
          <StatusBadge label={status.label} variant={status.variant} />
          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
            {formatTime(runSummary.run_started_at)}
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Run meta */}
        <MetricCard label="Duration"          value={duration ?? 'N/A'}                             accent="cyan"    />
        <MetricCard label="Raw Signals Seen"  value={ing?.raw_signals_found ?? 'N/A'}               accent="cyan"    />
        <MetricCard label="New Written"       value={ing?.new_signals_written ?? 'N/A'}             accent="cyan"    />
        <MetricCard label="Duplicates Removed" value={ing?.duplicates_skipped ?? 'N/A'}             accent="magenta" />

        {/* Scoring */}
        <MetricCard label="Scored"            value={sc?.signals_processed ?? 'N/A'}                accent="cyan"    />
        <MetricCard label="Publish-worthy"    value={passCount}
                    sub={`${passRate} pass rate`}                                                   accent={passCount > 0 ? 'green' : 'amber'} />
        <MetricCard label="Archived"          value={sc?.archive_count ?? 'N/A'}                    accent="magenta" />

        {/* Downstream */}
        <MetricCard label="Insights"          value={ins?.generated_count ?? 'N/A'}
                    sub={`${ins?.eligible_signals ?? '?'} eligible`}                               accent="magenta" />
        <MetricCard label="Drafts"            value={dr?.generated_count ?? 'N/A'}
                    sub={`${dr?.eligible_insights ?? '?'} eligible`}                               accent="magenta" />
        <MetricCard label="Humanized"         value={hum?.generated_count ?? 'N/A'}
                    sub={`${hum?.eligible_drafts ?? '?'} eligible`}                               accent="green"   />

        {/* Errors */}
        <MetricCard
          label="Pipeline Errors"
          value={errors?.count ?? 0}
          sub={errors?.count > 0 ? 'See logs for details' : 'Clean run'}
          accent={errors?.count > 0 ? 'red' : 'green'}
          wide
        />
      </div>

      {/* Error list (collapsed, show top 3) */}
      {errors?.count > 0 && errors?.items?.length > 0 && (
        <div className="metrics-errors">
          <div className="metrics-errors__label">RECENT ERRORS</div>
          {errors.items.slice(0, 3).map((e, i) => (
            <div key={i} className="metrics-errors__item">{e}</div>
          ))}
          {errors.items.length > 3 && (
            <div className="metrics-errors__more">+{errors.items.length - 3} more in logs</div>
          )}
        </div>
      )}
    </section>
  )
}
