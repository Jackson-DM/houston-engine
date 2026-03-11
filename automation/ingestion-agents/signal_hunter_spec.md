# Signal Hunter Specification (Phase 5)

## 🎯 Mission
Automate the discovery and collection of high-authority signals related to the Houston AI ecosystem.

## 📡 Signal Sources
- **TMC (Texas Medical Center) Bulletins:** Clinical AI pilots and digital health pilots.
- **Port of Houston Maritime Reports:** Logistics automation and trade-tech updates.
- **Houston Energy News:** AI in oil/gas, energy transitions, and grid resilience.
- **Greater Houston Partnership (GHP):** Macro-economic shifts and corporate tech news.

## 📝 Format Standard
- **Metadata:** Source, Date, Industry, Title.
- **Summary:** Concise summary of the signal.
- **Scoring (50-point model):**
  - Houston Relevance (10)
  - Industry Importance (10)
  - Executive Urgency (10)
  - Authority Potential (10)
  - Consulting Opportunity (10)
- **Total Score:** Sum of the above.
- **Priority Band:** Tier 1 (40+), Tier 2 (30-39), Tier 3 (<30).

## 🤖 Gemini Collection Protocol
1. **Search:** Periodically query Brave Search for defined industry keywords.
2. **Filter:** Identify signals with a "Houston-first" angle.
3. **Draft:** Create a `.md` file in `signals/raw/` with standardized scoring.
4. **Notify:** Ping the orchestrator (Claw) when Tier 1 signals are found.
