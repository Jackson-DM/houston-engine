#!/usr/bin/env python3
"""
Phase 10 Article Generator
Reads Phase 1-9 intelligence outputs (READ ONLY) and generates LinkedIn articles
via OpenRouter API.
"""

import os
import json
import glob
import requests
from datetime import datetime

REPO_ROOT = os.path.abspath(os.path.dirname(__file__))


def load_config():
    """Load phase10_config.json."""
    config_path = os.path.join(REPO_ROOT, "phase10_config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_intelligence_context(config):
    """Read Phase 1-9 outputs as context (READ ONLY). Returns a summary dict."""
    inputs = config["intelligence_inputs"]
    context = {"scored_signals": [], "insights": [], "final_content": [],
                "humanized_draft_ids": [], "keyword_gaps": []}

    # Load recent scored signals (last 10)
    scored_dir = os.path.join(REPO_ROOT, inputs["scored_signals"])
    if os.path.isdir(scored_dir):
        files = sorted(glob.glob(os.path.join(scored_dir, "*.md")), reverse=True)[:10]
        for f in files:
            with open(f, "r", encoding="utf-8") as fh:
                content = fh.read()
                # Extract title from first line
                title = content.split("\n")[0].strip("# ").strip()
                context["scored_signals"].append({"file": os.path.basename(f), "title": title})

    # Load recent insights (last 10)
    insights_dir = os.path.join(REPO_ROOT, inputs["insights"])
    if os.path.isdir(insights_dir):
        files = sorted(glob.glob(os.path.join(insights_dir, "*.json")), reverse=True)[:10]
        for f in files:
            try:
                with open(f, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                    insight = data.get("insight", {})
                    context["insights"].append({
                        "file": os.path.basename(f),
                        "summary": insight.get("summary", ""),
                        "why_it_matters": insight.get("why_it_matters", ""),
                    })
            except (json.JSONDecodeError, IOError):
                continue

    # Load recent final content (last 5)
    final_dir = os.path.join(REPO_ROOT, inputs["final_content"])
    if os.path.isdir(final_dir):
        files = sorted(glob.glob(os.path.join(final_dir, "*.json")), reverse=True)[:5]
        for f in files:
            try:
                with open(f, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                    context["final_content"].append({
                        "file": os.path.basename(f),
                        "topic": data.get("topic", data.get("title", "")),
                    })
            except (json.JSONDecodeError, IOError):
                continue

    # Load humanized draft IDs (to avoid duplicate topics)
    humanized_path = os.path.join(REPO_ROOT, inputs.get("humanized_drafts", ""))
    if humanized_path and os.path.isfile(humanized_path):
        try:
            with open(humanized_path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
                context["humanized_draft_ids"] = data.get("processed_draft_ids", [])
        except (json.JSONDecodeError, IOError):
            pass

    # Load keyword watchlist gaps (content opportunities)
    watchlist_path = os.path.join(REPO_ROOT, inputs.get("keyword_watchlist", ""))
    if watchlist_path and os.path.isfile(watchlist_path):
        try:
            with open(watchlist_path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
                context["keyword_gaps"] = data.get("confirmed_gaps", [])
                context["keyword_watch"] = data.get("watch_list", [])
        except (json.JSONDecodeError, IOError):
            pass

    return context


def build_article_prompt(topic, brand_config, intelligence_context):
    """Build the system and user prompts for article generation."""
    system_prompt = (
        f"You are a LinkedIn article writer for {brand_config['name']}.\n"
        f"Voice: {brand_config['voice']}\n"
        f"Audience: {brand_config['audience']}\n"
        f"Tone: {brand_config['tone']}\n\n"
        "LinkedIn formatting rules:\n"
        "- No markdown headers — use ALL CAPS or line spacing for section breaks\n"
        "- No bold/italic markdown syntax — use plain emphasis through word choice\n"
        "- Paragraphs separated by blank lines\n"
        "- 800-1200 words\n"
        "- First line is the hook — must be punchy and standalone\n"
        "- End with a question to drive comments\n"
        "- Output the article as plain text, ready to paste into LinkedIn\n"
    )

    # Build intelligence summary
    intel_summary = "Recent intelligence context (for topical relevance):\n"
    for sig in intelligence_context.get("scored_signals", [])[:5]:
        intel_summary += f"- Signal: {sig['title']}\n"
    for ins in intelligence_context.get("insights", [])[:5]:
        intel_summary += f"- Insight: {ins['summary'][:150]}\n"

    # Add keyword gap opportunities if available
    gaps = intelligence_context.get("keyword_gaps", [])
    if gaps:
        intel_summary += "\nContent gap opportunities (topics underserved in current content):\n"
        for gap in gaps[:5]:
            label = gap.get("keyword", gap) if isinstance(gap, dict) else str(gap)
            intel_summary += f"- Gap: {label}\n"

    # Note already-covered drafts to avoid duplication
    draft_ids = intelligence_context.get("humanized_draft_ids", [])
    if draft_ids:
        intel_summary += f"\nAlready published {len(draft_ids)} drafts — avoid repeating these topics.\n"

    user_prompt = (
        f"Write a LinkedIn article on the following topic:\n\n"
        f"Topic: {topic.get('title', 'Untitled')}\n"
        f"Angle: {topic.get('angle', 'General perspective')}\n"
        f"Key points: {topic.get('key_points', 'Cover the topic thoroughly')}\n\n"
        f"{intel_summary}\n"
        "Output ONLY the article text. No JSON, no metadata, no markdown."
    )

    return system_prompt, user_prompt


def generate_article(topic, brand_key, brand_config, intelligence_context, config, dry_run=False):
    """Generate a single article via OpenRouter API."""
    settings = config["article_settings"]

    if dry_run:
        return {
            "success": True,
            "dry_run": True,
            "brand": brand_key,
            "topic": topic.get("title", "Untitled"),
            "content": f"[DRY RUN] Article for {brand_config['name']}: {topic.get('title', 'Untitled')}\n\nThis is a dry-run placeholder. No API call was made.",
            "word_count": 20,
        }

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return {"success": False, "error": "OPENROUTER_API_KEY not set"}

    system_prompt, user_prompt = build_article_prompt(topic, brand_config, intelligence_context)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings["model"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    for attempt in range(settings.get("max_retries", 2) + 1):
        try:
            response = requests.post(
                settings["api_url"],
                headers=headers,
                json=payload,
                timeout=settings.get("timeout_seconds", 60),
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            word_count = len(content.split())

            return {
                "success": True,
                "brand": brand_key,
                "topic": topic.get("title", "Untitled"),
                "content": content,
                "word_count": word_count,
                "model": settings["model"],
                "usage": result.get("usage", {}),
            }
        except Exception as e:
            if attempt < settings.get("max_retries", 2):
                continue
            return {"success": False, "error": str(e)}
