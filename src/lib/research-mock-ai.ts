import {
  AI_TOOLS,
  LAYER_LABELS,
  MODE_HINTS,
  SOURCE_TOOL_LABELS,
  type AiToolId,
  type ResearchCard,
  type ResearchMode,
  type WorkspaceState,
} from "@/types/research";

const TOOL_ANGLES: Record<AiToolId, string> = {
  chatgpt: "全体像の整理と実務的な論点分解",
  gemini: "マルチモーダル・ツール連携の観点",
  claude: "長文要約と慎重な根拠付け",
};

export function generateMockAiReport(
  tool: AiToolId,
  brief: string,
  mode: ResearchMode,
): string {
  const label = SOURCE_TOOL_LABELS[tool];
  const topic = brief.trim() || "（ブリーフ未設定）";
  return [
    `# ${label} Report`,
    "",
    `- **モード**: ${mode} — ${MODE_HINTS[mode]}`,
    `- **視点**: ${TOOL_ANGLES[tool]}`,
    "",
    "## 調査サマリ（疑似）",
    "",
    `ブリーフ「${topic.slice(0, 120)}${topic.length > 120 ? "…" : ""}」に対する${label}のたたき台です。`,
    "API未接続のため、実際の回答ではなくワークベンチ用のプレースホルダーです。",
    "",
    "## 主要論点",
    "",
    "1. 定義とスコープの確認",
    "2. 一次情報との突合が必要な数値・仕様",
    "3. ツール選定（生成・編集・配布）の比較軸",
    "",
    "## 推奨アクション",
    "",
    "- 出典URLを付けてA層カードへ昇格",
    "- 不確実な主張はB層、検証タスクはC層へ分離",
  ].join("\n");
}

export function generateMockComparison(
  reports: Record<AiToolId, string>,
  cards: ResearchCard[],
): string {
  const lines = [
    "# 3AI差分比較（疑似）",
    "",
    "## 一致しやすい論点",
    "",
    "- ブリーフのスコープ整理は3モデルとも有効",
    "- 根拠のない断定は避けるべき、という点は共通",
    "",
    "## 相違・補完",
    "",
  ];

  for (const tool of AI_TOOLS) {
    const hasReport = reports[tool].trim().length > 0;
    lines.push(
      `### ${SOURCE_TOOL_LABELS[tool]}`,
      hasReport ? "- レポート生成済み（詳細は各Reportを参照）" : "- レポート未生成 — [Research] 実行後に再比較",
      `- カード取込数: ${cards.filter((c) => c.sourceTool === tool).length} 件`,
      "",
    );
  }

  const byLayer = (layer: "A" | "B" | "C") =>
    cards.filter((c) => c.layer === layer).length;

  lines.push(
    "## ワークベンチ上の整理状況",
    "",
    `- A層（${LAYER_LABELS.A}）: ${byLayer("A")} 件`,
    `- B層（${LAYER_LABELS.B}）: ${byLayer("B")} 件`,
    `- C層（${LAYER_LABELS.C}）: ${byLayer("C")} 件`,
    "",
    "## 次の比較ステップ",
    "",
    "1. 各AIレポートから事実候補をA層へ",
    "2. 解釈・仮説はB層、検証タスクはC層へ",
    "3. 本比較をMarkdownレポートに統合",
  );

  return lines.join("\n");
}

export function buildVerificationPlanFromHypothesis(
  hypothesis: string,
  sourceCardId: string,
): string {
  return [
    "【追加検証案】",
    "",
    hypothesis,
    "",
    "### 確認すべきこと",
    "- 一次ソース（公式ドキュメント・論文・リリースノート）での裏取り",
    "- 数値・日付・仕様の口径一致",
    "",
    "### 反証条件",
    "- 上記が否定された場合、B層の仮説を修正または却下",
    "",
    `（元B層カード: ${sourceCardId.slice(0, 8)}…）`,
  ].join("\n");
}

export function runMockResearch(
  state: WorkspaceState,
  onTick: (partial: Partial<WorkspaceState>) => void,
  onDone: (final: Partial<WorkspaceState>) => void,
): () => void {
  const running: WorkspaceState["aiStatus"] = {
    chatgpt: "running",
    gemini: "running",
    claude: "running",
  };
  onTick({ aiStatus: running });

  const timeout = window.setTimeout(() => {
    const reports = {} as Record<AiToolId, string>;
    for (const tool of AI_TOOLS) {
      reports[tool] = generateMockAiReport(
        tool,
        state.brief.trim(),
        state.mode,
      );
    }
    const comparison = generateMockComparison(reports, state.cards);
    onDone({
      aiStatus: { chatgpt: "done", gemini: "done", claude: "done" },
      aiReports: reports,
      aiComparison: comparison,
    });
  }, 1200);

  return () => window.clearTimeout(timeout);
}
