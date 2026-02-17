# Architecture Decision Records

This directory contains all Architecture Decision Records (ADR) for the project.

> An ADR captures a single architectural decision. The collection of all ADRs
> constitutes the project's decision log. ADRs are immutable — only their
> status can change.

## Structure

```
.adr/
├── README.md                       # This file
├── _templates/
│   └── template.md                 # MADR template
├── global/                         # Decisions that apply to the entire project
│   ├── template.md                 # log4brains template (copy)
│   ├── index.md                    # Scope landing page
│   └── YYYYMMDD-decision-title.md  # ADR files
├── domain/                         # Decisions scoped to a domain
│   └── <domain-name>/
│       ├── template.md
│       ├── index.md
│       └── YYYYMMDD-decision-title.md
└── local/                          # Decisions scoped to a single package
    └── <package-name>/
        ├── template.md
        ├── index.md
        └── YYYYMMDD-decision-title.md
```

## Scope Model

| Level | Applies to | Example |
|-------|-----------|---------|
| `global` | Entire project / all packages | "Use TypeScript everywhere" |
| `domain` | A logical group of packages | "Backend libs use Drizzle ORM" |
| `local` | A single package or app | "Dashboard app uses SSR with Next.js" |

Global ADRs apply everywhere. Domain ADRs apply to packages matching their
`scope.applies_to` globs. A local ADR can derogate from a global/domain ADR
if it declares `relations.constrained_by` with a justification.

## Lifecycle

```
proposed  ──>  accepted  ──>  deprecated
                  │
                  └──>  superseded (by YYYYMMDD-new-slug)
```

| Transition | Condition |
|------------|-----------|
| proposed → accepted | PR merged with at least 1 reviewer |
| accepted → deprecated | Technology/pattern no longer recommended, no replacement |
| accepted → superseded | A new ADR exists with `relations.supersedes` pointing here |

## Naming Convention

```
YYYYMMDD-short-title-in-kebab-case.md
```

Date-based naming avoids merge conflicts when multiple teams create ADRs concurrently.

## Creating a New ADR

**With Claude Code:**
```
/adr.create "Use Redis for caching"
```

**With log4brains (if installed):**
```bash
npx log4brains adr new
```

**Manually:**
```bash
cp .adr/_templates/template.md .adr/global/YYYYMMDD-my-decision.md
```

## Browsing ADRs

**With log4brains:**
```bash
npx log4brains preview     # Local preview with hot-reload
npx log4brains build       # Generate static site
```

**With grep:**
```bash
grep -rl 'status: "accepted"' .adr/          # All accepted ADRs
grep -rl 'apps/dashboard' .adr/              # ADRs affecting a path
grep -rl '"security"' .adr/                  # ADRs tagged "security"
```

## Integration

### BMAD

Architectural decisions from `architecture.md` can be promoted to formal ADRs
using `/adr.promote`. The ADR references its BMAD source.

### Spec Kit

Research decisions from `research.md` can be promoted to ADRs. The ADR
references `speckit_research` for traceability.

### Agreements

The `agreement.yaml` template includes a `references.adr` field to link
agreements to the ADRs that justify their design.

## log4brains Compatibility

This ADR system is fully compatible with [log4brains](https://github.com/thomvaill/log4brains).
The frontmatter fields `status`, `date`, `deciders`, and `tags` are parsed by log4brains.
The ecosystem extensions (`scope`, `relations`, `references`) are ignored by log4brains
but consumed by Claude Code commands.
