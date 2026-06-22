import "server-only";

import OpenAI from "openai";
import { buildResearchPrompt } from "@/lib/ai/prompt";
import { requireSecret } from "@/lib/server/env";
import type { ProviderResearchResult } from "@/types/research-api";
import type { ResearchMode } from "@/types/research";

const DEFAULT_MODEL = "gpt-5.5";

export async function researchWithOpenAI(
  brief: string,
  mode: ResearchMode,
): Promise<ProviderResearchResult> {
  const apiKey = requireSecret("OPENAI_API_KEY");
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const client = new OpenAI({ apiKey, timeout: 120_000 });
  const response = await client.responses.create({
    model,
    tools: [{ type: "web_search", search_context_size: "medium" }],
    input: buildResearchPrompt(brief, mode, "ChatGPT"),
  });

  const report = response.output_text.trim();
  if (!report) throw new Error("OpenAI APIから本文が返されませんでした");

  return {
    provider: "chatgpt",
    model,
    status: "done",
    report,
  };
}
