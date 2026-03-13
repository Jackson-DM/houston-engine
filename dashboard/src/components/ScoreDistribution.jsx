/**
 * ScoreDistribution
 *
 * Plots all scored signals along a 0–100 axis with threshold zones.
 * Threshold zones come from score_signals.py:
 *   Ignore <20 | Archive 20–39 | Candidate 40–59 | Publish 60+
 *
 * Explains visually why only a handful of signals reach later pipeline stages.
 */

import { EmptyState } from './ui/EmptyState.jsx'
import { CountUp }    from './CountUp.jsx'

const DEFAULT_THRESHOLDS = { publish: 60, candidate: 40, archive: 20 }

function tierLabel(score, t) {
  if (score >= t.publish)   return 'publish'
  if (score >= t.candidate) return 'candidate'
  if (score >= t.archive)   return 'archive'
  return 'ignore'
}

function tierColor(tier) {
  return {
    publish:   'var(--green)',
    candidate: 'var(--amber)',
    archive:   'var(--text-muted)',
    ignore:    'var(--text-muted)',
  }[tier] ?? 'var(--text-muted)'
}

export function ScoreDistribution({ scoredSignals, thresholds, archiveDigest, onSelectSignal }) {
  if (!scoredSignals?.length) {
    return (
      <section className="panel score-dist-panel">
        <div className="panel__header"><h2 className="panel__title">SCORE DISTRIBUTION</h2></div>
        <EmptyState icon="◈" message="No scored signals available." sub="Run the pipeline to populate signals/scored/" />
      </section>
    )
  }

  const t = thresholds ?? DEFAULT_THRESHOLDS
  const sorted = [...scoredSignals].sort((a, b) => b.final_score - a.final_score)

  const publishCount   = scoredSignals.filter(s => s.final_score >= t.publish).length
  const candidateCount = scoredSignals.filter(s => s.final_score >= t.candidate && s.final_score < t.publish).length
  const archiveCount   = scoredSignals.filter(s => s.final_score < t.candidate).length

  // Summary stats
  const scores = scoredSignals.map(s => s.final_score)
  const avg    = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const max    = Math.max(...scores)
  const min    = Math.min(...scores)

  return (
    <section className="panel score-dist-panel">
      <div className="panel__header">
        <h2 className="panel__title">SCORE DISTRIBUTION</h2>
        <span className="panel__sub">{scoredSignals.length} signals · threshold zones at {t.candidate} and {t.publish}</span>
      </div>

      {/* Tier summary row */}
      <div className="score-tier-row">
        <div className="score-tier-stat score-tier-stat--green">
          <span className="score-tier-stat__val"><CountUp value={publishCount} /></span>
          <span className="score-tier-stat__label">Publish-eligible <span className="score-tier-stat__range">≥{t.publish}</span></span>
        </div>
        <div className="score-tier-stat score-tier-stat--amber">
          <span className="score-tier-stat__val"><CountUp value={candidateCount} /></span>
          <span className="score-tier-stat__label">Candidate <span className="score-tier-stat__range">{t.candidate}–{t.publish - 1}</span></span>
        </div>
        <div className="score-tier-stat score-tier-stat--muted">
          <span className="score-tier-stat__val"><CountUp value={archiveCount} /></span>
          <span className="score-tier-stat__label">Below candidate <span className="score-tier-stat__range">&lt;{t.candidate}</span></span>
        </div>
        <div className="score-tier-stat score-tier-stat--cyan">
          <span className="score-tier-stat__val"><CountUp value={avg} /></span>
          <span className="score-tier-stat__label">Avg score</span>
        </div>
      </div>

      {/* Axis with zone backgrounds */}
      <div className="score-axis-wrap">
        {/* Zone backgrounds */}
        <div className="score-axis-zones">
          <div className="score-zone score-zone--ignore"   style={{ left: '0%',                    width: `${t.archive}%` }} />
          <div className="score-zone score-zone--archive"  style={{ left: `${t.archive}%`,         width: `${t.candidate - t.archive}%` }} />
          <div className="score-zone score-zone--candidate"style={{ left: `${t.candidate}%`,       width: `${t.publish - t.candidate}%` }} />
          <div className="score-zone score-zone--publish"  style={{ left: `${t.publish}%`,         width: `${100 - t.publish}%` }} />
        </div>

        {/* Threshold marker lines */}
        <div className="score-marker score-marker--candidate" style={{ left: `${t.candidate}%` }}>
          <div className="score-marker__line" />
          <div className="score-marker__label">{t.candidate}</div>
        </div>
        <div className="score-marker score-marker--publish" style={{ left: `${t.publish}%` }}>
          <div className="score-marker__line" />
          <div className="score-marker__label">{t.publish}</div>
        </div>

        {/* Signal dots */}
        <div className="score-dots">
          {sorted.map((s, i) => {
            const tier  = tierLabel(s.final_score, t)
            const color = tierColor(tier)
            const left  = `${s.final_score}%`
            return (
              <div
                key={s.signal_id ?? i}
                className="score-dot"
                style={{ left, color, '--dot-color': color, cursor: onSelectSignal ? 'pointer' : 'default' }}
                title={`${s.source_name} · Score: ${s.final_score} · ${s.signal_category}`}
                onClick={() => onSelectSignal?.(s)}
              />
            )
          })}
        </div>

        {/* Axis labels */}
        <div className="score-axis-labels">
          <span>0</span>
          <span style={{ left: '25%' }}>25</span>
          <span style={{ left: '50%' }}>50</span>
          <span style={{ left: '75%' }}>75</span>
          <span style={{ left: '100%' }}>100</span>
        </div>
      </div>

      {/* Zone legend */}
      <div className="score-legend">
        <span className="score-legend__item score-legend__item--ignore">▪ Ignore / Archive (&lt;{t.candidate})</span>
        <span className="score-legend__item score-legend__item--candidate">▪ Candidate ({t.candidate}–{t.publish - 1})</span>
        <span className="score-legend__item score-legend__item--publish">▪ Publish-eligible (≥{t.publish})</span>
      </div>

      {/* Top signals list */}
      <div className="score-top-list">
        <div className="score-top-list__label">TOP SIGNALS IN CORPUS</div>
        {sorted.slice(0, 5).map((s, i) => {
          const tier  = tierLabel(s.final_score, t)
          const color = tierColor(tier)
          return (
            <div
              key={s.signal_id ?? i}
              className="score-top-row"
              style={{ cursor: onSelectSignal ? 'pointer' : 'default' }}
              onClick={() => onSelectSignal?.(s)}
            >
              <span className="score-top-row__rank">{i + 1}</span>
              <div className="score-top-row__bar-track">
                <div className="score-top-row__bar" style={{ width: `${s.final_score}%`, background: color }} />
              </div>
              <span className="score-top-row__score" style={{ color }}>{s.final_score}</span>
              <span className="score-top-row__source">{s.source_name}</span>
              <span className="score-top-row__cat">{s.signal_category}</span>
              {s.ai_adjustment > 0 && (
                <span className="score-top-row__ai-adj" title="AI score adjustment">+{s.ai_adjustment} AI</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Archive digest section */}
      {archiveDigest && archiveDigest.count > 0 && (
        <div className="score-archive-section">
          <div className="score-archive-section__header">
            <span className="score-archive-section__label">SIGNALS/ARCHIVE</span>
            <span className="score-archive-section__count">
              <CountUp value={archiveDigest.count} duration={700} /> archived
            </span>
          </div>
          {archiveDigest.samples?.length > 0 && (
            <div className="score-archive-list">
              {archiveDigest.samples.map((s, i) => (
                <div key={s.signal_id ?? i} className="score-archive-row">
                  <span className="score-archive-row__score">{s.final_score}</span>
                  <span className="score-archive-row__source">{s.source_name}</span>
                  <span className="score-archive-row__cat">{s.signal_category}</span>
                  <span className="score-archive-row__geo">{s.geo_relevance}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
