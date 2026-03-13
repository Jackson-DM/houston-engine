# Houston AI Authority Engine — Pipeline Dashboard

A real-time operator dashboard for the Houston AI Authority Engine's content manufacturing pipeline.

---

## What It Does

Visualizes the full **Signal → Post funnel** — from raw RSS ingest through AI scoring,
insight extraction, draft generation, and final humanized content — in a single control panel.

Designed for operators who need to answer three questions at a glance:
1. **Is the pipeline running?** (run status, error count, timestamp)
2. **Where is content piling up?** (stage-by-stage counts + bottleneck detection)
3. **What's ready to publish?** (review queue with humanized hooks front and center)

---

## Dashboard Sections

| Section              | What It Shows |
|----------------------|---------------|
| **Pipeline Funnel**  | File counts per stage, drop-off rates between stages, bottleneck alerts |
| **Latest Run Metrics** | Ingestion, scoring, insight, draft, and humanization counts from the last pipeline run |
| **Active Review Queue** | Humanized final content with hooks, confidence scores, and editorial status |
| **Throughput Snapshot** | Stage efficiency table, plain-language health sentence, pipeline health indicator |

---

## File Paths It Reads From

The snapshot generator (`scripts/generate-snapshot.js`) reads these paths relative to the repo root:

| Data                    | Path |
|-------------------------|------|
| Raw signals             | `signals/raw/` |
| Scored signals          | `signals/scored/` |
| Insights                | `signals/insights/` |
| Drafts                  | `content/drafts/` |
| Final / humanized posts | `content/final/` |
| Run summary             | `automation/logs/latest-run-summary.json` |

**To change a path**, edit the `PATHS` object at the top of `scripts/generate-snapshot.js`.

---

## Expected Data Shape

### `automation/logs/latest-run-summary.json`

```json
{
  "run_started_at":   "ISO 8601 timestamp",
  "run_completed_at": "ISO 8601 timestamp",
  "ingestion": {
    "raw_signals_found":   0,
    "new_signals_written": 0,
    "duplicates_skipped":  0
  },
  "scoring": {
    "signals_processed": 0,
    "publish_count":     0,
    "candidate_count":   0,
    "archive_count":     0,
    "ignore_count":      0
  },
  "insights":     { "eligible_signals": 0, "generated_count": 0, "skipped_count": 0 },
  "drafts":       { "eligible_insights": 0, "generated_count": 0, "skipped_count": 0 },
  "humanization": { "eligible_drafts": 0,   "generated_count": 0, "skipped_count": 0 },
  "errors": { "count": 0, "items": [] }
}
```

All fields are optional — the dashboard degrades gracefully and shows `N/A` for missing values.

### `content/final/*.json`

```json
{
  "id": "final-YYYY-MM-DD-slug",
  "created_at": "ISO 8601 timestamp",
  "content_type": "linkedin_post",
  "final": {
    "hook":      "Opening line of the humanized post",
    "body":      "Main body text",
    "closing":   "Closing sentence",
    "cta":       "Call to action + hashtags",
    "full_text": "Complete assembled post"
  },
  "editorial": {
    "status":              "ready_for_review",
    "needs_review":        true,
    "used_for_publishing": false
  }
}
```

Confidence and signal score are pulled from the matching `signals/insights/insight-*.json` file.

---

## Setup & Running

```bash
cd dashboard

# 1. Install dependencies
npm install

# 2. Generate a live data snapshot from the repo
npm run snapshot

# 3. Start the dev server
npm run dev
```

Then open `http://localhost:5173` in your browser.

**To refresh data:** re-run `npm run snapshot`. The dashboard auto-reloads.

If `pipeline-data.json` is missing, the dashboard shows mock data (based on the actual repo state as of 2026-03-12) with a `MOCK DATA` badge.

### Production Build

```bash
npm run build
# Outputs to dashboard/dist/ — can be deployed as static HTML or served from any host
```

---

## Extending the Dashboard

- **Add a new panel:** create `src/components/NewPanel.jsx`, import and place in `App.jsx`
- **Add new metrics:** extend `PATHS` in `generate-snapshot.js` and the matching React component
- **Change color theme:** edit CSS custom properties in `src/index.css` under `:root`
- **Add historical trends:** store timestamped snapshots in `public/history/` and load them in `useSnapshot.js`
