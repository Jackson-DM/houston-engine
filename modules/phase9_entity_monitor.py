#!/usr/bin/env python3
"""
Module: phase9_entity_monitor.py
Phase: Phase 9 — Entity Authority & Structured Data Layer
Purpose: Weekly standalone scan of Leon Coe's entity signal health.

Checks:
  1. Broken sameAs / anchor URLs        (HTTP HEAD — no API cost)
  2. Orphan content                      (local file scan — no API cost)
  3. Name consistency                    (LLM web search)
  4. NAP consistency                     (LLM web search)
  5. New press mentions (past 7 days)    (LLM web search)

Output: Formatted hygiene report appended to logs/entity_hygiene_report.md

Usage:
    python modules/phase9_entity_monitor.py

Cron (GitHub Actions — Monday 9am UTC):
    schedule:
      - cron: '0 9 * * 1'
"""

import os
import sys
import json
import requests
from datetime import datetime, timezone, timedelta

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, ".."))

ENTITY_ANCHORS_PATH = os.path.join(REPO_ROOT, "config", "entity_anchors.json")
FINAL_DIR = os.path.join(REPO_ROOT, "content", "final")
REPORT_PATH = os.path.join(REPO_ROOT, "logs", "entity_hygiene_report.md")

# OpenRouter config — Perplexity Sonar has built-in live web search
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MONITOR_MODEL = os.getenv("ENTITY_MONITOR_MODEL", "perplexity/sonar")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# HTTP check settings
URL_TIMEOUT = 10
URL_CHECK_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; HoustonEngine-EntityMonitor/1.0; "
        "+https://github.com/Jackson-DM/houston-engine)"
    )
}


# ---------------------------------------------------------------------------
# Config loader
# ---------------------------------------------------------------------------

def _load_anchors() -> dict:
    with open(ENTITY_ANCHORS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _collect_entity_urls(anchors: dict) -> list:
    """
    Return a flat list of {label, url} dicts for all of Leon's own
    entity surfaces — person + organizations only (not monitored_companies).
    """
    urls = []
    person = anchors.get("person", {})
    for field in ("website", "linkedin", "twitter", "crunchbase", "wikidata"):
        val = person.get(field)
        if val:
            urls.append({"label": f"person.{field}", "url": val})

    for key, org in anchors.get("organizations", {}).items():
        for field in ("url", "linkedin"):
            val = org.get(field)
            if val:
                urls.append({"label": f"org.{key}.{field}", "url": val})

    return urls


# ---------------------------------------------------------------------------
# Check 1 — Broken URL scan (no API cost)
# ---------------------------------------------------------------------------

def _is_ok_status(status: int) -> bool:
    """
    True when the HTTP status indicates the URL is alive.
    403/405 are treated as alive — social platforms (LinkedIn, Twitter/X)
    routinely block automated HEAD requests without the URL being broken.
    """
    if status is None:
        return False
    # Definitive dead: 404 Not Found, 410 Gone, 5xx server errors
    if status in (404, 410) or status >= 500:
        return False
    # Bot-blocking from live social platforms — URL exists
    if status in (403, 405, 429):
        return True
    return status < 400


def check_broken_urls(entity_urls: list) -> dict:
    """HEAD-check every entity anchor URL. Returns result dict."""
    results = []
    broken = []

    for entry in entity_urls:
        label = entry["label"]
        url = entry["url"]
        try:
            resp = requests.head(
                url,
                allow_redirects=True,
                timeout=URL_TIMEOUT,
                headers=URL_CHECK_HEADERS,
            )
            status = resp.status_code
            ok = _is_ok_status(status)
        except requests.exceptions.SSLError:
            try:
                resp = requests.head(
                    url,
                    allow_redirects=True,
                    timeout=URL_TIMEOUT,
                    headers=URL_CHECK_HEADERS,
                    verify=False,
                )
                status = resp.status_code
                ok = _is_ok_status(status)
            except Exception:
                status = None
                ok = False
        except Exception:
            status = None
            ok = False

        result = {"label": label, "url": url, "status": status, "ok": ok}
        results.append(result)
        if not ok:
            broken.append(result)

    return {"results": results, "broken": broken, "broken_count": len(broken)}


# ---------------------------------------------------------------------------
# Check 2 — Orphan content scan (no API cost)
# ---------------------------------------------------------------------------

def check_orphan_content() -> dict:
    """
    Scan content/final/*.json for payloads that are missing a schema_block.
    These are published/ready articles with no JSON-LD attribution.
    """
    orphans = []
    total = 0

    if not os.path.isdir(FINAL_DIR):
        return {"orphans": [], "orphan_count": 0, "total_checked": 0}

    for filename in sorted(os.listdir(FINAL_DIR)):
        if not filename.endswith(".json"):
            continue
        total += 1
        filepath = os.path.join(FINAL_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                payload = json.load(f)
        except Exception:
            continue

        if not payload.get("schema_block"):
            title = (
                payload.get("title")
                or payload.get("id")
                or filename
            )
            orphans.append({"id": payload.get("id", filename), "title": title})

    return {
        "orphans": orphans,
        "orphan_count": len(orphans),
        "total_checked": total,
    }


# ---------------------------------------------------------------------------
# Check 3+4+5 — LLM-powered web research (single API call)
# ---------------------------------------------------------------------------

def _build_research_prompt(anchors: dict) -> str:
    person = anchors.get("person", {})
    name = person.get("name", "Leon Coe")
    title = person.get("jobTitle", "AI Consultant & Strategist")
    website = person.get("website", "")
    linkedin = person.get("linkedin", "")
    twitter = person.get("twitter", "")
    orgs = ", ".join(
        org.get("name", key)
        for key, org in anchors.get("organizations", {}).items()
    )

    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")

    return f"""You are an entity signal analyst performing a weekly health check for {name}.

KNOWN ENTITY PROFILE:
- Full name: {name}
- Title: {title}
- Website: {website}
- LinkedIn: {linkedin}
- Twitter/X: {twitter}
- Organizations: {orgs}

TASK — search the web and answer the following three questions. Return ONLY valid JSON.

QUESTION 1 — NAME CONSISTENCY
Search for "{name}" across web sources. Are there name variants in use (e.g. "Leon J. Coe", "L. Coe", "Leon Coe AI")? Even minor variants fragment the Knowledge Graph entity signal.

QUESTION 2 — NAP CONSISTENCY (Name / Affiliation / Position)
Check LinkedIn, Crunchbase, the website, and any press bio pages. Is the job title consistent? Is the company/affiliation consistent? Flag any surface where the title or company name differs from the canonical profile above.

QUESTION 3 — NEW PRESS MENTIONS (since {cutoff_date})
Search for new web mentions of "{name}" published in the last 7 days. List each one. For each, note whether it contains any incorrect information (wrong title, wrong company, wrong attribution).

REQUIRED JSON OUTPUT (return ONLY valid JSON, no preamble):
{{
  "name_consistency": {{
    "status": "ok" | "warning" | "issue",
    "canonical_name": "{name}",
    "variants_found": [
      {{"variant": "<name variant>", "source": "<URL or site name>"}}
    ],
    "notes": "<summary string>"
  }},
  "nap_consistency": {{
    "status": "ok" | "warning" | "issue",
    "inconsistencies": [
      {{"surface": "<LinkedIn|Crunchbase|website|press>", "field": "<title|company|name>", "found": "<what was found>", "expected": "<canonical value>"}}
    ],
    "notes": "<summary string>"
  }},
  "press_mentions": {{
    "count": <integer>,
    "items": [
      {{
        "title": "<article title>",
        "source": "<publication name>",
        "url": "<URL>",
        "date": "<YYYY-MM-DD or approximate>",
        "has_issue": <true|false>,
        "issue_note": "<description of inaccuracy, or empty string>"
      }}
    ]
  }}
}}"""


def run_web_research(anchors: dict) -> dict:
    """Call a web-search-capable LLM to check name consistency, NAP, and press mentions."""
    if not OPENROUTER_API_KEY:
        return {
            "error": "OPENROUTER_API_KEY not set — web research skipped.",
            "name_consistency": {"status": "skipped", "variants_found": [], "notes": "API key missing."},
            "nap_consistency": {"status": "skipped", "inconsistencies": [], "notes": "API key missing."},
            "press_mentions": {"count": 0, "items": []},
        }

    prompt = _build_research_prompt(anchors)
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MONITOR_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a precise entity signal analyst. "
                    "Search the web for current, accurate information. "
                    "Return ONLY valid JSON — no markdown, no preamble."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    }

    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=90)
        resp.raise_for_status()
        result = resp.json()

        # Record token usage
        usage = result.get("usage", {})
        try:
            sys.path.insert(0, os.path.join(REPO_ROOT, "automation", "scripts"))
            import budget_tracker
            budget_tracker.record_usage(
                MONITOR_MODEL,
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
        return {
            "error": str(e),
            "name_consistency": {"status": "error", "variants_found": [], "notes": str(e)},
            "nap_consistency": {"status": "error", "inconsistencies": [], "notes": str(e)},
            "press_mentions": {"count": 0, "items": []},
        }


# ---------------------------------------------------------------------------
# Score calculation
# ---------------------------------------------------------------------------

def compute_score(url_result: dict, orphan_result: dict, research: dict) -> int:
    """Compute a 0-100 signal health score from all check results."""
    score = 100

    # Broken URLs: -15 each, capped at -40
    url_penalty = min(url_result["broken_count"] * 15, 40)
    score -= url_penalty

    # Orphan content: -5 each, capped at -20
    orphan_penalty = min(orphan_result["orphan_count"] * 5, 20)
    score -= orphan_penalty

    # Name inconsistency
    name_status = research.get("name_consistency", {}).get("status", "ok")
    if name_status == "issue":
        score -= 20
    elif name_status == "warning":
        score -= 10

    # NAP inconsistency
    nap_status = research.get("nap_consistency", {}).get("status", "ok")
    nap_issues = len(research.get("nap_consistency", {}).get("inconsistencies", []))
    if nap_status == "issue" or nap_issues >= 2:
        score -= 20
    elif nap_status == "warning" or nap_issues == 1:
        score -= 10

    return max(score, 0)


def _status_icon(status: str) -> str:
    return {"ok": "OK", "warning": "WARN", "issue": "FAIL",
            "skipped": "SKIP", "error": "ERR"}.get(status, "?")


def _health_label(score: int) -> str:
    if score >= 85:
        return "HEALTHY"
    if score >= 65:
        return "DEGRADED"
    return "CRITICAL"


# ---------------------------------------------------------------------------
# Report builder
# ---------------------------------------------------------------------------

def build_report(
    url_result: dict,
    orphan_result: dict,
    research: dict,
    score: int,
) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    health = _health_label(score)

    name_c = research.get("name_consistency", {})
    nap_c = research.get("nap_consistency", {})
    press = research.get("press_mentions", {})

    name_icon = _status_icon(name_c.get("status", "ok"))
    nap_icon = _status_icon(nap_c.get("status", "ok"))
    broken_n = url_result["broken_count"]
    orphan_n = orphan_result["orphan_count"]
    mention_n = press.get("count", len(press.get("items", [])))

    lines = [
        f"\n## Entity Hygiene Report -- {date_str}\n",
        f"\n### Signal Health: {score}/100 [{health}]\n",
        f"- Name consistency: [{name_icon}]\n",
        f"- NAP consistency: [{nap_icon}]\n",
        f"- Orphan content detected: {orphan_n} article(s)\n",
        f"- Broken sameAs URLs: {broken_n}\n",
        f"- New press mentions (past 7 days): {mention_n}\n",
    ]

    # --- URL details ---
    if url_result["results"]:
        lines.append("\n#### URL Liveness\n")
        for r in url_result["results"]:
            icon = "[OK]" if r["ok"] else "[FAIL]"
            status_str = str(r["status"]) if r["status"] else "no-response"
            lines.append(f"- {icon} `{r['label']}` — {r['url']} ({status_str})\n")

    # --- Orphan content details ---
    if orphan_result["orphan_count"] > 0:
        lines.append("\n#### Orphan Content (missing schema_block)\n")
        for item in orphan_result["orphans"]:
            lines.append(f"- `{item['id']}`\n")
    else:
        lines.append(f"\n#### Orphan Content\n")
        lines.append(f"- All {orphan_result['total_checked']} final article(s) have schema attribution. [OK]\n")

    # --- Name consistency details ---
    lines.append("\n#### Name Consistency\n")
    notes = name_c.get("notes", "")
    if notes:
        lines.append(f"{notes}\n\n")
    variants = name_c.get("variants_found", [])
    if variants:
        for v in variants:
            lines.append(f"- Variant detected: \"{v.get('variant', '?')}\" — source: {v.get('source', '?')}\n")
    else:
        lines.append("- No name variants detected.\n")

    # --- NAP consistency details ---
    lines.append("\n#### NAP Consistency\n")
    nap_notes = nap_c.get("notes", "")
    if nap_notes:
        lines.append(f"{nap_notes}\n\n")
    inconsistencies = nap_c.get("inconsistencies", [])
    if inconsistencies:
        for inc in inconsistencies:
            lines.append(
                f"- [{inc.get('surface', '?')}] {inc.get('field', '?')}: "
                f"found \"{inc.get('found', '?')}\" — expected \"{inc.get('expected', '?')}\"\n"
            )
    else:
        lines.append("- No NAP inconsistencies detected.\n")

    # --- Press mentions ---
    lines.append("\n#### Press Mentions (past 7 days)\n")
    items = press.get("items", [])
    if not items:
        lines.append("- No new mentions found.\n")
    else:
        for item in items:
            flag = " [INACCURACY FLAGGED]" if item.get("has_issue") else ""
            lines.append(
                f"- [{item.get('date', '?')}] {item.get('source', '?')}: "
                f"\"{item.get('title', '?')}\"{flag}\n"
            )
            if item.get("has_issue") and item.get("issue_note"):
                lines.append(f"  - Issue: {item['issue_note']}\n")

    # --- Action items ---
    lines.append("\n### Action Items\n")
    has_action = False

    for r in url_result["broken"]:
        lines.append(f"- [ ] Fix broken URL: `{r['label']}` — {r['url']}\n")
        has_action = True

    for item in orphan_result["orphans"]:
        lines.append(f"- [ ] Add schema attribution to: `{item['id']}`\n")
        has_action = True

    for v in variants:
        lines.append(
            f"- [ ] Verify name variant: \"{v.get('variant', '?')}\" found on {v.get('source', '?')}\n"
        )
        has_action = True

    for inc in inconsistencies:
        lines.append(
            f"- [ ] Fix NAP on [{inc.get('surface', '?')}]: update {inc.get('field', '?')} "
            f"from \"{inc.get('found', '?')}\" to \"{inc.get('expected', '?')}\"\n"
        )
        has_action = True

    for item in items:
        if item.get("has_issue"):
            lines.append(
                f"- [ ] Address inaccuracy in: \"{item.get('title', '?')}\" "
                f"({item.get('source', '?')}) — {item.get('issue_note', '')}\n"
            )
            has_action = True

    if not has_action:
        lines.append("- No action items. Entity signal is clean.\n")

    lines.append("\n---\n")
    return "".join(lines)


# ---------------------------------------------------------------------------
# Log writer
# ---------------------------------------------------------------------------

def append_report(report_text: str) -> None:
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

    # Seed the file with a header if it doesn't exist yet
    if not os.path.exists(REPORT_PATH):
        with open(REPORT_PATH, "w", encoding="utf-8") as f:
            f.write(
                "# Entity Hygiene Report Log\n\n"
                "Weekly entity signal health scans for Leon Coe, "
                "generated by `modules/phase9_entity_monitor.py`.\n\n"
                "---\n"
            )

    with open(REPORT_PATH, "a", encoding="utf-8") as f:
        f.write(report_text)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run_entity_monitor() -> int:
    print("--- [Phase 9] Entity Hygiene Monitor ---")
    anchors = _load_anchors()
    entity_urls = _collect_entity_urls(anchors)

    # Check 1: URL liveness (no API)
    print(f"  Checking {len(entity_urls)} anchor URLs...")
    url_result = check_broken_urls(entity_urls)
    print(f"  URL check complete: {url_result['broken_count']} broken")

    # Check 2: Orphan content (no API)
    print("  Scanning content/final/ for orphan articles...")
    orphan_result = check_orphan_content()
    print(f"  Orphan scan complete: {orphan_result['orphan_count']} orphans / {orphan_result['total_checked']} checked")

    # Checks 3+4+5: LLM web research
    print(f"  Running web research via {MONITOR_MODEL}...")
    research = run_web_research(anchors)
    if research.get("error"):
        print(f"  [WARNING] Web research error: {research['error']}")
    else:
        name_status = research.get("name_consistency", {}).get("status", "?")
        nap_status = research.get("nap_consistency", {}).get("status", "?")
        mention_n = len(research.get("press_mentions", {}).get("items", []))
        print(f"  Web research complete: name={name_status}, NAP={nap_status}, mentions={mention_n}")

    # Score
    score = compute_score(url_result, orphan_result, research)
    health = _health_label(score)
    print(f"  Signal Health Score: {score}/100 [{health}]")

    # Build and append report
    report = build_report(url_result, orphan_result, research, score)
    append_report(report)
    print(f"  Report appended to logs/entity_hygiene_report.md")

    return 0


if __name__ == "__main__":
    sys.exit(run_entity_monitor())
