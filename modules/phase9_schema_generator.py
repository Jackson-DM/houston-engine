#!/usr/bin/env python3
"""
Module: phase9_schema_generator.py
Phase: Phase 9 — Entity Authority & Structured Data Layer
Purpose: Append a JSON-LD structured data block to every finalized article payload.
         Schema type is determined by the content_type tag from Phase 8.

Usage (standalone):
    python modules/phase9_schema_generator.py content/final/final-<id>.json

Usage (pipeline):
    from modules.phase9_schema_generator import generate_schema
    payload = generate_schema(payload)
"""

import os
import json
import sys
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Path resolution — works whether called from repo root or modules/ dir
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, ".."))

ENTITY_ANCHORS_PATH = os.path.join(REPO_ROOT, "config", "entity_anchors.json")
ROUTING_RULES_PATH = os.path.join(REPO_ROOT, "config", "schema_routing_rules.json")
SCHEMA_LOG_PATH = os.path.join(REPO_ROOT, "logs", "schema_log.md")


# ---------------------------------------------------------------------------
# Config loaders
# ---------------------------------------------------------------------------

def _load_entity_anchors() -> dict:
    with open(ENTITY_ANCHORS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_routing_rules() -> dict:
    with open(ROUTING_RULES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Schema type resolution
# ---------------------------------------------------------------------------

def resolve_schema_type(content_type: str, routing_rules: dict) -> str:
    """Map a content_type string to a JSON-LD @type string."""
    key = (content_type or "").lower().strip().replace(" ", "_").replace("-", "_")
    return routing_rules["routing"].get(key, routing_rules.get("default", "Article"))


# ---------------------------------------------------------------------------
# JSON-LD block builders
# ---------------------------------------------------------------------------

def _build_person_block(person: dict) -> dict:
    return {
        "@type": "Person",
        "name": person["name"],
        "jobTitle": person["jobTitle"],
        "url": person["url"],
        "sameAs": person["sameAs"],
    }


def _build_article(payload: dict, person_block: dict, schema_type: str) -> dict:
    """Covers Article, NewsArticle, and Report (which is typed as Article in JSON-LD)."""
    title = payload.get("title") or payload.get("id", "")
    url = payload.get("url", "")
    date_published = payload.get("created_at") or datetime.now(timezone.utc).isoformat()

    full_text = ""
    if payload.get("final") and isinstance(payload["final"], dict):
        full_text = payload["final"].get("full_text", "")
    elif payload.get("original") and isinstance(payload["original"], dict):
        full_text = payload["original"].get("full_text", "")

    ld_type = schema_type if schema_type in ("Article", "NewsArticle") else "Article"

    block = {
        "@context": "https://schema.org",
        "@type": ld_type,
        "headline": title,
        "datePublished": date_published,
        "author": person_block,
        "publisher": {
            "@type": "Organization",
            "name": "Amplify Intelligence",
            "url": "https://amplifyintelligence.com",
        },
    }
    if url:
        block["url"] = url
    if full_text:
        block["articleBody"] = full_text[:500]  # brief excerpt; full body in HTML
    if schema_type == "Report":
        block["@type"] = "Article"
        block["additionalType"] = "https://schema.org/Report"

    return block


def _build_how_to(payload: dict, person_block: dict) -> dict:
    title = payload.get("title") or payload.get("id", "")
    full_text = ""
    if payload.get("final") and isinstance(payload["final"], dict):
        full_text = payload["final"].get("full_text", "")

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": title,
        "author": person_block,
        "description": full_text[:300] if full_text else "",
        "step": [
            {
                "@type": "HowToStep",
                "text": "See the full article for step-by-step guidance.",
            }
        ],
    }


def _build_faq_page(payload: dict, person_block: dict) -> dict:
    full_text = ""
    if payload.get("final") and isinstance(payload["final"], dict):
        full_text = payload["final"].get("full_text", "")

    # Emit a single placeholder entity; Phase 10 will extract real Q&A pairs.
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "author": person_block,
        "mainEntity": [
            {
                "@type": "Question",
                "name": payload.get("title", "See article for FAQ"),
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": full_text[:500] if full_text else "See full article.",
                },
            }
        ],
    }


# ---------------------------------------------------------------------------
# Core public function
# ---------------------------------------------------------------------------

def generate_schema(payload: dict) -> dict:
    """
    Accept an article payload dict, generate the appropriate JSON-LD block,
    and return the updated payload with `schema_block` and `schema_type` added.

    Args:
        payload: Article payload dict from Phase 8 (humanize_authority_drafts output).

    Returns:
        Updated payload dict with two new keys:
            schema_type  (str)  — e.g. "Article", "HowTo", "FAQPage", "NewsArticle"
            schema_block (str)  — <script type="application/ld+json">…</script>
    """
    anchors = _load_entity_anchors()
    routing = _load_routing_rules()
    person_block = _build_person_block(anchors["person"])

    content_type = payload.get("content_type", "")
    schema_type = resolve_schema_type(content_type, routing)

    if schema_type == "HowTo":
        ld_obj = _build_how_to(payload, person_block)
    elif schema_type == "FAQPage":
        ld_obj = _build_faq_page(payload, person_block)
    else:
        # Article, NewsArticle, Report
        ld_obj = _build_article(payload, person_block, schema_type)

    ld_json = json.dumps(ld_obj, indent=2, ensure_ascii=False)
    schema_block = f'<script type="application/ld+json">\n{ld_json}\n</script>'

    payload["schema_type"] = schema_type
    payload["schema_block"] = schema_block

    _log_schema(payload, schema_type)

    return payload


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def _log_schema(payload: dict, schema_type: str) -> None:
    """Append one log line to logs/schema_log.md."""
    article_id = payload.get("id", "unknown")
    content_type = payload.get("content_type", "unknown")
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    line = f"- `{timestamp}` | `{article_id}` | content_type: `{content_type}` -> schema: **{schema_type}**\n"

    os.makedirs(os.path.dirname(SCHEMA_LOG_PATH), exist_ok=True)
    with open(SCHEMA_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line)


# ---------------------------------------------------------------------------
# Standalone CLI — process a single final payload JSON file
# ---------------------------------------------------------------------------

def _process_file(filepath: str) -> None:
    with open(filepath, "r", encoding="utf-8") as f:
        payload = json.load(f)

    updated = generate_schema(payload)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)

    print(f"[schema_generator] {updated['id']} -> {updated['schema_type']}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Process all files in content/final/ as a convenience
        final_dir = os.path.join(REPO_ROOT, "content", "final")
        files = [
            os.path.join(final_dir, f)
            for f in os.listdir(final_dir)
            if f.endswith(".json")
        ]
        if not files:
            print("No final payload files found. Pass a file path as argument.")
            sys.exit(0)
        for fp in files:
            try:
                _process_file(fp)
            except Exception as e:
                print(f"[schema_generator] ERROR processing {fp}: {e}", file=sys.stderr)
    else:
        target = sys.argv[1]
        if not os.path.isabs(target):
            target = os.path.join(REPO_ROOT, target)
        _process_file(target)
