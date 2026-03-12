import os
import json
from datetime import datetime

# ==============================================================================
# Helper: run_logger.py
# Purpose: Centralized run summary tracking for operational hardening
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SUMMARY_FILE = os.path.join(REPO_ROOT, "automation/logs/latest-run-summary.json")

def init_summary():
    summary = {
        "run_started_at": datetime.utcnow().isoformat() + "Z",
        "run_completed_at": None,
        "ingestion": {"raw_signals_found": 0, "new_signals_written": 0, "duplicates_skipped": 0},
        "scoring": {"signals_processed": 0, "publish_count": 0, "candidate_count": 0, "archive_count": 0, "ignore_count": 0},
        "insights": {"eligible_signals": 0, "generated_count": 0, "skipped_count": 0},
        "drafts": {"eligible_insights": 0, "generated_count": 0, "skipped_count": 0},
        "errors": {"count": 0, "items": []}
    }
    save_summary(summary)
    return summary

def load_summary():
    if os.path.exists(SUMMARY_FILE):
        with open(SUMMARY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return init_summary()

def save_summary(summary):
    os.makedirs(os.path.dirname(SUMMARY_FILE), exist_ok=True)
    with open(SUMMARY_FILE, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)

def update_summary(stage, updates):
    summary = load_summary()
    if stage in summary:
        summary[stage].update(updates)
    save_summary(summary)

def add_error(message):
    summary = load_summary()
    summary["errors"]["count"] += 1
    summary["errors"]["items"].append(f"[{datetime.utcnow().isoformat()}] {message}")
    save_summary(summary)

def complete_run():
    summary = load_summary()
    summary["run_completed_at"] = datetime.utcnow().isoformat() + "Z"
    save_summary(summary)
