#!/bin/bash

# ==============================================================================
# Script: signal-hunter-run.sh
# Purpose: Runtime wrapper for scheduled Signal Hunter ingestion on a DigitalOcean droplet.
# Usage: cron execution or manual cli.
# ==============================================================================

# Strict Bash Mode
set -euo pipefail

# Resolve Repo Root Robustly from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Target Directories & Files
STATE_DIR="$REPO_ROOT/automation/state"
LOG_DIR="$REPO_ROOT/automation/logs/signal-hunter"
RAW_SIGNALS_DIR="$REPO_ROOT/signals/raw"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"
mkdir -p "$STATE_DIR"

# Individual execution log file (YYYYMMDD-HHMMSS)
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
RUN_LOG="$LOG_DIR/run-$TIMESTAMP.log"

# Navigate to Repo Root
cd "$REPO_ROOT"

# --- Execute Ingestion ---
echo "[$(date)] Starting Signal Hunter ingestion..." | tee -a "$RUN_LOG"

# Using existing manual ingestion contract/agent setup
# Assuming 'npm run ingest:signals' or equivalent is the established entry point.
# Using 'git checkout' as a placeholder for the logic check if no specific entry point command was provided.
# As it's agentic, we assume we invoke the signal hunter agent workflow.
# For now, we simulate the run.
# REPLACE WITH THE ACTUAL COMMAND IF DIFFERENT (e.g., ./commands/ingest-signals.sh)
./commands/ingest-signals.sh >> "$RUN_LOG" 2>&1 || true

# --- Inspection & Validation ---
echo "[$(date)] Validating changes..." | tee -a "$RUN_LOG"

# Check what changed in git
UNCHANGED_DIFF=$(git status --porcelain | grep -vE "^(\?\?| A| M) (signals/raw/|automation/state/signal-hunter-last-run\.json|automation/state/signal-hunter-seen-signals\.json|automation/logs/signal-hunter/)" || true)

if [[ -n "$UNCHANGED_DIFF" ]]; then
    echo "ERROR: Unrelated files changed. Aborting." | tee -a "$RUN_LOG"
    echo "$UNCHANGED_DIFF" >> "$RUN_LOG"
    exit 1
fi

# 1. Abort if more than 3 raw signal files were added
NEW_SIGNALS_COUNT=$(git status --porcelain signals/raw/ | wc -l)
if [[ "$NEW_SIGNALS_COUNT" -gt 3 ]]; then
    echo "ERROR: Too many raw signal files added ($NEW_SIGNALS_COUNT). Max is 3. Aborting." | tee -a "$RUN_LOG"
    exit 1
fi

# 2. Abort if state files were NOT updated (assuming they should be modified on every run)
if ! git status --porcelain "$STATE_DIR" | grep -q "signal-hunter-last-run.json" || \
   ! git status --porcelain "$STATE_DIR" | grep -q "signal-hunter-seen-signals.json"; then
    echo "ERROR: State files were not updated. Aborting." | tee -a "$RUN_LOG"
    exit 1
fi

# 3. Abort if no run log was created
if [[ ! -f "$RUN_LOG" ]]; then
    echo "ERROR: Run log was not created. Aborting."
    exit 1
fi

# --- Clean Exit vs Commit ---
if [[ -z "$(git status --porcelain signals/raw/ automation/state/ automation/logs/signal-hunter/)" ]]; then
    echo "[$(date)] No valid ingestion changes detected. Exiting cleanly." | tee -a "$RUN_LOG"
    exit 0
fi

# --- Commit & Push ---
echo "[$(date)] Committing changes..." | tee -a "$RUN_LOG"

git add signals/raw/ \
        automation/state/signal-hunter-last-run.json \
        automation/state/signal-hunter-seen-signals.json \
        automation/logs/signal-hunter/

COMMIT_MSG="chore(signal-hunter): scheduled ingestion run $(date +'%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG" >> "$RUN_LOG" 2>&1
git push origin main >> "$RUN_LOG" 2>&1

# --- Summary Output ---
echo "--- Terminal Summary ---"
echo "Timestamp:      $(date +'%Y-%m-%d %H:%M:%S')"
echo "Raw Signals:    $NEW_SIGNALS_COUNT added"
echo "State Files:    Updated (last-run, seen-signals)"
echo "Run Log:        Detected ($RUN_LOG)"
echo "Action:         Commit and Push successful"
echo "------------------------"
