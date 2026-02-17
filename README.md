# adr-system

Bootstrap an Architecture Decision Records (ADR) system with MADR templates, log4brains compatibility, scoped domains, and Claude Code commands.

## Quick Start

```bash
npx adr-system init
```

This will:

1. Detect your monorepo layout (pnpm, npm, lerna) and ecosystem (BMAD, Spec Kit, Agreements)
2. Create `.adr/` with scoped directories (global + detected domains)
3. Install the MADR template with ecosystem extensions
4. Generate `.log4brains.yml` for static site generation
5. Install 5 Claude Code commands in `.claude/commands/`

## Commands

### `init`

```bash
npx adr-system init              # Interactive mode
npx adr-system init --yes        # Non-interactive, auto-detect domains
npx adr-system init --domains backend,frontend  # Explicit domains
npx adr-system init --no-l4b     # Skip log4brains config
```

### `update`

Update commands and templates without touching existing ADRs, index files, or config.

```bash
npx adr-system update
```

### `help`

```bash
npx adr-system help
```

## Claude Code Commands

| Command | Description |
|---------|-------------|
| `/adr.create` | Create a new ADR with scope selection and ecosystem context |
| `/adr.promote` | Promote a research.md or architecture.md decision to a formal ADR |
| `/adr.supersede` | Mark an ADR as superseded and create the replacement |
| `/adr.impact` | Find all ADRs that apply to a given monorepo path |
| `/adr.list` | List ADRs with filters (status, scope, domain, tags) |

## Scope Model

| Level | Applies to | Directory |
|-------|-----------|-----------|
| `global` | Entire project | `.adr/global/` |
| `domain` | Group of packages | `.adr/domain/<name>/` |
| `local` | Single package | `.adr/local/<package>/` |

## Ecosystem Integration

- **BMAD**: Promotes `DA-*` decisions from `architecture.md` to ADRs
- **Spec Kit**: Promotes `R*` decisions from `research.md` to ADRs
- **Agreements**: Adds `references.adr` to the agreement template
- **log4brains**: Generates `.log4brains.yml` for static site preview

## Requirements

- Node.js >= 18
- Zero npm dependencies
