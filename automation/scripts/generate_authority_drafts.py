#!/usr/bin/env python3
import os
import sys
import json
import requests
import time
from datetime import datetime
import run_logger

# ==============================================================================
# Script: generate_authority_drafts.py
# Purpose: Convert strategic insights into LinkedIn authority content drafts
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
INSIGHTS_DIR = os.path.join(REPO_ROOT, "signals/insights")
DRAFTS_DIR = os.path.join(REPO_ROOT, "content/drafts")
STATE_FILE = os.path.join(REPO_ROOT, "automation/state/generated-drafts.json")

# Model Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_ID = os.getenv("CONTENT_GEN_MODEL", "google/gemini-3.1-flash-lite-preview")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Ensure output directory exists
os.makedirs(DRAFTS_DIR, exist_ok=True)

def load_generated_ids():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return set(data.get("generated_draft_ids", []))
        except (json.JSONDecodeError, IOError):
            return set()
    return set()

def save_generated_ids(generated_ids):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump({"generated_draft_ids": list(generated_ids)}, f, indent=2)

def generate_draft_content(insight_artifact):
    insight = insight_artifact.get("insight", {})
    source = insight_artifact.get("source", {})
    insight_context = json.dumps({"title": source.get("title"), "summary": insight.get("summary"), "why_it_matters": insight.get("why_it_matters")}, indent=2)
    
    prompt = """
    Generate a high-authority LinkedIn post draft based on the provided strategic insight.
    REQUIRED JSON KEYS:
    - strategy: {angle, format, audience, tone}
    - draft: {hook, body, closing, cta, full_text}
    Produce VALID JSON ONLY.
    """

    try:
        headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
        payload = {"model": MODEL_ID, "messages": [{"role": "system", "content": (
                    "You are an elite LinkedIn ghostwriter and B2B content strategist with deep expertise in AI, enterprise technology, "
                    "industrial automation, and the Houston regional business landscape. You write for founders, executives, and operators "
                    "who want to be recognized as authoritative voices in their industry — not just content creators.\n\n"
                    "Your posts do NOT sound like marketing copy. They sound like insider perspective from someone who has been in the room. "
                    "Every post you write must:\n"
                    "- Open with a hook that creates immediate tension, curiosity, or a bold claim — never a generic observation\n"
                    "- Deliver a clear, specific insight that the audience cannot easily find elsewhere\n"
                    "- Connect AI or technology shifts to real business consequences: revenue, risk, competitive advantage, or workforce change\n"
                    "- Speak to a professional B2B audience in Houston's core industries: energy, logistics, healthcare, manufacturing, aerospace\n"
                    "- Close with a CTA that provokes thought or invites engagement — not a hollow 'what do you think?'\n\n"
                    "Match tone to context: authoritative but not arrogant, direct but not cold, forward-thinking but grounded in reality. "
                    "Vary format intelligently — use short punchy paragraphs, numbered insights, or narrative depending on what best serves the content.\n\n"
                    "Output ONLY valid JSON. No preamble, no explanation, no markdown — raw JSON only."
                )}, {"role": "user", "content": f"{prompt}\n\nSTRATEGIC INSIGHT DATA:\n{insight_context}"}], "response_format": {"type": "json_object"}}
        
        response = requests.post(API_URL, headers=headers, json=payload, timeout=45)
        response.raise_for_status()
        content = response.json()['choices'][0]['message']['content']
        return json.loads(content)
    except Exception as e:
        run_logger.add_error(f"Content generation failed: {str(e)}")
        return None

def process_insights():
    print("--- [Inference Running] Content Generation Layer ---")
    if not OPENROUTER_API_KEY:
        run_logger.add_error("OPENROUTER_API_KEY not set — draft generation skipped.")
        run_logger.complete_run()
        print("ERROR: OPENROUTER_API_KEY not set.")
        return 0

    generated_ids = load_generated_ids()
    insight_files = [f for f in os.listdir(INSIGHTS_DIR) if f.endswith(".json")]
    
    if not insight_files:
        print("No insights found. Skipping content generation.")
        return 0

    eligible_count = 0
    generated_count = 0
    skipped_count = 0
    
    # Configurable limits
    MAX_PER_RUN = int(os.getenv("MAX_DRAFTS_PER_RUN", 1))
    MIN_CONFIDENCE = float(os.getenv("MIN_INSIGHT_CONFIDENCE_FOR_DRAFTS", 0.70))

    for filename in insight_files:
        if generated_count >= MAX_PER_RUN:
            break
            
        filepath = os.path.join(INSIGHTS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            artifact = json.load(f)
            
        try:
            insight_id = artifact.get("id")
            status = artifact.get("status", {})
            insight_data = artifact.get("insight", {})
            
            if insight_id in generated_ids or status.get("used_for_content"):
                continue
            
            raw_conf = insight_data.get("confidence", 0)
            try:
                confidence = float(raw_conf)
            except (ValueError, TypeError):
                # Handle string-based confidence found in some model outputs
                if isinstance(raw_conf, str) and "high" in raw_conf.lower(): confidence = 0.95
                else: confidence = 0.85

            if confidence < MIN_CONFIDENCE:
                continue

            eligible_count += 1
            print(f"  Generating draft for insight: {insight_id}")

            content_result = generate_draft_content(artifact)
            
            if not content_result:
                skipped_count += 1
                continue

            draft_id = f"draft-{insight_id}"
            draft_artifact = {
                "id": draft_id,
                "created_at": datetime.utcnow().isoformat() + "Z",
                "source_insight_path": f"signals/insights/{filename}",
                "source_signal_id": insight_id,
                "content_type": "linkedin_post",
                "strategy": content_result.get("strategy"),
                "draft": content_result.get("draft"),
                "editorial": {"status": "draft", "used_for_publishing": False, "needs_review": True}
            }
            
            with open(os.path.join(DRAFTS_DIR, f"{draft_id}.json"), 'w', encoding='utf-8') as f:
                json.dump(draft_artifact, f, indent=2)
            
            # Update source insight
            artifact["status"]["used_for_content"] = True
            artifact["status"]["content_asset_ids"].append(draft_id)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(artifact, f, indent=2)
            
            generated_ids.add(insight_id)
            generated_count += 1
            time.sleep(1)
            
        except Exception as e:
            run_logger.add_error(f"Draft Generation Error ({filename}): {str(e)}")

    save_generated_ids(generated_ids)
    run_logger.update_summary("drafts", {
        "eligible_insights": eligible_count,
        "generated_count": generated_count,
        "skipped_count": skipped_count
    })
    
    print(f"Content Generation complete. Eligible: {eligible_count}, Generated: {generated_count}, Skipped: {skipped_count}")
    
    # Finalize Runlogger
    run_logger.complete_run()
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_insights())
    except Exception as e:
        run_logger.add_error(f"Critical Generation Error: {str(e)}")
        sys.exit(1)
