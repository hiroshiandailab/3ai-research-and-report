import { loadEnvFile } from "node:process";

loadEnvFile(".env.local");

const token = process.env.GITHUB_REPORT_TOKEN?.trim();
const owner = process.env.GITHUB_REPORT_OWNER?.trim() || "hiroshiandailab";
const repo = process.env.GITHUB_REPORT_REPO?.trim() || "3ai-research-and-report";
const branch = process.env.GITHUB_REPORT_BRANCH?.trim() || "main";
const directory = normalizeDirectory(process.env.GITHUB_REPORT_DIR?.trim() || "reports");

if (!token) {
  console.error("GitHub Markdown: NOT_CONFIGURED | missing=GITHUB_REPORT_TOKEN");
  process.exit(1);
}

const startedAt = Date.now();
const now = new Date();
const fileName = `github-markdown-save-test-${formatTimestamp(now)}.md`;
const path = `${directory}/${formatDate(now)}/${fileName}`;

try {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        branch,
        message: `Test report save: ${fileName}`,
        content: Buffer.from(
          [
            "# GitHub Markdown Save Test",
            "",
            "3AI Research & ReportからGitHubへMarkdown保存できるかを確認するテストです。",
            "",
            `- 作成日時: ${new Date().toISOString()}`,
          ].join("\n"),
          "utf8",
        ).toString("base64"),
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || `HTTP_${response.status}`);
  }

  console.log(
    `GitHub Markdown: OK | ${Date.now() - startedAt}ms | path=${payload.content?.path || path}`,
  );
  if (payload.content?.html_url) {
    console.log(`URL: ${payload.content.html_url}`);
  }
} catch (error) {
  console.error(
    `GitHub Markdown: FAILED | ${Date.now() - startedAt}ms | ${safeError(error)}`,
  );
  process.exit(1);
}

function normalizeDirectory(directory) {
  return directory
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((part) => slugify(part))
    .filter(Boolean)
    .join("/");
}

function slugify(value) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "reports"
  );
}

function formatTimestamp(date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function encodeURIComponentPath(pathValue) {
  return pathValue.split("/").map(encodeURIComponent).join("/");
}

function safeError(error) {
  if (!(error instanceof Error)) return "Unknown error";
  return error.message
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{10,}\b/g, "[REDACTED]")
    .replace(/\bgithub_pat_[A-Za-z0-9_]{10,}\b/g, "[REDACTED]")
    .slice(0, 240);
}
