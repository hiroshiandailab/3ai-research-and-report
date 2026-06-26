import "server-only";

import { researchWithClaude } from "@/lib/ai/claude";
import { buildIntegratedComparison } from "@/lib/ai/comparison";
import { researchWithGemini } from "@/lib/ai/gemini";
import { researchWithOpenAI } from "@/lib/ai/openai";
import {
  classifyProviderError,
  redactSensitiveText,
} from "@/lib/ai/error-policy";
import {
  AI_TOOLS,
  SOURCE_TOOL_LABELS,
  type AiToolId,
  type ResearchMode,
} from "@/types/research";
import type {
  ProviderResearchResult,
  ResearchResponse,
} from "@/types/research-api";

const RUNNERS = {
  chatgpt: researchWithOpenAI,
  claude: researchWithClaude,
  gemini: researchWithGemini,
} satisfies Record<
  AiToolId,
  (brief: string, mode: ResearchMode) => Promise<ProviderResearchResult>
>;

const DEFAULT_MODELS: Record<AiToolId, string> = {
  chatgpt: "gpt-5.5",
  claude: "claude-sonnet-4-6",
  gemini: "gemini-3.5-flash",
};

function configuredModel(provider: AiToolId): string {
  const envKey =
    provider === "chatgpt"
      ? "OPENAI_MODEL"
      : provider === "claude"
        ? "ANTHROPIC_MODEL"
        : "GEMINI_MODEL";
  return process.env[envKey] || DEFAULT_MODELS[provider];
}

function logProviderError(provider: AiToolId, error: unknown): void {
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : "Unknown provider error";
  console.error(`[research:${provider}] ${redactSensitiveText(detail)}`);
}

function errorReport(provider: AiToolId, message: string): string {
  return [
    `# ${SOURCE_TOOL_LABELS[provider]} Report`,
    "",
    "## 実行エラー",
    "",
    message,
    "",
    "API設定またはサービス状態を確認して、Researchを再実行してください。",
  ].join("\n");
}

export async function runProviderResearch(
  brief: string,
  mode: ResearchMode,
): Promise<ResearchResponse> {
  const settled = await Promise.allSettled(
    AI_TOOLS.map(async (provider) => ({
      provider,
      result: await RUNNERS[provider](brief, mode),
    })),
  );

  const results = {} as Record<AiToolId, ProviderResearchResult>;

  settled.forEach((entry, index) => {
    const provider = AI_TOOLS[index];
    if (entry.status === "fulfilled") {
      results[provider] = entry.value.result;
      return;
    }

    const publicError = classifyProviderError(entry.reason);
    const message = publicError.message;
    logProviderError(provider, entry.reason);
    results[provider] = {
      provider,
      model: configuredModel(provider),
      status: "error",
      report: errorReport(provider, message),
      error: message,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    results,
    comparison: buildIntegratedComparison(results),
  };
}
