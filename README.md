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
  [ INSIGHT EXTRACTION ] (Upcoming)
         ↓
  [ AUTHORITY CONTENT ]  (Upcoming)
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
*   **Production Operations:** Shell-based runtime wrappers (`signal-hunter-run.sh`) ready for 24/7 automation.

---

## 📂 Repository Structure

*   `signals/raw/`: Newly ingested, unverified signal files.
*   `signals/scored/`: High-value signals triaged for content generation.
*   `signals/archive/`: Filtered signals stored for historical reference.
*   `automation/scripts/`: Executable Python/Bash logic (Ingestion, Scoring, Triage).
*   `automation/ingestion-agents/`: Logic definitions (Specs, Source Registries, Schemas).
*   `automation/state/`: Persistent JSON files tracking "seen" signals and run history.
*   `automation/logs/`: Detailed execution logs for runtime and ingestion cycles.
*   `commands/`: Executable entrypoints for agentic and manual operations.

---

## ⚖️ Scoring & Triage Model

The engine utilizes a **Hybrid Scoring Model** to ensure stability and accuracy:

1.  **Deterministic Base:** Regex and keyword-weighted analysis of regional (Houston), industrial, and enterprise relevance.
2.  **Bounded AI Adjustment:** An AI "opinion" layer that can nudge scores up or down based on tactical nuance, strictly bounded to prevent hallucinated extremes.
3.  **Tiered Routing:**
    *   **Publish (68+):** Immediate candidates for the content pipeline.
    *   **Candidate (45-67):** Signals requiring minor refinement or human review.
    *   **Archive (25-44):** Lower-priority or noisy signals moved out of the active flow.

---

## 🚀 Roadmap

*   **Phase 4.1:** **GitHub Actions Automation** — Deploying the first 24/7 serverless cron execution.
*   **Phase 4.2:** **Insight Extraction Layer** — Generating automated Executive Memos from scored signals.
*   **Phase 4.3:** **CRM Autopush** — Directly syncing high-value scores to the CRM tracking system.
*   **Phase 5.0:** **Authority Post Generation** — Transitioning from memos to viral LinkedIn/Social content.

---

## 🛠️ Local Testing

To run a manual ingestion and triaging cycle from the repository root:

```bash
# Ingest latest signals from Golden Set
python automation/scripts/ingest_signal_hunter.py

# Triage and score ingested signals
python automation/scripts/score_signals.py

# Run the full automated operational sequence
./automation/scripts/signal-hunter-run.sh
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
