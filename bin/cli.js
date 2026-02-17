#!/usr/bin/env node

import { argv, exit } from "node:process";
import { install } from "../src/installer.js";
import { update } from "../src/updater.js";

const command = argv[2];
const flags = argv.slice(3);

const HELP = `
adr-system — Bootstrap an Architecture Decision Records system.

Usage:
  npx adr-system init     Install the ADR system in the current project
  npx adr-system update   Update commands and templates (preserves existing ADRs)
  npx adr-system help     Show this help message

Options (init):
  --yes              Skip confirmation prompts (auto-accept defaults)
  --domains <list>   Comma-separated domain names (e.g., --domains backend,frontend)
  --no-l4b           Skip .log4brains.yml generation

Features:
  - MADR format with log4brains-compatible frontmatter
  - Scoped domains: global, domain/<name>, local/<package>
  - Ecosystem integration: BMAD, Spec Kit, Agreements
  - 5 Claude Code commands: /adr.create, /adr.promote, /adr.supersede, /adr.impact, /adr.list
`;

switch (command) {
  case "init":
    install(flags);
    break;
  case "update":
    update(flags);
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    console.log(HELP);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log(HELP);
    exit(1);
}
