/**
 * MetricCard — compact data panel used in the RunMetrics section.
 * accent: 'cyan' | 'magenta' | 'green' | 'amber' | 'red'
 *
 * Numeric values automatically animate in with CountUp.
 * String values (e.g. 'N/A', '3m 42s', '100%') display as-is.
 */
import { CountUp } from '../CountUp.jsx'

export function MetricCard({ label, value, sub, accent = 'cyan', wide = false }) {
  const isNumeric = typeof value === 'number'
  return (
    <div className={`metric-card metric-card--${accent}${wide ? ' metric-card--wide' : ''}`}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">
        {isNumeric ? <CountUp value={value} duration={800} /> : (value ?? 'N/A')}
      </div>
      {sub && <div className="metric-card__sub">{sub}</div>}
    </div>
  )
}
