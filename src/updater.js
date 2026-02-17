import { existsSync, copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, "..", "templates");

function copyTemplate(src, dest) {
  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(src, dest);
}

export function update(flags = []) {
  const projectRoot = process.cwd();
  const adrRoot = join(projectRoot, ".adr");

  console.log("\n  adr-system update\n");

  if (!existsSync(adrRoot)) {
    console.error("  Error: .adr/ not found. Run 'adr-system init' first.");
    process.exit(1);
  }

  // ── Update Claude Code commands ────────────────────────

  console.log("  Updating Claude Code commands...");

  const commandMappings = [
    ["commands/adr.create.md", ".claude/commands/adr.create.md"],
    ["commands/adr.promote.md", ".claude/commands/adr.promote.md"],
    ["commands/adr.supersede.md", ".claude/commands/adr.supersede.md"],
    ["commands/adr.impact.md", ".claude/commands/adr.impact.md"],
    ["commands/adr.list.md", ".claude/commands/adr.list.md"],
  ];

  for (const [src, dest] of commandMappings) {
    copyTemplate(join(TEMPLATES, src), join(projectRoot, dest));
    console.log(`    update ${dest}`);
  }

  // ── Update core templates ─────────────────────────────

  console.log("  Updating templates...");

  // Master template
  copyTemplate(
    join(TEMPLATES, "core", "template.md"),
    join(adrRoot, "_templates", "template.md")
  );
  console.log("    update .adr/_templates/template.md");

  // README
  copyTemplate(
    join(TEMPLATES, "core", "README.md"),
    join(adrRoot, "README.md")
  );
  console.log("    update .adr/README.md");

  // Update template.md in each existing scope directory
  // global/
  if (existsSync(join(adrRoot, "global"))) {
    copyTemplate(
      join(TEMPLATES, "core", "template.md"),
      join(adrRoot, "global", "template.md")
    );
    console.log("    update .adr/global/template.md");
  }

  // domain/*/
  const domainDir = join(adrRoot, "domain");
  if (existsSync(domainDir)) {
    for (const entry of readdirSync(domainDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        copyTemplate(
          join(TEMPLATES, "core", "template.md"),
          join(domainDir, entry.name, "template.md")
        );
        console.log(`    update .adr/domain/${entry.name}/template.md`);
      }
    }
  }

  // local/*/
  const localDir = join(adrRoot, "local");
  if (existsSync(localDir)) {
    for (const entry of readdirSync(localDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        copyTemplate(
          join(TEMPLATES, "core", "template.md"),
          join(localDir, entry.name, "template.md")
        );
        console.log(`    update .adr/local/${entry.name}/template.md`);
      }
    }
  }

  console.log();
  console.log("  Done! Commands and templates updated.");
  console.log("  Your existing ADRs, index.md files, and .log4brains.yml are untouched.\n");
}
