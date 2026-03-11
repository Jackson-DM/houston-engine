#!/usr/bin/env bash

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
INGESTION_LOG_DIR="$REPO_ROOT/automation/logs/signal-hunter"
RUNTIME_LOG_DIR="$REPO_ROOT/automation/logs/runtime"
RAW_SIGNALS_DIR="$REPO_ROOT/signals/raw"

# Required Files
LAST_RUN_JSON="$STATE_DIR/signal-hunter-last-run.json"
SEEN_SIGNALS_JSON="$STATE_DIR/signal-hunter-seen-signals.json"
INGEST_CMD="./commands/ingest-signals.sh"

# Create directories if they don't exist
mkdir -p "$RUNTIME_LOG_DIR"
mkdir -p "$INGESTION_LOG_DIR"
mkdir -p "$STATE_DIR"

# Individual execution log file (YYYYMMDD-HHMMSS)
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
RUN_LOG="$RUNTIME_LOG_DIR/run-$TIMESTAMP.log"

# Navigate to Repo Root
cd "$REPO_ROOT"

# --- Preflight Check ---
if [[ ! -x "$INGEST_CMD" ]]; then
    echo "ERROR: Ingestion command '$INGEST_CMD' not found or not executable. Aborting." | tee -a "$RUN_LOG"
    exit 1
fi

# --- Execute Ingestion ---
echo "[$(date)] Starting Signal Hunter ingestion..." | tee -a "$RUN_LOG"
$INGEST_CMD >> "$RUN_LOG" 2>&1

# --- Inspection & Validation ---
echo "[$(date)] Validating changes..." | tee -a "$RUN_LOG"

# Collect all changed/untracked file paths
CHANGED_FILES=$(git status --porcelain | awk '{print $NF}')

# Regex for allowed paths
ALLOWED_REGEX="^(signals/raw/|automation/state/signal-hunter-last-run\.json|automation/state/signal-hunter-seen-signals\.json|automation/logs/signal-hunter/|automation/logs/runtime/)"

# Abort on any unauthorized path
for FILE in $CHANGED_FILES; do
    if [[ ! "$FILE" =~ $ALLOWED_REGEX ]]; then
        echo "ERROR: Unauthorized file change detected: $FILE. Aborting." | tee -a "$RUN_LOG"
        exit 1
    fi
done

NEW_SIGNALS_COUNT=$(git status --porcelain signals/raw/ | grep -E "^(\?\?| A)" | wc -l || echo 0)
NEW_SIGNALS_COUNT=$(echo $NEW_SIGNALS_COUNT | xargs)

if [[ "$NEW_SIGNALS_COUNT" -gt 3 ]]; then
    echo "ERROR: Too many NEW raw signal files added ($NEW_SIGNALS_COUNT). Max is 3. Aborting." | tee -a "$RUN_LOG"
    exit 1
fi

# 2. State Validation
# - signal-hunter-last-run.json MUST change every run
if ! git status --porcelain "$LAST_RUN_JSON" | grep -q "M"; then
    echo "ERROR: $LAST_RUN_JSON was not updated. Aborting." | tee -a "$RUN_LOG"
    exit 1
fi

# - signal-hunter-seen-signals.json MUST change if new signals were added
if [[ "$NEW_SIGNALS_COUNT" -gt 0 ]]; then
    if ! git status --porcelain "$SEEN_SIGNALS_JSON" | grep -q "M"; then
        echo "ERROR: New signals were added but $SEEN_SIGNALS_JSON was not updated. Aborting." | tee -a "$RUN_LOG"
        exit 1
    fi
fi

# 3. Final log check
if [[ ! -f "$RUN_LOG" ]]; then
    echo "ERROR: Runtime log was not created. Aborting."
    exit 1
fi

# --- Clean Exit vs Commit ---
# Check if anything in allowed paths actually changed
STAGED_OR_MODIFIED=$(git status --porcelain signals/raw/ automation/state/ automation/logs/signal-hunter/)
if [[ -z "$STAGED_OR_MODIFIED" ]]; then
    echo "[$(date)] No valid ingestion changes detected. Exiting cleanly." | tee -a "$RUN_LOG"
    exit 0
fi

# --- Commit & Push ---
echo "[$(date)] Committing changes..." | tee -a "$RUN_LOG"

git add signals/raw/ \
        "$LAST_RUN_JSON" \
        "$SEEN_SIGNALS_JSON" \
        automation/logs/signal-hunter/

COMMIT_MSG="chore(signal-hunter): scheduled ingestion run $(date +'%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG" >> "$RUN_LOG" 2>&1
git push origin main >> "$RUN_LOG" 2>&1

# --- Summary Output ---
echo "--- Terminal Summary ---"
echo "Timestamp:      $(date +'%Y-%m-%d %H:%M:%S')"
echo "Raw Signals:    $NEW_SIGNALS_COUNT newly added"
echo "State Files:    Validated (last-run: changed, seen-signals: conditional)"
echo "Run Log:        Detected ($RUN_LOG)"
echo "Action:         Commit and Push successful"
echo "------------------------"
