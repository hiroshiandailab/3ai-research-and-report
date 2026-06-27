import "server-only";

import OpenAI from "openai";
import { buildResearchPrompt } from "@/lib/ai/prompt";
import { requireSecret } from "@/lib/server/env";
import { getAiMaxOutputTokens } from "@/lib/server/research-cost-control";
import type { ProviderResearchResult } from "@/types/research-api";
import type { ResearchMode } from "@/types/research";

const DEFAULT_MODEL = "gpt-5.5";
const REQUEST_TIMEOUT_MS = 180_000;

export async function researchWithOpenAI(
  brief: string,
  mode: ResearchMode,
): Promise<ProviderResearchResult> {
  const apiKey = requireSecret("OPENAI_API_KEY");
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });
  const response = await client.responses.create(
    {
      model,
      max_output_tokens: getAiMaxOutputTokens(),
      tools: [{ type: "web_search", search_context_size: "medium" }],
      input: buildResearchPrompt(brief, mode, "ChatGPT"),
    },
    { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );

  const report = response.output_text.trim();
  if (!report) throw new Error("OpenAI APIから本文が返されませんでした");

  return {
    provider: "chatgpt",
    model,
    status: "done",
    report,
  };
}
