import "server-only";

import { researchWithClaude } from "@/lib/ai/claude";
import { researchWithGemini } from "@/lib/ai/gemini";
import { researchWithOpenAI } from "@/lib/ai/openai";
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

function publicErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.startsWith("SERVER_CONFIGURATION_MISSING:")
  ) {
    return "サーバーのAPI設定が完了していません。管理者に確認してください。";
  }
  return "AIサービスとの通信に失敗しました。時間をおいて再実行してください。";
}

function redactSecrets(value: string): string {
  return value
    .replace(/\bsk-ant-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED]")
    .replace(/\bAIza[0-9A-Za-z_-]{10,}\b/g, "[REDACTED]");
}

function logProviderError(provider: AiToolId, error: unknown): void {
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : "Unknown provider error";
  console.error(`[research:${provider}] ${redactSecrets(detail)}`);
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

function buildExecutionSummary(
  results: Record<AiToolId, ProviderResearchResult>,
): string {
  const lines = [
    "# 3AI実行結果",
    "",
    ...AI_TOOLS.map((provider) => {
      const result = results[provider];
      return `- **${SOURCE_TOOL_LABELS[provider]}**: ${
        result.status === "done" ? `完了（${result.model}）` : `失敗 — ${result.error}`
      }`;
    }),
    "",
    "3AIの共通点・相違点と出典統合は、第3段階で生成します。",
  ];

  return lines.join("\n");
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

    const message = publicErrorMessage(entry.reason);
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
    comparison: buildExecutionSummary(results),
  };
}
