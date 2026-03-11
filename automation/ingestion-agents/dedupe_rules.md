# Signal Deduplication Rules

This document defines the core deduplication logic for **Signal Hunter** to prevent noise and redundancy in `signals/raw/`. Deduplication ensures the downstream pipeline (Memos and LinkedIn Content) focuses on unique, high-value events rather than repetitive coverage of the same signal.

---

## 1. Why Deduplication is Required
- **Signal Clarity:** Avoid processing the same news event multiple times.
- **Pipeline Efficiency:** Reduce token spend on redundant summaries and analysis.
- **Authority Consistency:** Prevent generating duplicate LinkedIn posts or executive memos for a single announcement.

---

## 2. Primary Deduplication Checks

### Rule 1: URL Match (Exact)
- **Explanation:** Checks if the `source_url` already exists in any file under `signals/raw/`.
- **Example Scenario:** Signal Hunter scans the same OpenAI blog post twice during two different runs.
- **Expected Behavior:** Immediate rejection. If the URL matches, it is a 100% duplicate.

### Rule 2: Event Fingerprint Match (Entity + Activity)
- **Explanation:** A combination check of **Primary Entity** (Company/Person) + **Key Activity** (Action).
- **Example Scenario:** Source A reports "Nvdia releases Blackwell B200" and Source B reports "Nvidia's Blackwell B200 is here."
- **Expected Behavior:** Match identified. The fingerprint `Nvidia + Blackwell_Release` is flagged as a duplicate if it appeared within the last 48 hours.

### Rule 3: Company + Event Type + Time Window
- **Explanation:** Prevents ingestion of the same corporate event reported by different outlets within a 72-hour window.
- **Example Scenario:** Microsoft announces a new healthcare AI partnership. Reuters reports it on Monday; TechCrunch reports it on Tuesday.
- **Expected Behavior:** The Tuesday report is flagged as a duplicate of the Monday report.

### Rule 4: Multi-source Coverage (The 'Echo' Rule)
- **Explanation:** Detects if a high-profile event is being "echoed" across multiple Tier 2 (Supporting) sources after already being captured by a Tier 1 (Core) source.
- **Example Scenario:** A Tier 1 source (Anthropic Blog) releases a signal. Five Tier 2 news outlets cover it hours later.
- **Expected Behavior:** Only the Tier 1 source is preserved. Subsequent Tier 2 signals are discarded.

---

## 3. Dedupe Priority Order
Signal Hunter must check for duplicates in this specific order:
1. **URL Match** (Fastest, 1:1 match)
2. **Event Fingerprint** (Entity/Action match)
3. **Company + Window** (Time-based similarity)
4. **Multi-source Coverage** (Tier-based suppression)

---

## 4. Handling Detected Duplicates
When a duplicate is identified, Signal Hunter must:
1. **Abort File Creation:** Do not create a new `.md` file in `signals/raw/`.
2. **Log the Event:** Log the duplicate attempt in `logs/ingestion/dedupe.log` including the `signal_id` of the original.
3. **Preserve Strongest Source:** Always keep the Tier 1/Primary source. If a Tier 2 source was ingested first and a Tier 1 source appears later, the Tier 1 source should ideally replace/augment the entry if the `status` is still `raw`.

---

## 5. Example Scenario: Model Releases
**Scenario:** OpenAI releases GPT-5.
- **Source 1 (08:00):** OpenAI Blog (Tier 1) - *Ingested as Original.*
- **Source 2 (08:30):** VentureBeat (Tier 1) - *Discarded (Duplicate: Company + Event Type).*
- **Source 3 (09:00):** TechCrunch (Tier 1) - *Discarded (Duplicate: Company + Event Type).*
- **Source 4 (11:00):** Generic News Hub (Tier 2) - *Discarded (Multi-source Echo).*

**Reasoning:** The OpenAI Blog is the primary source of truth. Subsequent reports offer no new "signal," only "noise."

---

## 6. Dedupe Behavior Summary
When Signal Hunter detects a duplicate:
- **ACTION:** **STOP** file generation.
- **UPDATE:** (Optional) Add the secondary source URL to the `duplicate_of` or `source_url` metadata of the original file if supplementary info is present.
- **CLEANUP:** Ensure no orphaned fragments of the duplicate remain in the working directory.
