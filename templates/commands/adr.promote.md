---
description: Promote a decision from SpecKit research.md or BMAD architecture.md into a formal ADR.
handoffs:
  - label: List ADRs
    agent: adr.list
    prompt: List all existing ADRs
  - label: Create ADR from scratch
    agent: adr.create
    prompt: Create a new ADR
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Promote an informal decision documented in a SpecKit `research.md` (as `## RX:` entries) or a BMAD `architecture.md` (as `### DA-X:` decision anchors) into a formal, governed ADR with status lifecycle and ecosystem traceability.

## Execution Flow

### 1. Identify the source decision

**If `$ARGUMENTS` matches a reference pattern:**
- `specs/<feature>/research.md#R3` → read that specific research entry
- `architecture.md#DA-2` → read that decision from `.bmad_output/planning-artifacts/architecture.md`

**If `$ARGUMENTS` is a feature_id (e.g., `001-bookstore`):**
- Scan `specs/<feature_id>/research.md` for `## R` entries
- Scan `.bmad_output/planning-artifacts/architecture.md` for `### DA-` entries
- Present all found decisions and ask user to pick one (or multiple for batch promotion)

**If no match:**
- Ask user to specify the source file and decision reference.

### 2. Extract decision content

From the source, extract:
- **Title** → ADR H1 title
- **Decision / Chosen option** → Decision Outcome section
- **Rationale / Reasoning** → Context and Problem Statement
- **Alternatives considered** → Considered Options with pros/cons
- **Risks / Consequences** → Negative Consequences

Map to MADR sections:
| Source field | MADR section |
|---|---|
| Decision | Decision Outcome |
| Rationale | Context and Problem Statement |
| Alternatives considered | Considered Options + Pros and Cons |
| Risks | Negative Consequences |

### 3. Determine scope

- If the source is in a feature-specific spec, suggest the domain that aligns with that feature's area.
- If the source is in a global architecture doc, suggest global scope.
- Ask user to confirm or adjust.

### 4. Create the ADR

- Fill the MADR template with extracted content.
- Set `references.speckit_research` or `references.features` to the original source path and anchor.
- Set `status`: "proposed" (even if the decision was already implemented).
- Write the file to the appropriate scope directory.

### 5. Report

```
ADR promoted: .adr/{scope}/YYYYMMDD-{slug}.md
Source: {source_file}#{reference}

The following sections were pre-filled from the source:
  - Context and Problem Statement
  - Considered Options
  - Decision Outcome

Please review and complete:
  - Decision Drivers (why this decision matters)
  - Pros and Cons details
  - Tags
```

## Rules

- The original source document is NEVER modified.
- The ADR MUST include a reference back to the source (traceability).
- If the source decision is vague, ask the user to clarify before creating the ADR.
- Status starts as "proposed" even if the decision was already implemented.
- Multiple decisions from the same research.md can be promoted in batch — create one ADR per decision.
