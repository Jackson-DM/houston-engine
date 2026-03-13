/**
 * EmptyState — polished fallback for sections with no data.
 */
export function EmptyState({ icon = '○', message, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <div className="empty-state__message">{message}</div>
      {sub && <div className="empty-state__sub">{sub}</div>}
    </div>
  )
}
