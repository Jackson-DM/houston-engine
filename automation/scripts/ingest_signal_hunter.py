#!/usr/bin/env python3
import os
import json
import uuid
import sys
import re
import feedparser
import requests
from datetime import datetime
import run_logger

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

# Ensure directories exist
for d in [STATE_DIR, LOG_DIR, RAW_SIGNALS_DIR]:
    os.makedirs(d, exist_ok=True)

# Sources Mapping
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
"""
    return sig_id, content

def run_ingestion():
    print("--- [Inference Running] Ingestion Layer ---")
    run_logger.init_summary()
    
    last_run = load_json(LAST_RUN_PATH, {"last_successful_run": None, "signals_created": 0})
    seen_signals = load_json(SEEN_SIGNALS_PATH, [])
    
    accepted_signals = []
    new_seen_entries = []
    created_count = 0
    duplicate_count = 0
    raw_found = 0
    
    MAX_PER_RUN = int(os.getenv("MAX_INGESTION_PER_RUN", 5))

    for source in RSS_FEEDS:
        if created_count >= MAX_PER_RUN:
            break
            
        try:
            feed = feedparser.parse(source['url'])
            if not feed.entries:
                continue
                
            raw_found += len(feed.entries)
            for entry in feed.entries:
                if created_count >= MAX_PER_RUN:
                    break
                    
                def normalize_id(raw_id):
                    """Normalize RSS entry IDs to prevent http/https duplicates."""
                    if raw_id and raw_id.startswith("http://"):
                        return "https://" + raw_id[7:]
                    return raw_id

                entry_id = normalize_id(getattr(entry, 'id', entry.link))
                if entry_id in seen_signals:
                    duplicate_count += 1
                    continue
                
                sig_id, content = generate_signal_content(source, entry)
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
                
        except Exception as e:
            run_logger.add_error(f"Ingestion Error ({source['name']}): {str(e)}")

    if created_count > 0:
        seen_signals.extend(new_seen_entries)
        last_run["last_successful_run"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        last_run["signals_created"] = created_count
        save_json(LAST_RUN_PATH, last_run)
        save_json(SEEN_SIGNALS_PATH, seen_signals)
    
    run_logger.update_summary("ingestion", {
        "raw_signals_found": raw_found,
        "new_signals_written": created_count,
        "duplicates_skipped": duplicate_count
    })
    
    print(f"Ingestion complete. Found: {raw_found}, Written: {created_count}, Duplicates: {duplicate_count}")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(run_ingestion())
    except Exception as e:
        run_logger.add_error(f"Critical Ingestion Error: {str(e)}")
        sys.exit(1)
