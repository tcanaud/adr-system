import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { detect } from "./detect.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, "..", "templates");

// ── Helpers ──────────────────────────────────────────────

function copyTemplate(src, dest) {
  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(src, dest);
}

function writeTemplate(dest, content) {
  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  writeFileSync(dest, content);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return { date: `${y}-${m}-${dd}`, slug: `${y}${m}${dd}` };
}

// ── Domain auto-detection ────────────────────────────────

function autoDetectDomains(env) {
  if (!env.packages.length) return [];

  // Group packages by their category (workspace glob base)
  const categories = new Map();
  for (const pkg of env.packages) {
    const cat = pkg.category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat).push(pkg);
  }

  // Each category with 2+ packages becomes a domain candidate
  const domains = [];
  for (const [cat, pkgs] of categories) {
    if (pkgs.length >= 1) {
      const name = cat.replace(/\//g, "-").replace(/^-|-$/g, "");
      domains.push({ name, glob: `${cat}/*`, count: pkgs.length });
    }
  }

  return domains;
}

// ── Main installer ───────────────────────────────────────

export async function install(flags = []) {
  const projectRoot = process.cwd();
  const autoYes = flags.includes("--yes");
  const noL4b = flags.includes("--no-l4b");
  const domainsFlag = flags.find((f) => f.startsWith("--domains"));
  let explicitDomains = null;
  if (domainsFlag) {
    const idx = flags.indexOf(domainsFlag);
    if (domainsFlag.includes("=")) {
      explicitDomains = domainsFlag.split("=")[1].split(",").map((d) => d.trim()).filter(Boolean);
    } else if (flags[idx + 1]) {
      explicitDomains = flags[idx + 1].split(",").map((d) => d.trim()).filter(Boolean);
    }
  }

  console.log("\n  adr-system v1.0.0\n");

  // ── Step 1: Detect environment ─────────────────────────

  console.log("  [1/7] Detecting environment...");
  const env = detect(projectRoot);

  console.log(`    Monorepo:       ${env.monorepoType || "none"}`);
  if (env.monorepoType) {
    console.log(`    Workspaces:     ${env.workspaceGlobs.join(", ")}`);
    console.log(`    Packages:       ${env.packages.length} found`);
  }
  console.log(`    BMAD:           ${env.hasBmad ? `yes (${env.bmadDir}/)` : "no"}`);
  console.log(`    Spec Kit:       ${env.hasSpeckit ? "yes" : "no"}`);
  console.log(`    Agreements:     ${env.hasAgreements ? "yes" : "no"}`);
  console.log(`    Claude commands: ${env.hasClaudeCommands ? "yes" : "no"}`);
  console.log(`    log4brains:     ${env.hasLog4brains ? "yes" : "no"}`);
  console.log(`    Git user:       ${env.gitUserName || "(not configured)"}`);
  console.log();

  // ── Step 2: Check existing .adr/ ──────────────────────

  console.log("  [2/7] Checking existing ADR system...");

  if (env.hasExistingAdr) {
    if (!autoYes) {
      const answer = await ask("    .adr/ already exists. Update templates and commands? (y/N) ");
      if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
        console.log("    Aborted. Use 'adr-system update' to update commands only.\n");
        return;
      }
    }
    console.log("    Existing .adr/ found — will update templates, preserve ADRs.");
  } else {
    console.log("    No existing .adr/ — fresh install.");
  }
  console.log();

  // ── Step 3: Determine domains ─────────────────────────

  console.log("  [3/7] Determining domains...");

  let domains = [];

  if (explicitDomains) {
    // --domains flag provided
    domains = explicitDomains.map((name) => ({ name, glob: "", count: 0 }));
    console.log(`    From --domains flag: ${domains.map((d) => d.name).join(", ")}`);
  } else if (autoYes) {
    // Auto mode: detect from workspace structure
    domains = autoDetectDomains(env);
    if (domains.length) {
      console.log(`    Auto-detected: ${domains.map((d) => `${d.name} (${d.glob})`).join(", ")}`);
    } else {
      console.log("    No domains detected — global-only setup.");
    }
  } else {
    // Interactive mode
    const detected = autoDetectDomains(env);
    if (detected.length) {
      console.log("    Detected workspace categories:");
      for (const d of detected) {
        console.log(`      - ${d.name} (${d.glob}, ${d.count} packages)`);
      }
      const answer = await ask("    Use these as domains? (Y/n/custom) ");
      if (answer.toLowerCase() === "n" || answer.toLowerCase() === "no") {
        domains = [];
      } else if (answer.toLowerCase() !== "" && answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
        // Custom input
        domains = answer.split(",").map((d) => ({ name: d.trim(), glob: "", count: 0 })).filter((d) => d.name);
      } else {
        domains = detected;
      }
    } else {
      const answer = await ask("    No monorepo detected. Enter domain names (comma-separated, or Enter for none): ");
      if (answer) {
        domains = answer.split(",").map((d) => ({ name: d.trim(), glob: "", count: 0 })).filter((d) => d.name);
      }
    }
    if (domains.length) {
      console.log(`    Domains: ${domains.map((d) => d.name).join(", ")}`);
    } else {
      console.log("    No domains — global-only setup.");
    }
  }
  console.log();

  // ── Step 4: Scaffold .adr/ ────────────────────────────

  console.log("  [4/7] Scaffolding .adr/ structure...");

  const adrRoot = join(projectRoot, ".adr");

  // README.md
  copyTemplate(join(TEMPLATES, "core", "README.md"), join(adrRoot, "README.md"));
  console.log("    write .adr/README.md");

  // _templates/template.md
  copyTemplate(join(TEMPLATES, "core", "template.md"), join(adrRoot, "_templates", "template.md"));
  console.log("    write .adr/_templates/template.md");

  // global/ scope
  const globalDir = join(adrRoot, "global");
  copyTemplate(join(TEMPLATES, "core", "template.md"), join(globalDir, "template.md"));
  console.log("    write .adr/global/template.md");

  const globalIndex = join(globalDir, "index.md");
  if (!existsSync(globalIndex)) {
    const indexContent = readFileSync(join(TEMPLATES, "core", "index.md"), "utf-8")
      .replace("{SCOPE_NAME}", "Global Decisions")
      .replace("{DESCRIPTION}", "Architecture decisions that apply to the entire project.");
    writeTemplate(globalIndex, indexContent);
    console.log("    write .adr/global/index.md");
  } else {
    console.log("    skip .adr/global/index.md (exists)");
  }

  // domain/ scopes
  for (const domain of domains) {
    const domainDir = join(adrRoot, "domain", domain.name);
    copyTemplate(join(TEMPLATES, "core", "template.md"), join(domainDir, "template.md"));
    console.log(`    write .adr/domain/${domain.name}/template.md`);

    const domainIndex = join(domainDir, "index.md");
    if (!existsSync(domainIndex)) {
      const indexContent = readFileSync(join(TEMPLATES, "core", "index.md"), "utf-8")
        .replace("{SCOPE_NAME}", domain.name)
        .replace("{DESCRIPTION}", `Decisions scoped to the ${domain.name} domain${domain.glob ? ` (${domain.glob})` : ""}.`);
      writeTemplate(domainIndex, indexContent);
      console.log(`    write .adr/domain/${domain.name}/index.md`);
    } else {
      console.log(`    skip .adr/domain/${domain.name}/index.md (exists)`);
    }
  }

  // First ADR (only if no ADR files exist in global/)
  const hasExistingAdrs = existsSync(globalDir) && readdirSync(globalDir).some((f) =>
    f.endsWith(".md") && /^\d{8}-/.test(f)
  );

  if (!hasExistingAdrs) {
    const { date, slug } = today();
    const firstAdrContent = readFileSync(join(TEMPLATES, "core", "first-adr.md"), "utf-8")
      .replace("{DATE}", date)
      .replace("{OWNER}", env.gitUserName || "team")
      .replace("{DOMAINS}", domains.length ? domains.map((d) => d.name).join(", ") : "none (global-only)")
      .replace("{MONOREPO}", env.monorepoType || "single-package");
    const firstAdrPath = join(globalDir, `${slug}-use-adr-system.md`);
    writeTemplate(firstAdrPath, firstAdrContent);
    console.log(`    write .adr/global/${slug}-use-adr-system.md`);
  } else {
    console.log("    skip first ADR (existing ADRs found)");
  }
  console.log();

  // ── Step 5: Generate .log4brains.yml ──────────────────

  console.log("  [5/7] Generating .log4brains.yml...");

  if (noL4b) {
    console.log("    Skipped (--no-l4b flag).");
  } else {
    const l4bPath = join(projectRoot, ".log4brains.yml");
    if (existsSync(l4bPath) && !autoYes) {
      const answer = await ask("    .log4brains.yml already exists. Overwrite? (y/N) ");
      if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
        console.log("    Skipped (existing file preserved).");
        console.log();
        skipL4b();
      } else {
        writeLog4brainsYml(l4bPath, domains, env);
      }
    } else {
      writeLog4brainsYml(l4bPath, domains, env);
    }
  }
  console.log();

  // ── Step 6: Copy Claude Code commands ─────────────────

  console.log("  [6/7] Installing Claude Code commands...");

  if (!env.hasClaudeCommands) {
    mkdirSync(join(projectRoot, ".claude", "commands"), { recursive: true });
    console.log("    create .claude/commands/");
  }

  const commandMappings = [
    ["commands/adr.create.md", ".claude/commands/adr.create.md"],
    ["commands/adr.promote.md", ".claude/commands/adr.promote.md"],
    ["commands/adr.supersede.md", ".claude/commands/adr.supersede.md"],
    ["commands/adr.impact.md", ".claude/commands/adr.impact.md"],
    ["commands/adr.list.md", ".claude/commands/adr.list.md"],
  ];

  for (const [src, dest] of commandMappings) {
    copyTemplate(join(TEMPLATES, src), join(projectRoot, dest));
    console.log(`    write ${dest}`);
  }
  console.log();

  // ── Step 7: Agreement integration ─────────────────────

  console.log("  [7/7] Agreement integration...");

  if (env.hasAgreements) {
    const tplPath = join(projectRoot, ".agreements", "_templates", "agreement.tpl.yaml");
    if (existsSync(tplPath)) {
      const content = readFileSync(tplPath, "utf-8");
      if (content.includes("adr:")) {
        console.log("    skip agreement template (already has adr reference)");
      } else {
        // Add adr: [] after the last references entry
        const updated = content.replace(
          /(references:\n(?:  \w+:.*\n)*)(  code:.*)/,
          "$1$2\n  adr: [] # e.g. [\".adr/global/20260217-use-typescript.md\"]"
        );
        if (updated !== content) {
          writeFileSync(tplPath, updated);
          console.log("    update .agreements/_templates/agreement.tpl.yaml (added references.adr)");
        } else {
          console.log("    skip agreement template (could not find references section)");
        }
      }
    } else {
      console.log("    skip (no agreement template found)");
    }
  } else {
    console.log("    No .agreements/ detected, skipping.");
  }
  console.log();

  // ── Summary ────────────────────────────────────────────

  console.log("  Done! ADR system installed.\n");
  console.log("  Structure:");
  console.log("    .adr/");
  console.log("    ├── _templates/template.md");
  console.log("    ├── global/");
  for (const domain of domains) {
    console.log(`    ├── domain/${domain.name}/`);
  }
  if (!noL4b) {
    console.log("    .log4brains.yml");
  }
  console.log();
  console.log("  Available commands:");
  console.log("    /adr.create     Create a new ADR");
  console.log("    /adr.promote    Promote a research/architecture decision to ADR");
  console.log("    /adr.supersede  Supersede an existing ADR");
  console.log("    /adr.impact     Find ADRs applying to a path");
  console.log("    /adr.list       List all ADRs with filters");
  console.log();

  if (env.hasBmad || env.hasSpeckit) {
    console.log("  Ecosystem:");
    if (env.hasBmad) console.log("    BMAD detected: /adr.promote can extract DA-* from architecture.md");
    if (env.hasSpeckit) console.log("    Spec Kit detected: /adr.promote can extract R* from research.md");
    console.log();
  }
}

// ── Log4brains config generation ─────────────────────────

function writeLog4brainsYml(filePath, domains, env) {
  const lines = [
    "# Log4brains configuration",
    "# Generated by: npx adr-system init",
    "# See: https://github.com/thomvaill/log4brains",
    "",
    "project:",
    '  name: ""',
    "  tz: UTC",
    "  adrFolder: .adr/global",
    "",
  ];

  if (env.gitRemoteUrl) {
    lines.push("  repository:");
    lines.push(`    url: "${env.gitRemoteUrl}"`);
    lines.push("");
  }

  if (domains.length) {
    lines.push("packages:");
    for (const domain of domains) {
      lines.push(`  - name: "@adr/${domain.name}"`);
      lines.push(`    path: .`);
      lines.push(`    adrFolder: .adr/domain/${domain.name}`);
    }
    lines.push("");
  }

  writeFileSync(filePath, lines.join("\n"));
  console.log("    write .log4brains.yml");
}

function skipL4b() {
  // No-op, just for readability in the flow
}
