#!/usr/bin/env python3
import os
import re
import yaml
import json
import sys
from datetime import datetime

# ==============================================================================
# Script: score_signals.py
# Purpose: Bounded Hybrid Scoring (Deterministic + AI Adjustment)
# Logic: Base score (deterministic) -> AI Adjustment (bounded -8 to +12)
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RAW_DIR = os.path.join(REPO_ROOT, "signals/raw")
SCORED_DIR = os.path.join(REPO_ROOT, "signals/scored")
ARCHIVE_DIR = os.path.join(REPO_ROOT, "signals/archive")

# Ensure directories exist
for d in [SCORED_DIR, ARCHIVE_DIR]:
    os.makedirs(d, exist_ok=True)

# --- Scoring Constants ---
WEIGHTS = {
    "enterprise_relevance": 25, 
    "strategic_impact": 20,    
    "regional_relevance": 20, 
    "content_potential": 10,   
    "momentum": 5              
}

def calculate_base_score(frontmatter, content):
    score = 0
    full_text = f"{frontmatter.get('source_name', '')} {content}".lower()
    
    # 1. Regional / Industrial Relevance (Max 20)
    houston_keywords = ["houston", "exxon", "chevron", "shell", "refinery", "port of houston", "napa"]
    industrial_keywords = ["energy", "oil", "gas", "logistics", "shipping", "manufacturing", "supply chain", "industrial", "infrastructure"]
    
    if frontmatter.get("geo_relevance", "").lower() == "houston":
        score += 20
    elif any(kw in full_text for kw in houston_keywords):
        score += 15
    elif any(kw in full_text for kw in industrial_keywords):
        score += 8
    
    # 2. Enterprise Relevance & Source Authority (Max 25)
    enterprise_keywords = ["enterprise", "b2b", "governance", "reliability", "architecture", "deployment", "security"]
    if any(kw in full_text for kw in enterprise_keywords):
        score += 12
    
    source_name = frontmatter.get("source_name", "")
    if frontmatter.get("source_type") == "Company Blog" and any(s in source_name for s in ["NVIDIA", "OpenAI", "Anthropic"]):
        score += 13
    elif frontmatter.get("source_type") == "Company Blog":
        score += 5
        
    # 3. Strategic Impact (Max 20)
    strategic_keywords = ["blackwell", "frontier", "moat", "regulation", "breakthrough", "standard", "nexus", "agent", "swarm", "automation"]
    if any(kw in full_text for kw in strategic_keywords):
        score += 15
    if frontmatter.get("priority_hint") == "high":
        score += 5
        
    # 4. Content Potential (Max 10)
    if frontmatter.get("source_type") == "News Outlet" and any(kw in full_text for kw in ["exclusive", "reveal", "partnership", "invest"]):
        score += 8
    elif "announced" in full_text or "launched" in full_text:
        score += 2
        
    # 5. Momentum (Max 5)
    score += 5 
    
    return min(score, 80)

def get_ai_adjustment(frontmatter, body):
    """
    Simulated AI Adjustment Hook.
    In a real implementation, this would involve a structured call to a model
    (e.g., via OpenClaw sessions_spawn or a direct API client).
    """
    # BOUNDS: -8 to +12
    # For this first executable version, we simulate the 'AI Opinion' 
    # based on specific high-value high-nuance triggers.
    
    adjustment = 0
    reasoning = "AI adjustment bypassed (score too low or no strong nuance detected)."

    # Example specialized logic that deterministic regex might miss
    if "agent" in body.lower() and "enterprise" in body.lower():
        adjustment = 8
        reasoning = "Strong alignment with Agentic Enterprise thesis; boosted for strategic priority."
    
    if "open-source" in body.lower() or "nous" in body.lower():
        adjustment = 5
        reasoning = "High-value open-weights/community signal detected; relevant for self-hosted authority."

    if "price" in body.lower() or "cost" in body.lower():
        adjustment = -4
        reasoning = "Signal focused on pricing/costs rather than strategic/technical breakthrough."

    # Clamp the adjustment within the safe bounds
    adjustment = max(-8, min(12, adjustment))
    
    return adjustment, reasoning

def determine_tier(score):
    if score >= 68: return "publish"
    if score >= 45: return "candidate"
    if score >= 25: return "archive"
    return "ignore"

def process_signals():
    raw_files = [f for f in os.listdir(RAW_DIR) if f.endswith(".md")]
    processed_count = 0
    
    print(f"Hybrid Scoring {len(raw_files)} raw signals...")

    for filename in raw_files:
        filepath = os.path.join(RAW_DIR, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        try:
            parts = content.split('---', 2)
            if len(parts) < 3: continue
            
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2]
            
            # --- 1. DETERMINISTIC BASE SCORE ---
            base_score = calculate_base_score(frontmatter, body)
            
            # --- 2. BOUNDED AI ADJUSTMENT (Only for signals >= 40) ---
            ai_adjustment = 0
            ai_reasoning = "Base score too low for AI evaluation."
            
            if base_score >= 40:
                try:
                    ai_adjustment, ai_reasoning = get_ai_adjustment(frontmatter, body)
                except Exception as e:
                    ai_adjustment = 0
                    ai_reasoning = f"AI Adjustment failed: {str(e)}"
            
            # --- 3. FINAL CALCULATION ---
            final_score = base_score + ai_adjustment
            tier = determine_tier(final_score)
            
            # Update Frontmatter
            frontmatter["base_score"] = base_score
            frontmatter["ai_adjustment"] = ai_adjustment
            frontmatter["ai_reasoning"] = ai_reasoning
            frontmatter["final_score"] = final_score
            frontmatter["tier"] = tier
            frontmatter["status"] = "triaged" if tier in ["publish", "candidate"] else "archived"
            
            # Rebuild File
            new_content = f"--- \n{yaml.dump(frontmatter)}---{body}"
            
            # Routing
            if tier in ["publish", "candidate"]:
                target_path = os.path.join(SCORED_DIR, filename)
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  Hybrid Scored: [{final_score}] {tier.upper()} - {filename} (Adj: {ai_adjustment})")
            else:
                target_path = os.path.join(ARCHIVE_DIR, filename)
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"  Archived: [{final_score}] - {filename} (Base: {base_score})")
                
            processed_count += 1
            
        except Exception as e:
            print(f"  Error processing {filename}: {str(e)}")

    print(f"\nHybrid Triage Complete. Processed: {processed_count}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(process_signals())
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        sys.exit(1)
