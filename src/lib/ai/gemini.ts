import "server-only";

import { GoogleGenAI } from "@google/genai";
import { buildResearchPrompt } from "@/lib/ai/prompt";
import { requireSecret } from "@/lib/server/env";
import type { ProviderResearchResult } from "@/types/research-api";
import type { ResearchMode } from "@/types/research";

const DEFAULT_MODEL = "gemini-3.5-flash";
const REQUEST_TIMEOUT_MS = 90_000;

export async function researchWithGemini(
  brief: string,
  mode: ResearchMode,
): Promise<ProviderResearchResult> {
  const apiKey = requireSecret("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: buildResearchPrompt(brief, mode, "Gemini"),
    config: {
      tools: [{ googleSearch: {} }],
      abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  });

  const report = response.text?.trim() ?? "";
  if (!report) throw new Error("Gemini APIから本文が返されませんでした");

  return {
    provider: "gemini",
    model,
    status: "done",
    report,
  };
}
