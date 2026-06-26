import "server-only";

import { requireSecret } from "@/lib/server/env";

const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_OWNER = "hiroshiandailab";
const DEFAULT_REPO = "3ai-research-and-report";
const DEFAULT_BRANCH = "main";
const DEFAULT_DIR = "reports";

export interface GitHubMarkdownSaveInput {
  title: string;
  markdown: string;
}

export interface GitHubMarkdownSaveResult {
  path: string;
  url: string;
  commitUrl: string;
}

interface GitHubContentResponse {
  content?: {
    html_url?: string;
    path?: string;
  };
  commit?: {
    html_url?: string;
  };
  message?: string;
}

export async function saveMarkdownToGitHub(
  input: GitHubMarkdownSaveInput,
): Promise<GitHubMarkdownSaveResult> {
  const token = requireSecret("GITHUB_REPORT_TOKEN");
  const owner = process.env.GITHUB_REPORT_OWNER?.trim() || DEFAULT_OWNER;
  const repo = process.env.GITHUB_REPORT_REPO?.trim() || DEFAULT_REPO;
  const branch = process.env.GITHUB_REPORT_BRANCH?.trim() || DEFAULT_BRANCH;
  const directory = normalizeDirectory(
    process.env.GITHUB_REPORT_DIR?.trim() || DEFAULT_DIR,
  );
  const fileName = `${slugify(input.title || "3ai-research-report")}-${formatTimestamp(new Date())}.md`;
  const path = `${directory}/${new Date().toISOString().slice(0, 10)}/${fileName}`;

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
        message: `Save report: ${fileName}`,
        content: Buffer.from(input.markdown, "utf8").toString("base64"),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  let payload: GitHubContentResponse;
  try {
    payload = (await response.json()) as GitHubContentResponse;
  } catch {
    throw new Error("GITHUB_INVALID_JSON_RESPONSE");
  }

  if (!response.ok) {
    throw new Error(payload.message || `GITHUB_SAVE_FAILED:${response.status}`);
  }

  const savedPath = payload.content?.path || path;
  const url =
    payload.content?.html_url ||
    `https://github.com/${owner}/${repo}/blob/${branch}/${savedPath}`;
  const commitUrl =
    payload.commit?.html_url || `https://github.com/${owner}/${repo}/commits/${branch}`;

  return { path: savedPath, url, commitUrl };
}

function normalizeDirectory(directory: string): string {
  return directory
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((part) => slugify(part))
    .filter(Boolean)
    .join("/");
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "3ai-research-report"
  );
}

function formatTimestamp(date: Date): string {
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
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

function encodeURIComponentPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}
