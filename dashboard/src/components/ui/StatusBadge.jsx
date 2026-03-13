/**
 * StatusBadge — small pill showing pipeline or content status.
 * variant: 'ready' | 'warning' | 'error' | 'published' | 'live' | 'mock' | 'info'
 */
export function StatusBadge({ label, variant = 'info' }) {
  return <span className={`badge badge--${variant}`}>{label}</span>
}
