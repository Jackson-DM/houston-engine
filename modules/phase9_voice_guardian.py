#!/usr/bin/env python3
"""
Module: phase9_voice_guardian.py
Phase: Phase 9 — Entity Authority & Structured Data Layer
Purpose: Score every humanized draft against Leon Coe's voice profile before it
         enters the output queue. Flags or blocks drafts that drift from the voice.

Pipeline position:
    [Phase 8 humanize output] -> voice_guardian.py -> schema_generator.py -> [final payload]

Usage (pipeline):
    from modules.phase9_voice_guardian import check_voice
    payload = check_voice(payload)          # returns updated payload

Usage (standalone — score a single JSON payload file):
    python modules/phase9_voice_guardian.py content/final/final-<id>.json

Thresholds:
    90-100  auto-pass     — no action
    75-89   pass_flagged  — logged, flag appended to payload
    60-74   revise        — revision note appended to draft body
    < 60    block         — editorial status set to "held", alert logged
"""

import os
import sys
import json
import requests
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, ".."))

VOICE_PROFILE_PATH = os.path.join(REPO_ROOT, "config", "voice_profile.json")
BLOCKLIST_PATH = os.path.join(REPO_ROOT, "config", "voice_blocklist.txt")
VOICE_LOG_PATH = os.path.join(REPO_ROOT, "logs", "voice_guardian_log.md")

# OpenRouter / Claude config — mirrors the pattern used throughout this repo
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
VOICE_MODEL = os.getenv("VOICE_GUARDIAN_MODEL", "anthropic/claude-3.5-haiku")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Scoring thresholds
THRESHOLD_AUTO_PASS = 90
THRESHOLD_PASS_FLAGGED = 75
THRESHOLD_REVISE = 60  # below this → block


# ---------------------------------------------------------------------------
# Config loaders
# ---------------------------------------------------------------------------

def _load_voice_profile() -> dict:
    with open(VOICE_PROFILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_blocklist() -> list:
    """Return a list of forbidden phrases (lowercased, comments stripped)."""
    if not os.path.exists(BLOCKLIST_PATH):
        return []
    phrases = []
    with open(BLOCKLIST_PATH, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                phrases.append(stripped.lower())
    return phrases


# ---------------------------------------------------------------------------
# Local blocklist pre-scan (fast, no API call needed)
# ---------------------------------------------------------------------------

def _scan_blocklist(draft_text: str, blocklist: list) -> list:
    """Return list of forbidden phrases found in the draft."""
    lower = draft_text.lower()
    return [phrase for phrase in blocklist if phrase in lower]


# ---------------------------------------------------------------------------
# LLM scoring call
# ---------------------------------------------------------------------------

def _build_scoring_prompt(draft_text: str, voice_profile: dict, blocklist_hits: list) -> str:
    profile_summary = (
        f"Tone: {voice_profile.get('tone', {}).get('primary', '')}\n"
        f"Not: {', '.join(voice_profile.get('tone', {}).get('not', []))}\n"
        f"Sentence rhythm: {voice_profile.get('sentence_rhythm', {}).get('preferred', '')}\n"
        f"Avoid: {voice_profile.get('sentence_rhythm', {}).get('avoid', '')}\n"
        f"POV rule: {voice_profile.get('pov', {}).get('rule', '')}\n"
        f"Opening rule: {voice_profile.get('structure', {}).get('opening', '')}\n"
        f"Body rule: {voice_profile.get('structure', {}).get('body', '')}\n"
        f"Closing rule: {voice_profile.get('structure', {}).get('closing', '')}\n"
        f"Persona: {voice_profile.get('identity', {}).get('persona', '')}"
    )

    rubric = voice_profile.get("scoring_rubric", {
        "tone_alignment": 30,
        "sentence_rhythm": 20,
        "vocabulary_cleanliness": 25,
        "pov_clarity": 15,
        "structural_integrity": 10,
    })
    rubric_str = "\n".join(f"  - {k}: {v} pts" for k, v in rubric.items())

    blocklist_note = ""
    if blocklist_hits:
        blocklist_note = (
            f"\nNOTE: The following forbidden phrases were already detected in a pre-scan: "
            f"{', '.join(repr(p) for p in blocklist_hits)}. "
            f"These must be reflected in your flags and will reduce the vocabulary_cleanliness score."
        )

    return f"""You are a brand voice editor for Leon Coe, a Houston-based AI consultant and strategist.
Score the following draft against Leon's voice profile and return a JSON object.

LEON'S VOICE PROFILE:
{profile_summary}

SCORING RUBRIC (total = 100 pts):
{rubric_str}
{blocklist_note}

INSTRUCTIONS:
1. Score each rubric dimension and sum to a total voice_score (0-100).
2. List specific, actionable flags — quote the exact phrase or sentence causing the issue.
3. Set recommendation to exactly one of: "pass", "pass_flagged", "revise", "block"
   - "pass"         if score >= 90
   - "pass_flagged" if score 75-89
   - "revise"       if score 60-74
   - "block"        if score < 60
4. Be strict but fair. This is Leon's public voice — drift matters.

REQUIRED JSON OUTPUT (return ONLY valid JSON, no preamble):
{{
  "voice_score": <integer 0-100>,
  "dimension_scores": {{
    "tone_alignment": <int>,
    "sentence_rhythm": <int>,
    "vocabulary_cleanliness": <int>,
    "pov_clarity": <int>,
    "structural_integrity": <int>
  }},
  "flags": [<string>, ...],
  "recommendation": "pass" | "pass_flagged" | "revise" | "block",
  "revision_note": "<one-sentence guidance for the writer, or empty string if passing>"
}}

DRAFT TO SCORE:
---
{draft_text}
---"""


def _call_claude(prompt: str) -> dict:
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set — voice guardian cannot call LLM.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": VOICE_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a precise brand voice editor. "
                    "You return ONLY valid JSON — no markdown, no explanation, no preamble."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
    }

    response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    result = response.json()

    # Record token usage via budget_tracker if available
    usage = result.get("usage", {})
    try:
        sys.path.insert(0, os.path.join(REPO_ROOT, "automation", "scripts"))
        import budget_tracker
        budget_tracker.record_usage(
            VOICE_MODEL,
            usage.get("prompt_tokens", 0),
            usage.get("completion_tokens", 0),
        )
    except Exception:
        pass

    content = result["choices"][0]["message"]["content"]

    # Strip markdown fences if the model wraps anyway
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    return json.loads(content)


# ---------------------------------------------------------------------------
# Threshold enforcement
# ---------------------------------------------------------------------------

def _apply_threshold(payload: dict, score_result: dict) -> dict:
    """
    Mutate payload according to the score and threshold rules.
    Returns the updated payload.
    """
    score = score_result.get("voice_score", 0)
    recommendation = score_result.get("recommendation", "block")
    revision_note = score_result.get("revision_note", "")
    flags = score_result.get("flags", [])

    # Attach voice result to payload regardless of outcome
    payload["voice_result"] = score_result

    if score >= THRESHOLD_AUTO_PASS:
        # 90-100: auto-pass, no changes to editorial
        pass

    elif score >= THRESHOLD_PASS_FLAGGED:
        # 75-89: pass but log the flags
        if payload.get("editorial"):
            payload["editorial"].setdefault("voice_flags", [])
            payload["editorial"]["voice_flags"].extend(flags)

    elif score >= THRESHOLD_REVISE:
        # 60-74: soft-block — append revision note to draft body
        note_block = (
            f"\n\n---\n**[VOICE GUARDIAN — REVISION REQUIRED]**\n"
            f"Score: {score}/100\n"
            f"Note: {revision_note}\n"
            f"Flags: {'; '.join(flags) if flags else 'See voice_guardian_log.md'}\n---"
        )
        if payload.get("final") and isinstance(payload["final"], dict):
            body = payload["final"].get("body", "") or ""
            payload["final"]["body"] = body + note_block
            full = payload["final"].get("full_text", "") or ""
            payload["final"]["full_text"] = full + note_block
        if payload.get("editorial"):
            payload["editorial"]["voice_recommendation"] = "revise"

    else:
        # < 60: hard-block — hold the draft
        if payload.get("editorial"):
            payload["editorial"]["status"] = "held"
            payload["editorial"]["voice_recommendation"] = "block"
            payload["editorial"]["voice_hold_reason"] = (
                f"Voice score {score}/100 is below the 60-point threshold. "
                f"Revision required before release."
            )

    return payload


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def _log_result(payload: dict, score_result: dict) -> None:
    article_id = payload.get("id", "unknown")
    score = score_result.get("voice_score", 0)
    recommendation = score_result.get("recommendation", "unknown")
    flags = score_result.get("flags", [])
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    rec_emoji = {"pass": "[PASS]", "pass_flagged": "[PASS-FLAGGED]",
                 "revise": "[REVISE]", "block": "[BLOCK]"}.get(recommendation, "[?]")

    lines = [
        f"\n### {rec_emoji} `{article_id}` — Score: {score}/100 — {timestamp}\n",
        f"**Recommendation:** {recommendation}\n",
    ]
    if flags:
        lines.append("**Flags:**\n")
        for flag in flags:
            lines.append(f"- {flag}\n")
    revision_note = score_result.get("revision_note", "")
    if revision_note:
        lines.append(f"\n**Revision note:** {revision_note}\n")

    os.makedirs(os.path.dirname(VOICE_LOG_PATH), exist_ok=True)
    with open(VOICE_LOG_PATH, "a", encoding="utf-8") as f:
        f.writelines(lines)


# ---------------------------------------------------------------------------
# Core public function
# ---------------------------------------------------------------------------

def check_voice(payload: dict) -> dict:
    """
    Score the article payload's draft text against Leon's voice profile.
    Returns the updated payload with `voice_result` added and editorial
    status adjusted per threshold rules.

    Args:
        payload: Article payload dict (from humanize_authority_drafts output).

    Returns:
        Updated payload with voice_result, and editorial mutations applied.
    """
    # Extract draft text — prefer humanized final, fall back to original
    draft_text = ""
    if payload.get("final") and isinstance(payload["final"], dict):
        draft_text = payload["final"].get("full_text", "")
    if not draft_text and payload.get("original") and isinstance(payload["original"], dict):
        draft_text = payload["original"].get("full_text", "")
    if not draft_text:
        draft_text = payload.get("draft_text", "")

    if not draft_text:
        raise ValueError(f"No draft text found in payload '{payload.get('id', '?')}'")

    voice_profile = _load_voice_profile()
    blocklist = _load_blocklist()

    # Fast local scan first (free, instant)
    blocklist_hits = _scan_blocklist(draft_text, blocklist)

    # LLM scoring
    prompt = _build_scoring_prompt(draft_text, voice_profile, blocklist_hits)
    score_result = _call_claude(prompt)

    # Enforce thresholds
    payload = _apply_threshold(payload, score_result)

    # Log
    _log_result(payload, score_result)

    return payload


# ---------------------------------------------------------------------------
# Standalone CLI — process a single final payload JSON file
# ---------------------------------------------------------------------------

def _process_file(filepath: str) -> None:
    with open(filepath, "r", encoding="utf-8") as f:
        payload = json.load(f)

    updated = check_voice(payload)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)

    score = updated.get("voice_result", {}).get("voice_score", "?")
    rec = updated.get("voice_result", {}).get("recommendation", "?")
    print(f"[voice_guardian] {updated['id']} -> score: {score}/100 ({rec})")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python modules/phase9_voice_guardian.py <path/to/final-payload.json>")
        print("       Or pass 'all' to process all files in content/final/")
        sys.exit(1)

    target_arg = sys.argv[1]

    if target_arg == "all":
        final_dir = os.path.join(REPO_ROOT, "content", "final")
        files = [
            os.path.join(final_dir, f)
            for f in os.listdir(final_dir)
            if f.endswith(".json")
        ]
        if not files:
            print("No final payload files found.")
            sys.exit(0)
        for fp in files:
            try:
                _process_file(fp)
            except Exception as e:
                print(f"[voice_guardian] ERROR processing {fp}: {e}", file=sys.stderr)
    else:
        target = target_arg if os.path.isabs(target_arg) else os.path.join(REPO_ROOT, target_arg)
        _process_file(target)
