---
description: Find all ADRs that apply to a given monorepo path or workspace package.
handoffs:
  - label: Create ADR for this area
    agent: adr.create
    prompt: Create a new ADR
  - label: List all ADRs
    agent: adr.list
    prompt: List all ADRs in the system
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Given a file path or workspace package name, find all ADRs that apply to it. This enables developers to discover which architectural decisions govern the code they are about to modify.

## Execution Flow

### 1. Determine the target path

- If `$ARGUMENTS` is a file path (e.g., `packages/api/src/auth.ts`), use it directly.
- If `$ARGUMENTS` is a package name (e.g., `@my/api`), try to resolve it to a workspace path.
- If empty, ask the user for a path.

### 2. Collect all ADRs

- Scan `.adr/global/` for `*.md` files (excluding template.md, index.md, readme.md, backlog.md).
- Scan `.adr/domain/*/` for `*.md` files (same exclusions).
- Scan `.adr/local/*/` for `*.md` files (same exclusions).
- For each file, parse the YAML frontmatter to extract: status, scope, tags, title, date.

### 3. Determine applicability

- **Global ADRs**: Always apply to every path. Include all.
- **Domain ADRs**: Check `scope.applies_to` globs against the target path. A glob like `libs/be-*` matches `libs/be-auth/src/index.ts`. Use simple prefix matching (the glob base must be a prefix of the target path).
- **Local ADRs**: Check if the target path starts with the local scope's package path.

### 4. Filter and organize

- Separate active ADRs (proposed, accepted) from historical ones (deprecated, superseded).
- Sort active ADRs by date (newest first).

### 5. Present results

**Active ADRs:**

| Status | Date | Scope | Title | Path |
|--------|------|-------|-------|------|
| accepted | 2026-02-17 | global | Use TypeScript everywhere | .adr/global/20260115-... |
| accepted | 2026-02-01 | domain/backend | Express over Fastify | .adr/domain/backend/... |

**Historical ADRs (superseded/deprecated):**

| Status | Date | Title | Superseded by |
|--------|------|-------|---------------|

### 6. Summary

```
Target: {path}
Active ADRs: N (M global, K domain, L local)
Historical: X superseded, Y deprecated

Tip: Use /adr.create to add a new decision for this area.
```

## Rules

- This command is READ-ONLY. It NEVER modifies any files.
- Global ADRs ALWAYS appear in results.
- Domain ADRs appear only if the path matches their `scope.applies_to`.
- Superseded ADRs are shown separately, never mixed with active ones.
- If frontmatter parsing fails for a file, skip it with a warning.
