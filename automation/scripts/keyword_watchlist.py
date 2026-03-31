#!/usr/bin/env python3
import os
import json
import re
import sys
import collections
import datetime

import run_logger


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SCORED_DIR = os.path.join(REPO_ROOT, "signals/scored")
WATCHLIST_FILE = os.path.join(REPO_ROOT, "automation/state/keyword-watchlist.json")

KNOWN_GAP_TERMS = {
    "fractional ai officer": 1.8,
    "agentic ai consulting": 1.6,
    "ai workflow automation": 1.6,
    "ai governance consulting": 1.5,
    "houston energy ai": 1.7,
    "houston healthcare ai": 1.6,
    "houston aerospace ai": 1.5,
    "executive ai training houston": 1.8,
    "ai for energy executives": 1.7,
    "board ai training": 1.6,
    "fractional chief ai officer": 1.8,
    "ai implementation consulting": 1.5,
    "enterprise ai adoption": 1.5,
    "ai change management": 1.4,
    "industrial ai consulting": 1.6,
    "manufacturing ai consulting": 1.6,
    "ai readiness assessment": 1.5,
    "houston ai consultant": 1.9,
    "houston ai expert": 1.7,
    "texas ai consulting": 1.6,
}

STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "in", "to", "is", "are", "for",
    "with", "on", "at", "by", "from", "that", "this", "it", "as", "be",
    "was", "has", "have", "will", "new", "how", "what", "why", "when",
    "its", "not", "but", "up", "we", "our", "you", "your", "their", "can",
    "all", "more", "now", "just", "than", "about", "says"
}


def extract_ngrams(text, n=2):
    """Return normalized word n-grams from the given text."""
    cleaned_text = re.sub(r"[^\w\s]", "", text.lower())
    words = cleaned_text.split()
    if n <= 0 or len(words) < n:
        return []
    return [" ".join(words[i:i + n]) for i in range(len(words) - n + 1)]


def extract_emerging_terms(scored_dir, days_back=7):
    """Scan recent scored files and return frequent title n-grams."""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days_back)
    ngram_counts = collections.Counter()

    if not os.path.isdir(scored_dir):
        return {}

    for filename in os.listdir(scored_dir):
        if not filename.endswith(".md"):
            continue

        filepath = os.path.join(scored_dir, filename)
        if datetime.datetime.utcfromtimestamp(os.path.getmtime(filepath)) < cutoff:
            continue

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except OSError:
            continue

        parts = content.split("---", 2)
        if len(parts) < 3:
            continue

        title = ""
        for line in parts[1].splitlines():
            if line.strip().startswith("title:"):
                title = line.split(":", 1)[1].strip().strip("\"'")
                break

        if not title:
            continue

        ngram_counts.update(extract_ngrams(title, n=2))
        ngram_counts.update(extract_ngrams(title, n=3))

    filtered_terms = {
        term: count
        for term, count in ngram_counts.most_common()
        if count >= 2
    }

    top_terms = {}
    for term, count in filtered_terms.items():
        top_terms[term] = count
        if len(top_terms) == 30:
            break
    return top_terms


def score_opportunities(emerging_terms):
    """Classify emerging terms as confirmed gaps or watchlist items."""
    confirmed_gaps = []
    watch_list = []

    for term, count in emerging_terms.items():
        words = term.split()
        if len(words) == 2 and words[0] in STOPWORDS and words[1] in STOPWORDS:
            continue

        match_multiplier = None
        for gap_term, multiplier in KNOWN_GAP_TERMS.items():
            if gap_term in term or term in gap_term:
                match_multiplier = multiplier
                break

        if match_multiplier is not None:
            confirmed_gaps.append({
                "term": term,
                "count": count,
                "multiplier": match_multiplier,
            })
        else:
            watch_list.append({
                "term": term,
                "count": count,
            })

    confirmed_gaps.sort(key=lambda item: item["multiplier"], reverse=True)
    watch_list.sort(key=lambda item: item["count"], reverse=True)

    return {
        "confirmed_gaps": confirmed_gaps,
        "watch_list": watch_list[:20],
    }


def update_watchlist(opportunities):
    """Merge new opportunities into the persisted watchlist file."""
    now = datetime.datetime.utcnow().isoformat() + "Z"
    watchlist_data = {
        "last_updated": now,
        "confirmed_gaps": [],
        "watch_list": [],
        "summary": {
            "total_confirmed_gaps": 0,
            "total_watching": 0,
            "top_opportunity": None,
        },
    }

    if os.path.exists(WATCHLIST_FILE):
        try:
            with open(WATCHLIST_FILE, "r", encoding="utf-8") as f:
                watchlist_data = json.load(f)
        except (OSError, json.JSONDecodeError):
            pass

    watchlist_data.setdefault("confirmed_gaps", [])
    watchlist_data.setdefault("watch_list", [])

    confirmed_map = {
        item["term"]: item
        for item in watchlist_data["confirmed_gaps"]
        if "term" in item
    }
    for item in opportunities.get("confirmed_gaps", []):
        existing = confirmed_map.get(item["term"], {})
        existing.update(item)
        existing["last_seen"] = now
        confirmed_map[item["term"]] = existing

    watch_map = {
        item["term"]: item
        for item in watchlist_data["watch_list"]
        if "term" in item
    }
    for item in opportunities.get("watch_list", []):
        existing = watch_map.get(item["term"], {})
        existing.update(item)
        existing["last_seen"] = now
        watch_map[item["term"]] = existing

    confirmed_list = sorted(
        confirmed_map.values(),
        key=lambda item: item.get("multiplier", 0),
        reverse=True,
    )
    watch_list = sorted(
        watch_map.values(),
        key=lambda item: item.get("count", 0),
        reverse=True,
    )

    top_opportunity = confirmed_list[0]["term"] if confirmed_list else None
    summary = {
        "total_confirmed_gaps": len(confirmed_list),
        "total_watching": len(watch_list),
        "top_opportunity": top_opportunity,
    }

    watchlist_data["last_updated"] = now
    watchlist_data["confirmed_gaps"] = confirmed_list
    watchlist_data["watch_list"] = watch_list
    watchlist_data["summary"] = summary

    os.makedirs(os.path.dirname(WATCHLIST_FILE), exist_ok=True)
    with open(WATCHLIST_FILE, "w", encoding="utf-8") as f:
        json.dump(watchlist_data, f, indent=2)

    return summary


def run_watchlist_update():
    """Run the full emerging keyword watchlist refresh."""
    print("--- [Watchlist] Emerging Keyword Scanner ---")

    emerging_terms = extract_emerging_terms(SCORED_DIR)
    opportunities = score_opportunities(emerging_terms)
    summary = update_watchlist(opportunities)

    print(
        f"Confirmed gaps: {summary['total_confirmed_gaps']} | "
        f"Watching: {summary['total_watching']} | "
        f"Top opportunity: {summary['top_opportunity']}"
    )
    if summary["total_confirmed_gaps"] > 0:
        print("ALERT: Confirmed gap terms detected  check keyword-watchlist.json")

    try:
        run_logger.update_summary("watchlist", summary)
    except Exception:
        pass

    return 0


if __name__ == "__main__":
    sys.exit(run_watchlist_update())
