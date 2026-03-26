# MEMORY.md - durable state

## 🏁 PROJECT STATUS: PHASE 7 COMPLETE
The **Houston AI Authority Engine** is fully autonomous and hardened.
- **Workflow**: Ingest → Score → Extract → Draft → Humanize.
- **Automation**: GitHub Actions (6-hour CRON) is active and successful.
- **Proof**: End-to-end "Smoke Test" passed on 2026-03-11.
- **Visualization**: Vite-based Dashboard (V1) is currently being built by Claude Code.

## 💰 BUDGET & TOKEN MANAGEMENT (MANDATORY)
- **Token Limit**: Proactively suggest a session reset (`/new`) every **25k-50k tokens** to manage Leon's OpenRouter invoice costs.
- **Protocol**: 1. Monitor `/status` every 5-10 messages. 2. Perform a "Memory Flush" to `HANDOFF.md` before resetting. 3. Use Flash models for routine maintenance.
- **Goal**: Minimize context costs by restarting expensive high-history sessions after major milestones.
- **Reference**: Established 2026-03-12 by Jackson/Claw.

## 🏛️ AUTOMATION ARCHITECTURE
- **Ingest**: `automation/scripts/ingest_signal_hunter.py`
- **Score**: `automation/scripts/score_signals.py`
- **Extract**: `automation/scripts/extract_signal_insights.py`
- **Draft**: `automation/scripts/generate_authority_drafts.py`
- **Humanize**: `automation/scripts/humanize_authority_drafts.py`
- **Log**: `automation/logs/latest-run-summary.json`

## 🏁 OPERATIONAL STATUS
The engine is currently in **"Observation Mode"** following hardening. 
Next active building: Phase 8 (Integration/Dashboard) and Phase 9 (Automated Distribution).
