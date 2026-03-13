/**
 * MetricCard — compact data panel used in the RunMetrics section.
 * accent: 'cyan' | 'magenta' | 'green' | 'amber' | 'red'
 */
export function MetricCard({ label, value, sub, accent = 'cyan', wide = false }) {
  return (
    <div className={`metric-card metric-card--${accent}${wide ? ' metric-card--wide' : ''}`}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value ?? 'N/A'}</div>
      {sub && <div className="metric-card__sub">{sub}</div>}
    </div>
  )
}
