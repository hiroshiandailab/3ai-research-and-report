import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { buildResearchPrompt } from "@/lib/ai/prompt";
import { requireSecret } from "@/lib/server/env";
import { getAiMaxOutputTokens } from "@/lib/server/research-cost-control";
import type { ProviderResearchResult } from "@/types/research-api";
import type { ResearchMode } from "@/types/research";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const REQUEST_TIMEOUT_MS = 90_000;

export async function researchWithClaude(
  brief: string,
  mode: ResearchMode,
): Promise<ProviderResearchResult> {
  const apiKey = requireSecret("ANTHROPIC_API_KEY");
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const client = new Anthropic({
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });
  const response = await client.messages.create(
    {
      model,
      max_tokens: getAiMaxOutputTokens(),
      messages: [
        {
          role: "user",
          content: buildResearchPrompt(brief, mode, "Claude"),
        },
      ],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
        },
      ],
    },
    { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );

  const report = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!report) throw new Error("Claude APIから本文が返されませんでした");

  return {
    provider: "claude",
    model,
    status: "done",
    report,
  };
}
