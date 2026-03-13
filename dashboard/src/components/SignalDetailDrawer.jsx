/**
 * SignalDetailDrawer — right-side slide-in panel showing full signal details.
 *
 * Props: { signal, insightSummaries, onClose }
 */

import { useEffect } from 'react'

function tierLabel(score) {
  if (score >= 60) return { label: 'PUBLISH',   color: 'var(--green)' }
  if (score >= 40) return { label: 'CANDIDATE', color: 'var(--amber)' }
  return               { label: 'ARCHIVE',   color: 'var(--text-muted)' }
}

function MetaItem({ label, value }) {
  if (!value) return null
  return (
    <div className="signal-drawer__meta-item">
      <div className="signal-drawer__meta-label">{label}</div>
      <div className="signal-drawer__meta-value">{value}</div>
    </div>
  )
}

export function SignalDetailDrawer({ signal, insightSummaries, onClose }) {
  const insight = insightSummaries?.find(i =>
    i.id?.includes(signal.signal_id) ||
    signal.signal_id?.includes(i.id)
  ) ?? null

  const tier = tierLabel(signal.final_score)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="signal-drawer">
        {/* Header */}
        <div className="signal-drawer__header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>
                SIGNAL DETAIL
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 600 }}>
                {signal.source_name}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 10px',
                fontFamily: 'var(--font)', fontSize: '0.8rem', flexShrink: 0,
              }}
            >
              ✕ close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="signal-drawer__body">

          {/* Score section */}
          <div className="signal-drawer__section">
            <div className="signal-drawer__section-title">SCORE</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <div className="signal-drawer__score">{signal.final_score}</div>
              <div style={{ paddingBottom: 6 }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                  color: tier.color, border: `1px solid ${tier.color}`,
                  background: 'rgba(0,0,0,0.3)', borderRadius: 3, padding: '2px 8px',
                }}>
                  {tier.label}
                </span>
                {signal.ai_adjustment > 0 && (
                  <span style={{
                    fontSize: '0.68rem', color: 'var(--magenta)',
                    border: '1px solid var(--magenta)', borderRadius: 3,
                    padding: '2px 6px', marginLeft: 6,
                  }}>
                    +{signal.ai_adjustment} AI
                  </span>
                )}
              </div>
            </div>
            {signal.base_score !== signal.final_score && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Base score: {signal.base_score} · AI adjustment: {signal.ai_adjustment > 0 ? '+' : ''}{signal.ai_adjustment}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="signal-drawer__section">
            <div className="signal-drawer__section-title">SIGNAL METADATA</div>
            <div className="signal-drawer__meta-grid">
              <MetaItem label="SOURCE"    value={signal.source_name} />
              <MetaItem label="TYPE"      value={signal.source_type} />
              <MetaItem label="INDUSTRY"  value={signal.industry} />
              <MetaItem label="GEO"       value={signal.geo_relevance} />
              <MetaItem label="CATEGORY"  value={signal.signal_category} />
              <MetaItem label="PRIORITY"  value={signal.priority_hint?.toUpperCase()} />
              {signal.confidence != null && (
                <MetaItem label="CONFIDENCE" value={`${Math.round(signal.confidence * 100)}%`} />
              )}
              <MetaItem label="SIGNAL ID" value={signal.signal_id} />
            </div>
          </div>

          {/* Strategic analysis (from insight) */}
          {insight ? (
            <div className="signal-drawer__section">
              <div className="signal-drawer__section-title">STRATEGIC ANALYSIS</div>

              {insight.why_it_matters && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 4 }}>
                    WHY IT MATTERS
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {insight.why_it_matters}
                  </div>
                </div>
              )}

              {insight.business_implication && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 4 }}>
                    BUSINESS IMPLICATION
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {insight.business_implication}
                  </div>
                </div>
              )}

              {insight.regional_angle && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 4 }}>
                    HOUSTON ANGLE
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {insight.regional_angle}
                  </div>
                </div>
              )}

              {insight.recommended_angle && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 4 }}>
                    RECOMMENDED ANGLE
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--cyan)', lineHeight: 1.55 }}>
                    {insight.recommended_angle}
                  </div>
                </div>
              )}

              {insight.content_angles?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    CONTENT ANGLES
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {insight.content_angles.map((a, i) => (
                      <span key={i} style={{
                        fontSize: '0.72rem', color: 'var(--text-secondary)',
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '3px 10px', lineHeight: 1.4,
                      }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="signal-drawer__section">
              <div className="signal-drawer__section-title">STRATEGIC ANALYSIS</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No insight analysis available for this signal.
              </div>
            </div>
          )}

          {/* Content status */}
          <div className="signal-drawer__section">
            <div className="signal-drawer__section-title">CONTENT STATUS</div>
            {insight?.used ? (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
                color: 'var(--green)', border: '1px solid rgba(0,255,170,0.35)',
                background: 'var(--green-dim)', borderRadius: 3, padding: '3px 10px',
                display: 'inline-block',
              }}>
                ✓ CONTENT DRAFTED
              </span>
            ) : (
              <span style={{
                fontSize: '0.72rem', color: 'var(--text-muted)',
                border: '1px solid var(--border)', borderRadius: 3, padding: '3px 10px',
                display: 'inline-block',
              }}>
                ○ NOT YET DRAFTED
              </span>
            )}
          </div>

        </div>
      </aside>
    </>
  )
}
