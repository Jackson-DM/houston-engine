#!/usr/bin/env bash

# ==============================================================================
# Script: ingest-signals.sh
# Purpose: Robust Bash wrapper to trigger Signal Hunter ingestion via Python.
# ==============================================================================

# Strict Bash Mode
set -euo pipefail

# Resolve Repo Root Robustly
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Define Paths
INGEST_PY="$REPO_ROOT/automation/scripts/ingest_signal_hunter.py"

# Navigate to Repo Root
cd "$REPO_ROOT"

# Preflight: Ensure Python script exists
if [[ ! -f "$INGEST_PY" ]]; then
    echo "ERROR: Python ingestion script not found at '$INGEST_PY'."
    exit 1
fi

# Determine Python Executable (py, python3, or python)
PYTHON_CMD="py"
if ! command -v "$PYTHON_CMD" &> /dev/null; then
  PYTHON_CMD="python3"
  if ! command -v "$PYTHON_CMD" &> /dev/null; then
    PYTHON_CMD="python"
  fi
fi

# Execute Ingestion
echo "[$(date)] Launching Signal Hunter Ingestion Implementation..."
$PYTHON_CMD "$INGEST_PY"

echo "[$(date)] Ingestion wrapper exit code 0."
exit 0
