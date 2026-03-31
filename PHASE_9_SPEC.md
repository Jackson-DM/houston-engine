# Houston AI Authority Engine — Phase 9 Spec
**Entity Authority & Structured Data Layer**

> **Purpose:** Transform Leon Coe from a content producer into a *recognized entity* — a named, corroborated person in the knowledge graph with structured data signals that feed Google, LLMs, and AI-powered search engines.

---

## Overview

Phase 8 taught the engine *what* to produce and *how* to produce it. Phase 9 teaches the engine to *protect and amplify Leon's identity signal* at the infrastructure level.

By the end of Phase 9, every article the pipeline produces will carry JSON-LD structured data, every draft will pass a brand voice consistency check, Leon's entity footprint will be monitored weekly for drift, and a corroboration gap report will continuously surface actionable steps to strengthen his Knowledge Graph presence.

**This is the phase where Leon stops being a website and becomes a person the internet recognizes.**

---

## Phase 9 Modules

### Module 1 — Schema Block Generator
**File:** `modules/phase9_schema_generator.py`

**What it does:**
Appends a JSON-LD structured data block to every finalized article draft. The schema type is determined by the content classifier output from Phase 8.

**Schema type routing:**
| Content type | JSON-LD type |
|---|---|
| Opinion / thought leadership | `Article` + `Person` authorship |
| How-to / tutorial | `HowTo` |
| FAQ or explainer | `FAQPage` |
| News / event coverage | `NewsArticle` |
| Industry report | `Report` + `Article` |

**Person block (appended to all schemas):**
```json
{
  "@type": "Person",
  "name": "Leon Coe",
  "jobTitle": "AI Consultant",
  "url": "https://[leon-domain].com",
  "sameAs": [
    "https://linkedin.com/in/[leon-linkedin]",
    "https://twitter.com/[leon-twitter]",
    "https://crunchbase.com/person/[leon-crunchbase]"
  ]
}
```

**Implementation notes:**
- Schema is injected as a `<script type="application/ld+json">` block at article export time
- All `sameAs` URLs are pulled from a config file (`config/entity_anchors.json`) — update once, propagate everywhere
- Log schema type selected per article in the run summary

**Output added to article payload:**
```json
{
  "schema_block": "<script type='application/ld+json'>{ ... }</script>",
  "schema_type": "HowTo"
}
```

---

### Module 2 — Brand Voice Guardian
**File:** `modules/phase9_voice_guardian.py`

**What it does:**
Every humanized draft passes through a voice consistency scoring pass before it enters the output queue. Scores the draft against Leon's defined voice profile and flags or soft-blocks drafts that drift.

**Leon's voice profile (seed definition — refine over time):**
- **Tone:** Authoritative but accessible. Not academic. Not hype.
- **Sentence rhythm:** Short declarative sentences preferred. Occasional longer structured sentences for emphasis.
- **Vocabulary:** Avoids jargon without explanation. Uses Houston-native references where natural. Never uses "delve", "navigate", "landscape", "it's worth noting", or "in today's rapidly evolving."
- **POV:** First-person preferred for opinion. Third-person acceptable for reports.
- **Forbidden phrases:** (loaded from `config/voice_blocklist.txt`)

**Scoring method:**
Send the draft + voice profile to Claude with a structured scoring prompt. Return:
```json
{
  "voice_score": 87,
  "flags": ["Contains forbidden phrase: 'in today's rapidly evolving'", "Paragraph 3 sentence rhythm inconsistent with profile"],
  "recommendation": "pass" | "revise" | "block"
}
```

**Thresholds:**
| Score | Action |
|---|---|
| 90–100 | Auto-pass |
| 75–89 | Pass with flag logged |
| 60–74 | Soft-block — append revision note to draft |
| < 60 | Hard-block — draft held, alert logged |

**Config file:** `config/voice_profile.json`
Document Leon's voice profile here. Update it as the voice evolves. The guardian reads this file on every run — no code changes needed to update voice rules.

---

### Module 3 — Entity Hygiene Monitor
**File:** `modules/phase9_entity_monitor.py`

**What it does:**
A cron-triggered scan (runs weekly, separate from the 6-hour content cron) that checks Leon's entity signal health across key surfaces and logs a hygiene report.

**What it checks:**
1. **Name consistency** — Does "Leon Coe" appear consistently across known profiles, or are there variations ("Leon A. Coe", "L. Coe", etc.) that could fragment the entity signal?
2. **NAP consistency** (Name / Affiliation / Position) — Is the same job title and company name used across LinkedIn, Crunchbase, website, press mentions?
3. **Orphan content** — Are there published articles or mentions where Leon is not properly attributed (no byline schema, no `sameAs` link)?
4. **Broken `sameAs` URLs** — Are all entity anchor URLs in `config/entity_anchors.json` still live and resolving?
5. **New press mentions** — Via RSS or web search, surface any new Leon mentions in the past 7 days. Log them. Flag any that contain incorrect information.

**Output:** Weekly hygiene report appended to `logs/entity_hygiene_report.md`

**Report format:**
```
## Entity Hygiene Report — [DATE]

### Signal Health: [SCORE]/100
- Name consistency: ✅ / ⚠️ / ❌
- NAP consistency: ✅ / ⚠️ / ❌
- Orphan content detected: [N articles]
- Broken sameAs URLs: [N]
- New press mentions: [N]

### Action items:
- [ ] Fix broken sameAs: [URL]
- [ ] Add schema attribution to: [article title]
- [ ] Verify name variant: "Leon A. Coe" found on [source]
```

---

### Module 4 — Knowledge Graph Corroboration Tracker
**File:** `modules/phase9_kg_tracker.py`

**What it does:**
Tracks Leon's cross-source corroboration score — the number of independent, authoritative sources that reference Leon Coe by name with consistent entity signals. Higher corroboration = stronger Knowledge Graph entity = higher chance of Knowledge Panel.

**Tracked corroboration sources:**
| Source | Weight | Check method |
|---|---|---|
| LinkedIn profile | High | URL alive + name match |
| Crunchbase | High | URL alive + name match |
| Wikidata | Very High | API query |
| Google Scholar / Academia | Medium | Search query |
| Houston Business Journal mentions | High | RSS / search |
| InnovationMap mentions | High | RSS / search |
| Speaking bio pages | Medium | URL check |
| Podcast guest appearances | Medium | Search |
| University/org affiliation pages | High | Search |

**Output:** Weekly corroboration score appended to `logs/kg_corroboration_log.md`

**Report format:**
```
## KG Corroboration Report — [DATE]

### Corroboration Score: [N] / [MAX] sources confirmed

### Confirmed:
- ✅ LinkedIn (high weight)
- ✅ Houston Business Journal — 3 mentions

### Gaps (action items):
- ❌ Wikidata — no entry found → SUBMIT
- ❌ Crunchbase — profile incomplete → UPDATE
- ⚠️ Speaking bios — 2 of 4 URLs broken → FIX
```

**Gap list is actionable.** Every gap is a task Leon or Jackson can execute in < 30 minutes to directly improve entity authority.

---

## New Config Files

| File | Purpose |
|---|---|
| `config/entity_anchors.json` | All `sameAs` URLs for Leon — LinkedIn, Crunchbase, Twitter, website, Wikidata |
| `config/voice_profile.json` | Leon's brand voice definition used by the Voice Guardian |
| `config/voice_blocklist.txt` | Forbidden phrases list — one per line |
| `config/schema_routing_rules.json` | Maps content_type tags (from Phase 8 classifier) to JSON-LD schema types |

---

## New Log Files

| File | Contents |
|---|---|
| `logs/entity_hygiene_report.md` | Weekly entity hygiene scan output |
| `logs/kg_corroboration_log.md` | Weekly KG corroboration tracker output |
| `logs/voice_guardian_log.md` | Per-run voice scoring results |
| `logs/schema_log.md` | Per-article schema type selected and block generated |

---

## Integration Points with Phase 8

Phase 9 modules slot into the existing Phase 8 pipeline at two points:

**At article finalization (per-run):**
```
[Phase 8 output] → voice_guardian.py → schema_generator.py → [final article payload]
```

**On weekly cron (separate schedule):**
```
entity_monitor.py → kg_tracker.py → append to log files → (optional) Telegram alert summary
```

The weekly cron can be a separate GitHub Actions workflow triggered on `schedule: cron: '0 9 * * 1'` (Monday 9am UTC).

---

## Implementation Sequence

Build in this order to minimize dependencies:

1. **`config/entity_anchors.json`** — Populate Leon's entity URLs. All other modules depend on this.
2. **`config/voice_profile.json` + `voice_blocklist.txt`** — Define voice before building the guardian.
3. **`phase9_schema_generator.py`** — Highest SEO impact, lowest complexity. Ship first.
4. **`phase9_voice_guardian.py`** — Depends on voice config files being populated.
5. **`phase9_entity_monitor.py`** — Depends on `entity_anchors.json` for URL checks.
6. **`phase9_kg_tracker.py`** — Builds on entity monitor; add after monitor is confirmed working.

---

## Claude Code Session Prompts

Use these as your opening prompts when building each module in Claude Code:

**Module 1 — Schema Generator:**
```
Read PHASE_9_SPEC.md Module 1. Build modules/phase9_schema_generator.py for the Houston AI Authority Engine. It should accept the article payload dict from Phase 8, determine schema type from content_type tag, generate the appropriate JSON-LD block, and return the updated payload with schema_block and schema_type fields added. Load entity anchors from config/entity_anchors.json. Log schema type per article to logs/schema_log.md.
```

**Module 2 — Voice Guardian:**
```
Read PHASE_9_SPEC.md Module 2. Build modules/phase9_voice_guardian.py. It should accept a draft string, load the voice profile from config/voice_profile.json and forbidden phrases from config/voice_blocklist.txt, send a scoring prompt to Claude via the existing LLM call pattern in this repo, return a score + flags + recommendation, and log results to logs/voice_guardian_log.md. Apply thresholds as defined in the spec.
```

**Module 3 — Entity Monitor:**
```
Read PHASE_9_SPEC.md Module 3. Build modules/phase9_entity_monitor.py as a standalone script (not part of the 6-hour cron). It should check name consistency, NAP consistency, broken sameAs URLs from config/entity_anchors.json, and surface new press mentions via web search. Output a formatted hygiene report appended to logs/entity_hygiene_report.md.
```

**Module 4 — KG Tracker:**
```
Read PHASE_9_SPEC.md Module 4. Build modules/phase9_kg_tracker.py. Check corroboration sources from the table in the spec, score each by weight, generate a gap list, and append a weekly report to logs/kg_corroboration_log.md. Run as part of the weekly cron alongside entity_monitor.py.
```

---

## Success Criteria for Phase 9 Complete

- [ ] Every article payload exiting the pipeline includes a valid JSON-LD block
- [ ] No draft with a voice score < 60 reaches the output queue
- [ ] Weekly entity hygiene report generates without error
- [ ] Weekly KG corroboration report generates without error and produces an actionable gap list
- [ ] `config/entity_anchors.json` is populated with all known Leon entity URLs
- [ ] `config/voice_profile.json` reflects Leon's actual documented voice

---

## Phase 10 Preview

Phase 10 is the **"State of AI in Houston" Annual Report Machine** — synthesizing months of tagged, scored pipeline output into a flagship intelligence document that becomes Leon's link magnet, LLM citation anchor, and primary media moment each year.

Phase 10 begins accumulating data as soon as Phase 8 is stable. The first report is realistically shippable Q4 2026.

---

*Spec authored: 2026-03-30 | Jackson Miller — Amplify Intelligence*
