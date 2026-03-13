/**
 * mock.js — Fallback data based on actual repo state as of 2026-03-12.
 * Shown when public/pipeline-data.json hasn't been generated yet.
 * The UI shows a "MOCK DATA" badge when this is active.
 */

export const MOCK_SNAPSHOT = {
  generated_at: '2026-03-12T19:12:59.294446Z',
  is_live: false,

  // Scoring thresholds (mirrors score_signals.py)
  thresholds: { publish: 60, candidate: 40, archive: 20 },

  // ── Repo file counts ─────────────────────────────────────────────────────────
  funnel: { raw: 2, scored: 24, insights: 7, drafts: 1, final: 1 },

  // ── Latest run summary ───────────────────────────────────────────────────────
  run_summary: {
    run_started_at:   '2026-03-12T19:12:59.294446Z',
    run_completed_at: '2026-03-12T19:16:41.123456Z',
    ingestion: { raw_signals_found: 912, new_signals_written: 5, duplicates_skipped: 32 },
    scoring:   { signals_processed: 5, publish_count: 0, candidate_count: 1, archive_count: 4, ignore_count: 0 },
    insights:  { eligible_signals: 0, generated_count: 0, skipped_count: 0 },
    drafts:    { eligible_insights: 0, generated_count: 0, skipped_count: 0 },
    humanization: { eligible_drafts: 0, generated_count: 0, skipped_count: 0 },
    errors:    { count: 0, items: [] },
  },

  // ── Scored signals (all 24 from signals/scored/) ─────────────────────────────
  // Used for score distribution, source intelligence, and pillar coverage panels.
  scored_signals: [
    { filename: '2026-03-02-nvidia-us-manufacturing-reindustrialization.md',  signal_id: 'sig-2026-03-02-nv-03', final_score: 80, base_score: 80, ai_adjustment: 0,  tier: 'publish',   source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI / Robotics',             industry: 'Manufacturing',       geo_relevance: 'US',     confidence: 0.95, priority_hint: 'high'   },
    { filename: '2026-03-05-nvidia-palantir-decision-intelligence.md',        signal_id: 'sig-2026-03-05-nv-01', final_score: 73, base_score: 65, ai_adjustment: 8,  tier: 'publish',   source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Enterprise AI / Decision Intelligence', industry: 'Enterprise / Industrial', geo_relevance: 'US', confidence: 0.95, priority_hint: 'high'   },
    { filename: '2026-03-11-nvidia-newsroom-new-nvidia-nemotron-3-super.md',  signal_id: 'sig-2026-03-11-62c418', final_score: 70, base_score: 62, ai_adjustment: 8, tier: 'publish',   source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-02-siemens-nvidia-industrial-ai-os.md',              signal_id: 'sig-2026-03-02-nv-02', final_score: 65, base_score: 65, ai_adjustment: 0,  tier: 'candidate', source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Manufacturing / Energy', geo_relevance: 'Global', confidence: 1.0, priority_hint: 'high' },
    { filename: '2026-03-11-venturebeat-ai-the-creator-of-claude-code.md',   signal_id: 'sig-2026-03-11-407c4b', final_score: 63, base_score: 55, ai_adjustment: 8, tier: 'candidate', source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_category: 'Enterprise AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-12-nvidia-newsroom-nvidia-advances-autonomous.md',  signal_id: 'sig-2026-03-12-ffac80', final_score: 60, base_score: 60, ai_adjustment: 0,  tier: 'publish',   source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-12-nvidia-newsroom-nvidia-and-coherent.md',         signal_id: 'sig-2026-03-12-dcfc2e', final_score: 60, base_score: 60, ai_adjustment: 0,  tier: 'publish',   source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-11-nvidia-newsroom-nvidia-gtc-2026.md',             signal_id: 'sig-2026-03-11-de78af', final_score: 60, base_score: 60, ai_adjustment: 0,  tier: 'candidate', source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-11-nvidia-newsroom-nvidia-launches-new-blackwell.md',signal_id: 'sig-2026-03-11-beb9a9', final_score: 60, base_score: 60, ai_adjustment: 0,  tier: 'candidate', source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Enterprise AI',                         industry: 'Technology',          geo_relevance: 'Global', confidence: 0.9,  priority_hint: 'medium' },
    { filename: '2026-03-02-nvidia-physical-ai-models.md',                   signal_id: 'sig-2026-03-02-nv-01', final_score: 58, base_score: 53, ai_adjustment: 5,  tier: 'candidate', source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Physical AI / Robotics',                industry: 'Manufacturing',       geo_relevance: 'Global', confidence: 1.0,  priority_hint: 'high'   },
    { filename: '2026-03-11-venturebeat-ai-salesforce-slackbot.md',          signal_id: 'sig-2026-03-11-2df9d8', final_score: 57, base_score: 49, ai_adjustment: 8, tier: 'candidate', source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_category: 'Enterprise AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-11-venturebeat-ai-anthropic-launches-cowork.md',    signal_id: 'sig-2026-03-11-f8fecf', final_score: 55, base_score: 47, ai_adjustment: 8, tier: 'candidate', source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_category: 'Enterprise AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-11-venturebeat-ai-anthropic-partners.md',           signal_id: 'sig-2026-03-11-63e337', final_score: 53, base_score: 53, ai_adjustment: 0,  tier: 'candidate', source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_category: 'Enterprise AI',                         industry: 'Technology',          geo_relevance: 'Global', confidence: 0.9,  priority_hint: 'medium' },
    { filename: '2026-03-11-venturebeat-ai-nouscoder.md',                    signal_id: 'sig-2026-03-11-77f5bd', final_score: 52, base_score: 47, ai_adjustment: 5, tier: 'candidate', source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_category: 'Enterprise AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-12-nvidia-newsroom-abb-robotics.md',                signal_id: 'sig-2026-03-12-ebbc76', final_score: 50, base_score: 50, ai_adjustment: 0,  tier: 'candidate', source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-12-nvidia-newsroom-into-the-omniverse.md',          signal_id: 'sig-2026-03-12-11d275', final_score: 50, base_score: 50, ai_adjustment: 0,  tier: 'candidate', source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-11-venturebeat-ai-railway.md',                      signal_id: 'sig-2026-03-11-240d44', final_score: 49, base_score: 49, ai_adjustment: 0,  tier: 'candidate', source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_category: 'Enterprise AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-11-venturebeat-ai-claude-code-costs.md',            signal_id: 'sig-2026-03-11-8c3681', final_score: 47, base_score: 47, ai_adjustment: 0,  tier: 'candidate', source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_category: 'Enterprise AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-11-venturebeat-ai-listen-labs.md',                  signal_id: 'sig-2026-03-11-937ffc', final_score: 47, base_score: 47, ai_adjustment: 0,  tier: 'candidate', source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_category: 'Enterprise AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-11-openai-blog-openai-introduces-advanced-ent.md',  signal_id: 'sig-2026-03-11-5e4ac7', final_score: 45, base_score: 45, ai_adjustment: 0,  tier: 'candidate', source_name: 'OpenAI Blog',     source_type: 'Company Blog', signal_category: 'Enterprise AI',                         industry: 'Technology',          geo_relevance: 'Global', confidence: 0.9,  priority_hint: 'medium' },
    { filename: '2026-03-12-nvidia-newsroom-lilly-ai-factory.md',            signal_id: 'sig-2026-03-12-8dd997', final_score: 40, base_score: 40, ai_adjustment: 0,  tier: 'candidate', source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-12-nvidia-newsroom-nvidia-announces-financial.md',  signal_id: 'sig-2026-03-12-eb8830', final_score: 40, base_score: 40, ai_adjustment: 0,  tier: 'candidate', source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_category: 'Industrial AI',                         industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-12-openai-blog-from-model-to-agent.md',             signal_id: 'sig-2026-03-12-26beaf', final_score: 40, base_score: 40, ai_adjustment: 0,  tier: 'candidate', source_name: 'OpenAI Blog',     source_type: 'Company Blog', signal_category: 'AI Research',                           industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
    { filename: '2026-03-12-openai-blog-wayfair.md',                         signal_id: 'sig-2026-03-12-34fc92', final_score: 40, base_score: 40, ai_adjustment: 0,  tier: 'candidate', source_name: 'OpenAI Blog',     source_type: 'Company Blog', signal_category: 'AI Research',                           industry: 'Cross-Industry',      geo_relevance: 'Global', confidence: 0.85, priority_hint: 'medium' },
  ],

  // ── Source intelligence (derived from scored_signals) ────────────────────────
  source_intelligence: [
    { source_name: 'NVIDIA Newsroom', source_type: 'Company Blog', signal_count: 13, avg_score: 59, max_score: 80, min_score: 40, publish_count: 5, candidate_count: 8 },
    { source_name: 'VentureBeat AI',  source_type: 'News Outlet',  signal_count: 8,  avg_score: 53, max_score: 63, min_score: 47, publish_count: 1, candidate_count: 7 },
    { source_name: 'OpenAI Blog',     source_type: 'Company Blog', signal_count: 3,  avg_score: 42, max_score: 45, min_score: 40, publish_count: 0, candidate_count: 3 },
  ],

  // ── Pillar coverage (derived from scored_signals) ─────────────────────────────
  pillar_coverage: [
    { pillar: 'Industrial AI',        count: 11, avg_score: 58, max_score: 80, top_signal_id: 'sig-2026-03-02-nv-03' },
    { pillar: 'Enterprise AI',        count: 11, avg_score: 55, max_score: 73, top_signal_id: 'sig-2026-03-05-nv-01' },
    { pillar: 'AI Research & Tools',  count: 2,  avg_score: 40, max_score: 40, top_signal_id: 'sig-2026-03-12-26beaf' },
  ],

  // ── Final content ────────────────────────────────────────────────────────────
  final_content: [
    {
      id: 'final-2026-03-02-nvidia-us-manufacturing-reindustrialization',
      created_at: '2026-03-12T01:48:23.848452Z',
      content_type: 'linkedin_post',
      hook: "Just saw NVIDIA drop a serious robotics and AI architecture. As someone knee-deep in AI here in Houston, I gotta say, this could be a game-changer for U.S. manufacturing.",
      body: "This isn't just another tech release; it's a legit framework for merging hardware and software to bring AI automation to the factory floor. Think lower costs, way better precision, and factories that can actually adapt on the fly. If this takes off, it'll give American companies a real edge globally.",
      closing: "Bottom line: this isn't just about tech; it's about investing in American smarts and growing our economy.",
      editorial_status: 'ready_for_review',
      needs_review: true,
      used_for_publishing: false,
      confidence: 0.95,
      score: 80,
      source_name: 'NVIDIA Newsroom',
      signal_type: 'Technology Announcement',
      signal_category: 'Industrial AI / Robotics',
      filename: 'final-2026-03-02-nvidia-us-manufacturing-reindustrialization.json',
    },
  ],

  // ── Insight summaries ────────────────────────────────────────────────────────
  insight_summaries: [
    { id: 'insight-2026-03-02-nvidia-us-manufacturing-reindustrialization', score: 80,  route: 'publish', confidence: 0.95, used: true  },
    { id: 'insight-2026-03-02-siemens-nvidia-industrial-ai-os',             score: 65,  route: 'candidate', confidence: 1.0, used: false },
    { id: 'insight-2026-03-05-nvidia-palantir-decision-intelligence',       score: 73,  route: 'publish', confidence: 0.95, used: false },
    { id: 'insight-2026-03-11-nvidia-nemotron-3',                           score: 70,  route: 'publish', confidence: 0.85, used: false },
    { id: 'insight-2026-03-11-nvidia-gtc-2026',                             score: 60,  route: 'candidate', confidence: 0.85, used: false },
    { id: 'insight-2026-03-11-nvidia-blackwell',                            score: 60,  route: 'candidate', confidence: 0.9,  used: false },
    { id: 'insight-2026-03-11-venturebeat-claude-code-creator',             score: 63,  route: 'candidate', confidence: 0.85, used: false },
  ],
}
