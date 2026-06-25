import "server-only";

import { NextResponse } from "next/server";
import { auth, isAllowedEmail } from "@/auth";
import { saveFinalReportToGoogleDrive } from "@/lib/server/google-drive";

export const maxDuration = 90;

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
};

interface SaveRequest {
  title?: unknown;
  content?: unknown;
  brief?: unknown;
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

  const content = typeof input.content === "string" ? input.content.trim() : "";
  const brief = typeof input.brief === "string" ? input.brief.trim() : "";

  if (!content || content.length > 80_000) {
    return json({ error: "最終本文を確認してください" }, 400);
  }

  try {
    const result = await saveFinalReportToGoogleDrive({
      title: safeTitle(input.title),
      content,
      brief: brief.slice(0, 4000),
    });
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("SERVER_CONFIGURATION_MISSING")) {
      return json({ error: "Google Drive保存の設定が未完了です" }, 503);
    }
    console.error("Google Drive save failed", error);
    return json({ error: "Google Drive保存に失敗しました" }, 502);
  }
}
