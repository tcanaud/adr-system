---
description: List Architecture Decision Records with optional filtering by scope, status, tags, or domain.
handoffs:
  - label: Create ADR
    agent: adr.create
    prompt: Create a new ADR
  - label: Check impact
    agent: adr.impact
    prompt: Find ADRs impacting a specific path
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

List all ADRs in the system, optionally filtered by scope, status, tags, or domain. Provides a quick overview of all architectural decisions.

## Execution Flow

### 1. Parse filters from $ARGUMENTS

Supported filters (can be combined):
- `status:accepted` or `status:proposed` — filter by status
- `scope:global` or `scope:domain` or `scope:local` — filter by scope level
- `domain:backend` — filter by domain name
- `tag:security` — filter by tag
- No filters → show all ADRs

### 2. Scan all ADR files

- Read all `.md` files in `.adr/global/` (excluding template.md, index.md, readme.md, backlog.md).
- Read all `.md` files in `.adr/domain/*/` (same exclusions).
- Read all `.md` files in `.adr/local/*/` (same exclusions).
- For each file, parse the YAML frontmatter to extract: status, date, deciders, tags, scope, title (from H1).

### 3. Apply filters

- If status filter: keep only ADRs matching that status.
- If scope filter: keep only ADRs at that scope level.
- If domain filter: keep only ADRs in that domain directory.
- If tag filter: keep only ADRs whose tags include the specified tag.

### 4. Present results

Sort by date (newest first):

| # | Status | Date | Scope | Title | Tags | Path |
|---|--------|------|-------|-------|------|------|
| 1 | accepted | 2026-02-17 | global | Use ADR system | meta, tooling | .adr/global/20260217-... |
| 2 | accepted | 2026-02-01 | domain/backend | Express over Fastify | backend, framework | .adr/domain/backend/... |
| 3 | proposed | 2026-02-15 | domain/frontend | React Query caching | frontend, caching | .adr/domain/frontend/... |

### 5. Summary

```
Total: N ADRs
  Proposed:   X
  Accepted:   Y
  Deprecated: Z
  Superseded: W

Domains: backend (A), frontend (B), auth (C)
```

## Rules

- This command is READ-ONLY. It NEVER modifies any files.
- Parse frontmatter carefully. If a file has invalid frontmatter, skip it with a warning.
- Always show the file path so the user can navigate to it.
- Sort by date descending (newest first) by default.
- The title is extracted from the first H1 heading in the body, not from the frontmatter.
