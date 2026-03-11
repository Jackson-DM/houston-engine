# Signal Hunter Runbook

This runbook defines the operational sequence for **Signal Hunter**, the ingestion agent responsible for scanning curated sources, identifying high-value AI and industrial signals, and normalizing them into the `signals/raw/` directory of the **Houston AI Authority Engine**.

## 1. Purpose
The purpose of this runbook is to provide a standardized, repeatable execution flow for Signal Hunter, whether triggered by a cron job on the DigitalOcean droplet or run manually during development.

---

## 2. Run Sequence

### Stage 1: Load Configuration and Source Registry
*   **What Happens:** Signal Hunter initializes and reads the `automation/ingestion-agents/source_registry.md` to identify the list of Tier 1 and Tier 2 URLs to scan.
*   **Expected Inputs:** `automation/ingestion-agents/source_registry.md`
*   **Expected Outputs:** An in-memory list of target URLs and prioritization metadata.
*   **Failure Handling:** If the registry file is missing or unreadable, the run aborts immediately with a CRITICAL error log.

### Stage 2: Load State Files
*   **What Happens:** The agent loads the last run timestamps and the list of previously seen signal hashes/URLs.
*   **Expected Inputs:** `automation/state/signal-hunter-last-run.json`, `automation/state/signal-hunter-seen-signals.json`
*   **Expected Outputs:** Populated `last_run` metadata and `seen_signals` lookup table.
*   **Failure Handling:** If state files are corrupt, Signal Hunter attempts to initialize new empty state files rather than crashing.

### Stage 3: Scan Priority Sources
*   **What Happens:** The agent iterates through Tier 1 (Golden Set) followed by Tier 2 sources, fetching HTML or RSS data.
*   **Expected Inputs:** Source URLs from the registry.
*   **Expected Outputs:** Raw content blobs from each accessible source.
*   **Failure Handling:** Individual source failures are logged as WARNINGS; the run continues to the next source.

### Stage 4: Extract Candidate Signals
*   **What Happens:** The agent parses raw content to identify discrete news items, blog posts, or announcements.
*   **Expected Inputs:** Raw content blobs.
*   **Expected Outputs:** A list of "Candidate" signal objects (title, URL, snippet).

### Stage 5: Apply Signal Selection Criteria
*   **What Happens:** Candidate signals are evaluated against the `signal_hunter_spec.md` to ensure they meet the relevance bar for Enterprise AI, Industrial Tech, or Houston-adjacent trends.
*   **Expected Inputs:** `automation/ingestion-agents/signal_hunter_spec.md`
*   **Expected Outputs:** A filtered list of "Accepted" signals.
*   **Failure Handling:** Signals failing the check are logged as `low_signal_rejected` in the run state.

### Stage 6: Apply Deduplication Rules
*   **What Happens:** Accepted signals are checked against `dedupe_rules.md` and the `seen-signals.json` list.
*   **Expected Inputs:** `automation/ingestion-agents/dedupe_rules.md`, `automation/state/signal-hunter-seen-signals.json`
*   **Expected Outputs:** A final list of "Unique" signals.
*   **Failure Handling:** Duplicate matches increment the `duplicates_skipped` counter in the run state.

### Stage 7: Normalize Accepted Signals into Schema
*   **What Happens:** Unique signals are transformed into the structured Markdown format defined by the schema.
*   **Expected Inputs:** `automation/ingestion-agents/signal_schema.md`
*   **Expected Outputs:** Formatted Markdown strings with YAML frontmatter.

### Stage 8: Write Markdown Files to `signals/raw/`
*   **What Happens:** Files are written to disk using the naming convention `YYYY-MM-DD-source-slug.md`.
*   **Expected Inputs:** Formatted Markdown strings.
*   **Expected Outputs:** Physical `.md` files in `signals/raw/`.
*   **Failure Handling:** If a file cannot be written (disk full/permissions), the error is logged and the specific signal is retried in the next run.

### Stage 9: Update State Files
*   **What Happens:** Update `last-run.json` with current stats and append new signal hashes/URLs to `seen-signals.json`.
*   **Expected Outputs:** Updated JSON state files on disk.

### Stage 10: Write Run Log
*   **What Happens:** Write a summary of the run to `logs/ingestion/run-YYYY-MM-DD.log`.

### Stage 11: Commit and Push Results
*   **What Happens:** Git add, commit, and push the new signals and updated state files to the repository.
*   **Failure Handling:** If `git push` fails (connectivity), the files remain local and will be pushed by the next successful run.

---

## 3. Run Output Artifacts
A successful run typically produces or updates:
- **New Signal Files:** `signals/raw/*.md`
- **Updated Last Run State:** `automation/state/signal-hunter-last-run.json`
- **Updated Seen Registry:** `automation/state/signal-hunter-seen-signals.json`
- **Ingestion Log:** `logs/ingestion/run-YYYY-MM-DD.log`

---

## 4. Failure Handling
- **Source Fails:** Skip the source, log a warning, and proceed.
- **All Sources Fail:** Log a critical error, send a notification (if configured), and terminate.
- **Dedupe State Invalid:** Rebuild the `seen-signals.json` by scanning the existing `signals/raw/` directory.
- **File Writing Fails:** Log the error and retain the signal in memory for one retry before skipping.
- **Git Push Fails:** Normal operation. The files are locally committed; the next run will push them.

---

## 5. Manual Test Run Checklist
Before deploying as a cron job, perform the following:
- [ ] **Sync:** Ensure local repo is `git pull`ed and up to date.
- [ ] **Registry Check:** Validate `source_registry.md` has no broken links.
- [ ] **State Reset:** (Optional) Clear `signal-hunter-seen-signals.json` to simulate a first run.
- [ ] **Dry Run:** Run Agent with `DRY_RUN=true` to verify signal extraction without writing files.
- [ ] **Full Run:** Execute Signal Hunter and verify a file appears in `signals/raw/`.
- [ ] **Schema Check:** Run a Markdown linter or manually verify the YAML frontmatter against `signal_schema.md`.
- [ ] **Push Check:** Verify the new signal is visible on GitHub.
