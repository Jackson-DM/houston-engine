import os
import sys
import json
import yaml
import requests
import time
from datetime import datetime

# ==============================================================================
# Script: extract_signal_insights.py
# Purpose: Extract strategic insights from high-scoring signals using LLM
# Phase: Phase 4.2 - Model-Backed Insight Extraction
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SCORED_DIR = os.path.join(REPO_ROOT, "signals/scored")
INSIGHTS_DIR = os.path.join(REPO_ROOT, "signals/insights")
STATE_FILE = os.path.join(REPO_ROOT, "automation/state/signal-insights-processed.json")

# Model Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_ID = os.getenv("SIGNAL_INSIGHT_MODEL", "google/gemini-2.0-flash-001")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Ensure output directory exists
os.makedirs(INSIGHTS_DIR, exist_ok=True)

def load_processed_ids():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return set(data.get("processed_ids", []))
        except (json.JSONDecodeError, IOError):
            return set()
    return set()

def save_processed_ids(processed_ids):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump({"processed_ids": list(processed_ids)}, f, indent=2)

def call_model_for_insight(prompt, signal_context, retry_json=False):
    """
    Modular HTTP client for OpenRouter/LLM extraction.
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
                "content": "You are a strategic AI analyst for the Houston AI Club. Your goal is to extract high-signal insights from industry news. Output ONLY valid JSON."
            },
            {
                "role": "user",
                "content": f"{prompt}\n\nSIGNAL DATA:\n{signal_context}"
            }
        ],
        "response_format": { "type": "json_object" }
    }

    if retry_json:
        payload["messages"].append({"role": "user", "content": "Your previous output was not valid JSON. Please fix it and return ONLY the JSON object."})

    response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    
    result = response.json()
    content = result['choices'][0]['message']['content']
    
    # Strip markdown code blocks if present
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
        
    return json.loads(content)

def validate_insight(insight):
    """
    Ensures the model output contains required fields and normalizes types.
    """
    required = [
        "signal_type", "summary", "why_it_matters", 
        "business_implication", "regional_angle", 
        "content_angles", "recommended_angle", "confidence"
    ]
    for field in required:
        if field not in insight:
            insight[field] = "None" if field != "content_angles" else []
    
    # Ensure content_angles is a list
    if not isinstance(insight.get("content_angles"), list):
        insight["content_angles"] = [str(insight.get("content_angles", ""))]
        
    return insight

def extract_insight_data(frontmatter, body):
    """
    Real model-backed extraction flow.
    """
    signal_context = f"Title: {frontmatter.get('title')}\nSource: {frontmatter.get('source_name')}\nBody: {body[:3000]}"
    
    prompt = """
    Extract a strategic insight artifact from the following signal. 
    Focus on enterprise adoption, industrial logistics, and Houston relevance.
    Emphasize strategic interpretation over generic summarization.
    
    REQUIRED JSON KEYS:
    - signal_type: (e.g. 'Product Launch', 'Regulatory Shift', 'Partnership')
    - summary: (Concise 1-2 sentence overview)
    - why_it_matters: (The strategic 'so what' for AI leadership)
    - business_implication: (Practical impact on operations or competitive moats)
    - regional_angle: (Specific relevance to Houston energy, logistics, or manufacturing)
    - content_angles: (Array of 3 potential authority content topics)
    - recommended_angle: (The strongest angle from content_angles)
    - confidence: (Float 0.0 - 1.0)
    
    Produce VALID JSON ONLY. Do not fabricate facts.
    """

    try:
        # Attempt 1
        insight_raw = call_model_for_insight(prompt, signal_context)
        return validate_insight(insight_raw)
    except (json.JSONDecodeError, requests.exceptions.RequestException) as e:
        print(f"    [Warning] First attempt failed: {str(e)}. Retrying with repair instruction...")
        try:
            # Attempt 2 (Retry with repair)
            insight_raw = call_model_for_insight(prompt, signal_context, retry_json=True)
            return validate_insight(insight_raw)
        except Exception as retry_e:
            print(f"    [Error] Final extraction failure: {str(retry_e)}")
            return None

def process_signals():
    if not OPENROUTER_API_KEY:
        print("ERROR: OPENROUTER_API_KEY not set. Extraction cannot proceed.")
        return 1

    processed_ids = load_processed_ids()
    scored_files = [f for f in os.listdir(SCORED_DIR) if f.endswith(".md")]
    
    count = 0
    print(f"Extracting insights from {len(scored_files)} scored signals using {MODEL_ID}...")

    for filename in scored_files:
        filepath = os.path.join(SCORED_DIR, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        try:
            parts = content.split('---', 2)
            if len(parts) < 3: continue
            
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2]
            
            signal_id = frontmatter.get("id")
            if not signal_id:
                signal_id = filename.replace(".md", "")
            
            if signal_id in processed_ids:
                continue

            # Eligibility logic
            tier = frontmatter.get("tier", "")
            final_score = frontmatter.get("final_score", 0)
            is_eligible = (tier == "publish") or (tier == "candidate" and final_score >= 60)
            
            if not is_eligible:
                continue

            print(f"  Generating insight for: {filename} (Score: {final_score})")

            # Real Model Call
            insight_content = extract_insight_data(frontmatter, body)
            
            if not insight_content:
                print(f"  Skipping {filename} due to model failure.")
                continue

            # Construct Artifact
            artifact = {
                "id": signal_id,
                "created_at": datetime.utcnow().isoformat() + "Z",
                "source_signal_path": f"signals/scored/{filename}",
                "source": {
                    "publisher": frontmatter.get("source_name"),
                    "title": frontmatter.get("title"),
                    "url": frontmatter.get("url"),
                    "published_at": frontmatter.get("published_at")
                },
                "scoring": {
                    "base_score": frontmatter.get("base_score"),
                    "ai_adjustment": frontmatter.get("ai_adjustment"),
                    "merged_score": final_score, # Legacy/Matching schema
                    "final_score": final_score,
                    "route": tier
                },
                "insight": insight_content,
                "status": {
                    "used_for_content": False,
                    "content_asset_ids": []
                }
            }
            
            # Write Artifact
            output_filename = f"insight-{signal_id}.json"
            output_path = os.path.join(INSIGHTS_DIR, output_filename)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(artifact, f, indent=2)
            
            processed_ids.add(signal_id)
            count += 1
            
            # Rate limiting / Courtesy pause
            time.sleep(1)
            
        except Exception as e:
            print(f"  Error extracting insight from {filename}: {str(e)}")

    save_processed_ids(processed_ids)
    print(f"\nExtraction Complete. Insights generated: {count}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_signals())
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        sys.exit(1)
