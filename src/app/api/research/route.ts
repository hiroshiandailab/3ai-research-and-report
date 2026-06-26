import "server-only";

import { NextResponse } from "next/server";
import { auth, isAllowedEmail } from "@/auth";
import { runProviderResearch } from "@/lib/ai/research";
import {
  getResearchCostPolicy,
  researchRateLimiter,
  type RateLimitResult,
} from "@/lib/server/research-cost-control";
import type { ResearchMode } from "@/types/research";
import type { ResearchRequest } from "@/types/research-api";

export const maxDuration = 300;

const MODES = new Set<ResearchMode>(["ACADEMIC", "BUSINESS", "ART"]);
const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
};

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { ...PRIVATE_HEADERS, ...headers },
  });
}

function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    ...(result.retryAfterSeconds > 0
      ? { "Retry-After": String(result.retryAfterSeconds) }
      : {}),
  };
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

  const rateLimit = researchRateLimiter.consume(
    session.user.email,
    getResearchCostPolicy(),
  );
  if (!rateLimit.allowed) {
    const error =
      rateLimit.reason === "COOLDOWN"
        ? `連続実行を防ぐため、${rateLimit.retryAfterSeconds}秒後に再実行してください`
        : "1時間あたりのResearch実行上限に達しました。時間をおいて再実行してください";
    return json(
      {
        error,
        code: "RESEARCH_RATE_LIMITED",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      429,
      rateLimitHeaders(rateLimit),
    );
  }

  try {
    const result = await runProviderResearch(brief, input.mode);
    return json(result, 200, rateLimitHeaders(rateLimit));
  } catch (error) {
    console.error(
      "[research] Unexpected orchestration error",
      error instanceof Error ? error.name : "Unknown error",
    );
    return json(
      { error: "3AIリサーチの処理に失敗しました。時間をおいて再実行してください" },
      500,
      rateLimitHeaders(rateLimit),
    );
  }
}
