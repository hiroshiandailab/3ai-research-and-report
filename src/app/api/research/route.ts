import "server-only";

import { NextResponse } from "next/server";
import { auth, isAllowedEmail } from "@/auth";
import { runProviderResearch } from "@/lib/ai/research";
import type { ResearchMode } from "@/types/research";
import type { ResearchRequest } from "@/types/research-api";

export const maxDuration = 300;

const MODES = new Set<ResearchMode>(["ACADEMIC", "BUSINESS", "ART"]);
const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: PRIVATE_HEADERS,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAllowedEmail(session?.user?.email)) {
    return json({ error: "認証が必要です" }, 401);
  }

  let input: ResearchRequest;
  try {
    input = (await request.json()) as ResearchRequest;
  } catch {
    return json({ error: "リクエスト形式が正しくありません" }, 400);
  }

  const brief = typeof input.brief === "string" ? input.brief.trim() : "";
  if (!brief || brief.length > 4000 || !MODES.has(input.mode)) {
    return json(
      { error: "Main Questionまたはリサーチ対象を確認してください" },
      400,
    );
  }

  const result = await runProviderResearch(brief, input.mode);
  return json(result);
}
