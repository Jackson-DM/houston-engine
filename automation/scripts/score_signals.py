#!/usr/bin/env python3
import os
import re
import yaml
import json
import sys
import shutil
from datetime import datetime

# ==============================================================================
# Script: score_signals.py
# Purpose: Hybrid-ready deterministic scoring layer for Houston AI Authority Engine.
# Logic: Evaluates raw signals against weighted business and regional factors.
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RAW_DIR = os.path.join(REPO_ROOT, "signals/raw")
SCORED_DIR = os.path.join(REPO_ROOT, "signals/scored")
ARCHIVE_DIR = os.path.join(REPO_ROOT, "signals/archive")

# Ensure directories exist
for d in [SCORED_DIR, ARCHIVE_DIR]:
    os.makedirs(d, exist_ok=True)

# --- Scoring Constants (Total Max Base Score: 80) ---
WEIGHTS = {
    "enterprise_relevance": 25, 
    "strategic_impact": 20,    
    "regional_relevance": 20, 
    "content_potential": 10,   
    "momentum": 5              
}

def calculate_base_score(frontmatter, content):
    score = 0
    full_text = f"{frontmatter.get('collected_at', '')} {frontmatter.get('source_name', '')} {content}".lower()
    
    # 1. Regional / Industrial Relevance (Max 20)
    # Be more selective: Signal must explicitly hit industrial or regional keywords
    houston_keywords = ["houston", "exxon", "chevron", "shell", "refinery", "port of houston", "napa"]
    industrial_keywords = ["energy", "oil", "gas", "logistics", "shipping", "manufacturing", "supply chain", "industrial", "infrastructure"]
    
    if frontmatter.get("geo_relevance", "").lower() == "houston":
        score += 20
    elif any(kw in full_text for kw in houston_keywords):
        score += 15
    elif any(kw in full_text for kw in industrial_keywords):
        score += 8 # Reduced for general industrial to favor regional
    
    # 2. Enterprise Relevance & Source Authority (Max 25)
    enterprise_keywords = ["enterprise", "b2b", "governance", "reliability", "architecture", "deployment", "security"]
    if any(kw in full_text for kw in enterprise_keywords):
        score += 12
    
    # HIGH-SIGNAL SOURCE BONUS
    source_name = frontmatter.get("source_name", "")
    if frontmatter.get("source_type") == "Company Blog" and any(s in source_name for s in ["NVIDIA", "OpenAI", "Anthropic"]):
        score += 13 # Tier 1 Primary
    elif frontmatter.get("source_type") == "Company Blog":
        score += 5
        
    # 3. Strategic Impact (Max 20)
    strategic_keywords = ["blackwell", "frontier", "moat", "regulation", "breakthrough", "standard", "nexus", "agent", "swarm", "automation"]
    if any(kw in full_text for kw in strategic_keywords):
        score += 15
    if frontmatter.get("priority_hint") == "high":
        score += 5
        
    # 4. Content Potential (Max 10)
    # News outlets only get points here, and only for strong signals
    if frontmatter.get("source_type") == "News Outlet" and any(kw in full_text for kw in ["exclusive", "reveal", "partnership", "invest"]):
        score += 8
    elif "announced" in full_text or "launched" in full_text:
        score += 2
        
    # 5. Momentum (Max 5)
    score += 5 
    
    return min(score, 80)

def determine_tier(score):
    if score >= 68: return "publish"
    if score >= 45: return "candidate"
    if score >= 25: return "archive"
    return "ignore"

def process_signals():
    raw_files = [f for f in os.listdir(RAW_DIR) if f.endswith(".md")]
    processed_count = 0
    scored_count = 0
    archived_count = 0
    
    print(f"Scoring {len(raw_files)} raw signals...")

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
            ai_adjustment = 0
            final_score = base_score + ai_adjustment
            tier = determine_tier(final_score)
            
            frontmatter["base_score"] = base_score
            frontmatter["ai_adjustment"] = ai_adjustment
            frontmatter["final_score"] = final_score
            frontmatter["tier"] = tier
            frontmatter["status"] = "triaged" if tier in ["publish", "candidate"] else "archived"
            
            new_content = f"--- \n{yaml.dump(frontmatter)}---{body}"
            
            if tier in ["publish", "candidate"]:
                target_path = os.path.join(SCORED_DIR, filename)
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  Scored: [{final_score}] {tier.upper()} - {filename}")
                scored_count += 1
            else:
                target_path = os.path.join(ARCHIVE_DIR, filename)
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  Archived: [{final_score}] - {filename}")
                archived_count += 1
                
            processed_count += 1
            
        except Exception as e:
            print(f"  Error processing {filename}: {str(e)}")

    print(f"\nTriage Complete:")
    print(f"  Processed: {processed_count}")
    print(f"  Scored (Publish/Candidate): {scored_count}")
    print(f"  Archived: {archived_count}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_signals())
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        sys.exit(1)
