import type { AiToolId, ResearchMode, RunState } from "@/types/research";

export type ResearchRequest = {
  brief: string;
  mode: ResearchMode;
};

export type ProviderResearchResult = {
  provider: AiToolId;
  model: string;
  status: Extract<RunState, "done" | "error">;
  report: string;
  error?: string;
};

export type ResearchResponse = {
  generatedAt: string;
  results: Record<AiToolId, ProviderResearchResult>;
  comparison: string;
};
