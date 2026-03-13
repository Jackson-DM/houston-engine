/**
 * SourceIntelligence
 *
 * Shows which RSS sources are feeding the pipeline and how they perform.
 * Data comes from source_intelligence[] in the snapshot — derived from
 * parsing YAML frontmatter across all signals/scored/*.md files.
 *
 * Answers: "Which sources are producing the best signals?"
 */

import { StatusBadge } from './ui/StatusBadge.jsx'
import { EmptyState } from './ui/EmptyState.jsx'

const SOURCE_MAX_SCORE = 100  // axis max for bar chart

function qualityVariant(avgScore) {
  if (avgScore >= 60) return 'ready'
  if (avgScore >= 45) return 'warning'
  return 'error'
}

function sourceTypeLabel(type) {
  return type === 'Company Blog' ? 'First-party' : 'News outlet'
}

export function SourceIntelligence({ sourceIntelligence }) {
  if (!sourceIntelligence?.length) {
    return (
      <section className="panel source-panel">
        <div className="panel__header"><h2 className="panel__title">SOURCE INTELLIGENCE</h2></div>
        <EmptyState icon="◌" message="No source data available." sub="Run npm run snapshot to parse live signal metadata." />
      </section>
    )
  }

  const totalSignals = sourceIntelligence.reduce((s, r) => s + r.signal_count, 0)

  return (
    <section className="panel source-panel">
      <div className="panel__header">
        <h2 className="panel__title">SOURCE INTELLIGENCE</h2>
        <span className="panel__sub">{sourceIntelligence.length} sources · {totalSignals} total signals</span>
      </div>

      <div className="source-list">
        {sourceIntelligence.map((src, i) => {
          const shareOf  = Math.round((src.signal_count / totalSignals) * 100)
          const avgPct   = (src.avg_score / SOURCE_MAX_SCORE) * 100
          const maxPct   = (src.max_score / SOURCE_MAX_SCORE) * 100

          return (
            <div key={src.source_name} className="source-row">
              {/* Left: rank + source name + type */}
              <div className="source-row__left">
                <span className="source-row__rank">#{i + 1}</span>
                <div>
                  <div className="source-row__name">{src.source_name}</div>
                  <div className="source-row__meta">
                    <span className="source-row__type">{sourceTypeLabel(src.source_type)}</span>
                    <span className="source-row__share">{shareOf}% of corpus</span>
                  </div>
                </div>
              </div>

              {/* Center: score bars */}
              <div className="source-row__bars">
                {/* Avg score bar */}
                <div className="source-bar-row">
                  <span className="source-bar-row__label">avg</span>
                  <div className="source-bar-track">
                    <div
                      className="source-bar source-bar--avg"
                      style={{ width: `${avgPct}%` }}
                    />
                    <div
                      className="source-bar source-bar--max"
                      style={{ width: `${maxPct}%` }}
                      title={`Max: ${src.max_score}`}
                    />
                  </div>
                  <span className="source-bar-row__val">{src.avg_score}</span>
                </div>
              </div>

              {/* Right: tier breakdown + quality badge */}
              <div className="source-row__right">
                <div className="source-tier-pills">
                  <span className="source-tier-pill source-tier-pill--publish">
                    {src.publish_count} publish
                  </span>
                  <span className="source-tier-pill source-tier-pill--candidate">
                    {src.candidate_count} candidate
                  </span>
                </div>
                <div className="source-badge-row">
                  <StatusBadge
                    label={`Max ${src.max_score}`}
                    variant={qualityVariant(src.avg_score)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Insight: which source to watch */}
      {sourceIntelligence.length > 0 && (
        <div className="source-insight">
          <span className="source-insight__icon">◈</span>
          <span>
            <strong>{sourceIntelligence[0].source_name}</strong> leads quality with avg{' '}
            <strong>{sourceIntelligence[0].avg_score}</strong> and {sourceIntelligence[0].publish_count} publish-tier{' '}
            {sourceIntelligence[0].publish_count === 1 ? 'signal' : 'signals'}.{' '}
            {sourceIntelligence.at(-1).publish_count === 0
              ? `${sourceIntelligence.at(-1).source_name} has yet to produce a publish-eligible signal.`
              : ''}
          </span>
        </div>
      )}
    </section>
  )
}
