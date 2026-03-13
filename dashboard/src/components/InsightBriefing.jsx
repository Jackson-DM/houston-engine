/**
 * InsightBriefing
 *
 * Accordion cards — one per insight summary — showing the full strategic analysis:
 *   summary · why_it_matters · business_implication · regional_angle · recommended_angle
 *
 * Clicking a card header expands/collapses the detail sections.
 * High-score insights (publish route) open expanded by default.
 */

import { useState } from 'react'
import { EmptyState } from './ui/EmptyState.jsx'
import { CountUp }    from './CountUp.jsx'

function routeColor(route) {
  if (route === 'publish') return 'var(--green)'
  if (route === 'candidate') return 'var(--amber)'
  return 'var(--text-muted)'
}

function routeLabel(route) {
  if (route === 'publish')   return 'PUBLISH'
  if (route === 'candidate') return 'CANDIDATE'
  return (route ?? 'UNKNOWN').toUpperCase()
}

function confPct(confidence) {
  if (confidence === null || confidence === undefined) return null
  return Math.round(confidence * 100)
}

function Section({ label, children }) {
  if (!children) return null
  return (
    <div className="insight-card__section">
      <div className="insight-card__section-label">{label}</div>
      <div className="insight-card__section-body">{children}</div>
    </div>
  )
}

function AngleList({ angles }) {
  if (!angles?.length) return null
  return (
    <ul className="insight-card__angle-list">
      {angles.map((a, i) => (
        <li key={i} className="insight-card__angle-item">
          <span className="insight-card__angle-num">{i + 1}</span>
          {a}
        </li>
      ))}
    </ul>
  )
}

function InsightCard({ item, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const color = routeColor(item.route)
  const conf  = confPct(item.confidence)

  const hasDetail = item.why_it_matters || item.business_implication ||
                    item.regional_angle  || item.recommended_angle   ||
                    item.content_angles?.length

  return (
    <div
      className={`insight-card${open ? ' insight-card--open' : ''}`}
      style={{ '--insight-accent': color }}
    >
      {/* Header — always visible, click to toggle */}
      <button
        className="insight-card__header"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        disabled={!hasDetail}
      >
        <div className="insight-card__header-left">
          <span className="insight-card__route" style={{ color, borderColor: color }}>
            {routeLabel(item.route)}
          </span>
          <span className="insight-card__title">
            {item.summary ?? item.id}
          </span>
        </div>
        <div className="insight-card__header-right">
          {conf !== null && (
            <span className="insight-card__conf" style={{ color }}>
              <CountUp value={conf} duration={600} />%
            </span>
          )}
          {item.score !== null && item.score !== undefined && (
            <span className="insight-card__score">
              <CountUp value={item.score} duration={700} />
            </span>
          )}
          {hasDetail && (
            <span className="insight-card__chevron" aria-hidden="true">
              {open ? '▲' : '▼'}
            </span>
          )}
        </div>
      </button>

      {/* Expandable detail */}
      {open && hasDetail && (
        <div className="insight-card__body">
          <Section label="WHY IT MATTERS">{item.why_it_matters}</Section>
          <Section label="BUSINESS IMPLICATION">{item.business_implication}</Section>
          <Section label="REGIONAL ANGLE — HOUSTON">{item.regional_angle}</Section>
          <Section label="RECOMMENDED ANGLE">{item.recommended_angle}</Section>
          {item.content_angles?.length > 0 && (
            <div className="insight-card__section">
              <div className="insight-card__section-label">CONTENT ANGLES</div>
              <AngleList angles={item.content_angles} />
            </div>
          )}
          {item.publisher && (
            <div className="insight-card__footer-meta">
              Source: {item.publisher}
              {item.used && <span className="insight-card__used-badge">USED FOR CONTENT</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function InsightBriefing({ insightSummaries }) {
  const items = insightSummaries ?? []

  return (
    <section className="panel insight-briefing-panel">
      <div className="panel__header">
        <h2 className="panel__title">INSIGHT BRIEFING</h2>
        <span className="panel__sub">
          {items.length} {items.length === 1 ? 'insight' : 'insights'} · strategic analysis per signal
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="◉"
          message="No insight summaries available."
          sub="Run the pipeline to generate insights in signals/insights/"
        />
      ) : (
        <div className="insight-list">
          {items.map((item, i) => (
            <InsightCard
              key={item.id ?? i}
              item={item}
              defaultOpen={item.route === 'publish' && i === 0}
            />
          ))}
        </div>
      )}
    </section>
  )
}
