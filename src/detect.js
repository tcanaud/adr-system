import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

// ── Monorepo type detection ─────────────────────────────

function detectMonorepoType(projectRoot) {
  if (existsSync(join(projectRoot, "pnpm-workspace.yaml"))) return "pnpm";

  const pkgPath = join(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces) return "npm";
    } catch { /* invalid package.json */ }
  }

  if (existsSync(join(projectRoot, "lerna.json"))) return "lerna";

  return null;
}

// ── Workspace globs extraction ──────────────────────────

function resolveWorkspaceGlobs(projectRoot, monorepoType) {
  if (monorepoType === "pnpm") {
    const content = readFileSync(join(projectRoot, "pnpm-workspace.yaml"), "utf-8");
    const match = content.match(/packages:\s*\n((?:\s*-\s+.+\n?)+)/);
    if (match) {
      return match[1]
        .split("\n")
        .map((l) => l.replace(/^\s*-\s*['"]?/, "").replace(/['"]?\s*$/, ""))
        .filter(Boolean);
    }
    return [];
  }

  if (monorepoType === "npm") {
    const pkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf-8"));
    const ws = pkg.workspaces;
    return Array.isArray(ws) ? ws : (ws.packages || []);
  }

  if (monorepoType === "lerna") {
    const lerna = JSON.parse(readFileSync(join(projectRoot, "lerna.json"), "utf-8"));
    return lerna.packages || ["packages/*"];
  }

  return [];
}

// ── Resolve globs to actual package directories ─────────

function resolvePackages(projectRoot, globs) {
  const packages = [];

  for (const glob of globs) {
    const baseDir = glob.replace(/\/\*+$/, "");
    const fullBase = join(projectRoot, baseDir);

    if (!existsSync(fullBase)) continue;

    let entries;
    try {
      entries = readdirSync(fullBase, { withFileTypes: true });
    } catch { continue; }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;

      const pkgDir = join(fullBase, entry.name);
      const pkgJson = join(pkgDir, "package.json");

      let name = entry.name;
      if (existsSync(pkgJson)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgJson, "utf-8"));
          name = pkg.name || entry.name;
        } catch { /* use dir name */ }
      }

      packages.push({
        name,
        dirName: entry.name,
        path: `${baseDir}/${entry.name}`,
        category: baseDir,
      });
    }
  }

  return packages;
}

// ── Ecosystem detection ─────────────────────────────────

function detectEcosystem(projectRoot) {
  const bmadDir = existsSync(join(projectRoot, "_bmad"))
    ? "_bmad"
    : existsSync(join(projectRoot, ".bmad"))
      ? ".bmad"
      : null;

  return {
    hasBmad: bmadDir !== null,
    bmadDir,
    hasSpeckit: existsSync(join(projectRoot, ".specify")),
    hasAgreements: existsSync(join(projectRoot, ".agreements")),
    hasClaudeCommands: existsSync(join(projectRoot, ".claude", "commands")),
    hasExistingAdr: existsSync(join(projectRoot, ".adr")),
    hasLog4brains: existsSync(join(projectRoot, "node_modules", ".bin", "log4brains")),
  };
}

// ── Git info ────────────────────────────────────────────

function getGitUserName() {
  try {
    return execSync("git config user.name", { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function getGitRemoteUrl(projectRoot) {
  try {
    const url = execSync("git remote get-url origin", {
      encoding: "utf-8",
      cwd: projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return url
      .replace(/^git@github\.com:/, "https://github.com/")
      .replace(/\.git$/, "");
  } catch {
    return null;
  }
}

// ── Main export ─────────────────────────────────────────

export function detect(projectRoot) {
  const monorepoType = detectMonorepoType(projectRoot);
  const workspaceGlobs = monorepoType
    ? resolveWorkspaceGlobs(projectRoot, monorepoType)
    : [];
  const packages = monorepoType
    ? resolvePackages(projectRoot, workspaceGlobs)
    : [];

  return {
    ...detectEcosystem(projectRoot),
    monorepoType,
    workspaceGlobs,
    packages,
    gitUserName: getGitUserName(),
    gitRemoteUrl: getGitRemoteUrl(projectRoot),
  };
}
