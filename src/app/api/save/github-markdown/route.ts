import "server-only";

import { NextResponse } from "next/server";
import { auth, isAllowedEmail } from "@/auth";
import { saveMarkdownToGitHub } from "@/lib/server/github-markdown";

export const maxDuration = 90;

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
};

interface SaveRequest {
  title?: unknown;
  markdown?: unknown;
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: PRIVATE_HEADERS,
  });
}

function safeTitle(value: unknown): string {
  const title = typeof value === "string" ? value.trim() : "";
  if (!title) return "3AI Research Report";
  return title.slice(0, 120);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAllowedEmail(session?.user?.email)) {
    return json({ error: "認証が必要です" }, 401);
  }

  let input: SaveRequest;
  try {
    input = (await request.json()) as SaveRequest;
  } catch {
    return json({ error: "リクエスト形式が正しくありません" }, 400);
  }

  const markdown = typeof input.markdown === "string" ? input.markdown.trim() : "";
  if (!markdown || markdown.length > 200_000) {
    return json({ error: "Markdown本文を確認してください" }, 400);
  }

  try {
    const result = await saveMarkdownToGitHub({
      title: safeTitle(input.title),
      markdown,
    });
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("SERVER_CONFIGURATION_MISSING")) {
      return json({ error: "GitHub保存の設定が未完了です" }, 503);
    }
    console.error("GitHub Markdown save failed", error);
    return json({ error: "GitHub保存に失敗しました" }, 502);
  }
}
