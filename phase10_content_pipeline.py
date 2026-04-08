#!/usr/bin/env python3
"""
Phase 10 Content Pipeline — Main Orchestrator
Weekly LinkedIn content publishing pipeline.
Runs Tuesdays at 10:00 UTC via GitHub Actions.

Reads Phase 1-9 outputs as intelligence context (READ ONLY).
Outputs articles to: outputs/phase10_content/{brand}/{date}_{slug}.md
"""

import os
import sys
import json
import argparse
from datetime import datetime

REPO_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, REPO_ROOT)

from phase10_article_generator import load_config, load_intelligence_context, generate_article
from phase10_output_formatter import write_article

LOG_FILE = os.path.join(REPO_ROOT, "logs", "phase10_run_log.json")


def load_topic_queue():
    """Load the topic queue."""
    queue_path = os.path.join(REPO_ROOT, "phase10_topic_queue.json")
    with open(queue_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_topic_queue(queue):
    """Save updated topic queue."""
    queue_path = os.path.join(REPO_ROOT, "phase10_topic_queue.json")
    with open(queue_path, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2)


def get_next_topic_and_brand(queue, config):
    """Get the next topic from queue and determine target brand."""
    topics = queue.get("topics", [])
    rotation = queue.get("brand_rotation", list(config["brands"].keys()))
    brand_idx = queue.get("next_brand_index", 0) % len(rotation)
    brand_key = rotation[brand_idx]

    # Find next unprocessed topic
    for i, topic in enumerate(topics):
        if not topic.get("processed"):
            return topic, i, brand_key, brand_idx
    return None, -1, brand_key, brand_idx


def write_log(log_entry):
    """Append log entry to phase10_run_log.json."""
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

    logs = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                logs = json.load(f)
                if not isinstance(logs, list):
                    logs = [logs]
        except (json.JSONDecodeError, IOError):
            logs = []

    logs.append(log_entry)
    # Keep last 50 entries
    logs = logs[-50:]

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2)


def run_pipeline(dry_run=False):
    """Main pipeline execution."""
    print(f"=== Phase 10 Content Pipeline {'(DRY RUN)' if dry_run else ''} ===")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print()

    # Load config
    config = load_config()
    print(f"Config loaded. {len(config['brands'])} brands configured.")

    # Load intelligence context (READ ONLY)
    intel = load_intelligence_context(config)
    print(f"Intelligence loaded: {len(intel['scored_signals'])} signals, "
          f"{len(intel['insights'])} insights, {len(intel['final_content'])} final pieces.")

    # Load topic queue
    queue = load_topic_queue()
    topics = queue.get("topics", [])
    print(f"Topic queue: {len(topics)} topics, "
          f"{sum(1 for t in topics if not t.get('processed'))} unprocessed.")

    # Get next topic
    topic, topic_idx, brand_key, brand_idx = get_next_topic_and_brand(queue, config)

    if topic is None:
        msg = "No unprocessed topics in queue. Pipeline complete — nothing to generate."
        print(f"\n{msg}")
        write_log({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "skipped",
            "reason": "empty_queue",
            "message": msg,
            "dry_run": dry_run,
        })
        return True

    brand_config = config["brands"].get(brand_key)
    if not brand_config:
        print(f"Error: Brand '{brand_key}' not found in config.")
        return False

    print(f"\nGenerating article:")
    print(f"  Brand: {brand_config['name']} ({brand_key})")
    print(f"  Topic: {topic.get('title', 'Untitled')}")
    print(f"  Dry run: {dry_run}")

    # Generate article
    result = generate_article(topic, brand_key, brand_config, intel, config, dry_run=dry_run)

    if not result.get("success"):
        error_msg = result.get("error", "Unknown error")
        print(f"\nGeneration failed: {error_msg}")
        write_log({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "status": "error",
            "brand": brand_key,
            "topic": topic.get("title"),
            "error": error_msg,
            "dry_run": dry_run,
        })
        return False

    # Format and write output
    output = write_article(result["content"], brand_key, topic.get("title", "untitled"), config)
    print(f"\nArticle written:")
    print(f"  Path: {output['path']}")
    print(f"  Words: {output['word_count']}")

    # Update queue
    if not dry_run:
        queue["topics"][topic_idx]["processed"] = True
        queue["topics"][topic_idx]["processed_at"] = datetime.utcnow().isoformat() + "Z"
        queue["topics"][topic_idx]["output_path"] = output["path"]
        queue["next_brand_index"] = (brand_idx + 1) % len(queue.get("brand_rotation", [brand_key]))
        save_topic_queue(queue)

    # Log success
    write_log({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "success",
        "brand": brand_key,
        "topic": topic.get("title"),
        "output_path": output["path"],
        "word_count": output["word_count"],
        "dry_run": dry_run,
    })

    print(f"\nPipeline complete. {'(DRY RUN — no state changes)' if dry_run else ''}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Phase 10 Content Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Run without API calls or state changes")
    args = parser.parse_args()

    success = run_pipeline(dry_run=args.dry_run)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
