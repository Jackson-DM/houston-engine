#!/usr/bin/env python3
import os
import json
import uuid
from datetime import datetime
import sys

# ==============================================================================
# Script: ingest_signal_hunter.py
# Purpose: First executable implementation of Signal Hunter ingestion.
# Constraints: Golden Set only, max 3 signals, no enrichment.
# ==============================================================================

# Configuration & Paths
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
STATE_DIR = os.path.join(REPO_ROOT, "automation/state")
LOG_DIR = os.path.join(REPO_ROOT, "automation/logs/signal-hunter")
RAW_SIGNALS_DIR = os.path.join(REPO_ROOT, "signals/raw")

LAST_RUN_PATH = os.path.join(STATE_DIR, "signal-hunter-last-run.json")
SEEN_SIGNALS_PATH = os.path.join(STATE_DIR, "signal-hunter-seen-signals.json")

# Ensure directories exist
for d in [STATE_DIR, LOG_DIR, RAW_SIGNALS_DIR]:
    os.makedirs(d, exist_ok=True)

# Mock Golden Set Sources (Simulating web fetch for this iteration)
GOLDEN_SET = [
    {"name": "VentureBeat AI", "url": "https://venturebeat.com/category/ai/", "type": "News Outlet"},
    {"name": "NVIDIA Newsroom", "url": "https://nvidianews.nvidia.com/", "type": "Company Blog"},
    {"name": "OpenAI Blog", "url": "https://openai.com/blog", "type": "Company Blog"},
    {"name": "Anthropic Blog", "url": "https://www.anthropic.com/index", "type": "Company Blog"},
    {"name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/", "type": "News Outlet"}
]

def load_json(path, default):
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except:
            return default
    return default

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

def generate_signal_content(source, title, summary):
    collected_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    sig_id = f"sig-{datetime.utcnow().strftime('%Y-%m-%d')}-{uuid.uuid4().hex[:6]}"
    
    content = f"""---
signal_id: {sig_id}
collected_at: {collected_at}
source_name: {source['name']}
source_type: {source['type']}
source_url: {source['url']}
signal_category: Enterprise AI
industry: Technology
geo_relevance: Global
priority_hint: medium
confidence: 0.9
duplicate_of: null
status: raw
---

# Signal Summary
{summary}

## Why It Matters
This signal indicates a shift in {source['name']}'s strategic direction toward enterprise-grade AI reliability and scalable deployment.

## Houston Relevance
Indirect. While {source['name']} is global, the implications for {source['type']} adoption will impact Houston's growing tech and energy sectors.

## Suggested Angles
- **Memo Angle:** How {source['name']}'s latest move affects 2026 AI infrastructure planning.
- **LinkedIn Angle:** The "Enterprise First" shift at {source['name']} and what it means for the ecosystem.
- **CRM Implication:** Monitor enterprise adoption of these features within the Houston energy corridor.
"""
    return sig_id, content

def run_ingestion():
    last_run = load_json(LAST_RUN_PATH, {"last_successful_run": None, "signals_created": 0})
    seen_signals = load_json(SEEN_SIGNALS_PATH, [])
    
    new_signals = []
    
    # Simulate Ingestion (In a real run, this would fetch/parse HTML)
    # We are generating exactly 1-3 mock signals based on the Golden Set for this first executable version.
    mock_data = [
        ("NVIDIA Newsroom", "NVIDIA Launches New Blackwell Industrial Cluster Configs", "NVIDIA has released specialized Blackwell GPU configurations optimized for industrial data centers."),
        ("OpenAI Blog", "OpenAI Introduces Advanced Enterprise Privacy Controls", "New granular privacy settings allow enterprises to silo training data with zero-retention defaults."),
        ("VentureBeat AI", "Anthropic Partners with Major Energy Firm for Grid Optimization", "Anthropic's Claude models are being integrated into smart grid management systems for peak load prediction.")
    ]
    
    created_count = 0
    for source_name, title, summary in mock_data:
        if created_count >= 3:
            break
            
        # Check if already seen (using title as mock hash for this dev version)
        if title in seen_signals:
            continue
            
        # Match source metadata
        source_meta = next((s for s in GOLDEN_SET if s['name'] == source_name), GOLDEN_SET[0])
        
        # Generate Content
        sig_id, content = generate_signal_content(source_meta, title, summary)
        
        # Write File
        safe_title = title.lower().replace(" ", "-")[:30]
        filename = f"{datetime.utcnow().strftime('%Y-%m-%d')}-{source_name.lower().replace(' ', '-')}-{safe_title}.md"
        filepath = os.path.join(RAW_SIGNALS_DIR, filename)
        
        with open(filepath, 'w') as f:
            f.write(content)
            
        new_signals.append(sig_id)
        seen_signals.append(title) # Tracking title in this mock version
        created_count += 1

    # Update State
    last_run["last_successful_run"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    last_run["signals_created"] = created_count
    save_json(LAST_RUN_PATH, last_run)
    save_json(SEEN_SIGNALS_PATH, seen_signals)
    
    # Create Run Log
    log_filename = f"{datetime.utcnow().strftime('%Y-%m-%d-%H%M')}-run.md"
    log_path = os.path.join(LOG_DIR, log_filename)
    
    with open(log_path, 'w') as f:
        f.write(f"# Signal Hunter Run Log: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}\n\n")
        f.write(f"Status: SUCCESS\n")
        f.write(f"Signals Created: {created_count}\n")
        f.write(f"New Signal IDs: {', '.join(new_signals) if new_signals else 'None'}\n")
    
    print(f"Ingestion complete. {created_count} signals created.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(run_ingestion())
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        sys.exit(1)
