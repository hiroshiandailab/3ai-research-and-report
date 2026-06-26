"use client";

import { LogOut } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import { AiReportsModal } from "@/components/ai-reports-modal";
import { ResearchCardItem } from "@/components/research-card-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useResearchWorkbench } from "@/hooks/use-research-workbench";
import {
  ART_MAIN_QUESTION_PLACEHOLDER,
  DEFAULT_MAIN_QUESTION_PLACEHOLDER,
} from "@/lib/research-brief";
import {
  buildFullMarkdownReport,
  copyMarkdownToClipboard,
  downloadMarkdown,
} from "@/lib/research-markdown";
import { clearWorkspaceStorage } from "@/lib/research-storage";
import { cn } from "@/lib/utils";
import {
  AI_TOOLS,
  BOARD_PANELS,
  WORKFLOW_STEPS,
  type AiToolId,
  type ResearchCard,
  type ResearchMode,
} from "@/types/research";

const MODES: { id: ResearchMode; label: string }[] = [
  { id: "ART", label: "Art" },
  { id: "ACADEMIC", label: "Academic" },
  { id: "BUSINESS", label: "Business" },
];

type AiReportTab = AiToolId | "compare";

interface GoogleDriveSaveResponse {
  fileName?: string;
  url?: string;
  error?: string;
}

interface GitHubMarkdownSaveResponse {
  path?: string;
  url?: string;
  commitUrl?: string;
  error?: string;
}

function StepHeader({
  step,
  label,
  guide,
  className,
}: {
  step: number;
  label: string;
  guide: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
        STEP {step}
      </p>
      <h2 className="text-base font-semibold tracking-tight text-[#0F172A]">{label}</h2>
      <p className="text-sm text-[#64748B]">{guide}</p>
    </div>
  );
}

function SummaryPanel({
  title,
  hint,
  cards,
  emptyMessage,
  children,
  className,
  variant = "main",
}: {
  title: string;
  hint: string;
  cards: ResearchCard[];
  emptyMessage: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "main" | "sidebar";
}) {
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#D8E2EC] bg-white shadow-[var(--rw-shadow)]",
        isSidebar ? "max-h-full" : "min-h-[280px] flex-1",
        className,
      )}
    >
      <div className={cn("shrink-0 border-b border-[#D8E2EC]", isSidebar ? "px-3 py-2.5" : "px-5 py-4")}>
        <h3 className={cn("font-semibold text-[#0F172A]", isSidebar ? "text-xs" : "text-sm")}>
          {title}
        </h3>
        <p className={cn("text-[#64748B]", isSidebar ? "mt-0.5 text-[10px]" : "mt-1 text-xs")}>
          {hint}
        </p>
      </div>
      <ScrollArea className={cn("min-h-0 flex-1", isSidebar ? "max-h-[320px]" : "")}>
        <div className={cn("space-y-3", isSidebar ? "p-2" : "p-4")}>
          {cards.length === 0 ? (
            <p
              className={cn(
                "text-center text-[#64748B]",
                isSidebar ? "py-4 text-[11px]" : "py-8 text-sm",
              )}
            >
              {emptyMessage}
            </p>
          ) : (
            children
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function AdoptedSentencesPanel({
  title,
  hint,
  cards,
  draft,
  onDraftChange,
  onAddDraft,
  onDelete,
}: {
  title: string;
  hint: string;
  cards: ResearchCard[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAddDraft: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#D8E2EC] bg-white shadow-[var(--rw-shadow)] md:max-h-none">
      <div className="shrink-0 border-b border-[#D8E2EC] px-3 py-2.5">
        <h3 className="text-xs font-semibold text-[#0F172A]">{title}</h3>
        <p className="mt-0.5 text-[10px] text-[#64748B]">{hint}</p>
      </div>
      <ScrollArea className="min-h-0 max-h-[320px] flex-1">
        <div className="space-y-2 p-2">
          {cards.map((card) => (
            <ResearchCardItem
              key={card.id}
              card={card}
              onDelete={onDelete}
              compact
            />
          ))}
          <Textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onBlur={onAddDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onAddDraft();
              }
            }}
            placeholder="3AIレポートから重要文を選び「採用する」"
            rows={cards.length === 0 ? 5 : 3}
            className={cn(
              "resize-none border-[#D8E2EC] bg-[#F5F8FB]/40 text-xs leading-relaxed text-[#0F172A] focus-visible:ring-[#2563EB]",
              cards.length === 0 && "min-h-[120px]",
            )}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

export function ResearchWorkbench({ userEmail }: { userEmail: string }) {
  const {
    state,
    hydrated,
    anyAiRunning,
    setMode,
    setBrief,
    setFinalReport,
    deleteCard,
    addCard,
    adoptCardsToB,
    organizeCommonToA,
    createVerificationPlansFromB,
    runResearch,
    runVerification,
    resetWorkspace,
    cardsByLayer,
  } = useResearchWorkbench();

  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reportTab, setReportTab] = useState<AiReportTab>("chatgpt");
  const [selectedSummaryIds, setSelectedSummaryIds] = useState<Set<string>>(new Set());
  const [adoptDraft, setAdoptDraft] = useState("");
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [isSavingMarkdown, setIsSavingMarkdown] = useState(false);
  const finalReportRef = useRef<HTMLTextAreaElement>(null);

  const cardsA = cardsByLayer("A");
  const cardsB = cardsByLayer("B");
  const cardsC = cardsByLayer("C");

  const researchDone = AI_TOOLS.some((t) => state.aiStatus[t] === "done");
  const activeStep = useMemo(() => {
    if (!researchDone) return 1;
    if (cardsB.length === 0) return 2;
    return 3;
  }, [researchDone, cardsB.length]);

  function flash(msg: string) {
    setExportMessage(msg);
    window.setTimeout(() => setExportMessage(null), 2800);
  }

  function toggleSelect(id: string) {
    setSelectedSummaryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddAdoptDraft() {
    const text = adoptDraft.trim();
    if (!text) return;
    addCard({ content: text, layer: "B", status: "adopted" });
    setAdoptDraft("");
  }

  function handleAdopt() {
    const targets =
      selectedSummaryIds.size > 0
        ? cardsA.filter((c) => selectedSummaryIds.has(c.id)).map((c) => c.id)
        : cardsA.map((c) => c.id);

    if (targets.length === 0) {
      flash("3AIレポートから「共通点をAI共通まとめへ反映」するか、AI共通まとめに文を追加してください");
      return;
    }

    const n = adoptCardsToB(targets);
    setSelectedSummaryIds(new Set());
    flash(`${n} 件を「採用する重要文」へ移しました`);
  }

  function handleReflectCommonToA() {
    const n = organizeCommonToA();
    flash(
      n > 0
        ? `AI共通まとめに ${n} 件反映しました`
        : "追加する新しい論点がありません",
    );
  }

  function buildNextFinalReport() {
    const texts = cardsB
      .map((card) => card.content.trim())
      .filter((content) => content.length > 0);
    const merged = texts.map((text, index) => `${index + 1}. ${text}`).join("\n");
    const current = state.finalReport.trim();
    return {
      count: texts.length,
      content: current ? `${current}\n\n---\n\n${merged}` : merged,
    };
  }

  async function saveFinalReportToDrive(content: string) {
    const response = await fetch("/api/save/google-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "3AI Research Report",
        brief: state.brief,
        content,
      }),
      cache: "no-store",
    });

    const result = (await response.json()) as GoogleDriveSaveResponse;
    if (!response.ok) {
      throw new Error(result.error || "Google Drive保存に失敗しました");
    }
    return result;
  }

  async function handleFinalReport() {
    const nextReport = buildNextFinalReport();
    if (nextReport.count === 0) {
      flash("採用する重要文がありません");
      finalReportRef.current?.focus();
      return;
    }

    setFinalReport(nextReport.content);
    finalReportRef.current?.focus();

    setIsSavingDrive(true);
    try {
      const saved = await saveFinalReportToDrive(nextReport.content);
      flash(
        saved.fileName
          ? `最終本文を作成し、Google Driveへ保存しました: ${saved.fileName}`
          : "最終本文を作成し、Google Driveへ保存しました",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google Drive保存に失敗しました";
      flash(`最終本文は作成しました。${message}`);
    } finally {
      setIsSavingDrive(false);
    }
  }

  async function saveMarkdownToGitHub(markdown: string) {
    const response = await fetch("/api/save/github-markdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "3AI Research Report",
        markdown,
      }),
      cache: "no-store",
    });

    const result = (await response.json()) as GitHubMarkdownSaveResponse;
    if (!response.ok) {
      throw new Error(result.error || "GitHub保存に失敗しました");
    }
    return result;
  }

  async function handleMarkdownGenerate() {
    const md = buildFullMarkdownReport(state);
    await copyMarkdownToClipboard(md);
    downloadMarkdown(md, undefined);

    setIsSavingMarkdown(true);
    try {
      const saved = await saveMarkdownToGitHub(md);
      flash(
        saved.path
          ? `Markdownを生成し、GitHubへ保存しました: ${saved.path}`
          : "Markdownを生成し、GitHubへ保存しました",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "GitHub保存に失敗しました";
      flash(`Markdownは生成しました。${message}`);
    } finally {
      setIsSavingMarkdown(false);
    }
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
    setSelectedSummaryIds(new Set());
    setAdoptDraft("");
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[#64748B]">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F5F8FB]">
      <AiReportsModal
        open={reportsOpen}
        onOpenChange={setReportsOpen}
        state={state}
        reportTab={reportTab}
        onReportTabChange={setReportTab}
        onReflectCommonToA={handleReflectCommonToA}
      />

      <header className="shrink-0 border-b border-[#D8E2EC] bg-white px-6 py-5 shadow-[var(--rw-shadow)]">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-[#0F172A] sm:text-2xl">
                3AI Research & Report
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[#64748B]">
                複数AIの回答を比較し、自分が重要だと判断した情報を採用し、最終レポートへ整理するAIリサーチ作業台
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="hidden max-w-48 truncate text-xs text-[#64748B] sm:inline"
                title={userEmail}
              >
                {userEmail}
              </span>
              <Badge
                variant="outline"
                className="border-[#D8E2EC] bg-[#EAF2F8] font-normal text-[#334155]"
              >
                DRAFT
              </Badge>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  title="ログアウト"
                  aria-label="ログアウト"
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  <LogOut aria-hidden />
                </Button>
              </form>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {WORKFLOW_STEPS.map(({ step, label, guide }) => (
              <div
                key={step}
                className={cn(
                  "rounded-xl border px-4 py-3 transition-colors",
                  activeStep === step
                    ? "border-[#2563EB]/40 bg-[#EAF2F8]/60 shadow-[var(--rw-shadow)]"
                    : "border-[#D8E2EC] bg-[#F5F8FB]/50",
                  step === 1 && "cursor-pointer hover:border-[#2563EB]/30 hover:bg-white",
                )}
                onClick={step === 1 ? () => setReportsOpen(true) : undefined}
                onKeyDown={
                  step === 1
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setReportsOpen(true);
                        }
                      }
                    : undefined
                }
                role={step === 1 ? "button" : undefined}
                tabIndex={step === 1 ? 0 : undefined}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                  STEP {step}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[#0F172A]">{label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#64748B]">{guide}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {exportMessage && (
        <p className="shrink-0 border-b border-[#D8E2EC] bg-[#EAF2F8]/80 px-6 py-2 text-center text-sm text-[#334155]">
          {exportMessage}
        </p>
      )}

      {/* STEP 1 — リサーチ条件 */}
      <section className="shrink-0 border-b border-[#D8E2EC] bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl space-y-4">
          <StepHeader
            step={WORKFLOW_STEPS[0].step}
            label={WORKFLOW_STEPS[0].label}
            guide="リサーチ条件を入力して、3AIレポートを確認します"
          />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-2">
                <span className="text-xs font-medium text-[#64748B]">リサーチ対象</span>
                <div className="flex flex-wrap gap-2">
                  {MODES.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMode(id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        state.mode === id
                          ? "bg-[#2563EB] text-white"
                          : "bg-[#EAF2F8] text-[#334155] hover:bg-[#D8E2EC]/60",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme" className="text-xs font-medium text-[#64748B]">
                  Main Question
                </Label>
                <Textarea
                  id="theme"
                  value={state.brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder={
                    state.mode === "ART"
                      ? ART_MAIN_QUESTION_PLACEHOLDER
                      : DEFAULT_MAIN_QUESTION_PLACEHOLDER
                  }
                  rows={2}
                  className="resize-none border-[#D8E2EC] bg-[#F5F8FB]/40 text-sm leading-relaxed text-[#0F172A] focus-visible:ring-[#2563EB]"
                />
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 lg:w-52">
              <Button
                type="button"
                size="lg"
                disabled={anyAiRunning}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]"
                onClick={runResearch}
              >
                {anyAiRunning ? "Research…" : "Research"}
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B]"
                onClick={() => setReportsOpen(true)}
              >
                3AIレポートを開く
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-6">
        {/* STEP 2 */}
        <section className="flex flex-col gap-3">
          <StepHeader
            step={WORKFLOW_STEPS[1].step}
            label={WORKFLOW_STEPS[1].label}
            guide={
              selectedSummaryIds.size > 0
                ? `${selectedSummaryIds.size} 件選択中 —「選択文を採用する」で右のサイドパネルへ移動`
                : WORKFLOW_STEPS[1].guide
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[9fr_3fr]">
            <SummaryPanel
              variant="main"
              title={BOARD_PANELS.A.title}
              hint={BOARD_PANELS.A.hint}
              cards={cardsA}
              emptyMessage="モーダルで「共通点をAI共通まとめへ反映」するか、文を追加してください"
            >
              {cardsA.map((card) => (
                <ResearchCardItem
                  key={card.id}
                  card={card}
                  onDelete={deleteCard}
                  selectable
                  selected={selectedSummaryIds.has(card.id)}
                  onSelectToggle={() => toggleSelect(card.id)}
                />
              ))}
            </SummaryPanel>

            <AdoptedSentencesPanel
              title={BOARD_PANELS.B.title}
              hint={BOARD_PANELS.B.hint}
              cards={cardsB}
              draft={adoptDraft}
              onDraftChange={setAdoptDraft}
              onAddDraft={handleAddAdoptDraft}
              onDelete={deleteCard}
            />
          </div>

          <div className="flex shrink-0 justify-end pt-1">
            <Button
              type="button"
              size="lg"
              className="min-w-[200px] bg-[#2563EB] px-10 hover:bg-[#1D4ED8]"
              onClick={handleAdopt}
            >
              選択文を採用する
            </Button>
          </div>
        </section>

        {/* STEP 3 */}
        <section className="flex flex-col gap-4">
          <StepHeader
            step={WORKFLOW_STEPS[2].step}
            label={WORKFLOW_STEPS[2].label}
            guide={WORKFLOW_STEPS[2].guide}
          />

          <div className="flex min-h-[260px] flex-col overflow-hidden rounded-xl border border-[#D8E2EC] bg-white shadow-[var(--rw-shadow)]">
            <div className="flex flex-1 flex-col p-4">
              <Textarea
                ref={finalReportRef}
                value={state.finalReport}
                onChange={(e) => setFinalReport(e.target.value)}
                placeholder="採用した重要文をもとに、最終レポート本文を編集…"
                className="min-h-[120px] flex-1 resize-none border-[#D8E2EC] bg-[#F5F8FB]/30 text-sm leading-relaxed text-[#0F172A] focus-visible:ring-[#2563EB]"
              />

              {cardsC.length > 0 && (
                <details className="mt-3 shrink-0 border-t border-[#D8E2EC] pt-3">
                  <summary className="cursor-pointer text-[11px] text-[#64748B]">
                    参考（検証案 {cardsC.length} 件）
                  </summary>
                  <ScrollArea className="mt-2 max-h-20">
                    <div className="space-y-2 pr-2">
                      {cardsC.map((card) => (
                        <ResearchCardItem
                          key={card.id}
                          card={card}
                          onDelete={deleteCard}
                          compact
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </details>
              )}

              <div className="mt-4 flex shrink-0 flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="bg-[#2563EB] px-6 hover:bg-[#1D4ED8]"
                  disabled={isSavingDrive}
                  onClick={handleFinalReport}
                >
                  {isSavingDrive ? "Drive保存中…" : "最終本文を作成"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="bg-[#0F766E] px-6 hover:bg-[#115E59]"
                  disabled={isSavingMarkdown}
                  onClick={handleMarkdownGenerate}
                >
                  {isSavingMarkdown ? "GitHub保存中…" : "Markdown生成"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-[#D8E2EC] bg-white/80 px-6 py-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#94A3B8]">
          <button
            type="button"
            className="hover:text-[#64748B] hover:underline"
            onClick={() => {
              const n = createVerificationPlansFromB();
              flash(n > 0 ? `検証案を ${n} 件作成` : "採用する重要文がありません");
            }}
          >
            検証案作成
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            className="hover:text-[#64748B] hover:underline disabled:opacity-50"
            disabled={state.verificationStatus === "running"}
            onClick={() => {
              runVerification();
              flash("再検証を実行しました（疑似）");
            }}
          >
            {state.verificationStatus === "running" ? "再検証中…" : "再検証"}
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            className="hover:text-[#64748B] hover:underline"
            onClick={() => finalReportRef.current?.focus()}
          >
            最終レポートを編集
          </button>
          <button
            type="button"
            className="ml-auto hover:text-destructive hover:underline"
            onClick={handleClearAll}
          >
            全データをクリア
          </button>
        </div>
      </footer>
    </div>
  );
}
