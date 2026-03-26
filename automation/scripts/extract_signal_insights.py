#!/usr/bin/env python3
import os
import sys
import json
import yaml
import requests
import time
from datetime import datetime
import run_logger

# ==============================================================================
# Script: extract_signal_insights.py
# Purpose: Extract strategic insights from high-scoring signals using LLM
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SCORED_DIR = os.path.join(REPO_ROOT, "signals/scored")
INSIGHTS_DIR = os.path.join(REPO_ROOT, "signals/insights")
STATE_FILE = os.path.join(REPO_ROOT, "automation/state/signal-insights-processed.json")

# Model Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_ID = os.getenv("SIGNAL_INSIGHT_MODEL", "google/gemini-3.1-flash-lite-preview")
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
                "content": (
                    "You are a senior strategic intelligence analyst specializing in AI adoption trends, enterprise technology, "
                    "industrial automation, and the Houston regional economy. Your role is to process raw news signals and extract "
                    "high-value, actionable insights for operators, executives, and content strategists who track how AI is reshaping "
                    "logistics, energy, healthcare, and manufacturing sectors — with particular emphasis on Gulf Coast and Texas market dynamics.\n\n"
                    "When analyzing a signal, you must:\n"
                    "- Identify the core strategic implication, not just the surface-level news\n"
                    "- Connect it to real business consequences (cost, risk, competitive positioning, workforce impact)\n"
                    "- Flag regional relevance to Houston specifically — port operations, energy corridor, Texas Medical Center, aerospace, or petrochemical\n"
                    "- Suggest concrete content angles that would resonate with a professional B2B audience\n"
                    "- Assign confidence based on signal quality, source credibility, and how strongly the evidence supports your conclusions\n\n"
                    "Be precise. Be direct. Avoid vague generalities. Every field you produce should be immediately useful to a decision-maker.\n\n"
                    "Output ONLY valid JSON. No preamble, no explanation, no markdown — raw JSON only."
                )
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
    
    # DEBUG LOG
    # print(f"DEBUG: result type: {type(result)}")
    # print(f"DEBUG: choices type: {type(result.get('choices'))}")
    
    if not result or 'choices' not in result or not result['choices']:
        raise ValueError(f"Invalid API response: {json.dumps(result)}")

    content = result['choices'][0]['message']['content']
    
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
        
    # Parse JSON and handle list vs dict
    try:
        data = json.loads(content)
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        return data
    except Exception as e:
        raise ValueError(f"JSON Parse Error: {str(e)} | Content: {content[:100]}")

def validate_insight(insight):
    required = [
        "signal_type", "summary", "why_it_matters", 
        "business_implication", "regional_angle", 
        "content_angles", "recommended_angle", "confidence"
    ]
    # Normalize confidence to float 0.0-1.0
    conf = insight.get("confidence", 0.85)
    if isinstance(conf, str):
        if "high" in conf.lower(): conf = 0.95
        elif "med" in conf.lower(): conf = 0.75
        elif "low" in conf.lower(): conf = 0.40
        else: conf = 0.85
    insight["confidence"] = float(conf)
    
    return insight

def extract_insight_data(frontmatter, body):
    signal_context = f"Title: {frontmatter.get('title')}\nSource: {frontmatter.get('source_name')}\nBody: {body[:3000]}"
    
    prompt = """
    Extract a strategic insight artifact from the following signal. 
    Focus on enterprise adoption, industrial logistics, and Houston relevance.
    REQUIRED JSON KEYS:
    - signal_type, summary, why_it_matters, business_implication, regional_angle, content_angles, recommended_angle, confidence
    Produce VALID JSON ONLY.
    """

    try:
        insight_raw = call_model_for_insight(prompt, signal_context)
        return validate_insight(insight_raw)
    except Exception as e:
        print(f"    [Warning] First attempt failed: {str(e)}. Retrying with repair instruction...")
        try:
            insight_raw = call_model_for_insight(prompt, signal_context, retry_json=True)
            return validate_insight(insight_raw)
        except Exception as retry_e:
            run_logger.add_error(f"Insight Extraction Error: {str(retry_e)}")
            return None

def process_signals():
    print("--- [Inference Running] Extraction Layer ---")
    if not OPENROUTER_API_KEY:
        run_logger.add_error("OPENROUTER_API_KEY not set — insight extraction skipped.")
        print("ERROR: OPENROUTER_API_KEY not set.")
        return 0

    processed_ids = load_processed_ids()
    scored_files = [f for f in os.listdir(SCORED_DIR) if f.endswith(".md")]
    
    if not scored_files:
        print("No scored signals found. Skipping insights.")
        return 0

    eligible_count = 0
    generated_count = 0
    skipped_count = 0

    for filename in scored_files:
        filepath = os.path.join(SCORED_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        try:
            parts = content.split('---', 2)
            if len(parts) < 3: continue
            
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2]
            
            signal_id = frontmatter.get("id") or filename.replace(".md", "")
            
            if signal_id in processed_ids:
                continue

            tier = frontmatter.get("tier", "")
            final_score = frontmatter.get("final_score", 0)
            
            # Use Configurable Min Score
            MIN_SCORE = int(os.getenv("MIN_CANDIDATE_SCORE_FOR_INSIGHTS", 45))
            is_eligible = (tier == "publish") or (tier == "candidate" and final_score >= MIN_SCORE)
            
            if not is_eligible:
                continue

            eligible_count += 1
            print(f"  Generating insight for: {filename}")

            insight_content = extract_insight_data(frontmatter, body)
            
            if not insight_content:
                skipped_count += 1
                continue

            artifact = {
                "id": signal_id,
                "created_at": datetime.utcnow().isoformat() + "Z",
                "source_signal_path": f"signals/scored/{filename}",
                "source": { "publisher": frontmatter.get("source_name"), "title": frontmatter.get("title") },
                "scoring": { "final_score": final_score, "route": tier },
                "insight": insight_content,
                "status": { "used_for_content": False, "content_asset_ids": [] }
            }
            
            with open(os.path.join(INSIGHTS_DIR, f"insight-{signal_id}.json"), 'w', encoding='utf-8') as f:
                json.dump(artifact, f, indent=2)
            
            processed_ids.add(signal_id)
            generated_count += 1
            time.sleep(1)
            
        except Exception as e:
            run_logger.add_error(f"Insight Processing Error ({filename}): {str(e)}")

    save_processed_ids(processed_ids)
    run_logger.update_summary("insights", {
        "eligible_signals": eligible_count,
        "generated_count": generated_count,
        "skipped_count": skipped_count
    })
    
    print(f"Insights complete. Eligible: {eligible_count}, Generated: {generated_count}, Skipped: {skipped_count}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_signals())
    except Exception as e:
        run_logger.add_error(f"Critical Insights Error: {str(e)}")
        sys.exit(1)
