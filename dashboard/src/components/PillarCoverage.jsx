/**
 * PillarCoverage
 *
 * Shows which strategic pillars are represented in the scored signal corpus.
 * Pillars are derived from signal_category YAML field, grouped to match
 * the three scoring axes in score_signals.py:
 *
 *   Industrial AI  — Physical AI / Robotics, Industrial AI / Robotics, Industrial AI
 *   Enterprise AI  — Enterprise AI, Enterprise AI / Decision Intelligence
 *   AI Research & Tools — AI Research
 *
 * Answers: "Is the engine producing balanced authority coverage?"
 */

import { EmptyState } from './ui/EmptyState.jsx'

const PILLAR_COLORS = {
  'Industrial AI':       { color: 'var(--cyan)',    dim: 'var(--cyan-dim)'    },
  'Enterprise AI':       { color: 'var(--magenta)', dim: 'var(--magenta-dim)' },
  'AI Research & Tools': { color: 'var(--amber)',   dim: 'var(--amber-dim)'   },
}

const PILLAR_DESCRIPTIONS = {
  'Industrial AI':       'Physical AI, robotics, manufacturing, factory floor',
  'Enterprise AI':       'Deployment, governance, decision intelligence, agentic systems',
  'AI Research & Tools': 'Foundational models, tooling, open-source, benchmarks',
}

function getDefault(pillar) {
  return PILLAR_COLORS[pillar] ?? { color: 'var(--text-muted)', dim: 'transparent' }
}

function coverageLabel(count, total) {
  const pct = Math.round((count / total) * 100)
  if (pct >= 40) return 'Strong'
  if (pct >= 20) return 'Moderate'
  return 'Thin'
}

export function PillarCoverage({ pillarCoverage }) {
  if (!pillarCoverage?.length) {
    return (
      <section className="panel pillar-panel">
        <div className="panel__header"><h2 className="panel__title">STRATEGIC PILLAR COVERAGE</h2></div>
        <EmptyState icon="◉" message="No pillar data available." sub="Run npm run snapshot to parse live signal metadata." />
      </section>
    )
  }

  const total     = pillarCoverage.reduce((s, p) => s + p.count, 0)
  const maxCount  = Math.max(...pillarCoverage.map(p => p.count))
  const maxScore  = Math.max(...pillarCoverage.map(p => p.avg_score))

  // Balance check: warn if any pillar is at <15% of total
  const thinPillars = pillarCoverage.filter(p => p.count / total < 0.15)

  return (
    <section className="panel pillar-panel">
      <div className="panel__header">
        <h2 className="panel__title">STRATEGIC PILLAR COVERAGE</h2>
        <span className="panel__sub">{total} signals across {pillarCoverage.length} pillars</span>
      </div>

      <div className="pillar-list">
        {pillarCoverage.map(p => {
          const { color, dim }  = getDefault(p.pillar)
          const countPct  = Math.round((p.count / maxCount) * 100)
          const scorePct  = Math.round((p.avg_score / 100) * 100)
          const sharePct  = Math.round((p.count / total) * 100)
          const coverage  = coverageLabel(p.count, total)
          const desc      = PILLAR_DESCRIPTIONS[p.pillar] ?? ''

          return (
            <div key={p.pillar} className="pillar-row" style={{ '--pillar-color': color, '--pillar-dim': dim }}>
              {/* Header */}
              <div className="pillar-row__header">
                <div>
                  <div className="pillar-row__name" style={{ color }}>{p.pillar}</div>
                  {desc && <div className="pillar-row__desc">{desc}</div>}
                </div>
                <div className="pillar-row__stats">
                  <span className="pillar-stat">
                    <span className="pillar-stat__val" style={{ color }}>{p.count}</span>
                    <span className="pillar-stat__label">signals</span>
                  </span>
                  <span className="pillar-stat">
                    <span className="pillar-stat__val" style={{ color }}>{p.avg_score}</span>
                    <span className="pillar-stat__label">avg</span>
                  </span>
                  <span className="pillar-stat">
                    <span className="pillar-stat__val" style={{ color }}>{sharePct}%</span>
                    <span className="pillar-stat__label">share</span>
                  </span>
                </div>
              </div>

              {/* Count bar */}
              <div className="pillar-bar-group">
                <span className="pillar-bar-label">Volume</span>
                <div className="pillar-bar-track">
                  <div className="pillar-bar" style={{ width: `${countPct}%`, background: color, opacity: 0.75 }} />
                </div>
                <span className="pillar-bar-coverage"
                  style={{ color: coverage === 'Strong' ? color : coverage === 'Moderate' ? 'var(--amber)' : 'var(--text-muted)' }}>
                  {coverage}
                </span>
              </div>

              {/* Avg score bar */}
              <div className="pillar-bar-group">
                <span className="pillar-bar-label">Avg score</span>
                <div className="pillar-bar-track">
                  <div className="pillar-bar" style={{ width: `${scorePct}%`, background: color, opacity: 0.45 }} />
                  {/* Publish threshold marker */}
                  <div className="pillar-bar-threshold" style={{ left: '60%' }} title="Publish threshold (60)" />
                </div>
                <span className="pillar-bar-coverage" style={{ color: p.avg_score >= 60 ? 'var(--green)' : p.avg_score >= 45 ? 'var(--amber)' : 'var(--text-muted)' }}>
                  {p.avg_score >= 60 ? 'Above publish' : p.avg_score >= 45 ? 'Near threshold' : 'Sub-threshold'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Coverage balance note */}
      {thinPillars.length > 0 ? (
        <div className="pillar-notice pillar-notice--warn">
          <span>⚠</span>
          <span>
            <strong>{thinPillars.map(p => p.pillar).join(', ')}</strong> {thinPillars.length === 1 ? 'has' : 'have'} thin coverage — consider expanding source feeds in this pillar.
          </span>
        </div>
      ) : (
        <div className="pillar-notice pillar-notice--ok">
          <span>✓</span>
          <span>Pillar coverage is balanced across Industrial AI and Enterprise AI.</span>
        </div>
      )}
    </section>
  )
}
