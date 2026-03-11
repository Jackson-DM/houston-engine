#!/usr/bin/env python3
import os
import json
import uuid
import sys
import re
import feedparser
import requests
from datetime import datetime

# ==============================================================================
# Script: ingest_signal_hunter.py
# Purpose: Real RSS-based fetch layer for Signal Hunter ingestion.
# Process: Feed fetching, deduplication, schema normalization, file writing.
# ==============================================================================

# Configuration & Paths
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
STATE_DIR = os.path.join(REPO_ROOT, "automation/state")
LOG_DIR = os.path.join(REPO_ROOT, "automation/logs/signal-hunter")
RAW_SIGNALS_DIR = os.path.join(REPO_ROOT, "signals/raw")

LAST_RUN_PATH = os.path.join(STATE_DIR, "signal-hunter-last-run.json")
SEEN_SIGNALS_PATH = os.path.join(STATE_DIR, "signal-hunter-seen-signals.json")
SOURCE_REGISTRY_PATH = os.path.join(REPO_ROOT, "automation/ingestion-agents/source_registry.md")

# Ensure directories exist
for d in [STATE_DIR, LOG_DIR, RAW_SIGNALS_DIR]:
    os.makedirs(d, exist_ok=True)

# Sources Mapping (Extracted from Golden Set with specific RSS endpoints)
# Note: These represent the "Golden Set" from the registry mapped to actual RSS feeds.
RSS_FEEDS = [
    {"name": "VentureBeat AI", "url": "https://venturebeat.com/category/ai/feed/", "type": "News Outlet", "category": "Enterprise AI"},
    {"name": "NVIDIA Newsroom", "url": "https://nvidianews.nvidia.com/releases.xml", "type": "Company Blog", "category": "Industrial AI"},
    {"name": "OpenAI Blog", "url": "https://openai.com/news/rss.xml", "type": "Company Blog", "category": "AI Research"},
    {"name": "Anthropic Blog", "url": "https://www.anthropic.com/index.xml", "type": "Company Blog", "category": "AI Safety"},
    {"name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/feed/", "type": "News Outlet", "category": "AI Trends"}
]

def load_json(path, default):
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return default
    return default

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def clean_filename(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def generate_signal_content(source, entry):
    collected_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    sig_id = f"sig-{datetime.utcnow().strftime('%Y-%m-%d')}-{uuid.uuid4().hex[:6]}"
    
    title = entry.get('title', 'Unknown Title')
    summary = entry.get('summary', entry.get('description', 'No summary provided.'))
    # Basic HTML strip for summary
    summary = re.sub('<[^<]+?>', '', summary).replace('\n', ' ').strip()[:300]
    
    content = f"""---
signal_id: {sig_id}
collected_at: {collected_at}
source_name: {source['name']}
source_type: {source['type']}
source_url: {entry.link}
signal_category: {source['category']}
industry: Cross-Industry
geo_relevance: Global
priority_hint: medium
confidence: 0.85
duplicate_of: null
status: raw
---

# Signal Summary
{title}: {summary}

## Why It Matters
This signal represents a key development in {source['category']} originating from a Tier 1 source. It warrants monitoring for shifts in enterprise AI infrastructure or deployment standards.

## Houston Relevance
Indirect / Potential Direct. As global AI standards are set by frontier firms, Houston energy and logistics sectors must adapt to these infrastructure changes.

## Suggested Angles
- **Memo Angle:** Strategic implications of this {source['name']} announcement for 2026 industrial AI roadmaps.
- **LinkedIn Angle:** Analysis of why this {source['category']} shift matters for enterprise operators.
- **CRM Implication:** Assess potential consulting alignment for local firms integrating {source['name']} technology.
"""
    return sig_id, content

def run_ingestion():
    last_run = load_json(LAST_RUN_PATH, {"last_successful_run": None, "signals_created": 0})
    seen_signals = load_json(SEEN_SIGNALS_PATH, [])
    
    accepted_signals = []
    new_seen_entries = []
    created_count = 0
    
    print(f"Starting RSS ingestion for {len(RSS_FEEDS)} sources...")
    
    for source in RSS_FEEDS:
        if created_count >= 3:
            break
            
        print(f"Fetching {source['name']}...")
        try:
            feed = feedparser.parse(source['url'])
            if not feed.entries:
                print(f"  No entries found for {source['name']}.")
                continue
                
            for entry in feed.entries:
                if created_count >= 3:
                    break
                    
                entry_id = getattr(entry, 'id', entry.link)
                
                # Deduplication check
                if entry_id in seen_signals:
                    continue
                
                # Transform to Signal
                sig_id, content = generate_signal_content(source, entry)
                
                # File Writing
                filename_title = clean_filename(entry.get('title', 'signal'))[:40]
                date_str = datetime.utcnow().strftime("%Y-%m-%d")
                source_slug = clean_filename(source['name'])
                filename = f"{date_str}-{source_slug}-{filename_title}.md"
                filepath = os.path.join(RAW_SIGNALS_DIR, filename)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
                accepted_signals.append(sig_id)
                new_seen_entries.append(entry_id)
                created_count += 1
                print(f"  Accepted: {entry.get('title')[:50]}...")
                
        except Exception as e:
            print(f"  Error fetching {source['name']}: {str(e)}")
            continue

    # Update State
    if created_count > 0:
        seen_signals.extend(new_seen_entries)
        last_run["last_successful_run"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        last_run["signals_created"] = created_count
        save_json(LAST_RUN_PATH, last_run)
        save_json(SEEN_SIGNALS_PATH, seen_signals)
    else:
        # Update last run even if no signals added, per requirements
        last_run["last_successful_run"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        save_json(LAST_RUN_PATH, last_run)
    
    # Create Run Log
    log_filename = f"{datetime.utcnow().strftime('%Y-%m-%d-%H%M')}-run.md"
    log_path = os.path.join(LOG_DIR, log_filename)
    
    with open(log_path, 'w', encoding='utf-8') as f:
        f.write(f"# Signal Hunter Run Log: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}\n\n")
        f.write(f"Status: {'SUCCESS' if created_count > 0 else 'COMPLETED (No New Signals)'}\n")
        f.write(f"Signals Created: {created_count}\n")
        f.write(f"New Signal IDs: {', '.join(accepted_signals) if accepted_signals else 'None'}\n")
    
    print(f"Summary: {created_count} new signals ingested.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(run_ingestion())
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        sys.exit(1)
