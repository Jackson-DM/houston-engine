/**
 * ReviewQueue
 *
 * Shows the 5 most recent humanized final content items from content/final/.
 * The "Humanized Hook" is the hero element — the clearest proof of output quality.
 *
 * Each card renders:
 *   - Hook (hero text — most prominent)
 *   - Body preview (truncated)
 *   - Editorial status badge
 *   - Confidence score + signal score
 *   - Content type + date
 */

import { StatusBadge } from './ui/StatusBadge.jsx'
import { EmptyState } from './ui/EmptyState.jsx'

function formatDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch { return null }
}

function truncate(text, max = 180) {
  if (!text) return null
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

function editorialBadge(item) {
  if (item.used_for_publishing) return { label: 'PUBLISHED', variant: 'published' }
  if (item.editorial_status === 'ready_for_review') return { label: 'READY FOR REVIEW', variant: 'ready' }
  if (item.needs_review) return { label: 'NEEDS REVIEW', variant: 'warning' }
  return { label: item.editorial_status?.toUpperCase() ?? 'UNKNOWN', variant: 'info' }
}

function ConfidenceBar({ value }) {
  if (value === null || value === undefined) return <span className="score-na">confidence N/A</span>
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)'
  return (
    <div className="confidence-bar">
      <div className="confidence-bar__track">
        <div className="confidence-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="confidence-bar__label" style={{ color }}>{pct}% confidence</span>
    </div>
  )
}

export function ReviewQueue({ finalContent }) {
  const items = (finalContent ?? []).slice(0, 5)

  return (
    <section className="panel queue-panel">
      <div className="panel__header">
        <h2 className="panel__title">ACTIVE REVIEW QUEUE</h2>
        <span className="panel__sub">
          {items.length} {items.length === 1 ? 'asset' : 'assets'} ready
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="★"
          message="No final content yet."
          sub="Pipeline needs to produce humanized drafts in content/final/ before items appear here."
        />
      ) : (
        <div className="queue-list">
          {items.map((item, i) => {
            const badge = editorialBadge(item)
            const date  = formatDate(item.created_at)
            const slug  = item.filename
              ? item.filename.replace(/^final-/, '').replace('.json', '')
              : item.id?.replace(/^final-/, '')

            return (
              <div key={item.id ?? i} className="queue-card">
                {/* Header row */}
                <div className="queue-card__header">
                  <div className="queue-card__meta">
                    <span className="queue-card__type">{item.content_type ?? 'post'}</span>
                    {date && <span className="queue-card__date">{date}</span>}
                    {item.score !== null && item.score !== undefined && (
                      <span className="queue-card__score">signal score: {item.score}</span>
                    )}
                  </div>
                  <StatusBadge label={badge.label} variant={badge.variant} />
                </div>

                {/* HOOK — hero element */}
                {item.hook ? (
                  <blockquote className="queue-card__hook">
                    <span className="queue-card__hook-label">HUMANIZED HOOK</span>
                    {item.hook}
                  </blockquote>
                ) : (
                  <div className="queue-card__hook queue-card__hook--missing">
                    Hook not available
                  </div>
                )}

                {/* Body preview */}
                {item.body && (
                  <p className="queue-card__body">{truncate(item.body)}</p>
                )}

                {/* Footer */}
                <div className="queue-card__footer">
                  <ConfidenceBar value={item.confidence} />
                  {slug && (
                    <span className="queue-card__slug">{slug}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
