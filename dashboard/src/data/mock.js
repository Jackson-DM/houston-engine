/**
 * mock.js
 *
 * Fallback data that mirrors the real repo state as of 2026-03-12.
 * Used when public/pipeline-data.json hasn't been generated yet.
 * The UI shows a "MOCK DATA" badge when this is active.
 *
 * Exact data shapes come from:
 *   automation/logs/latest-run-summary.json
 *   content/final/*.json  +  signals/insights/*.json (for confidence/score)
 */

export const MOCK_SNAPSHOT = {
  generated_at: '2026-03-12T01:48:23.848452Z',
  is_live: false,

  // ── Repo file counts ────────────────────────────────────────────────────────
  funnel: {
    raw:      2,
    scored:   16,
    insights: 7,
    drafts:   1,
    final:    1,
  },

  // ── Latest run summary (mirrors automation/logs/latest-run-summary.json) ───
  run_summary: {
    run_started_at:   '2026-03-12T01:44:41.357561Z',
    run_completed_at: '2026-03-12T01:48:19.761487Z',
    ingestion: {
      raw_signals_found:   27,
      new_signals_written:  5,
      duplicates_skipped:   9,
    },
    scoring: {
      signals_processed: 21,
      publish_count:      0,
      candidate_count:    0,
      archive_count:     15,
      ignore_count:       6,
    },
    insights: {
      eligible_signals: 7,
      generated_count:  7,
      skipped_count:    0,
    },
    drafts: {
      eligible_insights: 1,
      generated_count:   1,
      skipped_count:     0,
    },
    errors: {
      count: 21,
      items: [
        '[2026-03-12T01:45:09] Insight Extraction Error: list indices must be integers or slices, not str',
        '[2026-03-12T01:47:20] Draft Generation Error (insight-2026-03-02-nvidia-us-manufacturing-reindustrialization.json): could not convert string to float: \'High\'',
        '... 19 more errors',
      ],
    },
    humanization: {
      eligible_drafts: 1,
      generated_count: 1,
      skipped_count:   0,
    },
  },

  // ── Final content (mirrors content/final/*.json) ────────────────────────────
  final_content: [
    {
      id:           'final-2026-03-02-nvidia-us-manufacturing-reindustrialization',
      created_at:   '2026-03-12T01:48:23.848452Z',
      content_type: 'linkedin_post',
      hook: "Just saw NVIDIA drop a serious robotics and AI architecture. As someone knee-deep in AI here in Houston, I gotta say, this could be a game-changer for U.S. manufacturing.",
      body: "This isn't just another tech release; it's a legit framework for merging hardware and software to bring AI automation to the factory floor. Think lower costs, way better precision, and factories that can actually adapt on the fly. If this takes off, it'll give American companies a real edge globally.",
      closing: "Bottom line: this isn't just about tech; it's about investing in American smarts and growing our economy.",
      editorial_status:    'ready_for_review',
      needs_review:        true,
      used_for_publishing: false,
      confidence: 0.95,
      score:      80,
      filename:   'final-2026-03-02-nvidia-us-manufacturing-reindustrialization.json',
    },
  ],

  // ── Insight summaries ───────────────────────────────────────────────────────
  insight_summaries: [
    { id: 'insight-2026-03-02-nvidia-us-manufacturing-reindustrialization',   score: 80,  route: 'publish',   confidence: 0.95, used: true  },
    { id: 'insight-2026-03-02-siemens-nvidia-industrial-ai-os',               score: null, route: null,       confidence: null, used: false },
    { id: 'insight-2026-03-05-nvidia-palantir-decision-intelligence',         score: null, route: null,       confidence: null, used: false },
    { id: 'insight-2026-03-11-nvidia-newsroom-nemotron-3',                    score: null, route: null,       confidence: null, used: false },
    { id: 'insight-2026-03-11-nvidia-newsroom-gtc-2026',                      score: null, route: null,       confidence: null, used: false },
    { id: 'insight-2026-03-11-nvidia-newsroom-blackwell',                     score: null, route: null,       confidence: null, used: false },
    { id: 'insight-2026-03-11-venturebeat-claude-code',                       score: null, route: null,       confidence: null, used: false },
  ],
}
