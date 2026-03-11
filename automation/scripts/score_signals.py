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
    "enterprise_relevance": 20, # AI adoption / B2B impact
    "strategic_impact": 15,    # Disruption / Moat potential
    "regional_relevance": 20, # Houston / Energy / Logistics
    "content_potential": 15,   # Viral / Authority hook
    "momentum": 10              # Market urgency / Recency
}

def calculate_base_score(frontmatter, content):
    score = 0
    full_text = f"{frontmatter.get('source_name', '')} {content}".lower()
    
    # 1. Regional Relevance (Max 20)
    houston_keywords = ["houston", "energy", "oil", "gas", "refinery", "logistics", "shipping", "port", "exxon", "chevron", "shell"]
    if frontmatter.get("geo_relevance", "").lower() == "houston":
        score += 20
    elif any(kw in full_text for kw in houston_keywords):
        score += 15
    
    # 2. Enterprise Relevance (Max 20)
    enterprise_keywords = ["enterprise", "b2b", "infrastructure", "deployment", "reliability", "security", "governance", "nvidia", "sap", "microsoft", "salesforce"]
    if any(kw in full_text for kw in enterprise_keywords):
        score += 15
    if frontmatter.get("source_type") == "Company Blog":
        score += 5  # Primary source bonus
        
    # 3. Strategic Impact (Max 15)
    strategic_keywords = ["disrupt", "competit", "moat", "standard", "regulation", "breakthrough", "blackwell", "frontier"]
    if any(kw in full_text for kw in strategic_keywords):
        score += 10
    if frontmatter.get("priority_hint") == "high":
        score += 5
        
    # 4. Content Potential (Max 15)
    # Higher for news outlets and trends
    if frontmatter.get("source_type") == "News Outlet":
        score += 10
    if "launched" in full_text or "announced" in full_text:
        score += 5
        
    # 5. Momentum (Max 10)
    # Simplified recency check (placeholder for date math)
    score += 10 
    
    return min(score, 80)

def determine_tier(score):
    if score >= 60: return "publish"
    if score >= 40: return "candidate"
    if score >= 20: return "archive"
    return "ignore"

def process_signals():
    raw_files = [f for f in os.listdir(RAW_DIR) if f.endswith(".md")]
    processed_count = 0
    
    print(f"Scoring {len(raw_files)} raw signals...")

    for filename in raw_files:
        filepath = os.path.join(RAW_DIR, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Parse YAML
        try:
            parts = content.split('---', 2)
            if len(parts) < 3: continue
            
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2]
            
            # --- DETERMINISTIC SCORING ---
            base_score = calculate_base_score(frontmatter, body)
            
            # --- HYBRID METADATA (Future AI Hook) ---
            ai_adjustment = 0
            final_score = base_score + ai_adjustment
            tier = determine_tier(final_score)
            
            # Update Frontmatter
            frontmatter["base_score"] = base_score
            frontmatter["ai_adjustment"] = ai_adjustment
            frontmatter["final_score"] = final_score
            frontmatter["tier"] = tier
            frontmatter["confidence"] = frontmatter.get("confidence", 0.8)
            frontmatter["status"] = "triaged" if tier in ["publish", "candidate"] else "archived"
            
            # Rebuild File
            new_content = f"--- \n{yaml.dump(frontmatter)}---{body}"
            
            # Routing
            if tier in ["publish", "candidate"]:
                target_path = os.path.join(SCORED_DIR, filename)
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  Scored: {filename} -> {tier} ({final_score})")
            else:
                target_path = os.path.join(ARCHIVE_DIR, filename)
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  Archived: {filename} ({final_score})")
                
            # Optional: Remove from raw after scoring to keep input clean
            # os.remove(filepath)
            
            processed_count += 1
            
        except Exception as e:
            print(f"  Error processing {filename}: {str(e)}")

    print(f"Triaging complete. {processed_count} signals processed.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_signals())
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        sys.exit(1)
