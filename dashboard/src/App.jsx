/**
 * App.jsx — Houston AI Authority Engine Pipeline Dashboard
 *
 * Layout:
 *   CircuitBackground (fixed, z-index: -1)
 *   Data streams (fixed, z-index: 0)
 *   Page border top (fixed, always visible)
 *   Scan line (fixed, periodic sweep)
 *   Header (sticky, with live clock + next-run countdown)
 *   Tab nav (sticky, below header)
 *
 *   OVERVIEW tab:
 *     Pipeline Funnel, Signal Compression Engine, Score Distribution,
 *     Industry Breakdown, Run Metrics + Throughput Snapshot
 *
 *   INTELLIGENCE tab:
 *     Signal Intelligence Briefing + Content Angles (split)
 *     Source Intelligence + Pillar Coverage (split)
 *
 *   CONTENT tab:
 *     Review Queue (full), Authority Impact (full)
 *
 *   PIPELINE tab:
 *     Pipeline Funnel, Run History, Run Metrics + Throughput Snapshot
 *
 * Features:
 *   F1  URL-based tab routing (#overview, #pipeline, etc.)
 *   F2  "Next Run In" countdown in header
 *   F3  Delta indicators on funnel stages (↑/↓ vs prev run)
 *   F4  Command Palette (Ctrl+K / ⌘K)
 *   F5  Signal Detail Drawer (click any signal)
 *   F6  Run delta strip in RunHistory
 *   F7  Boot sequence loading screen
 *   F8  Mobile responsive (CSS only)
 *   F9  About / Pitch modal
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSnapshot }                from './data/useSnapshot.js'
import { PipelineFunnel }             from './components/PipelineFunnel.jsx'
import { SignalCompressionEngine }    from './components/SignalCompressionEngine.jsx'
import { ScoreDistribution }          from './components/ScoreDistribution.jsx'
import { InsightBriefing }            from './components/InsightBriefing.jsx'
import { IndustryBreakdown }          from './components/IndustryBreakdown.jsx'
import { ContentAngles }              from './components/ContentAngles.jsx'
import { SourceIntelligence }         from './components/SourceIntelligence.jsx'
import { PillarCoverage }             from './components/PillarCoverage.jsx'
import { RunMetrics }                 from './components/RunMetrics.jsx'
import { ThroughputSnapshot }         from './components/ThroughputSnapshot.jsx'
import { ReviewQueue }                from './components/ReviewQueue.jsx'
import { AuthorityImpact }            from './components/AuthorityImpact.jsx'
import { RunHistory }                 from './components/RunHistory.jsx'
import { CircuitBackground }          from './components/CircuitBackground.jsx'
import { StatusBadge }                from './components/ui/StatusBadge.jsx'
import { ReadmeModal }                from './components/ReadmeModal.jsx'
import { CommandPalette }             from './components/CommandPalette.jsx'
import { SignalDetailDrawer }         from './components/SignalDetailDrawer.jsx'
import { PitchModal }                 from './components/PitchModal.jsx'

const TABS = [
  { id: 'overview',      label: 'OVERVIEW',      key: '1' },
  { id: 'intelligence',  label: 'INTELLIGENCE',  key: '2' },
  { id: 'content',       label: 'CONTENT',       key: '3' },
  { id: 'pipeline',      label: 'PIPELINE',      key: '4' },
]
const VALID_TABS = new Set(TABS.map(t => t.id))

function getHashTab() {
  const hash = window.location.hash.replace('#', '')
  return VALID_TABS.has(hash) ? hash : 'overview'
}

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

function useClock() {
  const fmt = () => new Date().toLocaleTimeString('en-US', { hour12: false })
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ── Feature 2: Next Run countdown ────────────────────────────────────────────
function useNextRun(generatedAt) {
  const getRemaining = () => {
    if (!generatedAt) return null
    const next = new Date(generatedAt).getTime() + 6 * 60 * 60 * 1000
    const diff = next - Date.now()
    if (diff <= 0) return '00:00:00'
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
    return `${h}:${m}:${s}`
  }
  const [remaining, setRemaining] = useState(getRemaining)
  useEffect(() => {
    if (!generatedAt) return
    const id = setInterval(() => setRemaining(getRemaining()), 1000)
    return () => clearInterval(id)
  }, [generatedAt])
  return remaining
}

// ── Feature 7: Boot sequence ─────────────────────────────────────────────────
const BOOT_LINES = [
  '◈ HOUSTON AI AUTHORITY ENGINE v2.0',
  '──────────────────────────────────',
  'CONNECTING TO SIGNAL REPOSITORY... OK',
  'LOADING PIPELINE SNAPSHOT.........',
  'PARSING SCORED SIGNALS.............',
  'EXTRACTING INSIGHT SUMMARIES.......',
  'LOADING INDUSTRY VECTORS...........',
  'MOUNTING DASHBOARD COMPONENTS......',
  '──────────────────────────────────',
  'ALL SYSTEMS NOMINAL. LAUNCHING...',
]

function BootSequence({ onDone }) {
  const [visibleLines, setVisibleLines] = useState([])

  useEffect(() => {
    let idx = 0
    let finalTimer = null
    const interval = setInterval(() => {
      if (idx < BOOT_LINES.length) {
        idx++
        setVisibleLines(BOOT_LINES.slice(0, idx))
      } else {
        clearInterval(interval)
        finalTimer = setTimeout(onDone, 500)
      }
    }, 130)
    return () => {
      clearInterval(interval)
      if (finalTimer) clearTimeout(finalTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If data becomes ready before sequence finishes, sequence still runs fully
  // (handled by interval above)

  return (
    <div className="boot-screen">
      <div className="boot-terminal">
        {visibleLines.map((line, i) => {
          const isHeader  = line.startsWith('◈')
          const isDivider = line.startsWith('─')
          return (
            <div
              key={i}
              className={`boot-line${isHeader ? ' boot-line--header' : ''}${isDivider ? ' boot-line--divider' : ''}`}
            >
              {line}
              {i === visibleLines.length - 1 && <span className="boot-cursor" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const { snapshot, loading, error } = useSnapshot()
  const clock   = useClock()
  const hasBootedRef = useRef(false)
  const [bootDone,     setBootDone]     = useState(false)
  const [showReadme,   setShowReadme]   = useState(false)
  const [showPalette,  setShowPalette]  = useState(false)
  const [showPitch,    setShowPitch]    = useState(false)
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [activeTab,    setActiveTab]    = useState(getHashTab)
  const closeReadme  = useCallback(() => setShowReadme(false), [])

  // Feature 1: sync tab to URL hash
  const setTab = useCallback((id) => {
    setActiveTab(id)
    window.history.replaceState(null, '', '#' + id)
  }, [])

  // Sync back/forward browser navigation
  useEffect(() => {
    function onPopstate() {
      setActiveTab(getHashTab())
    }
    window.addEventListener('popstate', onPopstate)
    return () => window.removeEventListener('popstate', onPopstate)
  }, [])

  // Feature 2: Next Run countdown
  const nextRun = useNextRun(snapshot?.generated_at ?? null)

  // Keyboard shortcuts 1–4 to switch tabs
  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      // Ctrl+K / Cmd+K → command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowPalette(p => !p)
        return
      }
      const idx = parseInt(e.key, 10) - 1
      if (idx >= 0 && idx < TABS.length) {
        setTab(TABS[idx].id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setTab])

  // Feature 7: Show boot sequence on first load
  const showBoot = !bootDone && !hasBootedRef.current

  if (showBoot) {
    return (
      <>
        <div className="page-border-top" aria-hidden="true" />
        <BootSequence
          onDone={() => {
            hasBootedRef.current = true
            setBootDone(true)
          }}
        />
      </>
    )
  }

  const {
    funnel, run_summary, final_content, scored_signals,
    source_intelligence, pillar_coverage, thresholds,
    generated_at, is_live, insight_summaries,
    archive_digest, industry_breakdown, run_history, deltas,
  } = snapshot ?? {}

  const errorCount = run_summary?.errors?.count ?? 0
  const runStatus  = errorCount === 0 ? 'ready' : errorCount <= 5 ? 'warning' : 'error'

  return (
    <div className="app">

      {/* ── Fixed background layers ─────────────────────────────────────────── */}
      <CircuitBackground />

      {/* ── Fixed page decorations ──────────────────────────────────────────── */}
      <div className="page-border-top" aria-hidden="true" />
      <div className="scan-line"       aria-hidden="true" />

      {/* ── Feature 4: Command Palette ──────────────────────────────────────── */}
      {showPalette && (
        <CommandPalette
          onClose={() => setShowPalette(false)}
          snapshot={snapshot}
          onSelectSignal={setSelectedSignal}
          onSwitchTab={setTab}
        />
      )}

      {/* ── Feature 5: Signal Detail Drawer ────────────────────────────────── */}
      {selectedSignal && (
        <SignalDetailDrawer
          signal={selectedSignal}
          insightSummaries={insight_summaries}
          onClose={() => setSelectedSignal(null)}
        />
      )}

      {/* ── Feature 9: Pitch Modal ──────────────────────────────────────────── */}
      {showPitch && (
        <PitchModal onClose={() => setShowPitch(false)} snapshot={snapshot} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
          {/* Feature 2: Next run countdown */}
          {nextRun && (
            <span className="app-header__nextrun">
              NEXT RUN <span className="app-header__nextrun-time">{nextRun}</span>
            </span>
          )}
          <span className="app-header__clock">{clock}</span>
          <button className="readme-btn" onClick={() => setShowReadme(true)} title="Dashboard guide">?</button>
        </div>
      </header>

      {showReadme && <ReadmeModal onClose={closeReadme} />}

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <nav className="tab-nav" aria-label="Dashboard sections">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'tab-nav__btn tab-nav__btn--active' : 'tab-nav__btn'}
            onClick={() => setTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
            <span className="tab-nav__key">{tab.key}</span>
          </button>
        ))}
        {/* Feature 9: About button */}
        <button
          className="tab-nav__btn tab-nav__about"
          onClick={() => setShowPitch(true)}
          style={{ marginLeft: 'auto' }}
        >
          ABOUT
        </button>
      </nav>

      {/* ── Data source notice ─────────────────────────────────────────────── */}
      {error && (
        <div className="data-notice">
          <span className="data-notice__icon">ℹ</span>
          {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <main className="dashboard">

          <div className="dashboard__row dashboard__row--full">
            <PipelineFunnel funnel={funnel} runSummary={run_summary} archiveDigest={archive_digest} deltas={deltas} />
          </div>

          <div className="dashboard__row dashboard__row--full">
            <SignalCompressionEngine funnel={funnel} runSummary={run_summary} />
          </div>

          <div className="dashboard__row dashboard__row--full">
            <ScoreDistribution
              scoredSignals={scored_signals}
              thresholds={thresholds}
              archiveDigest={archive_digest}
              onSelectSignal={setSelectedSignal}
            />
          </div>

          <div className="dashboard__row dashboard__row--full">
            <IndustryBreakdown industryBreakdown={industry_breakdown} />
          </div>

          <div className="dashboard__row dashboard__row--split">
            <RunMetrics runSummary={run_summary} />
            <ThroughputSnapshot funnel={funnel} runSummary={run_summary} />
          </div>

        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          INTELLIGENCE TAB
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'intelligence' && (
        <main className="dashboard">

          <div className="dashboard__row dashboard__row--split">
            <InsightBriefing insightSummaries={insight_summaries} />
            <ContentAngles insightSummaries={insight_summaries} />
          </div>

          <div className="dashboard__row dashboard__row--split">
            <SourceIntelligence sourceIntelligence={source_intelligence} />
            <PillarCoverage pillarCoverage={pillar_coverage} />
          </div>

        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CONTENT TAB
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'content' && (
        <main className="dashboard">

          <div className="dashboard__row dashboard__row--full">
            <ReviewQueue finalContent={final_content} />
          </div>

          <div className="dashboard__row dashboard__row--full">
            <AuthorityImpact finalContent={final_content} />
          </div>

        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PIPELINE TAB
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipeline' && (
        <main className="dashboard">

          <div className="dashboard__row dashboard__row--full">
            <PipelineFunnel funnel={funnel} runSummary={run_summary} archiveDigest={archive_digest} deltas={deltas} />
          </div>

          <div className="dashboard__row dashboard__row--full">
            <RunHistory runHistory={run_history} deltas={deltas} />
          </div>

          <div className="dashboard__row dashboard__row--split">
            <RunMetrics runSummary={run_summary} />
            <ThroughputSnapshot funnel={funnel} runSummary={run_summary} />
          </div>

        </main>
      )}

      <footer className="app-footer">
        Houston AI Authority Engine · Pipeline Dashboard ·{' '}
        <span className="text-muted">
          Run <code>npm run snapshot</code> to refresh live repo data
        </span>
        {' · '}
        <span className="text-muted">Press 1–4 to switch tabs</span>
        {' · '}
        <span className="text-muted"><kbd style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: 3, padding: '0 4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ctrl+K</kbd> to search</span>
      </footer>
    </div>
  )
}
