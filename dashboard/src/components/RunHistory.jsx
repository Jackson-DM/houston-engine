/**
 * RunHistory — Git commit timeline for the PIPELINE tab.
 *
 * Props:
 *   runHistory: Array<{ sha, message, date }>
 *
 * - Pipeline/automated commits get a green ● indicator
 * - Other commits get a dim ○
 * - Relative timestamps ("2h ago", "1d ago")
 */

import { EmptyState } from './ui/EmptyState.jsx'

function relativeTime(isoDate) {
  if (!isoDate) return ''
  try {
    const diff = Date.now() - new Date(isoDate).getTime()
    if (isNaN(diff)) return ''
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins  < 1)  return 'just now'
    if (mins  < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days  < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  } catch {
    return ''
  }
}

function isPipelineRun(message) {
  if (!message) return false
  return (
    message.includes('signal-hunter') ||
    message.includes('automated') ||
    message.includes('chore(signal')
  )
}

function DeltaStat({ label, value }) {
  if (value === 0 || value == null) return null
  const positive = value > 0
  return (
    <span className="run-delta__stat">
      <span className="run-delta__label">{label}</span>
      <span className={`run-delta__value run-delta__value--${positive ? 'up' : 'down'}`}>
        {positive ? '↑' : '↓'}{Math.abs(value)}
      </span>
    </span>
  )
}

export function RunHistory({ runHistory, deltas }) {
  if (!runHistory?.length) {
    return (
      <div className="panel run-history">
        <div className="panel__header">
          <span className="panel__title">RUN HISTORY</span>
        </div>
        <EmptyState
          icon="○"
          message="No run history available"
          sub="Run npm run snapshot to generate pipeline data"
        />
      </div>
    )
  }

  const hasDeltas = deltas && Object.values(deltas).some(v => v !== 0 && v != null)

  return (
    <div className="panel run-history">
      <div className="panel__header">
        <span className="panel__title">RUN HISTORY</span>
        <span className="panel__sub">{runHistory.length} commits</span>
      </div>

      {hasDeltas && (
        <div className="run-delta">
          <span className="run-delta__heading">VS PREV RUN</span>
          <DeltaStat label="SIGNALS" value={deltas.signals_ingested} />
          <span className="run-delta__sep">|</span>
          <DeltaStat label="CONTENT" value={deltas.content_drafted} />
          <span className="run-delta__sep">|</span>
          <DeltaStat label="ERRORS"  value={deltas.errors} />
        </div>
      )}

      <div className="run-history__timeline">
        {runHistory.map((entry, i) => {
          const pipeline = isPipelineRun(entry.message)
          return (
            <div key={entry.sha ?? i} className="run-history__entry">
              <div className={`run-history__dot${pipeline ? ' run-history__dot--pipeline' : ''}`}>
                {pipeline ? '●' : '○'}
              </div>
              <div className="run-history__body">
                <span className="run-history__sha">{entry.sha}</span>
                <span className="run-history__msg">{entry.message}</span>
              </div>
              <span className="run-history__time">{relativeTime(entry.date)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
