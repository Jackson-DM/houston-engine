/**
 * IndustryBreakdown
 *
 * Horizontal bar chart showing signal volume per industry,
 * with a tier split (publish vs candidate vs archive) baked into each bar.
 * Geo-relevance is shown as a pill on each row.
 */

import { EmptyState } from './ui/EmptyState.jsx'
import { CountUp }    from './CountUp.jsx'

function GeoPill({ geo }) {
  const isUS     = geo === 'US'
  const isGlobal = geo === 'Global'
  const cls = isUS     ? 'geo-pill geo-pill--us'
            : isGlobal ? 'geo-pill geo-pill--global'
            :            'geo-pill geo-pill--other'
  return <span className={cls}>{geo}</span>
}

export function IndustryBreakdown({ industryBreakdown }) {
  const rows = industryBreakdown ?? []

  if (!rows.length) {
    return (
      <section className="panel industry-panel">
        <div className="panel__header">
          <h2 className="panel__title">INDUSTRY BREAKDOWN</h2>
        </div>
        <EmptyState
          icon="⬡"
          message="No industry data available."
          sub="Run the pipeline to populate scored signals with industry tags."
        />
      </section>
    )
  }

  const maxTotal = Math.max(...rows.map(r => r.total), 1)

  return (
    <section className="panel industry-panel">
      <div className="panel__header">
        <h2 className="panel__title">INDUSTRY BREAKDOWN</h2>
        <span className="panel__sub">
          signal distribution by sector · {rows.reduce((a, r) => a + r.total, 0)} total signals
        </span>
      </div>

      {/* Legend */}
      <div className="industry-legend">
        <span className="industry-legend__item industry-legend__item--publish">▪ Publish-eligible</span>
        <span className="industry-legend__item industry-legend__item--candidate">▪ Candidate</span>
        <span className="industry-legend__item industry-legend__item--archive">▪ Below threshold</span>
      </div>

      <div className="industry-rows">
        {rows.map((row, i) => {
          const publishPct   = (row.publish_count   / maxTotal) * 100
          const candidatePct = (row.candidate_count / maxTotal) * 100
          const archivePct   = (row.archive_count   / maxTotal) * 100

          return (
            <div key={row.industry ?? i} className="industry-row">
              <div className="industry-row__label">
                <span className="industry-row__name">{row.industry}</span>
                <GeoPill geo={row.top_geo} />
              </div>

              <div className="industry-bar-track">
                {/* Publish (green) segment */}
                {row.publish_count > 0 && (
                  <div
                    className="industry-bar__fill industry-bar__fill--publish"
                    style={{ width: `${publishPct}%` }}
                    title={`${row.publish_count} publish-eligible`}
                  />
                )}
                {/* Candidate (amber) segment */}
                {row.candidate_count > 0 && (
                  <div
                    className="industry-bar__fill industry-bar__fill--candidate"
                    style={{ width: `${candidatePct}%` }}
                    title={`${row.candidate_count} candidate`}
                  />
                )}
                {/* Archive (muted) segment */}
                {row.archive_count > 0 && (
                  <div
                    className="industry-bar__fill industry-bar__fill--archive"
                    style={{ width: `${archivePct}%` }}
                    title={`${row.archive_count} below threshold`}
                  />
                )}
              </div>

              <div className="industry-row__counts">
                <span className="industry-row__total">
                  <CountUp value={row.total} duration={700} />
                </span>
                <span className="industry-row__breakdown">
                  {row.publish_count > 0 && (
                    <span className="industry-count industry-count--publish">{row.publish_count}p</span>
                  )}
                  {row.candidate_count > 0 && (
                    <span className="industry-count industry-count--candidate">{row.candidate_count}c</span>
                  )}
                  {row.archive_count > 0 && (
                    <span className="industry-count industry-count--archive">{row.archive_count}a</span>
                  )}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
