import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".vercel",
  "build",
  "coverage",
  "node_modules",
  "out",
]);
const ignoredFiles = new Set(["package-lock.json"]);

const patterns = [
  { name: "OpenAI API key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Anthropic API key", regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{20,}\b/g },
  { name: "GitHub classic token", regex: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g },
  { name: "GitHub fine-grained token", regex: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g },
  { name: "Google OAuth secret", regex: /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/g },
  {
    name: "Auth secret assignment",
    regex: /^AUTH_SECRET\s*=\s*[A-Za-z0-9+/_=-]{20,}$/gm,
  },
];

function filesUnder(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    if (entry.startsWith(".env")) continue;

    const absolute = join(directory, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      files.push(...filesUnder(absolute));
    } else if (!ignoredFiles.has(entry)) {
      files.push(absolute);
    }
  }
  return files;
}

const findings = [];

for (const file of filesUnder(root)) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(content)) {
      findings.push(`${relative(root, file)}: ${pattern.name}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Potential secrets were found:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("No API keys or auth secrets found outside ignored env files.");
