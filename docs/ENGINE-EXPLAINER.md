# Houston AI Authority Engine — Plain English Explainer

## What this repo is (in one sentence)
The Houston AI Authority Engine is an automated system that scans important AI news, decides what actually matters, turns those signals into strategic insights, generates authority-style content drafts, humanizes the writing, and stores the results for review.

In simpler terms:
> It’s an AI industry monitoring and content generation engine that runs automatically. It wakes up every 6 hours, checks for new AI developments, analyzes them, and produces polished content drafts.

---

# The Big Picture
Here is the full pipeline:

**RSS Feeds**
↓
**Signal Ingestion**
↓
**Signal Scoring**
↓
**Insight Extraction**
↓
**Content Draft Generation**
↓
**Humanization**
↓
**Commit results back to the repo**

GitHub Actions runs this entire flow automatically.

---

# Why this system exists
There is too much AI news and most of it is noise. This system automates the process of:
1. Finding meaningful AI developments
2. Filtering out the junk
3. Understanding why something matters
4. Turning it into useful authority content

Instead of manually doing research every day, the engine does it continuously.

---

# The Major Stages of the System

## 1. Signal Ingestion
The engine first collects AI signals from RSS feeds.
Example sources:
- NVIDIA
- OpenAI
- Anthropic
- VentureBeat
- TechCrunch

**Script responsible:** `automation/scripts/ingest_signal_hunter.py`

**What happens:**
1. RSS feeds are checked
2. New signals are detected
3. Duplicates are ignored
4. New signals are written into `signals/raw/`

The system keeps memory using: `automation/state/signal-hunter-seen-signals.json`. This prevents reprocessing the same article repeatedly.

---

## 2. Signal Scoring
Once signals are collected, they are scored.
**Script:** `automation/scripts/score_signals.py`

The scoring engine asks:
> Is this signal strategically important?

Signals are evaluated based on things like:
- AI lab authority (NVIDIA, OpenAI, Anthropic)
- Enterprise AI developments
- Agentic systems
- Robotics
- Industrial AI
- Manufacturing
- Energy
- Logistics
- Healthcare

The system also penalizes low-value signals like:
- Gaming news
- Consumer fluff
- Rumor/leak content

### Scoring Tiers
Signals are routed into categories:
- **Publish** — extremely important signal
- **Candidate** — potentially important
- **Archive** — low value
- **Ignore** — irrelevant

Files go to: `signals/scored/` or `signals/archive/`. This stage is the **editorial filter** of the system.

---

# 3. Insight Extraction
Now the system asks:
> Why does this signal actually matter?

**Script:** `automation/scripts/extract_signal_insights.py`

Using an LLM via OpenRouter, the system generates structured insight artifacts containing:
- Summary
- Why it matters
- Business implication
- Industry angle
- Content angles
- Recommended narrative
- Confidence score

Outputs go to: `signals/insights/`. At this point, the system has transformed raw news into **strategic intelligence**.

---

# 4. Content Draft Generation
Now the engine turns insights into content.
**Script:** `automation/scripts/generate_authority_drafts.py`

It produces LinkedIn-style drafts with:
- Hook
- Body
- Closing
- CTA
- Full post

Files are written to: `content/drafts/`. The engine also tracks which insights have already been used.
**State file:** `automation/state/generated-drafts.json`

---

# 5. Humanization
Drafts can still sound too AI-generated. So the system applies a humanization step.
**Script:** `automation/scripts/humanize_authority_drafts.py`

This uses Leon's `humanizer.md` guidance to:
- Reduce AI tone
- Vary sentence rhythm
- Remove generic marketing fluff
- Improve readability

Outputs go to: `content/final/`. These are the **best content outputs** produced by the system.

---

# Run Logging
Every run generates a run summary: `automation/logs/latest-run-summary.json`

Example metrics:
- Signals ingested
- Duplicates skipped
- Publish signals
- Candidate signals
- Insights generated
- Drafts generated
- Humanized outputs
- Errors

This helps monitor system health.

---

# Automation via GitHub Actions
The entire system runs automatically using GitHub Actions.
**Workflow file:** `.github/workflows/signal-hunter.yml`

**The schedule is:** `17 */6 * * *` (Run every 6 hours).

GitHub launches a temporary server that:
1. Checks out the repo
2. Installs dependencies
3. Runs the pipeline
4. Commits results back to the repo

No local machine or droplet is required.

---

# How to Use the Repo
**Most of the time:** Just let it run.
Check:
- `content/final/`
- `automation/logs/latest-run-summary.json`

If you want to run it manually:
GitHub → Actions → Signal Hunter Ingestion → Run workflow.

---

# What the Repo Produces
Over time the repo builds a library of:
- Signals
- Insights
- Drafts
- Final humanized posts

This creates a **content idea engine**.

---

# Simple Explanation
If someone asks what this repo does:
> It’s an automated AI signal intelligence engine that finds meaningful AI news, explains why it matters, turns it into authority content drafts, and runs automatically every 6 hours.
