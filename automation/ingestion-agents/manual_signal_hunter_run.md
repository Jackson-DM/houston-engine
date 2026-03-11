# Manual Signal Hunter Run: First Controlled Ingestion

This document defines the constraints and execution steps for the **First Controlled Manual Run** of the Signal Hunter agent. This is a restricted, high-safety ingestion cycle designed to validate the integration of the source registry, signal schema, and deduplication rules.

---

## 1. Run Constraints
To ensure system stability during initial validation, this run is strictly limited to the following scope:
- **Sources:** Tier 1 — Golden Set only (as defined in `source_registry.md`).
- **Signal Cap:** Maximum 1–3 new raw signals created.
- **Scope:** Ingest only; no enrichment, no downstream publishing, no backfill of historic data.
- **Safety:** Local execution only; strict adherence to `manual-run-contract.md`.

---

## 2. Pre-Run Sync & Safety Check
Before execution, the operator must confirm:
- [ ] Working directory is clean (`git status`).
- [ ] Local repo is synced with `main` (`git pull origin main`).
- [ ] State files are initialized (`automation/state/*.json`).
- [ ] Network connectivity to NVIDIA, OpenAI, and Anthropic blogs is active.

---

## 3. Execution Sequence
Following the `signal-hunter-runbook.md`, the agent or operator must perform:

1.  **Golden Set Scan:** Scan only the first 3 sources in the Golden Set.
2.  **Selection & Dedupe:**
    *   Filter candidates against `signal_hunter_spec.md`.
    *   Cross-reference against `automation/state/signal-hunter-seen-signals.json`.
3.  **Schema Normalization:**
    *   Convert accepted signals into the YAML + Markdown format defined in `signal_schema.md`.
4.  **Write Files:**
    *   Save generated `.md` files to `signals/raw/`.
    *   Generate a run log: `automation/logs/signal-hunter/YYYY-MM-DD-HHMM-run.md`.
5.  **Update State:**
    *   Update `last_successful_run` and signal counts in `signal-hunter-last-run.json`.
    *   Append new signal URLs/IDs to `signal-hunter-seen-signals.json`.

---

## 4. Success Definition
The run is successful if:
1.  Exactly 1–3 new files appear in `signals/raw/` with valid YAML frontmatter.
2.  The timestamped log file exists and correctly captures the metrics.
3.  `signal-hunter-last-run.json` reflects the current system time.
4.  A second execution attempt results in `duplicates_skipped: 1+` and zero new files.

---

## 5. Post-Run Summary Format
Every manual run must end with a console or log output in this format:
```text
=== SIGNAL HUNTER RUN SUMMARY ===
Run ID: [Generated UUID]
Status: SUCCESS / PARTIAL / FAILED
Sources Scanned: [Count]
Signals Created: [Count, max 3]
Duplicates Skipped: [Count]
Rejected (Low Signal): [Count]
State Files Updated: YES/NO
Git Status: Staged for Commit
==================================
```

---

## 6. Commit & Push Instructions
1.  **Verify:** Inspect `signals/raw/` to ensure no sensitive data or malformed tags were ingested.
2.  **Stage:** `git add signals/raw/ automation/state/ automation/logs/`
3.  **Commit:** `feat(ingestion): Initial controlled manual signal capture`
4.  **Push:** `git push origin main`
