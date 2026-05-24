import {
  LAYER_LABELS,
  MODE_HINTS,
  MODE_LABELS,
  SOURCE_TOOL_LABELS,
  STATUS_LABELS,
  type CardLayer,
  type ResearchCard,
  type WorkspaceState,
} from "@/types/research";

function cardsForLayer(cards: ResearchCard[], layer: CardLayer): ResearchCard[] {
  return cards
    .filter((c) => c.layer === layer)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function formatCard(card: ResearchCard, index: number): string {
  const lines = [
    `### ${index + 1}. [${STATUS_LABELS[card.status]}]`,
    "",
    card.content,
    "",
  ];

  if (card.sourceUrl.trim()) lines.push(`- **出典**: ${card.sourceUrl.trim()}`);
  if (card.memo.trim()) lines.push(`- **メモ**: ${card.memo.trim()}`);
  lines.push(`- **ソース**: ${SOURCE_TOOL_LABELS[card.sourceTool]}`);
  lines.push(`- **作成**: ${new Date(card.createdAt).toLocaleString("ja-JP")}`);
  lines.push("");
  return lines.join("\n");
}

function sectionForLayer(cards: ResearchCard[], layer: CardLayer): string {
  const layerCards = cardsForLayer(cards, layer);
  const header = `## ${layer}層：${LAYER_LABELS[layer]}`;
  if (layerCards.length === 0) return `${header}\n\n（該当なし）\n`;
  return `${header}\n\n${layerCards.map((c, i) => formatCard(c, i)).join("\n")}`;
}

function sectionAiReports(state: WorkspaceState): string {
  const parts = ["## 3AIレポート", ""];
  for (const tool of ["chatgpt", "gemini", "claude"] as const) {
    const body = state.aiReports[tool].trim();
    parts.push(`### ${SOURCE_TOOL_LABELS[tool]}`, "", body || "（未生成）", "");
  }
  return parts.join("\n");
}

/** 簡易エクスポート（A/B/C中心） */
export function buildMarkdownExport(state: WorkspaceState): string {
  return buildFullMarkdownReport(state);
}

/** 統合Markdownレポート */
export function buildFullMarkdownReport(state: WorkspaceState): string {
  const now = new Date().toLocaleString("ja-JP");
  const header = [
    "# 3AI Research & Report — 統合レポート",
    "",
    `- **ResearchMode**: ${state.mode}（${MODE_LABELS[state.mode]}）`,
    `- **用途**: ${MODE_HINTS[state.mode]}`,
    `- **LockProfile**: ${state.lockProfile}`,
    `- **出力日時**: ${now}`,
    "",
  ];

  const brief = state.brief.trim();
  if (brief) {
    header.push("## ブリーフ", "", brief, "");
  }

  const comparison = state.aiComparison.trim();
  const comparisonSection = [
    "## 3AI差分比較",
    "",
    comparison || "（[Research] 実行後に生成されます）",
    "",
  ].join("\n");

  const nextSection = [
    "## 次に試すこと",
    "",
    state.nextSteps.trim() || "（未記入）",
    "",
  ].join("\n");

  const finalSection = [
    "## C層：最終レポート（編集本文）",
    "",
    state.finalReport.trim() || "（未記入）",
    "",
  ].join("\n");

  return [
    ...header,
    sectionForLayer(state.cards, "A"),
    sectionForLayer(state.cards, "B"),
    finalSection,
    sectionForLayer(state.cards, "C"),
    comparisonSection,
    sectionAiReports(state),
    nextSection,
  ].join("\n");
}

export async function copyMarkdownToClipboard(markdown: string): Promise<void> {
  await navigator.clipboard.writeText(markdown);
}

export function downloadMarkdown(markdown: string, filename?: string): void {
  const name =
    filename ?? `research-report-${new Date().toISOString().slice(0, 10)}.md`;
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
