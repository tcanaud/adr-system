---
description: Create a new Architecture Decision Record with scope selection, MADR template, and ecosystem traceability.
handoffs:
  - label: List existing ADRs
    agent: adr.list
    prompt: Show all ADRs to check for related decisions
  - label: Check ADR impact
    agent: adr.impact
    prompt: Find ADRs that apply to the same area
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Create a new ADR using the MADR template. Automatically detect scope, detect ecosystem references (BMAD architecture decisions, SpecKit research, Agreements), and fill the template with the user's decision context.

## Execution Flow

### 0. Load ADR system

- Verify `.adr/` exists. If not, ERROR: "ADR system not found. Run `npx adr-system init` first."
- Read `.adr/_templates/template.md` as the base template.
- List available scopes: `global` + directories under `.adr/domain/` + directories under `.adr/local/`.

### 1. Determine scope

- If `$ARGUMENTS` includes `--scope global` or `--scope <domain>` or `--scope local/<pkg>`, use it.
- Otherwise ask: "Which scope?" and list available options (global + detected domains).
- If user chooses a domain not yet in `.adr/domain/`, create the directory with `template.md` + `index.md`.
- If user chooses local, ask for the monorepo package path, derive folder name (replace `/` with `--`).

### 2. Generate filename

- Date: today in YYYYMMDD format.
- Slug: kebab-case derived from `$ARGUMENTS` title or ask user for a short title.
- Full path: `.adr/{scope}/YYYYMMDD-{slug}.md`
- If a file with the same name exists, ERROR: "ADR already exists at that path."

### 3. Determine `scope.applies_to`

- If global: set to `["**"]`.
- If domain: ask which workspace globs this domain covers (e.g., `["libs/be-*", "apps/api-*"]`), or suggest based on domain name.
- If local: set to the single package path.

### 4. Detect ecosystem context

- **BMAD**: If `_bmad/` or `.bmad/` exists, scan `.bmad_output/planning-artifacts/architecture.md` for decisions matching `### DA-` patterns. Report found decisions as candidate references.
- **Agreements**: If `.agreements/` exists, read `.agreements/index.yaml` and list active agreements. Suggest relevant ones based on title/scope overlap.
- **SpecKit**: If `specs/` exists, scan for `research.md` files and list decision entries matching `## R` patterns.
- Pre-fill `references.features`, `references.agreements`, `references.speckit_research` from detected artifacts.

### 5. Fill the template

- Copy template from `.adr/_templates/template.md`.
- Fill frontmatter:
  - `status`: "proposed"
  - `date`: today (YYYY-MM-DD)
  - `deciders`: from `git config user.name` or ask
  - `tags`: ask user for relevant tags (comma-separated)
  - `scope.level`, `scope.domain`, `scope.applies_to`: from steps 1 and 3
  - `references`: from step 4
- Fill body:
  - H1 title from user input
  - Context and Problem Statement: ask user or derive from `$ARGUMENTS`
  - Leave Decision Drivers, Options, Outcome, Pros/Cons for user to complete

### 6. Write the ADR

- Write to the determined path.
- If the scope's `template.md` doesn't exist, copy it from `_templates/`.
- If the scope's `index.md` doesn't exist, create it.

### 7. Report

```
ADR created: .adr/{scope}/YYYYMMDD-{slug}.md
Status: proposed
Scope: {level} ({domain if applicable})

Ecosystem references detected:
  BMAD:       [list or "none"]
  Agreements: [list or "none"]
  SpecKit:    [list or "none"]

Next steps:
  - Complete the Decision Drivers, Considered Options, and Decision Outcome sections
  - Change status to "accepted" when the decision is approved
```

## Rules

- ADR filenames MUST use `YYYYMMDD-short-title.md` convention.
- Status MUST start as "proposed". Acceptance is a governance step (PR review).
- Keep Context concise. Reference external documents, don't duplicate.
- `scope.applies_to` MUST list specific workspace globs if domain/local scoped.
- NEVER create an ADR with the same filename as an existing one.
- Reserved filenames (template.md, index.md, readme.md, backlog.md) MUST NOT be used for ADRs.
