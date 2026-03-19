#!/usr/bin/env python3
import os
import sys
import json
import requests
import time
from datetime import datetime
import run_logger

# ==============================================================================
# Script: humanize_authority_drafts.py
# Purpose: Rewrite AI-sounding drafts into more natural, humanized content.
# Phase: Phase 7.0 - Humanization Layer
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DRAFTS_DIR = os.path.join(REPO_ROOT, "content/drafts")
FINAL_DIR = os.path.join(REPO_ROOT, "content/final")
STATE_FILE = os.path.join(REPO_ROOT, "automation/state/humanized-drafts.json")
HUMANIZER_SKILL = os.path.join(REPO_ROOT, ".claude/skills/humanizer.md")

# Model Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_ID = os.getenv("HUMANIZER_MODEL", "google/gemini-2.0-flash-001")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Ensure output directory exists
os.makedirs(FINAL_DIR, exist_ok=True)

def load_processed_ids():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return set(data.get("processed_draft_ids", []))
        except (json.JSONDecodeError, IOError):
            return set()
    return set()

def save_processed_ids(processed_ids):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump({"processed_draft_ids": list(processed_ids)}, f, indent=2)

def load_humanizer_guidance():
    if os.path.exists(HUMANIZER_SKILL):
        with open(HUMANIZER_SKILL, 'r', encoding='utf-8') as f:
            return f.read()
    return "Rewrite the text to sound more natural and less like an AI. Avoid hype and repetitive patterns."

def call_model_for_humanization(prompt, original_text, retry_json=False):
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not found in environment.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": "You are a professional editor. Your goal is to humanize AI-generated text, making it sound more natural, rhythmical, and credible. Output ONLY valid JSON."
            },
            {
                "role": "user",
                "content": f"{prompt}\n\nORIGINAL DRAFT:\n{original_text}"
            }
        ],
        "response_format": { "type": "json_object" }
    }

    if retry_json:
        payload["messages"].append({"role": "user", "content": "Your previous output was not valid JSON. Please return ONLY the JSON object with the requested keys."})

    response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    
    result = response.json()
    content = result['choices'][0]['message']['content']
    
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
        
    return json.loads(content)

def humanize_draft(draft_artifact, guidance):
    original_full_text = draft_artifact.get("draft", {}).get("full_text", "")
    
    prompt = f"""
    Using the following HUMANIZER GUIDANCE, rewrite the provided LinkedIn draft to sound like a real person—specifically a sharp, credible Houston-based AI operator.
    
    HUMANIZER GUIDANCE:
    {guidance[:2000]} # Limit to relevant length
    
    GOAL:
    - Vary sentence rhythm.
    - Remove AI vocab ('testament', 'pivotal', 'landscape', 'underscores').
    - Inject 'soul' and personality without becoming unprofessional.
    - Keep the strategic meaning 100% intact.
    
    REQUIRED JSON KEYS:
    - final:
        - hook: (The humanized opening)
        - body: (The humanized core analysis)
        - closing: (The humanized closing statement)
        - cta: (The humanized call to action)
        - full_text: (The complete copy-paste ready LinkedIn post)
    
    Produce VALID JSON ONLY.
    """

    try:
        result_raw = call_model_for_humanization(prompt, original_full_text)
        return result_raw
    except Exception as e:
        print(f"    [Warning] Humanize attempt failed: {str(e)}. Retrying...")
        try:
            result_raw = call_model_for_humanization(prompt, original_full_text, retry_json=True)
            return result_raw
        except Exception as retry_e:
            run_logger.add_error(f"Humanization Model Error: {str(retry_e)}")
            return None

def process_drafts():
    print("--- [Inference Running] Humanization Layer ---")
    if not OPENROUTER_API_KEY:
        print("ERROR: OPENROUTER_API_KEY not set.")
        return 0

    processed_ids = load_processed_ids()
    draft_files = [f for f in os.listdir(DRAFTS_DIR) if f.endswith(".json")]
    
    if not draft_files:
        print("No drafts found. Skipping humanization.")
        return 0

    humanizer_guidance = load_humanizer_guidance()
    processed_count = 0
    generated_count = 0
    skipped_count = 0
    
    MAX_PER_RUN = int(os.getenv("MAX_HUMANIZATION_PER_RUN", 2))

    for filename in draft_files:
        if generated_count >= MAX_PER_RUN:
            break
            
        filepath = os.path.join(DRAFTS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            draft_artifact = json.load(f)
            
        try:
            draft_id = draft_artifact.get("id")
            if draft_id in processed_ids:
                continue

            processed_count += 1
            print(f"  Humanizing draft: {draft_id}")

            humanized_result = humanize_draft(draft_artifact, humanizer_guidance)
            
            if not humanized_result:
                skipped_count += 1
                continue

            final_id = f"final-{draft_id.replace('draft-', '')}"
            final_artifact = {
                "id": final_id,
                "created_at": datetime.utcnow().isoformat() + "Z",
                "source_draft_path": f"content/drafts/{filename}",
                "source_draft_id": draft_id,
                "content_type": "linkedin_post",
                "original": {
                    "full_text": draft_artifact.get("draft", {}).get("full_text")
                },
                "final": humanized_result.get("final"),
                "editorial": {
                    "status": "ready_for_review",
                    "needs_review": True,
                    "used_for_publishing": False
                }
            }
            
            with open(os.path.join(FINAL_DIR, f"{final_id}.json"), 'w', encoding='utf-8') as f:
                json.dump(final_artifact, f, indent=2)
            
            processed_ids.add(draft_id)
            generated_count += 1
            time.sleep(1)
            
        except Exception as e:
            run_logger.add_error(f"Humanization Processing Error ({filename}): {str(e)}")

    save_processed_ids(processed_ids)
    
    # Update Run Summary (Adding Stage manually since it was hardening phase 6)
    summary = run_logger.load_summary()
    summary["humanization"] = {
        "eligible_drafts": processed_count,
        "generated_count": generated_count,
        "skipped_count": skipped_count
    }
    run_logger.save_summary(summary)
    
    print(f"Humanization complete. Processed: {processed_count}, Generated: {generated_count}, Skipped: {skipped_count}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_drafts())
    except Exception as e:
        run_logger.add_error(f"Critical Humanization Error: {str(e)}")
        sys.exit(1)
