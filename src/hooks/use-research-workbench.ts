"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ART_MAIN_QUESTION_PLACEHOLDER,
  DEFAULT_MAIN_QUESTION_PLACEHOLDER,
} from "@/lib/research-brief";
import { buildVerificationPlanFromHypothesis } from "@/lib/research-mock-ai";
import { loadWorkspace, saveWorkspace } from "@/lib/research-storage";
import {
  AI_TOOLS,
  DEFAULT_WORKSPACE,
  SOURCE_TOOL_LABELS,
  type AiToolId,
  type CardLayer,
  type CardStatus,
  type ResearchCard,
  type SourceTool,
  type WorkspaceState,
} from "@/types/research";
import type { ResearchResponse } from "@/types/research-api";

function extractComparisonBullets(markdown: string): string[] {
  const lines = markdown.split("\n");
  const bullets: string[] = [];
  let section = "";

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      section = heading[1].trim();
      continue;
    }
    if (section !== "採用候補" && section !== "共通点") continue;
    if (!line.trim().startsWith("- ")) continue;

    const content = line.replace(/^\s*-\s+/, "").trim();
    if (
      content.length > 12 &&
      !content.includes("まだ抽出できません") &&
      !content.includes("まだありません")
    ) {
      bullets.push(content);
    }
  }

  return bullets.slice(0, 6);
}

function firstMarkdownUrl(markdown: string): string {
  const match = markdown.match(/\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/);
  return match?.[1]?.replace(/[.,;:]+$/, "") ?? "";
}

function stripComparisonMeta(markdown: string): string {
  return markdown
    .replace(/\s*（一致: .*?）/g, "")
    .replace(/\s*出典:\s*(?:\[[^\]]+\]\([^)]+\)(?:\s*\/\s*)?)+/g, "")
    .trim();
}

export function useResearchWorkbench() {
  const [state, setState] = useState<WorkspaceState>(DEFAULT_WORKSPACE);
  const [hydrated, setHydrated] = useState(false);
  const researchCancelRef = useRef<(() => void) | null>(null);
  const verificationCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setState(loadWorkspace());
    setHydrated(true);
    return () => {
      researchCancelRef.current?.();
      verificationCancelRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveWorkspace(state);
  }, [state, hydrated]);

  const setMode = useCallback((mode: WorkspaceState["mode"]) => {
    setState((s) => ({ ...s, mode }));
  }, []);

  const setLockProfile = useCallback((lockProfile: WorkspaceState["lockProfile"]) => {
    setState((s) => ({ ...s, lockProfile }));
  }, []);

  const setBrief = useCallback((brief: string) => {
    setState((s) => ({ ...s, brief }));
  }, []);

  const setNextSteps = useCallback((nextSteps: string) => {
    setState((s) => ({ ...s, nextSteps }));
  }, []);

  const setFinalReport = useCallback((finalReport: string) => {
    setState((s) => ({ ...s, finalReport }));
  }, []);

  const adoptCardToB = useCallback((cardId: string) => {
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) =>
        c.id === cardId ? { ...c, layer: "B" as const, status: "adopted" as const } : c,
      ),
    }));
  }, []);

  const adoptCardsToB = useCallback((cardIds: string[]): number => {
    if (cardIds.length === 0) return 0;
    const idSet = new Set(cardIds);
    setState((s) => ({
      ...s,
      cards: s.cards.map((c) =>
        idSet.has(c.id) && c.layer === "A"
          ? { ...c, layer: "B" as const, status: "adopted" as const }
          : c,
      ),
    }));
    return cardIds.length;
  }, []);

  const reflectAllBToFinalReport = useCallback((): number => {
    let count = 0;
    setState((s) => {
      const blocks = s.cards
        .filter((c) => c.layer === "B" && c.status !== "rejected")
        .map((c) => c.content.trim())
        .filter(Boolean);
      if (blocks.length === 0) return s;
      count = blocks.length;
      const merged = blocks.join("\n\n---\n\n");
      const nextReport = s.finalReport.trim()
        ? `${s.finalReport.trim()}\n\n---\n\n${merged}`
        : merged;
      return { ...s, finalReport: nextReport };
    });
    return count;
  }, []);

  const reflectCardToC = useCallback((cardId: string) => {
    setState((s) => {
      const source = s.cards.find((c) => c.id === cardId);
      if (!source || source.layer !== "B") return s;

      const block = source.content.trim();
      const nextReport = s.finalReport.trim()
        ? `${s.finalReport.trim()}\n\n---\n\n${block}`
        : block;

      return { ...s, finalReport: nextReport };
    });
  }, []);

  const organizeCommonToA = useCallback((): number => {
    let added = 0;
    setState((s) => {
      const comparison = s.aiComparison.trim();
      const bullets = comparison
        ? extractComparisonBullets(comparison)
        : [
            "3モデルとも、ブリーフのスコープ整理が最初のステップとして有効",
            "根拠のない断定は避け、出典付きの事実へ分解する必要がある",
            "ツール選定（生成・編集・配布）の比較軸を先に固定すると議論が収束しやすい",
          ];

      if (bullets.length === 0) {
        bullets.push(
          "Research 実行後、「AI共通点を取り込む」で論点を取り込んでください",
        );
      }

      const existing = new Set(s.cards.filter((c) => c.layer === "A").map((c) => c.content));
      const newCards = bullets
        .map((content) => ({
          content: stripComparisonMeta(content),
          sourceUrl: firstMarkdownUrl(content),
        }))
        .filter(({ content }) => content && !existing.has(content))
        .map(({ content, sourceUrl }) => ({
          id: crypto.randomUUID(),
          content,
          layer: "A" as const,
          sourceUrl,
          memo: "3AI比較・出典統合から自動取り込み",
          status: "pending" as const,
          sourceTool: "manual" as const,
          createdAt: new Date().toISOString(),
        }));

      added = newCards.length;
      if (newCards.length === 0) return s;
      return { ...s, cards: [...s.cards, ...newCards] };
    });
    return added;
  }, []);

  const createVerificationPlansFromB = useCallback((): number => {
    let count = 0;
    setState((s) => {
      const targets = s.cards.filter((c) => c.layer === "B" && c.status !== "rejected");
      if (targets.length === 0) return s;

      const newCards = targets.map((source) => {
        count += 1;
        return {
          id: crypto.randomUUID(),
          content: buildVerificationPlanFromHypothesis(source.content, source.id),
          layer: "C" as const,
          sourceUrl: source.sourceUrl,
          memo: "B層から生成した検証案",
          status: "pending" as const,
          sourceTool: source.sourceTool,
          createdAt: new Date().toISOString(),
          derivedFromId: source.id,
        };
      });

      return { ...s, cards: [...s.cards, ...newCards] };
    });
    return count;
  }, []);

  const patchState = useCallback((patch: Partial<WorkspaceState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const addCard = useCallback(
    (input: {
      content: string;
      layer: CardLayer;
      sourceUrl?: string;
      memo?: string;
      status?: CardStatus;
      sourceTool?: SourceTool;
      derivedFromId?: string;
    }) => {
      const content = input.content.trim();
      if (!content) return false;

      const card: ResearchCard = {
        id: crypto.randomUUID(),
        content,
        layer: input.layer,
        sourceUrl: input.sourceUrl?.trim() ?? "",
        memo: input.memo?.trim() ?? "",
        status: input.status ?? "pending",
        sourceTool: input.sourceTool ?? "manual",
        createdAt: new Date().toISOString(),
        derivedFromId: input.derivedFromId,
      };

      setState((s) => ({ ...s, cards: [...s.cards, card] }));
      return true;
    },
    [],
  );

  const updateCard = useCallback(
    (id: string, patch: Partial<Omit<ResearchCard, "id" | "createdAt">>) => {
      setState((s) => ({
        ...s,
        cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    [],
  );

  const deleteCard = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      cards: s.cards.filter((c) => c.id !== id),
    }));
  }, []);

  const createVerificationFromHypothesis = useCallback((cardId: string): boolean => {
    let created = false;
    setState((s) => {
      const source = s.cards.find((c) => c.id === cardId);
      if (!source || source.layer !== "B") return s;

      const content = buildVerificationPlanFromHypothesis(source.content, cardId);
      const card: ResearchCard = {
        id: crypto.randomUUID(),
        content,
        layer: "C",
        sourceUrl: source.sourceUrl,
        memo: "B層仮説から自動生成",
        status: "pending",
        sourceTool: source.sourceTool,
        createdAt: new Date().toISOString(),
        derivedFromId: cardId,
      };
      created = true;
      return { ...s, cards: [...s.cards, card] };
    });
    return created;
  }, []);

  const runResearch = useCallback(() => {
    researchCancelRef.current?.();
    const controller = new AbortController();
    const cancelResearch = () => controller.abort();
    researchCancelRef.current = cancelResearch;

    const effectiveBrief =
      state.brief.trim() ||
      (state.mode === "ART"
        ? ART_MAIN_QUESTION_PLACEHOLDER
        : DEFAULT_MAIN_QUESTION_PLACEHOLDER);
    const request = {
      brief: effectiveBrief,
      mode: state.mode,
    };

    setState((s) => ({
      ...s,
      brief: effectiveBrief,
      aiStatus: { chatgpt: "running", gemini: "running", claude: "running" },
    }));

    void fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as ResearchResponse | { error?: string };
        if (!response.ok || !("results" in body)) {
          throw new Error(
            "error" in body && body.error
              ? body.error
              : "3AIリサーチを実行できませんでした",
          );
        }
        return body;
      })
      .then((body) => {
        const aiReports = {} as Record<AiToolId, string>;
        const aiStatus = {} as WorkspaceState["aiStatus"];

        for (const provider of AI_TOOLS) {
          aiReports[provider] = body.results[provider].report;
          aiStatus[provider] = body.results[provider].status;
        }

        setState((s) => ({
          ...s,
          aiReports,
          aiStatus,
          aiComparison: body.comparison,
        }));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "3AIリサーチでエラーが発生しました";
        setState((s) => ({
          ...s,
          aiStatus: { chatgpt: "error", gemini: "error", claude: "error" },
          aiReports: Object.fromEntries(
            AI_TOOLS.map((provider) => [
              provider,
              `# ${SOURCE_TOOL_LABELS[provider]} Report\n\n## 実行エラー\n\n${message}`,
            ]),
          ) as Record<AiToolId, string>,
          aiComparison: `# 3AI実行エラー\n\n${message}`,
        }));
      })
      .finally(() => {
        if (researchCancelRef.current === cancelResearch) {
          researchCancelRef.current = null;
        }
      });
  }, [state.brief, state.mode]);

  const runVerification = useCallback(() => {
    verificationCancelRef.current?.();
    setState((s) => ({ ...s, verificationStatus: "running" }));
    const timeout = window.setTimeout(() => {
      setState((s) => ({ ...s, verificationStatus: "done" }));
      verificationCancelRef.current = null;
    }, 1000);
    verificationCancelRef.current = () => window.clearTimeout(timeout);
  }, []);

  const resetWorkspace = useCallback(() => {
    researchCancelRef.current?.();
    verificationCancelRef.current?.();
    setState(DEFAULT_WORKSPACE);
  }, []);

  const cardsByLayer = useCallback(
    (layer: CardLayer) => state.cards.filter((c) => c.layer === layer),
    [state.cards],
  );

  const anyAiRunning = Object.values(state.aiStatus).some((s) => s === "running");

  return {
    state,
    hydrated,
    anyAiRunning,
    setMode,
    setLockProfile,
    setBrief,
    setNextSteps,
    setFinalReport,
    patchState,
    addCard,
    updateCard,
    deleteCard,
    adoptCardToB,
    adoptCardsToB,
    reflectCardToC,
    reflectAllBToFinalReport,
    organizeCommonToA,
    createVerificationFromHypothesis,
    createVerificationPlansFromB,
    runResearch,
    runVerification,
    resetWorkspace,
    cardsByLayer,
  };
}
