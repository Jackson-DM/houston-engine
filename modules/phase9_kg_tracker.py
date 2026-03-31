#!/usr/bin/env python3
"""
Module: phase9_kg_tracker.py
Phase: Phase 9 — Entity Authority & Structured Data Layer
Purpose: Weekly Knowledge Graph corroboration tracker for Leon Coe.
         Scores each independent authoritative source that references
         Leon Coe by name. Higher corroboration = stronger KG entity =
         higher chance of Knowledge Panel.

Checks:
  - URL liveness    (LinkedIn, Crunchbase)        — free, no API
  - Wikidata API    (free, real-time)             — free, no API
  - Web search      (HBJ, InnovationMap, Scholar, — Perplexity Sonar
                     speaking bios, podcasts,        via OpenRouter)
                     university affiliations)

Output: Weekly report appended to logs/kg_corroboration_log.md

Usage:
    python modules/phase9_kg_tracker.py

Cron: runs as part of entity-monitor.yml (Monday 9am UTC)
"""

import os
import sys
import json
import requests
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, ".."))

KG_SOURCES_PATH = os.path.join(REPO_ROOT, "config", "kg_sources.json")
REPORT_PATH = os.path.join(REPO_ROOT, "logs", "kg_corroboration_log.md")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
KG_MODEL = os.getenv("KG_TRACKER_MODEL", "perplexity/sonar")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WIKIDATA_UA = (
    "HoustonEngine-KGTracker/1.0 "
    "(Phase 9 entity authority; github.com/Jackson-DM/houston-engine)"
)

URL_TIMEOUT = 10
URL_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; HoustonEngine-KGTracker/1.0; "
        "+https://github.com/Jackson-DM/houston-engine)"
    )
}


# ---------------------------------------------------------------------------
# Config loader
# ---------------------------------------------------------------------------

def _load_sources() -> dict:
    with open(KG_SOURCES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Check 1 — URL liveness (LinkedIn, Crunchbase)
# ---------------------------------------------------------------------------

def _is_alive(status: int) -> bool:
    """403/405/429 = bot-blocked but alive (social platforms). 404/410/5xx = dead."""
    if status is None:
        return False
    if status in (403, 405, 429):
        return True
    if status in (404, 410) or status >= 500:
        return False
    return status < 400


def check_url_liveness(source: dict) -> dict:
    """HEAD-check each known_url for this source. Returns corroboration result."""
    urls = source.get("known_urls", [])
    if not urls:
        return {
            "confirmed": False,
            "status": "no_url",
            "detail": "No known URL configured in kg_sources.json",
            "urls_checked": [],
        }

    alive = []
    dead = []
    for url in urls:
        try:
            resp = requests.head(
                url, allow_redirects=True, timeout=URL_TIMEOUT, headers=URL_HEADERS
            )
            code = resp.status_code
        except Exception:
            code = None

        if _is_alive(code):
            alive.append({"url": url, "status": code})
        else:
            dead.append({"url": url, "status": code})

    confirmed = len(alive) > 0
    return {
        "confirmed": confirmed,
        "status": "confirmed" if confirmed else "broken",
        "detail": f"{len(alive)} of {len(urls)} URL(s) alive",
        "alive": alive,
        "dead": dead,
        "urls_checked": urls,
    }


# ---------------------------------------------------------------------------
# Check 2 — Wikidata API (free, deterministic)
# ---------------------------------------------------------------------------

def check_wikidata(source: dict, subject: dict) -> dict:
    """Query Wikidata for the subject. Returns corroboration result."""
    name = subject.get("name", "Leon Coe")
    search_term = subject.get("wikidata_search_term", name)

    try:
        resp = requests.get(
            WIKIDATA_API,
            params={
                "action": "wbsearchentities",
                "search": search_term,
                "language": "en",
                "format": "json",
                "type": "item",
                "limit": 10,
            },
            headers={"User-Agent": WIKIDATA_UA},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return {
            "confirmed": False,
            "status": "error",
            "detail": f"Wikidata API error: {e}",
            "matches": [],
        }

    results = data.get("search", [])

    # Look for a result that is plausibly the right Leon Coe
    # (not a Belgian politician, cyclist, etc.)
    name_lower = name.lower()
    matches = []
    for item in results:
        label = (item.get("label") or "").lower()
        description = (item.get("description") or "").lower()
        # Exact label match on the name
        if label == name_lower:
            matches.append({
                "qid": item.get("id"),
                "label": item.get("label"),
                "description": item.get("description", ""),
                "url": f"https://www.wikidata.org/wiki/{item.get('id')}",
            })

    confirmed = len(matches) > 0
    detail = (
        f"Found Wikidata entry: {matches[0]['qid']} — {matches[0]['description']}"
        if confirmed
        else f"No Wikidata entry found for \"{name}\" (searched: \"{search_term}\")"
    )

    return {
        "confirmed": confirmed,
        "status": "confirmed" if confirmed else "not_found",
        "detail": detail,
        "matches": matches,
        "all_results_count": len(results),
    }


# ---------------------------------------------------------------------------
# Check 3 — LLM web search (single call for all web-search sources)
# ---------------------------------------------------------------------------

def _build_kg_research_prompt(sources: list, subject: dict) -> str:
    name = subject.get("name", "Leon Coe")
    description = subject.get("description", "AI Consultant & Strategist, Houston TX")

    web_search_sources = [s for s in sources if s.get("check") == "web_search"]

    source_list = "\n".join(
        f'  - {s["id"]}: Search for "{name}" mentions on {s["label"]}'
        for s in web_search_sources
    )

    return f"""You are a Knowledge Graph corroboration analyst. Search the web to check how many independent authoritative sources reference "{name}" ({description}).

For each source below, search the web and determine:
1. Is "{name}" confirmed on this surface? (confirmed = at least one clear mention or profile)
2. How many distinct mentions/appearances can you find?
3. What are the best URLs?
4. Any notable detail?

SOURCES TO CHECK:
{source_list}

REQUIRED JSON OUTPUT — return ONLY valid JSON, no preamble:
{{
  "google_scholar": {{
    "confirmed": <true|false>,
    "count": <integer>,
    "urls": ["<url>", ...],
    "detail": "<one-line finding>"
  }},
  "hbj": {{
    "confirmed": <true|false>,
    "count": <integer>,
    "urls": ["<url>", ...],
    "detail": "<one-line finding>"
  }},
  "innovationmap": {{
    "confirmed": <true|false>,
    "count": <integer>,
    "urls": ["<url>", ...],
    "detail": "<one-line finding>"
  }},
  "speaking_bios": {{
    "confirmed": <true|false>,
    "count": <integer>,
    "urls": ["<url>", ...],
    "detail": "<one-line finding>"
  }},
  "podcasts": {{
    "confirmed": <true|false>,
    "count": <integer>,
    "urls": ["<url>", ...],
    "detail": "<one-line finding>"
  }},
  "university_affiliation": {{
    "confirmed": <true|false>,
    "count": <integer>,
    "urls": ["<url>", ...],
    "detail": "<one-line finding>"
  }}
}}"""


def run_web_research(sources: list, subject: dict) -> dict:
    """Single Perplexity Sonar call covering all web-search-dependent sources."""
    if not OPENROUTER_API_KEY:
        # Graceful no-key fallback
        web_ids = [s["id"] for s in sources if s.get("check") == "web_search"]
        return {
            src_id: {
                "confirmed": False,
                "count": 0,
                "urls": [],
                "detail": "OPENROUTER_API_KEY not set — web research skipped.",
            }
            for src_id in web_ids
        }

    prompt = _build_kg_research_prompt(sources, subject)
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": KG_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a precise entity corroboration analyst. "
                    "Search the web for current, factual information. "
                    "Return ONLY valid JSON — no markdown, no preamble."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    }

    try:
        resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=90)
        resp.raise_for_status()
        result = resp.json()

        usage = result.get("usage", {})
        try:
            sys.path.insert(0, os.path.join(REPO_ROOT, "automation", "scripts"))
            import budget_tracker
            budget_tracker.record_usage(
                KG_MODEL,
                usage.get("prompt_tokens", 0),
                usage.get("completion_tokens", 0),
            )
        except Exception:
            pass

        content = result["choices"][0]["message"]["content"]
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        return json.loads(content)

    except Exception as e:
        web_ids = [s["id"] for s in sources if s.get("check") == "web_search"]
        return {
            src_id: {
                "confirmed": False,
                "count": 0,
                "urls": [],
                "detail": f"Web research error: {e}",
            }
            for src_id in web_ids
        }


# ---------------------------------------------------------------------------
# Corroboration score calculation
# ---------------------------------------------------------------------------

def compute_corroboration(sources: list, results: dict, weight_points: dict) -> dict:
    """
    Compute confirmed count, weighted score, max possible score.
    Returns a summary dict used for both printing and the report.
    """
    confirmed_count = 0
    total_count = len(sources)
    earned_points = 0
    max_points = 0

    for source in sources:
        src_id = source["id"]
        weight = source.get("weight", "medium")
        pts = weight_points.get(weight, 2)
        max_points += pts

        result = results.get(src_id, {})
        if result.get("confirmed"):
            confirmed_count += 1
            earned_points += pts

    return {
        "confirmed_count": confirmed_count,
        "total_count": total_count,
        "earned_points": earned_points,
        "max_points": max_points,
        "pct": round((earned_points / max_points * 100) if max_points else 0),
    }


# ---------------------------------------------------------------------------
# Report builder
# ---------------------------------------------------------------------------

def build_report(sources: list, results: dict, score: dict) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    confirmed_count = score["confirmed_count"]
    total_count = score["total_count"]
    earned = score["earned_points"]
    max_pts = score["max_points"]
    pct = score["pct"]

    lines = [
        f"\n## KG Corroboration Report -- {date_str}\n",
        f"\n### Corroboration Score: {confirmed_count} / {total_count} sources confirmed",
        f"  ({earned} / {max_pts} weighted points, {pct}%)\n",
    ]

    confirmed_sources = [s for s in sources if results.get(s["id"], {}).get("confirmed")]
    gap_sources = [s for s in sources if not results.get(s["id"], {}).get("confirmed")]

    # Confirmed section
    lines.append("\n### Confirmed\n")
    if confirmed_sources:
        for source in confirmed_sources:
            src_id = source["id"]
            weight = source.get("weight", "medium")
            result = results.get(src_id, {})
            detail = result.get("detail", "")
            count = result.get("count", 0)
            count_str = f" -- {count} mention(s)" if count and count > 1 else ""
            lines.append(
                f"- [OK] {source['label']} ({weight} weight){count_str}\n"
            )
            if detail:
                lines.append(f"  {detail}\n")
    else:
        lines.append("- None confirmed yet.\n")

    # Gaps section
    lines.append("\n### Gaps (action items)\n")
    if gap_sources:
        for source in gap_sources:
            src_id = source["id"]
            weight = source.get("weight", "medium")
            result = results.get(src_id, {})
            status = result.get("status", "not_found")
            detail = result.get("detail", "")

            status_tag = "[FAIL]" if status not in ("error", "skipped", "no_url") else "[WARN]"
            lines.append(
                f"- {status_tag} {source['label']} ({weight} weight)"
                f" -- {source.get('action_if_gap', 'Investigate.')}\n"
            )
            if detail and "skipped" not in detail and "error" not in detail.lower():
                lines.append(f"  Finding: {detail}\n")
    else:
        lines.append("- No gaps. All sources confirmed.\n")

    # Detail block for confirmed sources with URLs
    urls_to_surface = []
    for source in confirmed_sources:
        src_id = source["id"]
        result = results.get(src_id, {})
        for url in (result.get("urls") or result.get("alive", []) or []):
            if isinstance(url, dict):
                url = url.get("url", "")
            if url:
                urls_to_surface.append({"label": source["label"], "url": url})

    if urls_to_surface:
        lines.append("\n#### Confirmed Source URLs\n")
        for entry in urls_to_surface:
            lines.append(f"- {entry['label']}: {entry['url']}\n")

    lines.append("\n---\n")
    return "".join(lines)


# ---------------------------------------------------------------------------
# Log writer
# ---------------------------------------------------------------------------

def append_report(report_text: str) -> None:
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

    if not os.path.exists(REPORT_PATH):
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            f.write(
                "# KG Corroboration Log\n\n"
                "Weekly Knowledge Graph corroboration tracker for Leon Coe, "
                "generated by `modules/phase9_kg_tracker.py`.\n\n"
                "---\n"
            )

    with open(REPORT_PATH, "a", encoding="utf-8") as f:
        f.write(report_text)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run_kg_tracker() -> int:
    print("--- [Phase 9] KG Corroboration Tracker ---")
    config = _load_sources()
    sources = config["sources"]
    subject = config["subject"]
    weight_points = config.get("weight_points", {"very_high": 4, "high": 3, "medium": 2})

    results = {}

    # --- URL liveness checks ---
    url_sources = [s for s in sources if s.get("check") == "url_liveness"]
    for source in url_sources:
        print(f"  URL check: {source['label']}...")
        results[source["id"]] = check_url_liveness(source)

    # --- Wikidata API ---
    wikidata_source = next((s for s in sources if s.get("check") == "wikidata_api"), None)
    if wikidata_source:
        print("  Querying Wikidata API...")
        results[wikidata_source["id"]] = check_wikidata(wikidata_source, subject)
        wd_status = results[wikidata_source["id"]]["status"]
        print(f"  Wikidata: {wd_status}")

    # --- LLM web research (single call) ---
    web_sources = [s for s in sources if s.get("check") == "web_search"]
    if web_sources:
        print(f"  Running web research via {KG_MODEL} ({len(web_sources)} sources)...")
        web_results = run_web_research(web_sources, subject)
        results.update(web_results)
        confirmed_web = sum(1 for s in web_sources if results.get(s["id"], {}).get("confirmed"))
        print(f"  Web research complete: {confirmed_web}/{len(web_sources)} confirmed")

    # --- Score ---
    score = compute_corroboration(sources, results, weight_points)
    print(
        f"  Corroboration Score: {score['confirmed_count']}/{score['total_count']} sources "
        f"({score['earned_points']}/{score['max_points']} pts, {score['pct']}%)"
    )

    # --- Report ---
    report = build_report(sources, results, score)
    append_report(report)
    print("  Report appended to logs/kg_corroboration_log.md")

    return 0


if __name__ == "__main__":
    sys.exit(run_kg_tracker())
