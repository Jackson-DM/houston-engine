/**
 * ContentAngles
 *
 * Aggregates all content_angles across insight summaries.
 * Deduplicates by similarity (exact string match), counts frequency,
 * and groups by the pillar of the parent insight.
 *
 * Renders a ranked list with frequency badges and pillar grouping pills.
 */

import { EmptyState } from './ui/EmptyState.jsx'

function pillarFromInsight(insight) {
  // Derive pillar from signal_category or route
  const cat = insight.signal_category ?? insight.summary ?? ''
  if (/industrial|robotics|physical/i.test(cat)) return 'Industrial AI'
  if (/enterprise|decision/i.test(cat))           return 'Enterprise AI'
  if (/research|tools/i.test(cat))                return 'AI Research'
  // fallback: use route label
  return insight.route === 'publish' ? 'Industrial AI' : 'Enterprise AI'
}

function pillarColor(pillar) {
  if (pillar === 'Industrial AI') return 'var(--cyan)'
  if (pillar === 'Enterprise AI') return 'var(--magenta)'
  return 'var(--amber)'
}

function buildAngleList(insightSummaries) {
  // Collect all angles with their parent insight context
  const angleMap = {}

  for (const insight of insightSummaries ?? []) {
    const pillar = pillarFromInsight(insight)
    for (const angle of insight.content_angles ?? []) {
      const key = angle.trim().toLowerCase()
      if (!angleMap[key]) {
        angleMap[key] = {
          text: angle.trim(),
          count: 0,
          pillars: new Set(),
          maxScore: 0,
        }
      }
      angleMap[key].count++
      angleMap[key].pillars.add(pillar)
      angleMap[key].maxScore = Math.max(angleMap[key].maxScore, insight.score ?? 0)
    }
  }

  return Object.values(angleMap)
    .map(a => ({ ...a, pillars: [...a.pillars] }))
    // Sort: frequency desc, then score desc
    .sort((a, b) => b.count - a.count || b.maxScore - a.maxScore)
}

export function ContentAngles({ insightSummaries }) {
  const items = insightSummaries ?? []
  const angles = buildAngleList(items)

  const totalAngles   = angles.length
  const uniquePillars = [...new Set(angles.flatMap(a => a.pillars))].length

  return (
    <section className="panel content-angles-panel">
      <div className="panel__header">
        <h2 className="panel__title">CONTENT ANGLES</h2>
        <span className="panel__sub">
          {totalAngles} angles · {uniquePillars} pillars
        </span>
      </div>

      {angles.length === 0 ? (
        <EmptyState
          icon="◎"
          message="No content angles generated yet."
          sub="Content angles populate once insights are created in signals/insights/"
        />
      ) : (
        <div className="angles-list">
          {angles.map((angle, i) => (
            <div key={i} className="angle-row">
              <span className="angle-row__rank">{i + 1}</span>

              <div className="angle-row__content">
                <span className="angle-row__text">{angle.text}</span>
                <div className="angle-row__meta">
                  {angle.pillars.map(p => (
                    <span
                      key={p}
                      className="angle-pillar-tag"
                      style={{ '--pillar-color': pillarColor(p) }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="angle-row__right">
                {angle.count > 1 && (
                  <span className="angle-freq-badge" title={`Appears in ${angle.count} insights`}>
                    ×{angle.count}
                  </span>
                )}
                {angle.maxScore > 0 && (
                  <span className="angle-score" title="Max parent signal score">
                    {angle.maxScore}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {angles.length > 0 && (
        <div className="angles-footer">
          <span className="angles-footer__note">
            Angles ranked by frequency across insights · score = max parent signal score
          </span>
        </div>
      )}
    </section>
  )
}
