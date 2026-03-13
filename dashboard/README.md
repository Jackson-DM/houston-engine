# Houston AI Authority Engine — Operator Dashboard

A real-time operator interface for monitoring and reviewing the Houston AI Authority Engine pipeline. Built in React + Vite, it reads a JSON snapshot generated from the live repo and renders the full signal-to-content lifecycle in a single-page dashboard.

---

## What it does

The pipeline ingests RSS signals every 6 hours, scores them against Houston's 4 industry verticals, extracts strategic insight, drafts content, humanizes it, and queues it for publish. This dashboard makes every stage of that process visible to the operator.

**What you can do here:**
- See how many signals were ingested, scored, archived, and drafted each run
- Identify which industry verticals are over/under-represented in the signal corpus
- Read the AI's full strategic analysis for each insight (not just the summary)
- See the ranked list of content angles the AI recommends across all signals
- Compare the pre-humanization AI draft vs the final humanized output, side by side
- Review queued posts and understand why each signal was surfaced
- See which signals were filtered out and why (archive digest)
- Track run health — errors, durations, throughput rates

---

## Dashboard panels

| Panel | Row | Description |
|-------|-----|-------------|
| **Pipeline Funnel** | 1 | End-to-end signal count flow: Ingest → Score → Archive → Extract → Draft → Humanize → Queue |
| **Signal Compression Engine** | 2 | Animated visualization of the signal compression ratio |
| **Score Distribution** | 3 | Histogram of signal scores across publish/candidate/archive tiers + top archived signals |
| **Signal Intelligence Briefing** | 3.5L | Full AI strategic analysis per insight — Why It Matters, Business Implication, Houston Angle, Recommended Angle |
| **Content Angles** | 3.5R | Ranked list of content angles aggregated across all insights — a running post idea engine |
| **Industry Breakdown** | 3.7 | Horizontal stacked bars showing signal distribution across Energy, Healthcare, Manufacturing, Logistics |
| **Source Intelligence** | 4L | Per-feed signal yield, quality, and contribution to final content |
| **Pillar Coverage** | 4R | Content pillar balance (Industrial AI / Enterprise AI / AI Research) |
| **Run Metrics** | 5L | Timing, error counts, stage durations from the last pipeline run |
| **Throughput Snapshot** | 5R | Signal-to-content conversion rates and pipeline efficiency |
| **Review Queue** | 6 | Humanized posts queued for publish — with ORIGINAL/HUMANIZED toggle to compare drafts |
| **Authority Impact** | 7 | Estimated reach, authority signal strength, and publish-readiness assessment |

---

## Data flow

```
signals/             content/           scripts/
  scored/*.md    ─┐    final/*.json  ─┐    generate-snapshot.js
  insights/*.json─┼──► (parsed)      ─┼──► public/pipeline-data.json
  archive/*.md   ─┘                  ─┘         │
                                                 ▼
                                          React app (useSnapshot.js)
                                          reads on load, falls back to mock
```

The snapshot script reads the live repo state. The React app fetches `pipeline-data.json` at runtime. If the file is missing, the app falls back to `src/data/mock.js` and shows a "MOCK DATA" badge in the header.

---

## Running locally

```bash
# From the dashboard/ directory:

# 1. Generate a fresh snapshot from the live repo
npm run snapshot

# 2. Start the dev server
npm run dev

# 3. Build for production
npm run build
```

`npm run snapshot` outputs a summary to the console showing signal counts, archive totals, insight counts, and industry distribution. Check this output if you expect data that isn't showing up in the UI.

---

## Refreshing data

The dashboard does **not** auto-refresh. To update what you see:

1. Run `npm run snapshot` — this overwrites `public/pipeline-data.json`
2. The dev server hot-reloads automatically; production requires a redeploy

The pipeline runs on GitHub Actions every 6 hours. After a pipeline run completes and new signals/content land in the repo, pull the latest and re-run `npm run snapshot` to see the updated state.

---

## Mock data

`src/data/mock.js` contains a full static snapshot used when `pipeline-data.json` is absent. All panels have empty states if their data is missing or empty. To test empty states, temporarily rename or delete `public/pipeline-data.json`.

---

## Tech stack

- **React 18** + **Vite** — frontend framework and build tool
- **CSS custom properties** — theming, panel accents, animation timing
- **No external chart libraries** — all visualizations are native CSS (bars, fills, pills)
- **CountUp.jsx** — animated number transitions on scroll
- **generate-snapshot.js** — Node.js script, no dependencies beyond what's in the repo
