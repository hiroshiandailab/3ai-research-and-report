"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateMockAiReport } from "@/lib/research-mock-ai";
import {
  AI_TOOLS,
  SOURCE_TOOL_LABELS,
  type AiToolId,
  type ResearchMode,
  type RunState,
  type WorkspaceState,
} from "@/types/research";

type AiReportTab = AiToolId | "compare";

function runStateBadge(state: RunState) {
  switch (state) {
    case "idle":
      return (
        <Badge variant="secondary" className="text-[10px] font-normal">
          待機
        </Badge>
      );
    case "running":
      return (
        <Badge className="bg-[#2563EB] text-[10px] font-normal text-white hover:bg-[#2563EB]">
          実行中
        </Badge>
      );
    case "done":
      return (
        <Badge className="bg-[#0F766E] text-[10px] font-normal text-white hover:bg-[#0F766E]">
          完了
        </Badge>
      );
  }
}

type AiReportsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: WorkspaceState;
  reportTab: AiReportTab;
  onReportTabChange: (tab: AiReportTab) => void;
  onReflectCommonToA: () => void;
};

function reportForTab(
  tab: AiReportTab,
  state: WorkspaceState,
  mode: ResearchMode,
): string {
  if (tab === "compare") {
    return (
      state.aiComparison.trim() ||
      "Research を実行すると、3AIの比較レポートがここに表示されます。"
    );
  }
  return (
    state.aiReports[tab].trim() ||
    generateMockAiReport(tab, state.brief.trim(), mode)
  );
}

export function AiReportsModal({
  open,
  onOpenChange,
  state,
  reportTab,
  onReportTabChange,
  onReflectCommonToA,
}: AiReportsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 py-4">
          <DialogTitle className="text-lg">3AIレポート</DialogTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            {AI_TOOLS.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                {SOURCE_TOOL_LABELS[tool]}
                {runStateBadge(state.aiStatus[tool])}
              </span>
            ))}
          </div>
        </DialogHeader>

        <Tabs
          value={reportTab}
          onValueChange={(v) => onReportTabChange(v as AiReportTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 border-b border-border/60 px-6 pt-3">
            <TabsList className="h-9 w-full justify-start bg-background/60">
              <TabsTrigger value="chatgpt" className="text-xs">
                ChatGPT
              </TabsTrigger>
              <TabsTrigger value="gemini" className="text-xs">
                Gemini
              </TabsTrigger>
              <TabsTrigger value="claude" className="text-xs">
                Claude
              </TabsTrigger>
              <TabsTrigger value="compare" className="text-xs">
                Compare
              </TabsTrigger>
            </TabsList>
          </div>

          {(["chatgpt", "gemini", "claude", "compare"] as AiReportTab[]).map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-[min(420px,52vh)]">
                <pre className="whitespace-pre-wrap px-6 py-4 font-sans text-sm leading-relaxed text-foreground/90">
                  {reportForTab(tab, state, state.mode)}
                </pre>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              onReflectCommonToA();
            }}
          >
            共通点をAI共通まとめへ反映
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
