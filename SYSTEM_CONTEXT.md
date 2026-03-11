# SYSTEM CONTEXT
Houston AI Authority Engine

---

# System Overview

The **Houston AI Authority Engine** is an automated multi-agent intelligence system designed to transform raw industry signals into strategic, executive-grade authority content. 

The system provides a continuous loop: **Signal Detection → Hybrid Scoring → Insight Generation → Authority Content → Business Opportunity.**

---

# Core Pipeline

**1. RSS Sources** (NVIDIA, OpenAI, Anthropic, VentureBeat, TechCrunch)
↓
**2. Signal Hunter** (Automated Ingestion Engine)
↓
**3. Hybrid Scoring** (Deterministic + Bounded AI Adjustment)
↓
**4. Signal Triage** (Publish / Candidate / Archive)
↓
**5. Executive Memo** (Strategic Insight Generation)
↓
**6. Authority Content** (LinkedIn and Social Packaging)

---

# Current Phase

**Phase 4 — Signal-Driven Automation (ACTIVE)**

The system has transitioned from a manual architectural concept into a live, automated pipeline.

**Core Automation Stack:**
• **Signal Hunter:** 24/7 ingestion via GitHub Actions (scheduled every 6 hours).
• **Hybrid Scoring:** Weighted deterministic baseline with a bounded (-8 to +12) AI expert adjustment.
• **State Tracking:** Robust JSON-based deduplication and run history management.
• **Cloud Native:** Serverless execution environment with zero-maintenance overhead.

---

# Phase 5 Objective

Introduce the **Insight Extraction & Memo Generation Layer**.

The next upgrade will:
1.  Automatically cluster `scored` signals into thematic groups.
2.  Trigger the **Research Agent (Claude)** to draft Executive Memos.
3.  Cross-reference memos with **CRM Engagement Signals** to prioritize high-value leads.

---

# Agent Roles

**Orchestrator** (Claw - Gemini 3 Flash)
- Coordinates 24/7 pipeline execution via GitHub Actions.
- Manages repository state and system-wide documentation.
- Routes high-value signals to the Research Layer.

**Research Agent** (Claude Opus)
- Analyzes scored signals to identify strategic "Why it Matters" insights.
- Generates Executive Memos and drafts high-authority content.
- Applies the "Houston Lens" to global AI developments.

**Engineering Agent** (Codex / o3-mini)
- Maintains the Python/Bash automation stack.
- Configures GitHub Actions and environment secrets.
- Manages technical schema validation and dedupe logic.

**Strategic Oversight** (ChatGPT)
- Designs the hybrid scoring models and triage thresholds.
- Maps long-term roadmap and business opportunity triggers.
- Provides architectural guidance for the authority funnel.

---

# System Assets

**Raw Signals (`signals/raw/`)**
Initial ingestions from Golden Set sources.

**Scored Signals (`signals/scored/`)**
Triaged intelligence ready for memo generation (Publish/Candidate status).

**Archived Signals (`signals/archive/`)**
Signals filtered out by the scoring layer for historical reference.

**Memos (`memos/`)**
Executive insights derived from scored signals.

**CRM Data (`crm/`)**
Tracking of companies, industries, and partnership opportunities.

---

# Strategic Outcome

The engine positions Houston as the **center of applied industrial AI** by converting global changes into regional influence and business opportunity.
