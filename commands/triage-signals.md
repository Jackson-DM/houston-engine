# Command: Triage Signals

**Purpose:** Evaluate incoming signals and determine which deserve executive memo generation.

---

# Workflow

1. Review all new files in `signals/raw`
2. Score each signal using the official signal scoring model
3. Assign a total signal score out of 50
4. Label each signal by priority band
5. Move strong signals to `signals/triaged`
6. Archive weak or low-relevance signals
7. Flag the top memo candidate for synthesis

---

# Scoring Criteria

Each signal must be scored across five dimensions:
- Houston Relevance
- Industry Importance
- Executive Urgency
- Authority Potential
- Consulting Opportunity

---

# Priority Bands

**Tier 1**
40–50 | High-priority memo candidate

**Tier 2**
30–39 | Monitor and compare against stronger signals

**Tier 3**
Below 30 | Archive unless it supports a stronger cluster

---

# Output

The triage process should produce:
1. scored signal files in `signals/triaged`
2. archived low-value signals in `signals/archive`
3. a clearly identified top signal or signal cluster for memo generation

---

# Operator Rule

Do not promote signals based only on novelty or recency. Promote signals based on strategic value, executive relevance, and authority-building potential.
