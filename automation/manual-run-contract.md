# Signal Hunter Manual Run Contract

This document defines the formal operational contract for performing manual execution of the **Signal Hunter** ingestion agent. Adherence to this contract ensures that development and testing reflect the intended production behavior of the Houston AI Authority Engine.

---

## 1. Purpose
The **Manual Run Contract** provides a standardized framework for developers and operators to execute Signal Hunter outside of an automated cron environment. It ensures data integrity, state consistency, and repository synchronization during manual ingestion cycles.

---

## 2. Execution Environment
Signal Hunter is designed for two primary environments:
- **Local Development:** Run manually on a workstation to test source parsing, selection logic, and schema normalization.
- **Production (DigitalOcean):** Run via OpenClaw on a cloud droplet for 24/7 cron-based operation and persistent signal collection.

---

## 3. Inputs
A valid manual run requires access to the following:
- **Source Registry:** `automation/ingestion-agents/source_registry.md`
- **Signal Schema:** `automation/ingestion-agents/signal_schema.md`
- **Dedupe Rules:** `automation/ingestion-agents/dedupe_rules.md`
- **State Files:** `automation/state/signal-hunter-last-run.json` and `seen-signals.json`
- **Repository Access:** Read/Write permissions for `signals/raw/`, `automation/state/`, and `automation/logs/`.
- **Network Access:** Stable HTTPS connectivity to the curated URLs defined in the Source Registry.

---

## 4. Expected Run Sequence
1.  **Sync:** Perform `git pull` to fetch the latest state and registry.
2.  **Initialize:** Load all configuration, schema, and persistent state files into memory.
3.  **Ingest:** Scan Priority (Tier 1) and Supporting (Tier 2) sources for candidate signals.
4.  **Filter:** Apply selection criteria and deduplication rules.
5.  **Normalize:** Generate structured Markdown files following the official schema.
6.  **Commit:** Write results to `signals/raw/`, update state files, and generate a run log.
7.  **Push:** Stage, commit, and push all changed artifacts to the repository.

---

## 5. Output Artifacts
A successful manual run may create or update the following:
- **Raw Signals:** New `.md` files in `signals/raw/`.
- **Run Stats:** Updated `automation/state/signal-hunter-last-run.json`.
- **Seen History:** Appended entries in `automation/state/signal-hunter-seen-signals.json`.
- **Run Log:** A new markdown log in `automation/logs/signal-hunter/`.

---

## 6. Success Criteria
A run is considered **Successful** only if:
- At least one valid source was successfully scanned.
- All newly created signals strictly follow the `signal_schema.md`.
- `last-run.json` accurately reflects the counts of created vs. skipped signals.
- All local changes are successfully pushed to the remote repository.

---

## 7. Failure Conditions
A run is considered **Failed** or **Partial** if:
- Any file in `signals/raw/` contains malformed YAML frontmatter.
- The `git push` command fails due to merge conflicts or permission issues.
- State files become corrupted or unreadable after the run.
- Critical errors are logged without successful processing of any Tier 1 sources.

---

## 8. Git Behavior
After a successful run, Signal Hunter must:
1.  Stage all new files in `signals/raw/`.
2.  Stage the updated `automation/state/` JSON files.
3.  Stage the new run log in `automation/logs/signal-hunter/`.
4.  Commit with a standard prefix: `feat(ingestion):` or `chore(state):`.
5.  Push immediately to the main branch.

---

## 9. Pre-Cron Validation Checklist
Before moving from manual execution to a server-side cron job, confirm:
- [ ] **Schema Compliance:** 100% of signals pass a frontmatter validation check.
- [ ] **State Persistence:** `seen-signals.json` is correctly preventing duplicates across multiple manual runs.
- [ ] **Error Resilience:** The agent handles 404/500 source errors without crashing.
- [ ] **Log Clarity:** Run logs provide enough detail to diagnose a skipped signal.
- [ ] **Security:** API keys or credentials (if added) are stored in an `.env` or system secret, not the repo.
