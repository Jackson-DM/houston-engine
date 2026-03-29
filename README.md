# Houston AI Authority Engine

**An automated intelligence pipeline that detects, evaluates, and transforms AI industry signals into enterprise-grade authority content.**

---

## 🛰️ System Overview

The **Houston AI Authority Engine** is a specialized research and content automation system. Its purpose is to identify high-value AI developments relevant to enterprise adoption, industrial infrastructure, and the **Houston innovation ecosystem** (Energy, Logistics, Manufacturing, Healthcare).

The engine moves beyond generic "AI news" by applying a multi-layer evaluation process to filter out noise and surface only the strategic signals that drive authority positioning for the Houston AI Club.

---

## 🔄 Recent Updates

Five operational improvements shipped in the latest hardening cycle:

1. **Silent failure visibility** — API errors across all inference stages are now captured and surfaced in the run summary instead of failing quietly.
2. **Candidate-tier signals unlocked** — Signals scoring 45–59 (Candidate tier) are now eligible for insight extraction, expanding the content pipeline's throughput.
3. **Draft generation cap raised** — Content generation now produces up to 3 drafts per run (previously 1), accelerating the content queue.
4. **URL deduplication fixed** — HTTP/HTTPS normalization prevents duplicate ingestion of the same article across protocol variants.
5. **Budget tracking system** — Monthly OpenRouter API spend is now tracked in `automation/state/budget-tracker.json` with a $16 alert threshold against the $20/month cap. A warning annotation surfaces in the GitHub Actions tab when the threshold is crossed.

---

## 🏗️ Architecture Flow

```text
  [ RSS SOURCES ]
  (NVIDIA, OpenAI, Anthropic, VentureBeat, TechCrunch)
         ↓
  [ SIGNAL HUNTER ] (Ingestion Engine)
  (Fetch → Normalize → Dedupe)
         ↓
  [ signals/raw/ ] (Structured Markdown)
         ↓
  [ SIGNAL SCORING ] (Hybrid AI Layer)
  (Deterministic Base Score + Bounded AI Adjustment)
         ↓
  ┌──────┴──────┐
  ↓             ↓
[ signals/scored/ ]   [ signals/archive/ ]
(Publish / Candidate)  (Low-Value / Triage)
         ↓
  [ INSIGHT EXTRACTION ]
  (Strategic Artifact Generation)
         ↓
  [ CONTENT DRAFTING ]
  (LinkedIn Authority Post Drafts)
         ↓
  [ CONTENT HUMANIZATION ]
  (Final Polish via Humanizer Guidance)
         ↓
  [ content/final/ ]
  (Copy-Paste Ready LinkedIn Posts)
```

---

## ✅ Current Capabilities

- **RSS Ingestion:** Automated fetching from the Tier 1 "Golden Set" signal sources.
- **Schema Normalization:** Conversion of raw feed data into strict, structured Markdown with YAML metadata.
- **Deduplication & State Tracking:** Robust JSON-based tracking with HTTP/HTTPS normalization to prevent duplicate ingestion across runs.
- **Deterministic Scoring:** A weighted baseline model (0–80 pts) evaluating signals for regional and strategic relevance.
- **Hybrid AI Adjustment:** A bounded (−8 to +12) agentic logic layer to refine terminal scores with expert nuance.
- **Automated Routing:** Logic-driven file movement between `scored` and `archive` directories.
- **Insight Extraction:** Automated generation of structured strategic insight artifacts from Publish-tier and qualifying Candidate-tier signals.
- **Content Generation:** Automated LinkedIn authority post drafting from strategic insights (up to 3 per run).
- **Content Humanization:** Post-processing of drafts using `humanizer.md` guidance to remove AI patterns and add voice.
- **Historical Run Log Archiving:** Every completed run is preserved as a dated JSON artifact in `automation/logs/archive/` for trend analysis and audit.
- **Monthly API Spend Tracking:** Token usage is accumulated per run in a state file with model-aware cost estimation. Alerts surface in the GitHub Actions tab when spend reaches 80% of the monthly budget cap.
- **Production Operations:** GitHub Actions workflow (`signal-hunter.yml`) for 24/7 automation on a 6-hour cadence.

---

## 🤖 Unattended Operations

The engine is hardened for unattended execution via GitHub Actions:

- **Schedule:** Runs every 6 hours (minute 17).
- **No-Op Safety:** Every stage (Ingestion through Content Humanization) handles empty candidate sets gracefully.
- **Git Safety:** The commit/push step only executes if file changes are detected.
- **Observability:** Every run generates `automation/logs/latest-run-summary.json` with a full metrics breakdown across all stages, plus a dated archive copy in `automation/logs/archive/`.
- **Budget Monitoring:** A pre-commit workflow step checks `budget_warning` in the run summary and emits a visible annotation in the Actions tab if the $16 threshold is crossed.

---

## 📂 Repository Structure

- `signals/raw/`: Newly ingested, unverified signal files.
- `signals/scored/`: High-value signals triaged for content generation.
- `signals/insights/`: Structured JSON artifacts containing strategic analysis.
- `signals/archive/`: Filtered signals stored for historical reference.
- `content/drafts/`: Automated initial LinkedIn drafts (JSON).
- `content/final/`: Humanized, copy-paste ready LinkedIn posts (JSON).
- `automation/scripts/`: Executable Python logic (Ingestion, Scoring, Insights, Content, Budget Tracking).
- `automation/state/`: Persistent run state files including dedup tracking and API spend accumulator.
- `automation/logs/`: Run summaries (`latest-run-summary.json`) and dated archive copies.

---

## ⚖️ Scoring & Triage Model

The engine uses a **Hybrid Scoring Model** to ensure stability and accuracy:

1. **Deterministic Base:** Regex and keyword-weighted analysis of regional (Houston), industrial, and enterprise relevance.
2. **Bounded AI Adjustment:** An AI "opinion" layer that can nudge scores up or down based on tactical nuance.
3. **Tiered Routing:**
   - **Publish (68+):** Immediate candidates for the content pipeline.
   - **Candidate (45–67):** Now eligible for insight extraction at scores 45+.
   - **Archive (25–44):** Lower-priority or noisy signals moved out of the active flow.

---

## 🚀 Roadmap

- **Phase 8.0: Omni-Channel Distribution** — Multi-format output for Newsletter and Web; single insight driving multiple content surfaces.
- **Phase 9.0: CRM Autopush** — Direct sync of high-value signals and published content records into the CRM tracking system.
- **Phase 10.0: Agent Swarm Expansion** — Parallel inference agents for higher throughput across signal sources and content formats.

---

## 🛠️ Local Testing

To run a manual cycle from the repository root:

```bash
# Set your API key
export OPENROUTER_API_KEY="your_key"

# Ingest, Score, Extract, Draft, and Humanize
python automation/scripts/ingest_signal_hunter.py
python automation/scripts/score_signals.py
python automation/scripts/extract_signal_insights.py
python automation/scripts/generate_authority_drafts.py
python automation/scripts/humanize_authority_drafts.py
```

---

## 🧠 Design Philosophy

- **Deterministic First:** Automation must be stable and predictable before it is enhanced by AI.
- **AI as Bounded Nudge:** AI is used for nuance, not for core logic; safeguards prevent score drift.
- **Signal Over Noise:** The engine is built to archive more than it promotes.
- **Houston-Centric:** All global AI signals are viewed through the lens of Houston's industrial power.

---

## 📞 Participation

This engine powers the **Houston AI Club** authority ecosystem. Architecture documentation lives in `docs/ARCHITECTURE.md`. For system context and operational notes, see `SYSTEM_CONTEXT.md` and `HANDOFF.md`.
