/**
 * generate-snapshot.js
 *
 * Run with: npm run snapshot
 *
 * Reads live repo files and writes public/pipeline-data.json for the dashboard.
 * Falls back to mock data if this file is absent.
 *
 * FILE PATHS — update these if the repo structure changes:
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── REPO PATHS ────────────────────────────────────────────────────────────────
const REPO_ROOT = resolve(__dirname, '../..')

const PATHS = {
  raw:        join(REPO_ROOT, 'signals/raw'),
  scored:     join(REPO_ROOT, 'signals/scored'),
  insights:   join(REPO_ROOT, 'signals/insights'),
  archive:    join(REPO_ROOT, 'signals/archive'),
  drafts:     join(REPO_ROOT, 'content/drafts'),
  final:      join(REPO_ROOT, 'content/final'),
  runSummary: join(REPO_ROOT, 'automation/logs/latest-run-summary.json'),
}

// Scoring thresholds — mirrors score_signals.py
const THRESHOLDS = { publish: 60, candidate: 40, archive: 20 }

const OUTPUT = join(__dirname, '../public/pipeline-data.json')
// ───────────────────────────────────────────────────────────────────────────────

function countFiles(dir) {
  try { return readdirSync(dir).filter(f => !f.startsWith('.')).length }
  catch { return 0 }
}

function readJSON(filePath) {
  try { return JSON.parse(readFileSync(filePath, 'utf8')) }
  catch { return null }
}

function listFiles(dir, ext = null) {
  try {
    const files = readdirSync(dir).filter(f => !f.startsWith('.'))
    return ext ? files.filter(f => f.endsWith(ext)) : files
  } catch { return [] }
}

/**
 * Parse YAML frontmatter from a scored signal markdown file.
 * Only handles the simple scalar fields we need — no multiline support needed.
 *
 * Expected fields: final_score, base_score, ai_adjustment, tier, source_name,
 *   source_type, signal_category, industry, geo_relevance, confidence,
 *   signal_id, priority_hint, status
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const block = match[1]
  const result = {}
  for (const raw of block.split('\n')) {
    const line = raw.trimEnd()
    // Skip blank lines, comments, and indented continuation lines
    if (!line || line.startsWith(' ') || line.startsWith('\t') || line.startsWith('#')) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let val = line.slice(colonIdx + 1).trim()
    if (!key) continue
    // Strip surrounding quotes
    val = val.replace(/^["']|["']$/g, '')
    // Type coerce
    if (val === 'null' || val === '') result[key] = null
    else if (val === 'true')  result[key] = true
    else if (val === 'false') result[key] = false
    else if (!isNaN(Number(val)) && val !== '') result[key] = Number(val)
    else result[key] = val
  }
  return result
}

function loadScoredSignals() {
  const files = listFiles(PATHS.scored, '.md').sort()
  return files.map(file => {
    let content = ''
    try { content = readFileSync(join(PATHS.scored, file), 'utf8') } catch { return null }
    const fm = parseFrontmatter(content)
    if (!fm.final_score && !fm.base_score) return null
    return {
      filename:        file,
      signal_id:       fm.signal_id     ?? file.replace('.md', ''),
      final_score:     fm.final_score   ?? fm.base_score ?? 0,
      base_score:      fm.base_score    ?? 0,
      ai_adjustment:   fm.ai_adjustment ?? 0,
      tier:            fm.tier          ?? 'candidate',
      source_name:     fm.source_name   ?? 'Unknown',
      source_type:     fm.source_type   ?? 'Unknown',
      signal_category: fm.signal_category ?? 'Other',
      industry:        fm.industry      ?? 'Cross-Industry',
      geo_relevance:   fm.geo_relevance ?? 'Global',
      confidence:      fm.confidence    ?? null,
      priority_hint:   fm.priority_hint ?? 'medium',
    }
  }).filter(Boolean)
}

function loadFinalContent() {
  const files = listFiles(PATHS.final, '.json').sort().reverse()
  return files.map(file => {
    const data = readJSON(join(PATHS.final, file))
    if (!data) return null

    const insightFile = file.replace(/^final-/, 'insight-')
    const insight = readJSON(join(PATHS.insights, insightFile))

    // Follow the chain: final → insight → scored signal → signal_category
    let signal_category = null
    if (insight?.source_signal_path) {
      try {
        const scoredContent = readFileSync(join(REPO_ROOT, insight.source_signal_path), 'utf8')
        signal_category = parseFrontmatter(scoredContent).signal_category ?? null
      } catch { /* scored signal may not exist yet */ }
    }

    return {
      id:                  data.id ?? file.replace('.json', ''),
      created_at:          data.created_at ?? null,
      content_type:        data.content_type ?? 'linkedin_post',
      hook:                data.final?.hook ?? null,
      body:                data.final?.body ?? null,
      closing:             data.final?.closing ?? null,
      full_text:           data.final?.full_text ?? null,
      original_text:       data.original?.full_text ?? null,
      editorial_status:    data.editorial?.status ?? 'unknown',
      needs_review:        data.editorial?.needs_review ?? false,
      used_for_publishing: data.editorial?.used_for_publishing ?? false,
      confidence:          insight?.insight?.confidence ?? null,
      score:               insight?.scoring?.final_score ?? null,
      // Attribution chain: which source and topic produced this asset
      source_name:         insight?.source?.publisher ?? null,
      signal_type:         insight?.insight?.signal_type ?? null,
      signal_category,
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
      id:                   data.id ?? file.replace('.json', ''),
      created_at:           data.created_at ?? null,
      publisher:            data.source?.publisher ?? null,
      score:                data.scoring?.final_score ?? null,
      route:                data.scoring?.route ?? null,
      confidence:           data.insight?.confidence ?? null,
      summary:              data.insight?.summary ?? null,
      why_it_matters:       data.insight?.why_it_matters ?? null,
      business_implication: data.insight?.business_implication ?? null,
      regional_angle:       data.insight?.regional_angle ?? null,
      recommended_angle:    data.insight?.recommended_angle ?? null,
      content_angles:       data.insight?.content_angles ?? [],
      used:                 data.status?.used_for_content ?? false,
      filename:             file,
    }
  }).filter(Boolean)
}

/**
 * Read signals/archive/*.md, parse frontmatter, and return a count + top-5 by score.
 */
function loadArchiveDigest() {
  const files = listFiles(PATHS.archive, '.md').sort()
  if (!files.length) return { count: 0, samples: [] }

  const parsed = files.map(file => {
    let content = ''
    try { content = readFileSync(join(PATHS.archive, file), 'utf8') } catch { return null }
    const fm = parseFrontmatter(content)
    return {
      filename:        file,
      signal_id:       fm.signal_id     ?? file.replace('.md', ''),
      final_score:     fm.final_score   ?? fm.base_score ?? 0,
      tier:            fm.tier          ?? 'archive',
      source_name:     fm.source_name   ?? 'Unknown',
      signal_category: fm.signal_category ?? 'Other',
      industry:        fm.industry      ?? 'Cross-Industry',
      geo_relevance:   fm.geo_relevance ?? 'Global',
    }
  }).filter(Boolean)

  const top5 = [...parsed]
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 5)

  return { count: parsed.length, samples: top5 }
}

/**
 * Derive industry breakdown from scored_signals.
 * Groups by industry, tracks publish vs candidate tier counts, and geo_relevance.
 */
/**
 * Load recent git commits and return a run history array.
 * Filters to pipeline-relevant commits; falls back to all 20 if none match.
 */
function loadRunHistory() {
  try {
    const raw = execSync('git log --pretty=format:"%H|%s|%ai|%an" -20', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 10000,
    })
    const lines = raw.trim().split('\n').filter(Boolean)
    const entries = lines.map(line => {
      const parts = line.replace(/^"|"$/g, '').split('|')
      const sha     = (parts[0] ?? '').slice(0, 7)
      const message = parts[1] ?? ''
      const date    = parts[2] ?? ''
      return { sha, message, date }
    }).filter(e => e.sha)

    // Prefer pipeline-relevant commits; fall back to all
    const filtered = entries.filter(e =>
      e.message.includes('signal') ||
      e.message.includes('pipeline') ||
      e.message.includes('chore(signal') ||
      e.message.startsWith('feat(') ||
      e.message.startsWith('fix(') ||
      e.message.startsWith('chore(')
    )
    const result = (filtered.length > 0 ? filtered : entries).slice(0, 15)
    return result
  } catch {
    return []
  }
}

function buildIndustryBreakdown(signals) {
  const map = {}
  for (const s of signals) {
    const industry = s.industry ?? 'Cross-Industry'
    if (!map[industry]) {
      map[industry] = {
        industry,
        total: 0,
        publish_count: 0,
        candidate_count: 0,
        archive_count: 0,
        geo_tags: {},
      }
    }
    map[industry].total++
    if (s.final_score >= THRESHOLDS.publish)        map[industry].publish_count++
    else if (s.final_score >= THRESHOLDS.candidate) map[industry].candidate_count++
    else                                             map[industry].archive_count++
    const geo = s.geo_relevance ?? 'Global'
    map[industry].geo_tags[geo] = (map[industry].geo_tags[geo] ?? 0) + 1
  }
  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .map(row => ({
      industry:         row.industry,
      total:            row.total,
      publish_count:    row.publish_count,
      candidate_count:  row.candidate_count,
      archive_count:    row.archive_count,
      // top geo tag for this industry
      top_geo:          Object.entries(row.geo_tags).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Global',
    }))
}

/**
 * Derive source intelligence analytics from scored signals.
 * Returns one record per unique source_name.
 */
function buildSourceIntelligence(signals) {
  const map = {}
  for (const s of signals) {
    const name = s.source_name
    if (!map[name]) map[name] = { source_name: name, source_type: s.source_type, scores: [], signals: [] }
    map[name].scores.push(s.final_score)
    map[name].signals.push(s)
  }
  return Object.values(map).map(src => {
    const scores = src.scores
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const publishCount = src.signals.filter(s => s.final_score >= THRESHOLDS.publish).length
    return {
      source_name:    src.source_name,
      source_type:    src.source_type,
      signal_count:   scores.length,
      avg_score:      avg,
      max_score:      Math.max(...scores),
      min_score:      Math.min(...scores),
      publish_count:  publishCount,
      candidate_count: scores.length - publishCount,
    }
  }).sort((a, b) => b.avg_score - a.avg_score)
}

/**
 * Derive pillar coverage from signal_category field.
 * Groups into the three strategic pillars used by the scoring engine.
 */
function buildPillarCoverage(signals) {
  // Strategic pillar grouping — mirrors the keyword categories in score_signals.py
  const PILLAR_MAP = {
    'Industrial AI':                   'Industrial AI',
    'Industrial AI / Robotics':        'Industrial AI',
    'Physical AI / Robotics':          'Industrial AI',
    'Enterprise AI':                   'Enterprise AI',
    'Enterprise AI / Decision Intelligence': 'Enterprise AI',
    'AI Research':                     'AI Research & Tools',
  }
  const pillars = {}
  for (const s of signals) {
    const pillar = PILLAR_MAP[s.signal_category] ?? s.signal_category ?? 'Other'
    if (!pillars[pillar]) pillars[pillar] = { pillar, scores: [], top_signal: null }
    pillars[pillar].scores.push(s.final_score)
    if (!pillars[pillar].top_signal || s.final_score > pillars[pillar].top_signal.final_score) {
      pillars[pillar].top_signal = s
    }
  }
  return Object.values(pillars).map(p => ({
    pillar:        p.pillar,
    count:         p.scores.length,
    avg_score:     Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length),
    max_score:     Math.max(...p.scores),
    top_signal_id: p.top_signal?.signal_id ?? null,
  })).sort((a, b) => b.count - a.count)
}

function buildSnapshot() {
  console.log('Houston AI Authority Engine — Pipeline Snapshot Generator')
  console.log('─'.repeat(55))

  // ── Load previous snapshot for delta computation ──────────────────────────
  let prevSnapshot = null
  try {
    if (existsSync(OUTPUT)) {
      prevSnapshot = readJSON(OUTPUT)
    }
  } catch { /* ignore */ }
  const prevFunnel  = prevSnapshot?.funnel ?? null
  const prevErrors  = prevSnapshot?.run_summary?.errors?.count ?? null

  const funnel = {
    raw:      countFiles(PATHS.raw),
    scored:   countFiles(PATHS.scored),
    insights: countFiles(PATHS.insights),
    drafts:   countFiles(PATHS.drafts),
    final:    countFiles(PATHS.final),
  }

  const runSummary         = readJSON(PATHS.runSummary)
  const currentErrors      = runSummary?.errors?.count ?? 0

  // ── Compute deltas vs previous snapshot ──────────────────────────────────
  const deltas = {
    signals_ingested: funnel.raw      - (prevFunnel?.raw      ?? funnel.raw),
    signals_scored:   funnel.scored   - (prevFunnel?.scored   ?? funnel.scored),
    content_drafted:  funnel.final    - (prevFunnel?.final    ?? funnel.final),
    errors:           currentErrors   - (prevErrors           ?? currentErrors),
  }

  const scoredSignals      = loadScoredSignals()
  const finalContent       = loadFinalContent()
  const insightSummaries   = loadInsightSummaries()
  const sourceIntelligence = buildSourceIntelligence(scoredSignals)
  const pillarCoverage     = buildPillarCoverage(scoredSignals)
  const archiveDigest      = loadArchiveDigest()
  const industryBreakdown  = buildIndustryBreakdown(scoredSignals)
  const runHistory         = loadRunHistory()

  const snapshot = {
    generated_at:        new Date().toISOString(),
    is_live:             true,
    thresholds:          THRESHOLDS,
    funnel,
    deltas,
    run_summary:         runSummary,
    scored_signals:      scoredSignals,
    source_intelligence: sourceIntelligence,
    pillar_coverage:     pillarCoverage,
    final_content:       finalContent,
    insight_summaries:   insightSummaries,
    archive_digest:      archiveDigest,
    industry_breakdown:  industryBreakdown,
    run_history:         runHistory,
  }

  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2))

  console.log(`✓ Written: ${OUTPUT}`)
  console.log()
  console.log('Funnel:')
  Object.entries(funnel).forEach(([k, v]) => console.log(`  ${k.padEnd(10)} ${v}`))
  console.log()
  console.log('Source Intelligence:')
  sourceIntelligence.forEach(s =>
    console.log(`  ${s.source_name.padEnd(22)} ${s.signal_count} signals  avg ${s.avg_score}  max ${s.max_score}`)
  )
  console.log()
  console.log('Pillar Coverage:')
  pillarCoverage.forEach(p =>
    console.log(`  ${p.pillar.padEnd(30)} ${p.count} signals  avg ${p.avg_score}`)
  )
  console.log()
  console.log(`Scored signals parsed: ${scoredSignals.length}`)
  console.log(`Final content items:   ${finalContent.length}`)
  console.log(`Archive signals:       ${archiveDigest.count}`)
  console.log(`Run history:           ${runHistory.length} commits`)
  console.log()
  console.log('Industry Breakdown:')
  industryBreakdown.forEach(row =>
    console.log(`  ${row.industry.padEnd(28)} total:${row.total}  publish:${row.publish_count}  cand:${row.candidate_count}  geo:${row.top_geo}`)
  )
  if (runSummary) {
    console.log()
    console.log(`Last run:              ${runSummary.run_started_at}`)
    console.log(`Errors:                ${runSummary.errors?.count ?? 0}`)
  }
}

buildSnapshot()
