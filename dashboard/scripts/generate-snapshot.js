/**
 * generate-snapshot.js
 *
 * Run this with: npm run snapshot
 * (or: node scripts/generate-snapshot.js)
 *
 * Reads live repo files and writes public/pipeline-data.json for the dashboard.
 * The React app fetches this file at runtime; if missing, it falls back to mock data.
 *
 * FILE PATHS — update these if the repo structure changes:
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── REPO PATHS ────────────────────────────────────────────────────────────────
const REPO_ROOT = resolve(__dirname, '../..')

const PATHS = {
  raw:        join(REPO_ROOT, 'signals/raw'),
  scored:     join(REPO_ROOT, 'signals/scored'),
  insights:   join(REPO_ROOT, 'signals/insights'),
  drafts:     join(REPO_ROOT, 'content/drafts'),
  final:      join(REPO_ROOT, 'content/final'),
  runSummary: join(REPO_ROOT, 'automation/logs/latest-run-summary.json'),
}

const OUTPUT = join(__dirname, '../public/pipeline-data.json')
// ───────────────────────────────────────────────────────────────────────────────

function countFiles(dir) {
  try {
    return readdirSync(dir).filter(f => !f.startsWith('.')).length
  } catch {
    return 0
  }
}

function readJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function listFiles(dir, ext = null) {
  try {
    const files = readdirSync(dir).filter(f => !f.startsWith('.'))
    return ext ? files.filter(f => f.endsWith(ext)) : files
  } catch {
    return []
  }
}

function loadFinalContent() {
  const files = listFiles(PATHS.final, '.json')
    .sort()
    .reverse() // newest first by filename date prefix

  return files.map(file => {
    const data = readJSON(join(PATHS.final, file))
    if (!data) return null

    // Try to find matching insight for confidence score
    // final-YYYY-MM-DD-slug.json → insight-YYYY-MM-DD-slug.json
    const insightFile = file.replace(/^final-/, 'insight-')
    const insight = readJSON(join(PATHS.insights, insightFile))

    return {
      id:                  data.id ?? file.replace('.json', ''),
      created_at:          data.created_at ?? null,
      content_type:        data.content_type ?? 'linkedin_post',
      hook:                data.final?.hook ?? null,
      body:                data.final?.body ?? null,
      closing:             data.final?.closing ?? null,
      full_text:           data.final?.full_text ?? null,
      editorial_status:    data.editorial?.status ?? 'unknown',
      needs_review:        data.editorial?.needs_review ?? false,
      used_for_publishing: data.editorial?.used_for_publishing ?? false,
      // Confidence from the corresponding insight file (0–1 float)
      confidence:          insight?.insight?.confidence ?? null,
      // Score from the insight's scoring block (0–100 int)
      score:               insight?.scoring?.final_score ?? null,
      filename:            file,
    }
  }).filter(Boolean)
}

function loadInsightSummaries() {
  const files = listFiles(PATHS.insights, '.json').sort().reverse()
  return files.map(file => {
    const data = readJSON(join(PATHS.insights, file))
    if (!data) return null
    return {
      id:         data.id ?? file.replace('.json', ''),
      created_at: data.created_at ?? null,
      publisher:  data.source?.publisher ?? null,
      score:      data.scoring?.final_score ?? null,
      route:      data.scoring?.route ?? null,
      confidence: data.insight?.confidence ?? null,
      summary:    data.insight?.summary ?? null,
      used:       data.status?.used_for_content ?? false,
      filename:   file,
    }
  }).filter(Boolean)
}

function buildSnapshot() {
  console.log('Houston AI Authority Engine — Pipeline Snapshot Generator')
  console.log('─'.repeat(55))

  const funnel = {
    raw:      countFiles(PATHS.raw),
    scored:   countFiles(PATHS.scored),
    insights: countFiles(PATHS.insights),
    drafts:   countFiles(PATHS.drafts),
    final:    countFiles(PATHS.final),
  }

  const runSummary = readJSON(PATHS.runSummary)
  const finalContent = loadFinalContent()
  const insightSummaries = loadInsightSummaries()

  const snapshot = {
    generated_at:     new Date().toISOString(),
    is_live:          true,   // flag so the UI can show LIVE vs MOCK
    funnel,
    run_summary:      runSummary,
    final_content:    finalContent,
    insight_summaries: insightSummaries,
  }

  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2))

  console.log(`✓ Written: ${OUTPUT}`)
  console.log()
  console.log('Funnel:')
  Object.entries(funnel).forEach(([k, v]) => console.log(`  ${k.padEnd(10)} ${v}`))
  console.log()
  console.log(`Final content items: ${finalContent.length}`)
  console.log(`Insight summaries:   ${insightSummaries.length}`)
  if (runSummary) {
    console.log(`Last run:            ${runSummary.run_started_at}`)
    console.log(`Errors:              ${runSummary.errors?.count ?? 0}`)
  } else {
    console.log('Last run:            (no summary file found)')
  }
}

buildSnapshot()
