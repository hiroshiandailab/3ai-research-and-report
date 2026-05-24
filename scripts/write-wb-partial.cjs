"use client";

import { useMemo, useState } from "react";
import { ReportDialog } from "@/components/report-dialog";
import { ResearchCardItem } from "@/components/research-card-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useResearchWorkbench } from "@/hooks/use-research-workbench";
import { generateMockAiReport } from "@/lib/research-mock-ai";
import {
  buildFullMarkdownReport,
  copyMarkdownToClipboard,
  downloadMarkdown,
} from "@/lib/research-markdown";
import { clearWorkspaceStorage } from "@/lib/research-storage";
import { cn } from "@/lib/utils";
import {
  AI_TOOLS,
  LAYER_LABELS,
  MODE_HINTS,
  MODE_LABELS,
  SOURCE_TOOL_LABELS,
  STATUS_LABELS,
  type AiToolId,
  type CardLayer,
  type CardStatus,
  type ResearchMode,
  type RunState,
  type SourceTool,
} from "@/types/research";

const SOURCE_TOOLS: SourceTool[] = [
  "chatgpt",
  "gemini",
  "claude",
  "notebooklm",
  "manual",
];

const MODES: ResearchMode[] = ["ACADEMIC", "BUSINESS", "ART"];
const LAYERS: CardLayer[] = ["A", "B", "C"];
const STATUSES: CardStatus[] = ["adopted", "pending", "rejected"];

type DialogState = {
  title: string;
  description?: string;
  content: string;
} | null;

function runStateBadge(state: RunState) {
  switch (state) {
    case "idle":
      return <Badge variant="secondary">待機</Badge>;
    case "running":
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-600">調査中</Badge>
      );
    case "done":
      return (
        <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">完了</Badge>
      );
  }
}

function LayerEmpty({ layer }: { layer: CardLayer }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">
      {layer}層（{LAYER_LABELS[layer]}）のカードはまだありません。
    </p>
  );
}