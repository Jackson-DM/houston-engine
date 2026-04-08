#!/usr/bin/env python3
"""Loads backlink data for Phase 10 content pipeline."""

import os
import json

REPO_ROOT = os.path.abspath(os.path.dirname(__file__))
BACKLINKS_FILE = os.path.join(REPO_ROOT, "backlinks.json")


def load_backlinks():
    """Load backlinks from backlinks.json."""
    if not os.path.exists(BACKLINKS_FILE):
        print(f"Warning: {BACKLINKS_FILE} not found. Using empty backlinks.")
        return {}
    with open(BACKLINKS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_backlinks_for_brand(brand_key):
    """Get backlink data for a specific brand."""
    backlinks = load_backlinks()
    return backlinks.get(brand_key, {})


def format_backlinks_footer(brand_key):
    """Format backlinks as a plain-text footer for LinkedIn articles."""
    data = get_backlinks_for_brand(brand_key)
    if not data:
        return ""
    lines = ["---", ""]
    if data.get("cta"):
        lines.append(data["cta"])
    if data.get("primary"):
        lines.append(data["primary"])
    return "\n".join(lines)
