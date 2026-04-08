#!/usr/bin/env python3
"""
Phase 10 Output Formatter
Formats generated articles into LinkedIn-ready plain text and writes to output directory.
"""

import os
import re
from datetime import datetime

from backlinks_loader import format_backlinks_footer

REPO_ROOT = os.path.abspath(os.path.dirname(__file__))


def slugify(text):
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:60].rstrip("-")


def strip_markdown(text):
    """Remove any residual markdown syntax from generated content."""
    # Remove headers
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    # Remove bold/italic
    text = re.sub(r"\*{1,3}(.+?)\*{1,3}", r"\1", text)
    text = re.sub(r"_{1,3}(.+?)_{1,3}", r"\1", text)
    # Remove links but keep text
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # Remove images
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", text)
    return text


def format_article(content, brand_key):
    """Format article content for LinkedIn and append backlinks footer."""
    # Strip any residual markdown
    formatted = strip_markdown(content)
    # Ensure proper paragraph spacing
    formatted = re.sub(r"\n{3,}", "\n\n", formatted)
    formatted = formatted.strip()
    # Append backlinks
    footer = format_backlinks_footer(brand_key)
    if footer:
        formatted = formatted + "\n\n" + footer
    return formatted


def write_article(content, brand_key, topic_title, config):
    """Write formatted article to the output directory."""
    output_template = config.get("output_path", "outputs/phase10_content/{brand}/{date}_{slug}.md")
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    slug = slugify(topic_title)

    rel_path = output_template.format(brand=brand_key, date=date_str, slug=slug)
    full_path = os.path.join(REPO_ROOT, rel_path)

    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    formatted = format_article(content, brand_key)

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(formatted)

    return {
        "path": rel_path,
        "full_path": full_path,
        "word_count": len(formatted.split()),
    }
