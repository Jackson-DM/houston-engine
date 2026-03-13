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

  // ── Delta vs previous snapshot ───────────────────────────────────────────────
  deltas: { signals_ingested: 4, signals_scored: 3, content_drafted: 1, errors: -2 },

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
      full_text: "Just saw NVIDIA drop a serious robotics and AI architecture. As someone knee-deep in AI here in Houston, I gotta say, this could be a game-changer for U.S. manufacturing.\n\nThis isn't just another tech release; it's a legit framework for merging hardware and software to bring AI automation to the factory floor. Think lower costs, way better precision, and factories that can actually adapt on the fly. If this takes off, it'll give American companies a real edge globally.\n\nBottom line: this isn't just about tech; it's about investing in American smarts and growing our economy.",
      original_text: "NVIDIA has announced a new physical AI reference architecture aimed at revitalizing United States manufacturing. The platform provides a comprehensive blueprint for integrating hardware and software components to enable AI-driven automation in factory environments. Key benefits include reduced operational costs, improved precision, and adaptive production capabilities. Industry analysts predict this will significantly enhance the competitive position of American manufacturing companies in global markets.",
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
    {
      id: 'insight-2026-03-02-nvidia-us-manufacturing-reindustrialization',
      score: 80,
      route: 'publish',
      confidence: 0.95,
      used: true,
      publisher: 'NVIDIA Newsroom',
      summary: 'NVIDIA introduces a comprehensive robotics and physical AI reference architecture designed to revitalize U.S. manufacturing by providing a blueprint for hardware/software integration in factories.',
      why_it_matters: 'This initiative has the potential to accelerate the adoption of AI-driven automation in manufacturing, leading to increased efficiency, reduced costs, and enhanced competitiveness for U.S. companies. It offers a tangible path for modernizing industrial operations.',
      business_implication: 'For manufacturers, integrating NVIDIA\'s physical AI blueprint could mean optimized production processes, improved quality control, and the ability to rapidly adapt to changing market demands. For NVIDIA, this strengthens their market position in the industrial AI space.',
      regional_angle: 'Houston, with its large manufacturing workforce, stands to benefit significantly. Local industrial operators can leverage this technology to upgrade their facilities, attract new investments, and create high-skilled jobs in AI-driven manufacturing.',
      recommended_angle: 'Focus on the practical applications of NVIDIA\'s physical AI blueprint for Houston\'s manufacturing sector, highlighting potential for job creation, economic growth, and enhanced competitiveness for local businesses.',
      content_angles: [
        'The role of AI in reshoring U.S. manufacturing.',
        'Case studies of early adopters of NVIDIA\'s physical AI.',
        'The impact of AI on the manufacturing workforce in Houston.',
        'How local businesses can access resources for implementing AI solutions.',
        'Comparison of NVIDIA\'s approach to other robotics and AI solutions.',
      ],
    },
    {
      id: 'insight-2026-03-02-siemens-nvidia-industrial-ai-os',
      score: 65,
      route: 'candidate',
      confidence: 1.0,
      used: false,
      publisher: 'NVIDIA Newsroom',
      summary: 'Siemens and NVIDIA partner on an Industrial AI operating system that unifies edge computing and cloud AI for factory automation at scale.',
      why_it_matters: 'A joint Siemens-NVIDIA industrial OS dramatically lowers the integration barrier for plant operators, collapsing what was a multi-vendor, multi-year project into a standardized platform.',
      business_implication: 'Plant operators who adopt early gain a first-mover efficiency advantage; systems integrators in Houston and the Gulf Coast face both disruption and opportunity as the integration services market reshapes.',
      regional_angle: 'Houston\'s petrochemical and energy corridor runs some of the world\'s largest process plants — exactly the environments this platform targets. Local operators at Dow, LyondellBasell, and Huntsman are natural early adopters.',
      recommended_angle: 'Frame as "the industrial AI plumbing that makes everything else possible" — emphasize how this removes the hidden integration tax that has slowed Houston plant modernization.',
      content_angles: [
        'How the Siemens-NVIDIA OS compares to existing SCADA and MES stacks.',
        'Which Houston-area industries are first in line to benefit.',
        'The new class of AI-native plant engineer this platform requires.',
        'Edge vs. cloud tradeoffs for continuous process industries.',
      ],
    },
    {
      id: 'insight-2026-03-05-nvidia-palantir-decision-intelligence',
      score: 73,
      route: 'publish',
      confidence: 0.95,
      used: false,
      publisher: 'NVIDIA Newsroom',
      summary: 'NVIDIA and Palantir combine GPU-accelerated inference with Palantir\'s AIP platform to deliver real-time decision intelligence for enterprise operations.',
      why_it_matters: 'Uniting the world\'s fastest inference hardware with the leading enterprise AI deployment platform creates a full-stack offering that compresses the path from model to operational decision.',
      business_implication: 'Enterprises that have been stuck in AI pilot purgatory now have a productionization on-ramp. Defense, energy, and financial services firms — all major Houston employers — are primary targets.',
      regional_angle: 'Houston\'s energy majors already run Palantir Foundry; adding NVIDIA-accelerated inference means AI-driven trading and operations decisions that currently take hours could execute in milliseconds.',
      recommended_angle: 'Lead with the "AI pilot to production" narrative — Houston operators have invested millions in pilots that never scaled; this partnership directly addresses that failure mode.',
      content_angles: [
        'Why most enterprise AI pilots fail at the inference bottleneck.',
        'How Palantir AIP + NVIDIA changes the ROI math for energy companies.',
        'Decision intelligence use cases specific to Houston\'s O&G sector.',
        'The talent implications: what a decision intelligence engineer looks like.',
      ],
    },
    {
      id: 'insight-2026-03-11-nvidia-nemotron-3',
      score: 70,
      route: 'publish',
      confidence: 0.85,
      used: false,
      publisher: 'NVIDIA Newsroom',
      summary: 'NVIDIA\'s Nemotron-3 Super delivers 5× inference throughput improvement over its predecessor, enabling cost-effective deployment of large language models at enterprise scale.',
      why_it_matters: 'A 5× throughput jump collapses the per-token cost curve, making frontier-model capabilities economically viable for workloads that were previously cost-prohibitive.',
      business_implication: 'AI product teams and internal tooling squads can now serve substantially more users without proportional infrastructure spend, accelerating ROI timelines.',
      regional_angle: 'Houston tech companies and university research groups running LLM-based tools can now dramatically cut cloud inference costs, freeing budget for other AI investment.',
      recommended_angle: 'Anchor on cost-per-insight economics — translate the 5× headline into concrete dollar figures for a typical Houston mid-market firm.',
      content_angles: [
        'The hidden cost structure of enterprise LLM deployments.',
        'What 5× throughput means for AI product roadmaps in 2026.',
        'Comparing Nemotron-3 Super to competing inference optimization solutions.',
        'How Houston startups can leverage the new efficiency curve.',
      ],
    },
    {
      id: 'insight-2026-03-11-nvidia-gtc-2026',
      score: 60,
      route: 'candidate',
      confidence: 0.85,
      used: false,
      publisher: 'NVIDIA Newsroom',
      summary: 'GTC 2026 live updates highlight NVIDIA\'s expanded industrial AI portfolio, new partnerships, and a strong signal that physical AI is the primary growth vector for the next product cycle.',
      why_it_matters: 'GTC sets the industry agenda for the coming year; the physical AI emphasis confirms where capital and talent are flowing, giving Houston operators a roadmap for investment prioritization.',
      business_implication: 'Companies that align their AI strategy with NVIDIA\'s announced roadmap gain preferred access to hardware allocations, partner programs, and early-adopter pricing.',
      regional_angle: 'Several Houston-based energy and manufacturing firms were cited in partnership announcements, signaling that the Gulf Coast is on NVIDIA\'s strategic radar.',
      recommended_angle: 'Curate the top three GTC announcements most relevant to Houston industry and frame as an executive briefing rather than a tech recap.',
      content_angles: [
        'Top 3 GTC 2026 announcements for Houston energy leaders.',
        'How to evaluate NVIDIA partnership programs for your organization.',
        'Physical AI vs. software AI: where the next decade of value accrues.',
      ],
    },
    {
      id: 'insight-2026-03-11-nvidia-blackwell',
      score: 60,
      route: 'candidate',
      confidence: 0.9,
      used: false,
      publisher: 'NVIDIA Newsroom',
      summary: 'NVIDIA launches Blackwell-based data center products, offering a generational leap in training and inference throughput targeted at hyperscalers and large enterprises.',
      why_it_matters: 'Blackwell resets the performance baseline that AI teams will engineer toward — workloads designed today need to be architected for this new ceiling.',
      business_implication: 'Enterprises on multi-year hardware refresh cycles need to plan Blackwell-compatible architectures now to avoid being two generations behind at production time.',
      regional_angle: 'Houston data center operators and the growing Texas AI infrastructure build-out will need to evaluate Blackwell upgrade timelines against power and cooling constraints.',
      recommended_angle: 'Frame as a planning signal — "if you\'re designing AI infrastructure today, here\'s what the finish line looks like."',
      content_angles: [
        'Blackwell vs. Hopper: the practical performance delta for enterprise workloads.',
        'Power and cooling implications for Texas data center operators.',
        'How to future-proof AI infrastructure investments in a rapid-iteration environment.',
      ],
    },
    {
      id: 'insight-2026-03-11-venturebeat-claude-code-creator',
      score: 63,
      route: 'candidate',
      confidence: 0.85,
      used: false,
      publisher: 'VentureBeat AI',
      summary: 'The creator of Claude Code reveals the design philosophy behind agentic coding tools, emphasizing autonomous task completion over autocomplete as the new productivity paradigm.',
      why_it_matters: 'Agentic coding tools represent a fundamental shift in developer productivity — teams that adopt early compound their output advantage each sprint cycle.',
      business_implication: 'Engineering organizations that integrate agentic tools into their workflow can realistically double effective developer capacity within a hiring freeze, directly improving product velocity.',
      regional_angle: 'Houston\'s growing tech and energy-tech sector employs thousands of software engineers; early adoption of agentic tools is a talent retention and competitiveness lever.',
      recommended_angle: 'Focus on the productivity math for engineering leaders — what does a 2× effective capacity mean for a 10-person Houston dev team?',
      content_angles: [
        'Agentic coding vs. autocomplete: the workflow difference explained.',
        'How Houston engineering teams are using AI coding tools in production.',
        'The learning curve for agentic development tools.',
        'Security and code review implications of AI-generated code at scale.',
      ],
    },
  ],

  // ── Archive digest ───────────────────────────────────────────────────────────
  archive_digest: {
    count: 42,
    samples: [
      { filename: '2026-03-02-nvidia-us-manufacturing-reindustrialization.md', signal_id: 'sig-2026-03-02-nv-03-arch', final_score: 38, tier: 'archive', source_name: 'NVIDIA Newsroom', signal_category: 'Industrial AI / Robotics', industry: 'Manufacturing', geo_relevance: 'US' },
      { filename: '2026-03-02-siemens-nvidia-industrial-ai-os.md',             signal_id: 'sig-2026-03-02-nv-02-arch', final_score: 35, tier: 'archive', source_name: 'NVIDIA Newsroom', signal_category: 'Industrial AI',           industry: 'Manufacturing / Energy', geo_relevance: 'Global' },
      { filename: '2026-03-11-nvidia-newsroom-nvidia-gtc-2026.md',             signal_id: 'sig-2026-03-11-de78af-arch', final_score: 32, tier: 'archive', source_name: 'NVIDIA Newsroom', signal_category: 'Industrial AI',           industry: 'Cross-Industry', geo_relevance: 'Global' },
      { filename: '2026-03-11-openai-blog-openai-introduces-advanced-ent.md',  signal_id: 'sig-2026-03-11-5e4ac7-arch', final_score: 30, tier: 'archive', source_name: 'OpenAI Blog',     signal_category: 'Enterprise AI',           industry: 'Technology', geo_relevance: 'Global' },
      { filename: '2026-03-12-openai-blog-from-model-to-agent.md',             signal_id: 'sig-2026-03-12-26beaf-arch', final_score: 28, tier: 'archive', source_name: 'OpenAI Blog',     signal_category: 'AI Research',             industry: 'Cross-Industry', geo_relevance: 'Global' },
    ],
  },

  // ── Industry breakdown ───────────────────────────────────────────────────────
  industry_breakdown: [
    { industry: 'Cross-Industry',        total: 14, publish_count: 3, candidate_count: 9,  archive_count: 2, top_geo: 'Global' },
    { industry: 'Manufacturing',         total: 3,  publish_count: 1, candidate_count: 1,  archive_count: 1, top_geo: 'US'     },
    { industry: 'Technology',            total: 3,  publish_count: 0, candidate_count: 3,  archive_count: 0, top_geo: 'Global' },
    { industry: 'Enterprise / Industrial', total: 1, publish_count: 1, candidate_count: 0, archive_count: 0, top_geo: 'US'    },
    { industry: 'Manufacturing / Energy', total: 1, publish_count: 0, candidate_count: 1,  archive_count: 0, top_geo: 'Global' },
  ],

  // ── Run history (git commits) ─────────────────────────────────────────────
  run_history: [
    { sha: '63321d7', message: 'feat(dashboard): add WOW layer — borders, hover, count-up, entrance, clock', date: '2026-03-13T04:20:00Z' },
    { sha: '53b36d6', message: 'feat(dashboard): add Authority Impact panel — final lifecycle stage',         date: '2026-03-13T03:40:00Z' },
    { sha: '535dc23', message: 'chore(signal-hunter): automated signal run summary 2026-03-13 03:10',        date: '2026-03-13T03:10:00Z' },
    { sha: '677a4e0', message: 'feat(dashboard): add subtle motion to compression engine particle clusters',  date: '2026-03-12T23:55:00Z' },
    { sha: 'a0b7dda', message: 'feat(dashboard): add Signal Compression Engine panel',                        date: '2026-03-12T22:40:00Z' },
    { sha: 'f4e5d6c', message: 'chore(signal-hunter): automated signal run summary 2026-03-12 19:12',        date: '2026-03-12T19:12:00Z' },
    { sha: 'b3c9e1f', message: 'feat(dashboard): add Score Distribution and Source Intelligence panels',      date: '2026-03-12T15:30:00Z' },
    { sha: 'd7a2b8e', message: 'chore(signal-hunter): automated signal run summary 2026-03-11 08:45',        date: '2026-03-11T08:45:00Z' },
  ],
}
