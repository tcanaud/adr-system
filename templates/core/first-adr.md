---
status: "accepted"
date: "{DATE}"
deciders: "{OWNER}"
tags: "meta, tooling"
scope:
  level: "global"
  domain: ""
  applies_to: ["**"]
relations:
  supersedes: []
  amends: []
  constrained_by: []
  related: []
references:
  features: []
  agreements: []
  speckit_research: []
---

# Use Architecture Decision Records

## Context and Problem Statement

We need to record the architectural decisions made in this project so that future team members can understand why decisions were made, not just what was decided.

## Decision Drivers

- Decisions must be version-controlled alongside code
- Must support scoped decisions in a {MONOREPO} setup
- Configured domains: {DOMAINS}
- Should integrate with existing tooling (Claude Code, BMAD, Agreements)
- Should be browsable as a static website (log4brains)

## Considered Options

- MADR format with log4brains-compatible frontmatter and scoped domains
- Plain markdown ADRs (Nygard format)
- Wiki-based decision log
- No formal ADR system

## Decision Outcome

Chosen option: "MADR format with log4brains-compatible frontmatter and scoped domains", because it provides structured metadata for tooling (scope, relations, status lifecycle) while remaining human-readable and compatible with the log4brains viewer.

### Positive Consequences

- Decisions are tracked next to code, versioned in git
- Scoped domains allow decentralized governance in monorepos
- Claude Code commands enable AI-assisted ADR creation and discovery
- log4brains provides a searchable web UI for browsing decisions
- Ecosystem extensions (scope, relations, references) integrate with BMAD/SpecKit/Agreements

### Negative Consequences

- Requires discipline to create ADRs for significant decisions
- Additional files in the repository

## Links

- [MADR](https://adr.github.io/madr/) - Markdown Architectural Decision Records
- [log4brains](https://github.com/thomvaill/log4brains) - ADR management and publication tool
