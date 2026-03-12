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
# Phase: Phase 6.1 - Hardened Scoring Weights
# ==============================================================================

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RAW_DIR = os.path.join(REPO_ROOT, "signals/raw")
SCORED_DIR = os.path.join(REPO_ROOT, "signals/scored")
ARCHIVE_DIR = os.path.join(REPO_ROOT, "signals/archive")

# Ensure directories exist
for d in [SCORED_DIR, ARCHIVE_DIR]:
    os.makedirs(d, exist_ok=True)

def calculate_base_score(frontmatter, content):
    """
    Deterministic scoring based on keywords and metadata.
    Max Score: 80 (Leaves room for +20 AI Adjustment in future)
    """
    score = 0
    full_text = f"{frontmatter.get('source_name', '')} {frontmatter.get('title', '')} {content}".lower()
    
    # 1. PROVIDER AUTHORITY (Max 25)
    # Reward Tier 1 Labs and Infrastructure
    tier_1_providers = ["nvidia", "openai", "anthropic", "microsoft", "google cloud", "aws", "databricks", "palantir"]
    if any(p in full_text for p in tier_1_providers):
        score += 15
        
    if frontmatter.get("source_type") == "Company Blog":
        score += 10
    elif frontmatter.get("source_type") == "News Outlet":
        score += 5

    # 2. STRATEGIC PILLARS (Max 30)
    # Reward Agentic, Enterprise, and Infrastructure shifts
    strategic_keywords = {
        "agent": 10, "swarm": 15, "autonomous": 10,  # Agentic
        "enterprise": 10, "deployment": 10, "architecture": 10, "governance": 10, # Enterprise
        "blackwell": 15, "h100": 10, "infrastructure": 10, "compute": 5 # Hardware/Infra
    }
    pillar_score = 0
    for kw, val in strategic_keywords.items():
        if kw in full_text:
            pillar_score += val
    score += min(pillar_score, 30)

    # 3. VERTICAL RELEVANCE (Max 25)
    # Houston Core: Energy, Logistics, Manufacturing, Healthcare
    vertical_keywords = {
        "manufacturing": 15, "factory": 15, "robotics": 15, "physical ai": 20, # Industrial
        "energy": 10, "grid": 10, "oil": 10, "gas": 10, "refinery": 15, # Energy
        "logistics": 15, "supply chain": 15, "shipping": 10, "port": 15, # Logistics
        "houston": 25, "texas": 10, "napa": 5 # Geo
    }
    vertical_score = 0
    for kw, val in vertical_keywords.items():
        if kw in full_text:
            vertical_score += val
    
    if frontmatter.get("geo_relevance", "").lower() == "houston":
        vertical_score += 25
        
    score += min(vertical_score, 25)

    # 4. NEGATIVE GUARDRAILS (Penalties)
    # Filter for fluff/consumer/non-strategic content
    negative_keywords = ["gaming", "smartphone", "consumer", "gimmick", "leak", "rumor", "celebrity"]
    if any(nk in full_text for nk in negative_keywords):
        score -= 20
        
    return max(0, min(score, 80))

def determine_tier(score):
    # Tier Thresholds (Hardened)
    if score >= 60: return "publish"   # High-value strategic signals
    if score >= 40: return "candidate" # Solid industry news
    if score >= 20: return "archive"   # Relevant but non-critical
    return "ignore"                    # Noise

def process_signals(target_dir=RAW_DIR, dry_run=False):
    print(f"--- [Inference Running] Scoring Layer (Dry Run: {dry_run}) ---")
    files = [f for f in os.listdir(target_dir) if f.endswith(".md")]
    
    if not files:
        print(f"No signals found in {target_dir}.")
        return 0

    results = {"signals_processed": 0, "publish_count": 0, "candidate_count": 0, "archive_count": 0, "ignore_count": 0}
    
    for filename in files:
        filepath = os.path.join(target_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        try:
            parts = content.split('---', 2)
            if len(parts) < 3: continue
            
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2]
            
            base_score = calculate_base_score(frontmatter, body)
            tier = determine_tier(base_score)
            
            if not dry_run:
                frontmatter.update({
                    "base_score": base_score, 
                    "ai_adjustment": 0, 
                    "final_score": base_score, 
                    "tier": tier, 
                    "status": "triaged" if tier in ["publish", "candidate"] else "archived"
                })
                
                new_content = f"--- \n{yaml.dump(frontmatter)}---{body}"
                target_path = os.path.join(SCORED_DIR if tier in ["publish", "candidate"] else ARCHIVE_DIR, filename)
                
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                # Cleanup if moving from RAW
                if target_dir == RAW_DIR:
                    os.remove(filepath)
            else:
                print(f"  [DRY RUN] {filename} -> Score: {base_score} ({tier})")
            
            results["signals_processed"] += 1
            results[f"{tier}_count"] += 1
            
        except Exception as e:
            if not dry_run:
                run_logger.add_error(f"Scoring Error ({filename}): {str(e)}")
            else:
                print(f"  Error scoring {filename}: {str(e)}")

    if not dry_run:
        run_logger.update_summary("scoring", results)
        
    print(f"Scoring complete. Processed: {results['signals_processed']}, Publish: {results['publish_count']}, Candidate: {results['candidate_count']}")
    return 0

if __name__ == "__main__":
    # If run with --backtest, score the archive folder as a dry run
    if len(sys.argv) > 1 and sys.argv[1] == "--backtest":
        process_signals(target_dir=ARCHIVE_DIR, dry_run=True)
    else:
        try:
            sys.exit(process_signals())
        except Exception as e:
            run_logger.add_error(f"Critical Scoring Error: {str(e)}")
            sys.exit(1)
