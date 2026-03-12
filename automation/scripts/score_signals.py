#!/usr/bin/env python3
import os
import yaml
import json
import sys
from datetime import datetime
import run_logger

# ==============================================================================
# Script: score_signals.py
# Purpose: Bounded Hybrid Scoring (Deterministic + AI Adjustment)
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RAW_DIR = os.path.join(REPO_ROOT, "signals/raw")
SCORED_DIR = os.path.join(REPO_ROOT, "signals/scored")
ARCHIVE_DIR = os.path.join(REPO_ROOT, "signals/archive")

# Ensure directories exist
for d in [SCORED_DIR, ARCHIVE_DIR]:
    os.makedirs(d, exist_ok=True)

def calculate_base_score(frontmatter, content):
    score = 0
    full_text = f"{frontmatter.get('source_name', '')} {content}".lower()
    
    # Simple scoring logic
    houston_keywords = ["houston", "exxon", "chevron", "shell", "refinery", "port of houston", "napa"]
    if any(kw in full_text for kw in houston_keywords): score += 20
    
    strategic_keywords = ["agent", "swarm", "automation", "enterprise"]
    if any(kw in full_text for kw in strategic_keywords): score += 15
    
    return min(score, 80)

def determine_tier(score):
    if score >= 68: return "publish"
    if score >= 45: return "candidate"
    if score >= 25: return "archive"
    return "ignore"

def process_signals():
    print("--- [Inference Running] Scoring Layer ---")
    raw_files = [f for f in os.listdir(RAW_DIR) if f.endswith(".md")]
    
    if not raw_files:
        print("No raw signals found. Skipping scoring.")
        return 0

    results = {"signals_processed": 0, "publish_count": 0, "candidate_count": 0, "archive_count": 0, "ignore_count": 0}
    
    for filename in raw_files:
        filepath = os.path.join(RAW_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        try:
            parts = content.split('---', 2)
            if len(parts) < 3: continue
            
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2]
            
            base_score = calculate_base_score(frontmatter, body)
            tier = determine_tier(base_score)
            
            frontmatter.update({"base_score": base_score, "ai_adjustment": 0, "final_score": base_score, "tier": tier, "status": "triaged"})
            
            # Rebuild and move
            new_content = f"--- \n{yaml.dump(frontmatter)}---{body}"
            target_path = os.path.join(SCORED_DIR if tier in ["publish", "candidate"] else ARCHIVE_DIR, filename)
            
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            os.remove(filepath)
            
            results["signals_processed"] += 1
            results[f"{tier}_count"] += 1
            
        except Exception as e:
            run_logger.add_error(f"Scoring Error ({filename}): {str(e)}")

    run_logger.update_summary("scoring", results)
    print(f"Scoring complete. Processed: {results['signals_processed']}, Publish: {results['publish_count']}, Candidate: {results['candidate_count']}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_signals())
    except Exception as e:
        run_logger.add_error(f"Critical Scoring Error: {str(e)}")
        sys.exit(1)
