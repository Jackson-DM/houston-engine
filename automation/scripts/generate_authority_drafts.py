#!/usr/bin/env python3
import os
import sys
import json
import requests
import time
from datetime import datetime

# ==============================================================================
# Script: generate_authority_drafts.py
# Purpose: Convert strategic insights into LinkedIn authority content drafts
# Phase: Phase 5.0 - Content Generation Layer
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
INSIGHTS_DIR = os.path.join(REPO_ROOT, "signals/insights")
DRAFTS_DIR = os.path.join(REPO_ROOT, "content/drafts")
STATE_FILE = os.path.join(REPO_ROOT, "automation/state/generated-drafts.json")

# Model Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_ID = os.getenv("CONTENT_GEN_MODEL", "google/gemini-2.0-flash-001")
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

def call_model_for_draft(prompt, insight_context, retry_json=False):
    """
    Modular HTTP client for LinkedIn content generation.
    """
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not found in environment.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/openclaw/houston-ai-authority-engine",
    }

    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": "You are an expert LinkedIn ghostwriter for AI executives. Your tone is sharp, credible, and operator-focused. Avoid hype, fluff, and excessive emojis."
            },
            {
                "role": "user",
                "content": f"{prompt}\n\nSTRATEGIC INSIGHT DATA:\n{insight_context}"
            }
        ],
        "response_format": { "type": "json_object" }
    }

    if retry_json:
        payload["messages"].append({"role": "user", "content": "Your previous output was not valid JSON. Please fix it and return ONLY the JSON object with the requested keys."})

    response = requests.post(API_URL, headers=headers, json=payload, timeout=45)
    response.raise_for_status()
    
    result = response.json()
    content = result['choices'][0]['message']['content']
    
    # Clean code blocks
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
        
    return json.loads(content)

def validate_draft(draft_json):
    """
    Ensures the model output contains required fields for the draft.
    """
    required = [
        "strategy", "draft"
    ]
    strategy_required = ["angle", "format", "audience", "tone"]
    draft_required = ["hook", "body", "closing", "cta", "full_text"]
    
    if not all(k in draft_json for k in required):
        raise ValueError("Missing top-level strategy or draft keys.")
        
    if not all(k in draft_json["strategy"] for k in strategy_required):
        raise ValueError("Missing required strategy fields.")

    if not all(k in draft_json["draft"] for k in draft_required):
        raise ValueError("Missing required draft fields.")
        
    return draft_json

def generate_draft_content(insight_artifact):
    """
    Real model-backed LinkedIn post generation.
    """
    insight = insight_artifact.get("insight", {})
    source = insight_artifact.get("source", {})
    
    insight_context = json.dumps({
        "title": source.get("title"),
        "summary": insight.get("summary"),
        "why_it_matters": insight.get("why_it_matters"),
        "business_implication": insight.get("business_implication"),
        "regional_angle": insight.get("regional_angle"),
        "recommended_angle": insight.get("recommended_angle")
    }, indent=2)
    
    prompt = """
    Generate a high-authority LinkedIn post draft based on the provided strategic insight.
    
    TONE & STYLE:
    - No generic 'AI is changing everything' hype.
    - Sharp, executive-level observation.
    - Focus on the practical 'so what' for business operators.
    - Mention Houston/regional impact only if explicitly supported by data.
    - Professional, credible, slightly provocative but grounded.
    
    REQUIRED JSON KEYS:
    - strategy:
        - angle: (The specific narrative angle used)
        - format: 'linkedin_post'
        - audience: 'AI Leads & Business Executives'
        - tone: (Description of the tone used)
    - draft:
        - hook: (One-sentence sharp opening)
        - body: (The core analysis, use line breaks for readability)
        - closing: (Summary statement)
        - cta: (Call to action / Question for engagement)
        - full_text: (Combine hook, body, closing, and cta into a single copy-paste ready string)
    
    Produce VALID JSON ONLY.
    """

    try:
        draft_raw = call_model_for_draft(prompt, insight_context)
        return validate_draft(draft_raw)
    except Exception as e:
        print(f"    [Warning] First attempt failed: {str(e)}. Retrying...")
        try:
            draft_raw = call_model_for_draft(prompt, insight_context, retry_json=True)
            return validate_draft(draft_raw)
        except Exception as retry_e:
            print(f"    [Error] Content generation failure: {str(retry_e)}")
            return None

def process_insights():
    if not OPENROUTER_API_KEY:
        print("ERROR: OPENROUTER_API_KEY not set.")
        return 1

    generated_ids = load_generated_ids()
    insight_files = [f for f in os.listdir(INSIGHTS_DIR) if f.endswith(".json")]
    
    draft_count = 0
    MAX_DRAFTS_PER_RUN = 3
    
    print(f"Generating drafts from {len(insight_files)} insight artifacts (Limit: {MAX_DRAFTS_PER_RUN})...")

    for filename in insight_files:
        if draft_count >= MAX_DRAFTS_PER_RUN:
            break
            
        filepath = os.path.join(INSIGHTS_DIR, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            artifact = json.load(f)
            
        try:
            insight_id = artifact.get("id")
            status = artifact.get("status", {})
            scoring = artifact.get("scoring", {})
            insight_data = artifact.get("insight", {})
            
            # Selection Rules
            if insight_id in generated_ids: continue
            if status.get("used_for_content"): continue
            
            route = scoring.get("route", "")
            confidence = insight_data.get("confidence", 0)
            
            is_eligible = (route == "publish" or (route == "candidate" and confidence >= 0.85)) and confidence >= 0.70
            
            if not is_eligible:
                continue

            print(f"  Generating LinkedIn draft for Insight: {insight_id}")

            # Model Call
            content_result = generate_draft_content(artifact)
            
            if not content_result:
                continue

            # Construct Draft Artifact
            draft_id = f"draft-{insight_id}"
            draft_artifact = {
                "id": draft_id,
                "created_at": datetime.utcnow().isoformat() + "Z",
                "source_insight_path": f"signals/insights/{filename}",
                "source_signal_id": insight_id,
                "content_type": "linkedin_post",
                "strategy": content_result["strategy"],
                "draft": content_result["draft"],
                "editorial": {
                    "status": "draft",
                    "used_for_publishing": False,
                    "needs_review": True
                }
            }
            
            # Write Draft
            output_path = os.path.join(DRAFTS_DIR, f"{draft_id}.json")
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(draft_artifact, f, indent=2)
            
            # Update Source Insight
            artifact["status"]["used_for_content"] = True
            artifact["status"]["content_asset_ids"].append(draft_id)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(artifact, f, indent=2)
            
            # Track State
            generated_ids.add(insight_id)
            draft_count += 1
            
            time.sleep(2) # Throttle
            
        except Exception as e:
            print(f"  Error processing {filename}: {str(e)}")

    save_generated_ids(generated_ids)
    print(f"\nGeneration Complete. Drafts created: {draft_count}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_insights())
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        sys.exit(1)
