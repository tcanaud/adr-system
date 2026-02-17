---
description: Mark an existing ADR as superseded and create the replacement ADR.
handoffs:
  - label: List ADRs
    agent: adr.list
    prompt: List all ADRs to find the one to supersede
  - label: Check impact
    agent: adr.impact
    prompt: Check what is impacted by the superseded ADR
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Supersede an existing ADR with a new one. The old ADR is marked as "superseded by {slug}" with a link to the replacement. The new ADR records why the previous decision was reversed and what replaces it.

## Execution Flow

### 1. Identify the ADR to supersede

- If `$ARGUMENTS` contains a filename or path (e.g., `20260201-express-over-fastify`), locate that ADR in `.adr/`.
- If `$ARGUMENTS` is vague, list ADRs with status "accepted" or "proposed" and ask the user to pick.
- Verify the ADR exists. ERROR if not found.
- Read the old ADR's frontmatter and body.

### 2. Collect replacement context

- Ask: "Why is this decision being superseded?"
- Ask: "What is the new decision?"
- The user's answers will populate the new ADR's Context and Decision Outcome.

### 3. Create the new ADR

- Use the MADR template from `.adr/_templates/template.md`.
- Place in the **same scope** as the old ADR.
- Filename: `YYYYMMDD-{new-slug}.md`
- Fill frontmatter:
  - `status`: "proposed"
  - `relations.supersedes`: path to the old ADR
  - Copy `scope` from the old ADR
  - Copy relevant `tags` from the old ADR
- Fill body:
  - H1: new decision title
  - Context: "This ADR supersedes [{old title}]({relative path}). The previous decision was: {summary}. It is being replaced because: {user's reason}."
  - Decision Outcome: the new decision from step 2
- Write the new ADR file.

### 4. Update the old ADR

- Change `status` to: `"superseded by YYYYMMDD-{new-slug}"`
  (This format is parsed by log4brains to create a link)
- Write the updated old ADR back.

### 5. Report

```
Superseded: .adr/{scope}/YYYYMMDD-{old-slug}.md
  Status: superseded by YYYYMMDD-{new-slug}

Created:    .adr/{scope}/YYYYMMDD-{new-slug}.md
  Status: proposed
  Supersedes: YYYYMMDD-{old-slug}

Next steps:
  - Review and complete the new ADR (Pros/Cons, Decision Drivers)
  - Get the new ADR reviewed and accepted
```

## Rules

- An ADR with status "superseded" MUST have the superseding slug in the status field (log4brains format).
- The new ADR MUST have `relations.supersedes` pointing to the old ADR.
- The old ADR content is NEVER deleted — only its status changes.
- The new ADR MUST explain why the old decision was reversed.
- Both ADRs MUST be in the same scope directory.
