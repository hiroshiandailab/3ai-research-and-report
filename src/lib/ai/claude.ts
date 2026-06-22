import Anthropic from "@anthropic-ai/sdk";
import { buildResearchPrompt } from "@/lib/ai/prompt";
import type { ProviderResearchResult } from "@/types/research-api";
import type { ResearchMode } from "@/types/research";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function researchWithClaude(
  brief: string,
  mode: ResearchMode,
): Promise<ProviderResearchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEYが設定されていません");
  }

  const client = new Anthropic({ apiKey, timeout: 120_000 });
  const response = await client.messages.create({
    model,
    max_tokens: 5000,
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
  });

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
