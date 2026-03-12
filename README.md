# Houston AI Authority Engine

**An automated intelligence pipeline that detects, evaluates, and transforms AI industry signals into enterprise-grade authority content.**

---

## 🛰️ System Overview

The **Houston AI Authority Engine** is a specialized research and content automation system. Its purpose is to identify high-value AI developments relevant to enterprise adoption, industrial infrastructure, and the **Houston innovation ecosystem** (Energy, Logistics, Manufacturing, Healthcare).

The engine moves beyond generic "AI news" by applying a multi-layer evaluation process to filter out noise and surface only the strategic signals that drive authority positioning for the Houston AI Club.

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
  [ INSIGHT EXTRACTION ] (Active)
  (Strategic Artifact Generation)
         ↓
  [ CONTENT DRAFTING ] (Active)
  (Initial LinkedIn Drafts)
         ↓
  [ CONTENT HUMANIZATION ] (Active)
  (Final Polish via Humanizer.md)
         ↓
  [ PUBLISHED CONTENT ] (Upcoming)
  (Executive Memos & LinkedIn Posts)
```

---

## ✅ Current Capabilities

*   **RSS Ingestion:** Automated fetching from the Tier 1 "Golden Set" signal sources.
*   **Schema Normalization:** Conversion of raw feed data into strict, structured Markdown with YAML metadata.
*   **Deduplication & State Tracking:** Robust JSON-based tracking to prevent duplicate ingestion across runs.
*   **Deterministic Scoring:** A weighted baseline model (0-80 pts) evaluating signals for regional and strategic relevance.
*   **Hybrid AI Adjustment:** A bounded (-8 to +12) agentic logic layer to refine terminal scores with expert nuance.
*   **Automated Routing:** Logic-driven file movement between `scored` and `archive` directories.
*   **Insight Extraction:** Automated generation of structured strategic insight artifacts from high-scoring signals.
*   **Content Generation:** Automated LinkedIn authority post drafting based on strategic insights.
*   **Content Humanization:** Post-processing of drafts using the `humanizer.md` guidance to remove "AI slop" and add soul.
*   **Production Operations:** GitHub Actions workflow (`signal-hunter.yml`) for 24/7 automation.

---

## 🤖 Unattended Operations

The engine is hardened for unattended execution via GitHub Actions:

- **Schedule:** Runs every 6 hours (minute 17).
- **No-Op Safety:** Every stage (Ingestion through Content Humanization) handles empty candidate sets gracefully.
- **Git Safety:** The commit/push step only executes if file changes are detected.
- **Observability:** Every run generates a `automation/logs/latest-run-summary.json` providing a breakdown of metrics across all stages.

---

## 📂 Repository Structure

*   `signals/raw/`: Newly ingested, unverified signal files.
*   `signals/scored/`: High-value signals triaged for content generation.
*   `signals/insights/`: Structured JSON artifacts containing strategic analysis.
*   `signals/archive/`: Filtered signals stored for historical reference.
*   `content/drafts/`: Automated initial LinkedIn drafts (JSON).
*   `content/final/`: Humanized, copy-paste ready LinkedIn posts (JSON).
*   `automation/scripts/`: Executable Python logic (Ingestion, Scoring, Insights, Content).
*   `commands/`: Executable entrypoints for agentic and manual operations.

---

## ⚖️ Scoring & Triage Model

The engine utilizes a **Hybrid Scoring Model** to ensure stability and accuracy:

1.  **Deterministic Base:** Regex and keyword-weighted analysis of regional (Houston), industrial, and enterprise relevance.
2.  **Bounded AI Adjustment:** An AI "opinion" layer that can nudge scores up or down based on tactical nuance.
3.  **Tiered Routing:**
    *   **Publish (68+):** Immediate candidates for the content pipeline.
    *   **Candidate (45-67):** Signals requiring minor refinement or human review.
    *   **Archive (25-44):** Lower-priority or noisy signals moved out of the active flow.

---

## 🚀 Roadmap

*   **Phase 4.1:** **GitHub Actions Automation** — Deploying the first 24/7 serverless cron execution.
*   **Phase 4.2:** **Insight Extraction Layer** — Generating automated Executive Memos from scored signals.
*   **Phase 4.3:** **CRM Autopush** — Directly syncing high-value scores to the CRM tracking system.
*   **Phase 5.0:** **Authority Content Generation** — Automated LinkedIn/Social drafting (Active).
*   **Phase 7.0:** **Content Humanization** — AI-slop removal and voice polish (Active).
*   **Phase 8.0:** **Omni-Channel Distribution** — Multi-format output for Newsletter/Web.

---

## 🛠️ Local Testing

To run a manual cycle from the repository root:

```bash
# Set your API Key
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

*   **Deterministic First:** Automation must be stable and predictable before it is enhanced by AI.
*   **AI as Bounded Nudge:** AI is used for nuance, not for core logic; safeguards prevent score drift.
*   **Signal Over Noise:** The engine is built to delete/archive more than it promotes.
*   **Houston-Centric:** All global AI signals are viewed through the lens of Houston's industrial power.

---

## 📞 Participation

This engine powers the **Houston AI Club** authority ecosystem. For architecture notes or contribution guidelines, see `docs/ARCHITECTURE.md`.
