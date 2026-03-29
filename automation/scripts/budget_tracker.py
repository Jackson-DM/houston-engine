#!/usr/bin/env python3
import os
import json
from datetime import datetime

# ==============================================================================
# Helper: budget_tracker.py
# Purpose: Track OpenRouter API spend against monthly budget cap
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
STATE_FILE = os.path.join(REPO_ROOT, "automation/state/budget-tracker.json")

BUDGET_USD = 20.00
ALERT_THRESHOLD = 0.80  # 80% = $16.00

MODEL_PRICING = {
    "google/gemini-3.1-flash-lite-preview": {
        "input": 0.075 / 1_000_000,
        "output": 0.30 / 1_000_000,
    },
    "DEFAULT": {
        "input": 0.50 / 1_000_000,
        "output": 0.50 / 1_000_000,
    },
}

def _empty_state():
    return {
        "month": datetime.utcnow().strftime("%Y-%m"),
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "estimated_spend_usd": 0.00,
        "run_count": 0,
        "last_updated": "",
    }

def _load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return _empty_state()

def _save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2)

def estimate_cost(model_id, input_tokens, output_tokens):
    """Return estimated USD cost for the given token counts and model."""
    pricing = MODEL_PRICING.get(model_id, MODEL_PRICING["DEFAULT"])
    return (input_tokens * pricing["input"]) + (output_tokens * pricing["output"])

def check_threshold():
    """Return a warning dict if spend >= 80% of budget, else None."""
    state = _load_state()
    spend = state.get("estimated_spend_usd", 0.00)
    alert_level = BUDGET_USD * ALERT_THRESHOLD
    if spend >= alert_level:
        pct_used = round((spend / BUDGET_USD) * 100, 1)
        return {
            "message": f"Monthly API spend ${spend:.4f} has reached {pct_used}% of ${BUDGET_USD:.2f} budget",
            "current_spend": round(spend, 4),
            "budget": BUDGET_USD,
            "pct_used": pct_used,
        }
    return None

def record_usage(model_id, input_tokens, output_tokens):
    """
    Accumulate token usage and estimated cost in the state file.
    Resets counters when the calendar month rolls over.
    Injects a budget_warning into the run summary if threshold is hit.
    """
    state = _load_state()
    current_month = datetime.utcnow().strftime("%Y-%m")

    # Monthly reset
    if state.get("month") != current_month:
        state = _empty_state()
        state["month"] = current_month

    state["total_input_tokens"] += input_tokens
    state["total_output_tokens"] += output_tokens
    state["estimated_spend_usd"] += estimate_cost(model_id, input_tokens, output_tokens)
    state["run_count"] += 1
    state["last_updated"] = datetime.utcnow().isoformat() + "Z"

    _save_state(state)

    # Inject warning into run summary if threshold crossed
    warning = check_threshold()
    if warning:
        try:
            import run_logger
            summary = run_logger.load_summary()
            summary["budget_warning"] = warning
            run_logger.save_summary(summary)
        except Exception:
            pass
