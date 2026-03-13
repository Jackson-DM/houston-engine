/**
 * App.jsx — Houston AI Authority Engine Pipeline Dashboard
 *
 * Layout:
 *   Header
 *   Row 1: Pipeline Funnel           (full width)
 *   Row 2: Score Distribution        (full width)
 *   Row 3: Source Intelligence | Pillar Coverage   (50/50)
 *   Row 4: Run Metrics | Throughput Snapshot       (50/50)
 *   Row 5: Active Review Queue       (full width)
 */

import { useSnapshot }              from './data/useSnapshot.js'
import { PipelineFunnel }           from './components/PipelineFunnel.jsx'
import { SignalCompressionEngine }  from './components/SignalCompressionEngine.jsx'
import { ScoreDistribution }        from './components/ScoreDistribution.jsx'
import { SourceIntelligence }  from './components/SourceIntelligence.jsx'
import { PillarCoverage }      from './components/PillarCoverage.jsx'
import { RunMetrics }          from './components/RunMetrics.jsx'
import { ThroughputSnapshot }  from './components/ThroughputSnapshot.jsx'
import { ReviewQueue }         from './components/ReviewQueue.jsx'
import { StatusBadge }         from './components/ui/StatusBadge.jsx'

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

  const {
    funnel, run_summary, final_content, scored_signals,
    source_intelligence, pillar_coverage, thresholds,
    generated_at, is_live,
  } = snapshot ?? {}

  const errorCount = run_summary?.errors?.count ?? 0
  const runStatus  = errorCount === 0 ? 'ready' : errorCount <= 5 ? 'warning' : 'error'

  return (
    <div className="app">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header__left">
          <div className="app-header__logo">◈</div>
          <div>
            <div className="app-header__title">HOUSTON AI AUTHORITY ENGINE</div>
            <div className="app-header__sub">Signal Intelligence Pipeline · Operator Dashboard</div>
          </div>
        </div>
        <div className="app-header__right">
          {!is_live && <StatusBadge label="MOCK DATA" variant="warning" />}
          {is_live  && <StatusBadge label="LIVE DATA" variant="live"    />}
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

      {/* ── Data source notice ─────────────────────────────────────── */}
      {error && (
        <div className="data-notice">
          <span className="data-notice__icon">ℹ</span>
          {error}
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <main className="dashboard">

        {/* Row 1: Funnel */}
        <div className="dashboard__row dashboard__row--full">
          <PipelineFunnel funnel={funnel} runSummary={run_summary} />
        </div>

        {/* Row 1b: Signal Compression Engine */}
        <div className="dashboard__row dashboard__row--full">
          <SignalCompressionEngine funnel={funnel} runSummary={run_summary} />
        </div>

        {/* Row 2: Score Distribution */}
        <div className="dashboard__row dashboard__row--full">
          <ScoreDistribution scoredSignals={scored_signals} thresholds={thresholds} />
        </div>

        {/* Row 3: Source Intelligence + Pillar Coverage */}
        <div className="dashboard__row dashboard__row--split">
          <SourceIntelligence sourceIntelligence={source_intelligence} />
          <PillarCoverage pillarCoverage={pillar_coverage} />
        </div>

        {/* Row 4: Run Metrics + Throughput */}
        <div className="dashboard__row dashboard__row--split">
          <RunMetrics runSummary={run_summary} />
          <ThroughputSnapshot funnel={funnel} runSummary={run_summary} />
        </div>

        {/* Row 5: Review Queue */}
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
