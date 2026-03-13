/**
 * App.jsx — Houston AI Authority Engine Pipeline Dashboard
 *
 * Layout:
 *   Header        (status strip)
 *   PipelineFunnel (full width)
 *   RunMetrics | ThroughputSnapshot  (side by side)
 *   ReviewQueue   (full width)
 */

import { useSnapshot } from './data/useSnapshot.js'
import { PipelineFunnel }     from './components/PipelineFunnel.jsx'
import { RunMetrics }         from './components/RunMetrics.jsx'
import { ThroughputSnapshot } from './components/ThroughputSnapshot.jsx'
import { ReviewQueue }        from './components/ReviewQueue.jsx'
import { StatusBadge }        from './components/ui/StatusBadge.jsx'

function formatTimestamp(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    })
  } catch { return iso }
}

export default function App() {
  const { snapshot, loading, error } = useSnapshot()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__spinner">◈</div>
        <div>Loading pipeline data…</div>
      </div>
    )
  }

  const { funnel, run_summary, final_content, generated_at, is_live } = snapshot ?? {}
  const errorCount = run_summary?.errors?.count ?? 0
  const runStatus  = errorCount === 0 ? 'ready' : errorCount <= 5 ? 'warning' : 'error'

  return (
    <div className="app">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header__left">
          <div className="app-header__logo">◈</div>
          <div>
            <div className="app-header__title">HOUSTON AI AUTHORITY ENGINE</div>
            <div className="app-header__sub">Signal Intelligence Pipeline · Operator Dashboard</div>
          </div>
        </div>
        <div className="app-header__right">
          {!is_live && (
            <StatusBadge label="MOCK DATA" variant="warning" />
          )}
          {is_live && (
            <StatusBadge label="LIVE DATA" variant="live" />
          )}
          <StatusBadge
            label={errorCount > 0 ? `${errorCount} ERRORS` : 'RUN OK'}
            variant={runStatus}
          />
          {generated_at && (
            <span className="app-header__ts">
              Snapshot: {formatTimestamp(generated_at)}
            </span>
          )}
        </div>
      </header>

      {/* ── Data source notice ────────────────────────────────────────── */}
      {error && (
        <div className="data-notice">
          <span className="data-notice__icon">ℹ</span>
          {error}
        </div>
      )}

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <main className="dashboard">
        {/* Row 1: Funnel (full width) */}
        <div className="dashboard__row dashboard__row--full">
          <PipelineFunnel funnel={funnel} runSummary={run_summary} />
        </div>

        {/* Row 2: Metrics + Throughput side by side */}
        <div className="dashboard__row dashboard__row--split">
          <RunMetrics runSummary={run_summary} />
          <ThroughputSnapshot funnel={funnel} runSummary={run_summary} />
        </div>

        {/* Row 3: Review Queue (full width) */}
        <div className="dashboard__row dashboard__row--full">
          <ReviewQueue finalContent={final_content} />
        </div>
      </main>

      <footer className="app-footer">
        Houston AI Authority Engine · Pipeline Dashboard ·{' '}
        <span className="text-muted">
          Run <code>npm run snapshot</code> to refresh live repo data
        </span>
      </footer>
    </div>
  )
}
