const fs = require('fs');
const path = 'C:/Users/h/src/research-workbench/src/components/research-workbench.tsx';

const content = "use client";

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

export function ResearchWorkbench() {
  const {
    state,
    hydrated,
    anyAiRunning,
    setMode,
    setLockProfile,
    setBrief,
    setNextSteps,
    addCard,
    updateCard,
    deleteCard,
    createVerificationFromHypothesis,
    runResearch,
    runVerification,
    resetWorkspace,
    cardsByLayer,
  } = useResearchWorkbench();

  const [pasteContent, setPasteContent] = useState("");
  const [draftSourceUrl, setDraftSourceUrl] = useState("");
  const [draftMemo, setDraftMemo] = useState("");
  const [draftLayer, setDraftLayer] = useState<CardLayer>("C");
  const [draftStatus, setDraftStatus] = useState<CardStatus>("pending");
  const [draftSourceTool, setDraftSourceTool] = useState<SourceTool>("manual");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [layerTab, setLayerTab] = useState<CardLayer>("A");

  const cardsA = cardsByLayer("A");
  const cardsB = cardsByLayer("B");
  const cardsC = cardsByLayer("C");

  const toolCounts = useMemo(() => {
    const counts: Record<SourceTool, number> = {
      chatgpt: 0,
      gemini: 0,
      claude: 0,
      notebooklm: 0,
      manual: 0,
    };
    for (const card of state.cards) counts[card.sourceTool] += 1;
    return counts;
  }, [state.cards]);

  const markdownPreview = useMemo(
    () => buildFullMarkdownReport(state),
    [state],
  );

  function flash(msg: string) {
    setExportMessage(msg);
    window.setTimeout(() => setExportMessage(null), 2500);
  }

  function handleAddCard() {
    const ok = addCard({
      content: pasteContent,
      layer: draftLayer,
      sourceUrl: draftSourceUrl,
      memo: draftMemo,
      status: draftStatus,
      sourceTool: draftSourceTool,
    });
    if (ok) {
      setPasteContent("");
      setDraftSourceUrl("");
      setDraftMemo("");
      setLayerTab(draftLayer);
    }
  }

  function openAiReport(tool: AiToolId) {
    const content =
      state.aiReports[tool].trim() ||
      generateMockAiReport(tool, state.brief, state.mode);
    setDialog({
      title: \\ Report\,
      description: "API未接続時は保存済みまたはプレビュー用の疑似レポート",
      content,
    });
  }

  function openComparison() {
    setDialog({
      title: "3AI比較",
      description: "ChatGPT / Gemini / Claude の対照整理（擬似）",
      content: state.aiComparison.trim() || "（[Research] 実行後に生成されます）",
    });
  }

  async function handleFullMarkdownCopy() {
    const md = buildFullMarkdownReport(state);
    await copyMarkdownToClipboard(md);
    flash("全文Markdownをコピーしました");
  }

  function handleFullMarkdownDownload() {
    downloadMarkdown(buildFullMarkdownReport(state), undefined);
    flash("全文Markdownをダウンロードしました");
  }

  function handleClearAll() {
    if (
      !window.confirm(
        "すべてのデータを削除します。ローカルストレージもクリアされます。よろしいですか？",
      )
    ) {
      return;
    }
    clearWorkspaceStorage();
    resetWorkspace();
    setPasteContent("");
    setDraftSourceUrl("");
    setDraftMemo("");
  }

  function renderLayerCards(layer: CardLayer) {
    const cards = layer === "A" ? cardsA : layer === "B" ? cardsB : cardsC;
    if (cards.length === 0) return <LayerEmpty layer={layer} />;
    return cards.map((card) => (
      <ResearchCardItem
        key={card.id}
        card={card}
        onUpdate={updateCard}
        onDelete={deleteCard}
        compact
        showHypothesisActions={layer === "B"}
        onCreateVerification={
          layer === "B" ? createVerificationFromHypothesis : undefined
        }
      />
    ));
  }

  if (!hydrated) {
    return (
      <motion.div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        読み込み中…
      </motion.div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ReportDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.title ?? ""}
        description={dialog?.description}
        content={dialog?.content ?? ""}
      />

      <header className="flex shrink-0 flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <motion.div className="space-y-1">
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">
            Research Workbench
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            複数AIの比較 × A/B/C層 × 検証可能なリサーチワークフロー
          </p>
        </motion.div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">DRAFT</Badge>
          <Badge variant="secondary">
            A:{cardsA.length} B:{cardsB.length} C:{cardsC.length}
          </Badge>
        </motion.div>
      </header>

      {exportMessage && (
        <p className="border-b bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
          {exportMessage}
        </p>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:h-[calc(100dvh-7rem)] lg:min-h-[560px] lg:grid-cols-2 lg:grid-rows-2 lg:gap-4 lg:p-4">
        <Card className="flex h-full min-h-[320px] flex-col lg:min-h-0">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-sm">1. ブリーフ & モード</CardTitle>
            <CardDescription className="text-xs">
              {MODE_HINTS[state.mode]}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="space-y-1">
              <Label className="text-xs">ResearchMode</Label>
              <div className="flex flex-wrap gap-1">
                {MODES.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={state.mode === m ? "default" : "outline"}
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setMode(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {MODE_LABELS[state.mode]}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">LockProfile</Label>
              <motion.div className="flex gap-1">
                {(["FULL", "LITE"] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={state.lockProfile === p ? "default" : "outline"}
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setLockProfile(p)}
                  >
                    {p}
                  </Button>
                ))}
              </motion.div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-2 pr-2">
                <div className="space-y-1">
                  <Label htmlFor="brief" className="text-xs">
                    ブリーフ
                  </Label>
                  <Textarea
                    id="brief"
                    value={state.brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder={"【背景】…\\n【対象】…\\n【目的】…"}
                    className="min-h-[72px] resize-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="next" className="text-xs">
                    次にやること
                  </Label>
                  <Textarea
                    id="next"
                    value={state.nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    placeholder="調査・検証・執筆・アクション"
                    className="min-h-[56px] resize-none text-xs"
                  />
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 pt-0">
            <Button
              type="button"
              onClick={runResearch}
              disabled={anyAiRunning}
              className="bg-blue-700 hover:bg-blue-700"
            >
              {anyAiRunning ? "Research 実行中…" : "[Research] 開始"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleClearAll}>
              クリア
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex h-full min-h-[320px] flex-col lg:min-h-0">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-sm">2. AIリサーチ & 取り込み</CardTitle>
            <CardDescription className="text-xs">
              3AIの疑似レポート・比較・調査カード化
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="space-y-1.5 rounded-lg border bg-muted/20 p-2">
              {AI_TOOLS.map((tool) => (
                <div
                  key={tool}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-medium">{SOURCE_TOOL_LABELS[tool]}</span>
                  {runStateBadge(state.aiStatus[tool])}
                </div>
              ))}
              <Separator className="my-1" />
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 flex-1 text-[10px]"
                  onClick={() => openAiReport("chatgpt")}
                >
                  ChatGPT Report
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 flex-1 text-[10px]"
                  onClick={() => openAiReport("gemini")}
                >
                  Gemini Report
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 flex-1 text-[10px]"
                  onClick={() => openAiReport("claude")}
                >
                  Claude Report
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 w-full text-[11px]"
                onClick={openComparison}
              >
                3AI比較
              </Button>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <motion.div className="space-y-2 pr-2">
                <div className="flex flex-wrap gap-1">
                  {SOURCE_TOOLS.map((tool) => (
                    <Button
                      key={tool}
                      type="button"
                      size="sm"
                      variant={draftSourceTool === tool ? "default" : "outline"}
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() => setDraftSourceTool(tool)}
                    >
                      {SOURCE_TOOL_LABELS[tool]}
                      {tool !== "manual" ? \ (\)\ : ""}
                    </Button>
                  ))}
                </div>
                <Textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="AI出力を貼り付けてカード化"
                  className="min-h-[64px] resize-none text-xs"
                />
                <div className="grid grid-cols-2 gap-1">
                  <Input
                    value={draftSourceUrl}
                    onChange={(e) => setDraftSourceUrl(e.target.value)}
                    placeholder="出典URL"
                    className="h-7 text-[11px]"
                  />
                  <Input
                    value={draftMemo}
                    onChange={(e) => setDraftMemo(e.target.value)}
                    placeholder="メモ"
                    className="h-7 text-[11px]"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {LAYERS.map((layer) => (
                    <Button
                      key={layer}
                      type="button"
                      size="sm"
                      variant={draftLayer === layer ? "default" : "outline"}
                      className={cn(
                        "h-6 px-1.5 text-[10px]",
                        layer === "A" &&
                          draftLayer === layer &&
                          "bg-emerald-700 hover:bg-emerald-700",
                        layer === "B" &&
                          draftLayer === layer &&
                          "bg-amber-600 hover:bg-amber-600",
                        layer === "C" &&
                          draftLayer === layer &&
                          "bg-slate-600 hover:bg-slate-600",
                      )}
                      onClick={() => setDraftLayer(layer)}
                    >
                      {layer}
                    </Button>
                  ))}
                  {STATUSES.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant={draftStatus === status ? "default" : "outline"}
                      className="h-6 px-1.5 text-[10px]"
                      onClick={() => setDraftStatus(status)}
                    >
                      {STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </motion.div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="gap-2 pt-0">
            <Button
              type="button"
              size="sm"
              onClick={handleAddCard}
              disabled={!pasteContent.trim()}
            >
              カードに追加
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex h-full min-h-[320px] flex-col border-emerald-600/20 lg:min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">3. A / B / C 層</CardTitle>
            <CardDescription className="text-xs">
              事実 → 仮説 → 未確認・計画（層ボタンで移動可）
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Tabs
              value={layerTab}
              onValueChange={(v) => setLayerTab(v as CardLayer)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="A" className="text-[11px]">
                  A · {cardsA.length}
                </TabsTrigger>
                <TabsTrigger value="B" className="text-[11px]">
                  B · {cardsB.length}
                </TabsTrigger>
                <TabsTrigger value="C" className="text-[11px]">
                  C · {cardsC.length}
                </TabsTrigger>
              </TabsList>
              {LAYERS.map((layer) => (
                <TabsContent
                  key={layer}
                  value={layer}
                  className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
                >
                  <p className="mb-2 text-[10px] text-muted-foreground">
                    {layer}層：{LAYER_LABELS[layer]}
                    {layer === "B" && "（「検証案を作成」でC層へ送れます）"}
                  </p>
                  <ScrollArea className="h-[200px] lg:h-[calc(100%-1.5rem)]">
                    <div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-[320px] flex-col border-amber-500/30 bg-amber-500/5 lg:min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">4. エクスポート & 検証</CardTitle>
            <CardDescription className="text-xs">
              全文Markdown · C層の追加検証（擬似）
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className="space-y-2">
              <Button
                type="button"
                className="w-full bg-emerald-800 hover:bg-emerald-800"
                onClick={handleFullMarkdownDownload}
              >
                Markdownエクスポート（保存）
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="sm"
                onClick={handleFullMarkdownCopy}
              >
                全文Markdownをコピー
              </Button>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                A/B/C · 3AI比較 · 次にやることを1本にまとめます。
              </p>
            </div>

            <Separator />

            <div className="space-y-2 rounded-lg border bg-background/60 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">追加検証（C層）</span>
                {runStateBadge(state.verificationStatus)}
              </div>
              <p className="text-[10px] text-muted-foreground">
                B層の仮説から自動生成された検証案{" "}
                {cardsC.filter((c) => c.derivedFromId).length} 件 / C層合計{" "}
                {cardsC.length} 件
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full"
                disabled={state.verificationStatus === "running"}
                onClick={runVerification}
              >
                {state.verificationStatus === "running"
                  ? "追加検証を実行中…"
                  : "追加検証を実行"}
              </Button>
            </div>

            <ScrollArea className="min-h-0 flex-1 rounded-md border bg-muted/20 p-2">
              <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-muted-foreground">
                {markdownPreview.slice(0, 1200)}
                {markdownPreview.length > 1200 ? "\\n\\n…" : ""}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
;

// Fix accidental motion tags from template - user asked div only
const fixed = content
  .replace(/<motion\.div/g, '<motion.div') // noop first
  .replace(/<\/motion\.motion>/g, '</div>')
  .replace(/<motion\.div/g, '<div')
  .replace(/<\/motion\.motion>/g, '</motion.div>')
  .replace(/<\/motion\.motion>/g, '</div>')
  .replace(/<\/motion\.motion>/g, '</div>');

// Actually do proper replacements
let out = content;
out = out.replaceAll('<motion.div', '<motion.div'); // identify mistakes
out = out.replaceAll('<motion.div', '<div');
out = out.replaceAll('</motion.div>', '</div>');
out = out.replaceAll('</motion.div>', '</motion.div>'); // fix wrong close in scroll
// fix the botched line renderLayerCards closing
out = out.replace(
  '<motion.div className="space-y-2 pr-2">{renderLayerCards(layer)}</motion.div>',
  '<div className="space-y-2 pr-2">{renderLayerCards(layer)}</div>',
);

fs.writeFileSync(path, out, 'utf8');
console.log('written', out.length, 'motion left', (out.match(/motion/g)||[]).length);
