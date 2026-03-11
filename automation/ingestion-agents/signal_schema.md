# Raw Signal Schema

This document defines the standardized schema for all raw signal files ingested by **Signal Hunter** and written into `signals/raw/`. Every ingested signal must strictly follow this structure to ensure compatibility with downstream processing (Executive Memos and LinkedIn Content Generation).

## 1. File Naming Convention
Files should be named using the following format:
`YYYY-MM-DD-source-slug-short-title.md`

---

## 2. YAML Frontmatter
Every raw signal file must begin with a YAML frontmatter block containing these exact fields.

| Field | Description | Expected Format | Example Value |
| :--- | :--- | :--- | :--- |
| `signal_id` | Unique identifier for the signal. | UUID or slug | `sig-2026-03-10-nv-01` |
| `collected_at` | ISO 8601 timestamp of ingestion. | YYYY-MM-DDTHH:MM:SSZ | `2026-03-10T20:33:00Z` |
| `source_name` | Name of the signal source. | String | `NVIDIA Newsroom` |
| `source_type` | Medium of the source. | Blog / News / VC / Press | `Company Blog` |
| `source_url` | Direct link to the source material. | URL | `https://nvidianews.nvidia.com/...` |
| `signal_category` | Core theme of the signal. | String | `Industrial AI` |
| `industry` | Target industry sector. | String | `Manufacturing` |
| `geo_relevance` | Geographic focus area. | Global / US / Houston | `Houston` |
| `priority_hint` | Priority for memo generation. | high / medium / low | `high` |
| `confidence` | Reliaiblity of the signal. | 0.0 - 1.0 | `0.95` |
| `duplicate_of` | ID of original if this is a duplicate. | signal_id or null | `null` |
| `status` | Processing state. | raw / triaged / archived | `raw` |

---

## 3. Markdown Body Sections

The body of the file must use these exact headers and follow the prescribed rules for each.

### # Signal Summary
*   **Rule:** Provide a concise 2–4 sentence technical or business explanation of the event.
*   **Focus:** Who did what, when, and how.

### ## Why It Matters
*   **Rule:** Define the business, AI, or operator significance.
*   **Focus:** Competitive advantage, cost reduction, or technical breakthrough.

### ## Houston Relevance
*   **Rule:** Explicitly state the relevance to the Houston market.
*   **Focus:** Direct (local HQ), indirect (energy/logistics impact), or none.

### ## Suggested Angles
*   **Rule:** Provide three specific tactical implications for the content engine.
*   **Focus:**
    *   **Memo Angle:** The executive "so what."
    *   **LinkedIn Angle:** The viral/authority hook.
    *   **CRM Implication:** Potential sales or partnership lead.

---

## 4. Full Example Signal File

```markdown
---
signal_id: sig-2026-03-10-nv-01
collected_at: 2026-03-10T20:45:00Z
source_name: NVIDIA Newsroom
source_type: Company Blog
source_url: https://nvidianews.nvidia.com/news/nvidia-omniverse-expansion-industrial-digital-twins
signal_category: Industrial AI
industry: Manufacturing
geo_relevance: Houston
priority_hint: high
confidence: 1.0
duplicate_of: null
status: raw
---

# Signal Summary
NVIDIA has announced a major expansion of the Omniverse platform specifically targeting industrial digital twins for large-scale energy facilities. The update includes new real-time simulation capabilities for predictive maintenance of offshore rigs and refinery layouts.

## Why It Matters
This represents a shift from general-purpose simulation to specialized industrial "industrial-metaverse" applications. For operators, this means a significant reduction in downtime by simulating repairs in a high-fidelity digital environment before executing them in the physical world.

## Houston Relevance
Highly Direct. Major energy firms headquartered in Houston (ExxonMobil, Chevron, Shell) are primary candidates for this technology. Adoption of these digital twins will likely become a standard for "Cyber Napa" and Gulf Coast energy infrastructure management.

## Suggested Angles
- **Memo Angle:** How digital twin ROI is moving from "experimental" to "mission-critical" for 2026 energy budgets.
- **LinkedIn Angle:** Why the next generation of Houston energy leaders will be "Digital Twin Architects."
- **CRM Implication:** Target CTO/VPs of Operations at Gulf Coast energy majors for digital transformation consulting.
```
