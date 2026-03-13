/**
 * AuthorityImpact
 *
 * Final stage of the system lifecycle: signal intelligence → authority content → audience impact.
 *
 * Four sections:
 *   1. Authority Outputs      — total / published / pending metric cards
 *   2. Authority Topics       — strategic pillar tags derived from signal_category
 *   3. Signal Source Attribution — which source powered each authority asset
 *   4. Engagement Placeholders  — impressions / engagement rate / comments / reshares (live tracking)
 *
 * Data source: finalContent array from snapshot (each item enriched with source_name,
 * signal_type, signal_category via the attribution chain in generate-snapshot.js).
 */

import { EmptyState } from './ui/EmptyState.jsx'

// ── Pillar grouping (mirrors PillarCoverage + generate-snapshot.js) ────────────
const PILLAR_MAP = {
  'Industrial AI':                        'Industrial AI',
  'Industrial AI / Robotics':             'Industrial AI',
  'Physical AI / Robotics':               'Industrial AI',
  'Enterprise AI':                        'Enterprise AI',
  'Enterprise AI / Decision Intelligence':'Enterprise AI',
  'AI Research':                          'AI Research & Tools',
}

const PILLAR_COLORS = {
  'Industrial AI':        'var(--cyan)',
  'Enterprise AI':        'var(--magenta)',
  'AI Research & Tools':  'var(--amber)',
}

const ENGAGEMENT_PLACEHOLDERS = [
  { label: 'Impressions',     icon: '◎', key: 'impressions' },
  { label: 'Engagement Rate', icon: '△', key: 'engagement'  },
  { label: 'Comments',        icon: '◇', key: 'comments'    },
  { label: 'Reshares',        icon: '↻', key: 'reshares'    },
]

function pillarFromCategory(cat) {
  return PILLAR_MAP[cat] ?? cat ?? 'Other'
}

function pillarColor(pillar) {
  return PILLAR_COLORS[pillar] ?? 'var(--text-muted)'
}

function statusColor(status) {
  if (status === 'published')       return 'var(--green)'
  if (status === 'ready_for_review') return 'var(--cyan)'
  return 'var(--amber)'
}

function statusLabel(status) {
  if (status === 'published')        return 'Published'
  if (status === 'ready_for_review') return 'Ready for Review'
  return 'Pending'
}

// ─── Section: Authority Output Metrics ────────────────────────────────────────
function OutputMetrics({ items }) {
  const total     = items.length
  const published = items.filter(i => i.used_for_publishing).length
  const ready     = items.filter(i => i.editorial_status === 'ready_for_review').length
  const pending   = total - published - ready

  const stats = [
    { label: 'Total Authority Posts', val: total,     color: 'var(--text-primary)',  glow: false },
    { label: 'Published',             val: published, color: 'var(--green)',          glow: true  },
    { label: 'Ready for Review',      val: ready,     color: 'var(--cyan)',           glow: true  },
    { label: 'In Queue',              val: pending,   color: 'var(--amber)',          glow: false },
  ]

  return (
    <div className="ai-section">
      <div className="ai-section__title">AUTHORITY OUTPUTS</div>
      <div className="ai-output-metrics">
        {stats.map(s => (
          <div key={s.label} className="ai-metric-card">
            <div
              className="ai-metric-card__val"
              style={{ color: s.color, textShadow: s.glow ? `0 0 8px ${s.color}88, 0 0 20px ${s.color}44` : 'none' }}
            >
              {s.val}
            </div>
            <div className="ai-metric-card__label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section: Authority Topics ─────────────────────────────────────────────────
function AuthorityTopics({ items }) {
  // Count by pillar
  const pillarCounts = {}
  for (const item of items) {
    const pillar = pillarFromCategory(item.signal_category)
    pillarCounts[pillar] = (pillarCounts[pillar] ?? 0) + 1
  }

  // Signal types as topic tags
  const signalTypes = [...new Set(items.map(i => i.signal_type).filter(Boolean))]

  if (!Object.keys(pillarCounts).length && !signalTypes.length) {
    return (
      <div className="ai-section">
        <div className="ai-section__title">AUTHORITY TOPICS</div>
        <div className="ai-section__empty">No topic data — run <code>npm run snapshot</code> to enrich.</div>
      </div>
    )
  }

  return (
    <div className="ai-section">
      <div className="ai-section__title">AUTHORITY TOPICS</div>

      {/* Strategic pillars */}
      <div className="ai-topic-pillars">
        {Object.entries(pillarCounts).map(([pillar, count]) => {
          const color = pillarColor(pillar)
          return (
            <div
              key={pillar}
              className="ai-pillar-tag"
              style={{ '--tag-color': color, borderColor: color + '55', color }}
            >
              <span className="ai-pillar-tag__dot" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
              <span>{pillar}</span>
              <span className="ai-pillar-tag__count">{count}</span>
            </div>
          )
        })}
      </div>

      {/* Signal type sub-tags */}
      {signalTypes.length > 0 && (
        <div className="ai-signal-types">
          {signalTypes.map(t => (
            <span key={t} className="ai-signal-type-tag">{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Section: Signal Source Attribution ───────────────────────────────────────
function SourceAttribution({ items }) {
  // Group by source
  const sources = {}
  for (const item of items) {
    const name = item.source_name ?? 'Unknown Source'
    if (!sources[name]) sources[name] = { name, count: 0, posts: [] }
    sources[name].count++
    sources[name].posts.push(item)
  }

  const sourceList = Object.values(sources).sort((a, b) => b.count - a.count)

  return (
    <div className="ai-section">
      <div className="ai-section__title">SIGNAL SOURCE ATTRIBUTION</div>
      <div className="ai-attribution-sub">Where authority content originates — the upstream signal that generated each post</div>

      {sourceList.length === 0 ? (
        <div className="ai-section__empty">No attribution data available.</div>
      ) : (
        <div className="ai-attribution-list">
          {sourceList.map(src => (
            <div key={src.name} className="ai-attribution-row">
              <div className="ai-attribution-row__source">
                <div className="ai-attribution-source-dot" />
                <span className="ai-attribution-source-name">{src.name}</span>
              </div>
              <div className="ai-attribution-row__posts">
                {src.posts.map(post => (
                  <div key={post.id} className="ai-attribution-post">
                    <span
                      className="ai-attribution-post__status"
                      style={{ color: statusColor(post.editorial_status) }}
                    >
                      {statusLabel(post.editorial_status)}
                    </span>
                    {post.hook && (
                      <span className="ai-attribution-post__hook">
                        "{post.hook.slice(0, 80)}{post.hook.length > 80 ? '…' : ''}"
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Section: Engagement Placeholders ─────────────────────────────────────────
function EngagementLayer() {
  return (
    <div className="ai-section">
      <div className="ai-section__title">REAL-WORLD IMPACT TRACKING</div>
      <div className="ai-engagement-sub">
        Live audience metrics will populate here once posts are published.
        This layer closes the loop: signal intelligence → authority content → measurable audience impact.
      </div>

      <div className="ai-engagement-grid">
        {ENGAGEMENT_PLACEHOLDERS.map(metric => (
          <div key={metric.key} className="ai-engagement-card">
            <div className="ai-engagement-card__icon">{metric.icon}</div>
            <div className="ai-engagement-card__val">—</div>
            <div className="ai-engagement-card__label">{metric.label}</div>
            <div className="ai-engagement-card__status">Awaiting publish</div>
          </div>
        ))}
      </div>

      <div className="ai-engagement-note">
        <span className="ai-engagement-note__icon">◈</span>
        <span>
          Connect LinkedIn Analytics, Twitter/X API, or export engagement CSVs to populate this panel.
          The engine is designed to measure what moves audiences, not just what exits the pipeline.
        </span>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AuthorityImpact({ finalContent }) {
  const items = finalContent ?? []

  return (
    <section className="panel ai-panel">
      {/* Accent bar */}
      <div className="ai-panel__accent" />

      <div className="panel__header">
        <h2 className="panel__title">AUTHORITY IMPACT</h2>
        <span className="panel__sub">signal intelligence → authority content → audience impact</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="◈"
          message="No authority content in pipeline yet."
          sub="Run the full pipeline to generate final authority posts."
        />
      ) : (
        <div className="ai-body">
          <OutputMetrics items={items} />
          <div className="ai-split-row">
            <AuthorityTopics items={items} />
            <SourceAttribution items={items} />
          </div>
          <EngagementLayer />
        </div>
      )}

      {/* Lifecycle trail */}
      <div className="ai-lifecycle">
        {['Signal Ingest', 'Score', 'Extract Insight', 'Draft', 'Humanize', 'Review', 'Publish', 'Measure Impact'].map((step, i, arr) => (
          <div key={step} className="ai-lifecycle__step">
            <span className={`ai-lifecycle__label${i === arr.length - 1 ? ' ai-lifecycle__label--active' : ''}`}>
              {step}
            </span>
            {i < arr.length - 1 && <span className="ai-lifecycle__arrow">›</span>}
          </div>
        ))}
      </div>
    </section>
  )
}
