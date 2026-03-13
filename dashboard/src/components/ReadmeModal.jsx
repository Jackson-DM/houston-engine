import { useEffect } from 'react'

export function ReadmeModal({ onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="readme-overlay" onClick={onClose}>
      <div className="readme-modal" onClick={(e) => e.stopPropagation()}>
        <div className="readme-modal__header">
          <span className="readme-modal__title">◈ HOUSTON AI AUTHORITY ENGINE — DASHBOARD GUIDE</span>
          <button className="readme-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="readme-modal__body">

          <section className="readme-section">
            <h2>What this is</h2>
            <p>
              A real-time operator dashboard for the Houston AI Authority Engine — a fully automated
              7-stage content pipeline (Ingest → Score → Extract Insight → Draft → Humanize → Review → Publish)
              running every 6 hours on GitHub Actions. This dashboard makes every stage of that process
              visible in one place.
            </p>
          </section>

          <section className="readme-section">
            <h2>What you can do here</h2>
            <ul>
              <li>See how many signals were ingested, scored, archived, and drafted each run</li>
              <li>Identify which industry verticals are over/under-represented in the signal corpus</li>
              <li>Read the AI's full strategic analysis per insight — not just the summary</li>
              <li>See ranked content angles the AI recommends across all signals</li>
              <li>Compare pre-humanization AI draft vs final humanized output side by side</li>
              <li>Review queued posts and understand why each signal was surfaced</li>
              <li>See which signals were filtered out and why (archive digest)</li>
              <li>Track run health — errors, durations, throughput rates</li>
            </ul>
          </section>

          <section className="readme-section">
            <h2>Dashboard panels</h2>
            <table className="readme-table">
              <thead>
                <tr><th>Panel</th><th>What it shows</th></tr>
              </thead>
              <tbody>
                <tr><td>Pipeline Funnel</td><td>End-to-end signal count flow: Ingest → Score → Archive → Extract → Draft → Humanize → Queue</td></tr>
                <tr><td>Signal Compression Engine</td><td>Animated visualization of the signal compression ratio</td></tr>
                <tr><td>Score Distribution</td><td>Histogram of signal scores across publish/candidate/archive tiers + top archived signals</td></tr>
                <tr><td>Signal Intelligence Briefing</td><td>Full AI strategic analysis per insight — Why It Matters, Business Implication, Houston Angle, Recommended Angle</td></tr>
                <tr><td>Content Angles</td><td>Ranked list of content angles aggregated across all insights — a running post idea engine</td></tr>
                <tr><td>Industry Breakdown</td><td>Horizontal stacked bars showing signal distribution across Energy, Healthcare, Manufacturing, Logistics</td></tr>
                <tr><td>Source Intelligence</td><td>Per-feed signal yield, quality, and contribution to final content</td></tr>
                <tr><td>Pillar Coverage</td><td>Content pillar balance (Industrial AI / Enterprise AI / AI Research)</td></tr>
                <tr><td>Run Metrics</td><td>Timing, error counts, stage durations from the last pipeline run</td></tr>
                <tr><td>Throughput Snapshot</td><td>Signal-to-content conversion rates and pipeline efficiency</td></tr>
                <tr><td>Review Queue</td><td>Humanized posts queued for publish — with ORIGINAL/HUMANIZED toggle to compare drafts</td></tr>
                <tr><td>Authority Impact</td><td>Estimated reach, authority signal strength, and publish-readiness assessment</td></tr>
              </tbody>
            </table>
          </section>

          <section className="readme-section">
            <h2>Data flow</h2>
            <pre className="readme-code">{`signals/             content/           scripts/
  scored/*.md    ─┐    final/*.json  ─┐    generate-snapshot.js
  insights/*.json─┼──► (parsed)      ─┼──► public/pipeline-data.json
  archive/*.md   ─┘                  ─┘         │
                                                 ▼
                                    React app reads on load
                                    falls back to mock if missing`}</pre>
          </section>

          <section className="readme-section">
            <h2>Refreshing data</h2>
            <p>
              The dashboard does not auto-refresh. After a pipeline run completes and new signals/content
              land in the repo, pull the latest and run:
            </p>
            <pre className="readme-code">{`# from the dashboard/ directory
npm run snapshot   # regenerates public/pipeline-data.json
npm run dev        # start local dev server`}</pre>
            <p>
              The snapshot script prints a summary to the console showing signal counts, archive totals,
              insight counts, and industry distribution. Check this output if you expect data that
              isn't showing up in the UI.
            </p>
          </section>

          <section className="readme-section">
            <h2>Mock data</h2>
            <p>
              If <code>public/pipeline-data.json</code> is missing, the dashboard falls back to static
              mock data and shows a <strong>MOCK DATA</strong> badge in the header. All panels have
              empty states if their data section is missing or empty.
            </p>
          </section>

          <section className="readme-section">
            <h2>Pipeline stages</h2>
            <table className="readme-table">
              <thead>
                <tr><th>Stage</th><th>What it does</th></tr>
              </thead>
              <tbody>
                <tr><td>1 · Ingest</td><td>Fetches RSS feeds, deduplicates, stores raw signal files</td></tr>
                <tr><td>2 · Score</td><td>Scores each signal 0–100 against Houston industry relevance criteria</td></tr>
                <tr><td>3 · Archive</td><td>Signals scoring 20–39 are archived (visible in Score Distribution panel)</td></tr>
                <tr><td>4 · Extract Insight</td><td>AI extracts strategic analysis for publish-tier signals</td></tr>
                <tr><td>5 · Draft</td><td>AI drafts LinkedIn post from insight</td></tr>
                <tr><td>6 · Humanize</td><td>Second AI pass rewrites the draft to sound human — removes AI tells</td></tr>
                <tr><td>7 · Publish</td><td>Queues post for review and eventual publish</td></tr>
              </tbody>
            </table>
          </section>

        </div>

        <div className="readme-modal__footer">
          Press <kbd>Esc</kbd> or click outside to close
        </div>
      </div>
    </div>
  )
}
