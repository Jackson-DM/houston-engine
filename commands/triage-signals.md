# Command: Triage Signals

**Purpose:** Evaluate incoming signals and determine which deserve executive memo generation.

**Process:**
1. Identify new signals in `signals/raw`
2. Evaluate signal importance
3. Score signals using the signal scoring model
4. Move high-value signals to `signals/triaged`
5. Archive low-priority signals

**Signal scoring criteria:**
• Houston relevance
• industry importance
• executive urgency
• authority potential
• consulting opportunity
