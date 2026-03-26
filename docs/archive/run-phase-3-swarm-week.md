# Command: Run Phase 3 Swarm Week

Execute one weekly cycle using Jackson Hub swarm orchestration.
Orchestration model and routing rules: `docs/phase-3-swarm-entry.md`

---

## Overview

Three agents. Three roles. One weekly loop.

| Agent | Role |
|---|---|
| Gemini (Claw) | Orchestration, planning, synthesis |
| Claude | Content packaging, markdown formatting |
| Codex | Engineering, repo tasks, automation |

Run in order: Gemini plans → Claude packages → Codex executes → human verifies → commit.

---

## Monday Morning — Gemini Planning Prompt

Copy and run the following prompt with Gemini (Claw):

```
You are the orchestrator for the Houston AI Authority Engine weekly content cycle.

Your inputs are:
- Executive memos in: content/executive-memos/
- Existing posts in: content/linkedin-posts/
- Office Hours hook rules in: templates/office-hours-hook.md
- Phase 2 cadence rules in: docs/phase-2-activation-runbook.md
- Phase 3 routing rules in: docs/phase-3-swarm-entry.md

Your task:
1. Review the memo library and identify the strongest topic(s) for this week.
2. Produce a weekly plan with:
   - Topic focus (1–2 memos to draw from)
   - Post count for the week (3 standard, 5 extended)
   - Which post slot(s) should carry the Office Hours hook (30–40% of posts)
   - Hook variant assignment (A, B, or C) per applicable post
   - Any backlog tasks for Codex (repo hygiene, automation, utilities)
3. Route tasks: mark each item as [Claude], [Codex], or [Human].
4. Output the plan as a structured list. Do not draft posts yet.
```

Review the plan output before proceeding. Adjust topic focus or post count if needed.
Approve the plan, then continue to content packaging.

---

## Tuesday–Wednesday — Claude Content Packaging Prompt

Copy and run the following prompt with Claude:

```
You are packaging content assets for the Houston AI Authority Engine.

Your inputs are:
- Approved weekly plan (provided above or attached)
- Source memos in: content/executive-memos/
- Post format: templates/linkedin-post-template.md
- Hook variants: templates/office-hours-hook.md

Your task:
1. Draft 3–5 LinkedIn posts as individual markdown files.
   - Name each file descriptively (e.g., YYYY-MM-DD-topic-slug.md).
   - Format each post to match templates/linkedin-post-template.md exactly.
   - Each post must be traceable to a specific memo — note the source memo in a comment
     at the top of the file (<!-- source: content/executive-memos/filename.md -->).
2. For posts designated to carry the Office Hours hook:
   - Append the assigned variant verbatim from templates/office-hours-hook.md.
   - Do not modify the variant text.
3. Stage all new files in content/linkedin-posts/.
   Do not publish. Do not modify any existing files.
4. Output a summary: file names created, hook assignments, source memos used.
```

Review all draft posts before the quality gate. Request revisions if tone, structure,
or hook placement is off.

---

## Thursday — Codex Engineering Prompt

Copy and run the following prompt with Codex:

```
You are handling engineering and repo tasks for the Houston AI Authority Engine.

Your inputs are:
- Backlog tasks identified in this week's Gemini plan
- Repo structure reference: docs/phase-3-swarm-entry.md

Your constraints:
- Do not redesign any existing architecture.
- Do not modify content files, templates, or documentation unless explicitly listed in the backlog.
- Scope is limited to: repo hygiene, automation scripts, small utilities, and any structural
  tasks listed in the approved weekly plan.

Your task:
1. Execute each backlog item in order.
2. For each completed task, note: what was done, what file(s) were affected, and why.
3. Stage changes only. Do not commit.
4. If a task is ambiguous or would require touching files outside the approved scope, stop
   and flag it for human review before proceeding.
```

Review Codex output before the quality gate. Confirm no out-of-scope files were touched.

---

## Quality Gate Checklist

Run before committing any output from this cycle.

- [ ] All post files match the format in `templates/linkedin-post-template.md`
- [ ] Hook variants (where used) are copied verbatim from `templates/office-hours-hook.md`
- [ ] No hype language, urgency framing, or engagement-bait phrasing is present in any post
- [ ] Every post includes a source memo comment traceable to `content/executive-memos/`
- [ ] All new files are placed in the correct repo paths
- [ ] No existing files were modified as a side effect
- [ ] Codex changes are limited to the approved backlog scope
- [ ] Human has reviewed and approved all staged content before commit

---

## Commit and Push

Once the quality gate passes, commit all staged changes with a message in this format:

```
Phase 3 week [YYYY-MM-DD]: [N] posts packaged, [summary of Codex tasks if any]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Example:

```
Phase 3 week 2026-03-09: 3 posts packaged, repo hygiene tasks complete

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Then push to `main`.

---

## Friday — Signal Summary and Retrospective

After publishing posts per the Phase 2 cadence, run the weekly retrospective from
`docs/phase-2-activation-runbook.md` (Section 6).

Ask Gemini to synthesize the week's CRM entries into a brief signal summary:

```
Review this week's CRM signal entries and produce a brief summary:
- Total signals logged
- Signal strength distribution (how many at each level)
- Any contacts worth prioritizing for follow-up
- Whether any topic pattern suggests a "double down" or "new memo needed" decision
  (per the criteria in docs/phase-2-activation-runbook.md)
```

Log the summary in your weekly note. Use it as input for next Monday's planning prompt.
