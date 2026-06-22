import { GoogleGenAI } from "@google/genai";
import { buildResearchPrompt } from "@/lib/ai/prompt";
import type { ProviderResearchResult } from "@/types/research-api";
import type { ResearchMode } from "@/types/research";

const DEFAULT_MODEL = "gemini-3.5-flash";

export async function researchWithGemini(
  brief: string,
  mode: ResearchMode,
): Promise<ProviderResearchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEYが設定されていません");
  }

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: buildResearchPrompt(brief, mode, "Gemini"),
    config: {
      tools: [{ googleSearch: {} }],
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
