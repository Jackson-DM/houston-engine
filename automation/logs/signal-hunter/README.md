# Signal Hunter Logs

This directory contains the historical run logs for the **Signal Hunter** ingestion agent. These logs serve as an operational trail for debugging, performance tracking, and signal selection auditing.

## 1. Purpose
Logs are generated for every scheduled or manual run of Signal Hunter. They provide a high-level summary and detailed execution trace for each ingestion cycle, helping operators identify when sources fail or when high-value signals are correctly processed.

## 2. Run Log Content
A typical run log file (`YYYY-MM-DD-HHMM-run.md`) should include:
- **Run Timestamp:** Exact start and end time of the ingestion cycle.
- **Sources Scanned:** List of Tier 1 and Tier 2 URLs attempted.
- **Candidate Items Found:** Total count of raw news items or posts identified.
- **Signals Created:** Count and filenames of successful `.md` files written to `signals/raw/`.
- **Duplicates Skipped:** Number of items rejected based on `dedupe_rules.md`.
- **Low-Signal Rejections:** Number of items filtered out based on `signal_hunter_spec.md` relevance criteria.
- **Errors or Warnings:** Detailed report of timeouts, 404s, or git push issues.
- **Notes:** Brief manual or automated commentary on the overall quality of the run.

## 3. Filename Convention
Logs should be named using the following format for easy chronological sorting:
`YYYY-MM-DD-HHMM-run.md`  
*Example: 2026-03-10-1200-run.md*

## 4. Preservation Policy
Logs should be preserved indefinitely to maintain operational visibility and provide context for long-term pipeline performance analysis. They provide the "why" behind every signal produced by the AI Authority Engine.
