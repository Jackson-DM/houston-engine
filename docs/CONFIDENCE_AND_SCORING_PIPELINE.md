# How Scoring & Confidence Work in the Engine
_A plain-language breakdown of what the numbers actually mean_

---

## The Big Picture

Every piece of news the engine collects goes through a five-stage pipeline before it ever becomes a LinkedIn post. At each stage, the system is asking one question: **is this worth continuing?**

The scores and confidence values are how it answers that question — automatically, without anyone having to read every article.

```
Collect news → Score it → Extract insight → Write a draft → Polish it
```

---

## Stage 1 — Collecting Signals

The engine pulls articles from RSS feeds across AI, enterprise tech, and industry news sources. Every article that comes in gets a default confidence tag of **0.85** — basically the system saying "I don't know much about this yet, but it seems credible enough to look at."

Nothing gets filtered here. It's just collection.

- Max articles collected per run: **5** (adjustable)

---

## Stage 2 — Scoring (This Is Where "What Does 80 Mean?" Gets Answered)

This is the most important stage. Every article gets a **score out of 100** based on a keyword analysis. No AI involved here — it's a deterministic point system.

### What actually builds the score

The score is built from three buckets:

**Bucket 1 — Who's talking? (up to 25 pts)**
Is this from a major AI player? NVIDIA, OpenAI, Anthropic, Microsoft, Google Cloud, AWS, Databricks, Palantir all get a boost (+15). Company blog posts get a bonus on top of that (+10). General news outlets get a smaller bonus (+5).

**Bucket 2 — What's the topic? (up to 30 pts)**
The system scans for strategic keywords:
- Words like `agent`, `autonomous`, `swarm` → these signal AI doing real work, not just being talked about
- Words like `enterprise`, `deployment`, `governance` → signals business adoption, not just research
- Words like `compute`, `h100`, `blackwell` → signals serious infrastructure investment

**Bucket 3 — Is it relevant to Houston? (up to 25 pts)**
- Mentions of `manufacturing`, `refinery`, `logistics`, `port`, `energy`, `oil`, `gas` all add points
- The word `houston` in the text adds **25 points by itself**
- `texas` adds 10

**Penalty**
If the article is about gaming, smartphones, celebrity, consumer products, rumors, or leaks — **–20 points**. The engine is built for operators and executives, not general tech news.

### So what does a score of 80 actually mean?

An **80** means the article hit near-maximum across multiple buckets. Something like: a major AI lab (NVIDIA or Anthropic) published a blog post about enterprise agent deployment in industrial or logistics contexts — and Houston or Texas got mentioned. That's a signal the engine considers highly worth acting on.

A **score of 45** might mean: interesting topic, credible source, but no strong Houston/Texas connection and no agentic or enterprise deployment keywords.

A **score of 15** means: probably consumer-facing, off-topic, or from a low-authority source. Gets archived automatically.

### The four tiers

| Score | Tier | What Happens |
|---|---|---|
| 60+ | **Publish** | Moves forward automatically |
| 40–59 | **Candidate** | Moves forward only if score hits the insight threshold (default 60) |
| 20–39 | **Archive** | Stored but not processed further |
| Below 20 | **Ignore** | Archived, effectively discarded |

> There's also a reserved "AI adjustment" slot (–8 to +12 points) that isn't active yet — this would eventually let an LLM nudge scores up or down based on context the keywords can't capture.

---

## Stage 3 — Extracting the Insight

Signals that clear the scoring threshold get sent to an AI model (currently Gemini) which reads the article and produces a structured insight artifact. Think of this as the engine asking: *"Okay, this matters — but why, specifically?"*

The model returns:
- A **summary** of the signal
- **Why it matters** strategically
- The **business implication** (cost, risk, competitive pressure, workforce)
- The **regional angle** — how does this connect to Houston specifically?
- Several **content angles** to potentially write about
- A **recommended angle** — the best one to pursue
- A **confidence score** (0.0 to 1.0)

### What does the confidence score mean here?

This is the model rating its own certainty that the insight it extracted is solid. If the article was clear, specific, and well-sourced, confidence will be high (0.85–0.95). If the signal was vague or the implications were hard to pin down, it might come back at 0.40–0.60.

| What the model returns | What it becomes |
|---|---|
| `"high"` | 0.95 |
| `"med"` | 0.75 |
| `"low"` | 0.40 |
| A number like `0.82` | Used as-is |

---

## Stage 4 — Writing the Draft

Insights with a confidence of **0.70 or higher** move forward to draft generation. Anything below that gets skipped — the model wasn't confident enough in what it extracted, so it won't become content.

The draft model produces a full LinkedIn post broken into parts:
- **Hook** — the opening line designed to stop the scroll
- **Body** — the insight, explained
- **Closing** — the wrap-up
- **CTA** — a call to action that invites real engagement (not just "what do you think?")
- **Full text** — the assembled post

Only **1 draft is generated per pipeline run** by default, to keep quality high and avoid flooding the content queue.

---

## Stage 5 — Humanization (Polishing the Draft)

Every draft goes through one final pass where a model rewrites it to remove AI-sounding language. Words like *testament*, *pivotal*, *landscape*, *underscores* get flagged and replaced. The goal is for the post to sound like it came from someone who's been in the room — not from a chatbot.

The strategic content doesn't change. Only the voice and rhythm do.

Up to **2 posts are humanized per run**.

---

## The Full Chain in One View

```
Article collected (confidence: 0.85 default)
    ↓
Scored (0–100 based on keywords)
    ↓
Score < 40?  → Archived, done
Score 40–59? → Only proceeds if score hits insight threshold (default 60)
Score 60+?   → Proceeds automatically
    ↓
AI extracts insight + assigns confidence (0.0–1.0)
    ↓
Confidence < 0.70? → Skipped, not drafted
Confidence ≥ 0.70? → Draft generated
    ↓
Draft humanized → lands in content/final/ ready for review
```

---

## Key Numbers to Remember

| Number | What It Is |
|---|---|
| **60** | Minimum score to proceed to insight extraction |
| **0.70** | Minimum confidence for an insight to become a draft |
| **0.85** | Default confidence assigned to new signals (before AI analysis) |
| **80** (score) | Near-maximum — strong source, strong topic, strong regional relevance |
| **5** | Max articles ingested per run |
| **1** | Max drafts generated per run |
| **2** | Max posts humanized per run |
