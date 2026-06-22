export type ResearchMode = "ACADEMIC" | "BUSINESS" | "ART";
export type LockProfile = "FULL" | "LITE";
export type CardLayer = "A" | "B" | "C";
export type CardStatus = "adopted" | "pending" | "rejected";
export type SourceTool = "chatgpt" | "gemini" | "claude" | "notebooklm" | "manual";
export type AiToolId = "chatgpt" | "gemini" | "claude";
export type RunState = "idle" | "running" | "done" | "error";

export interface ResearchCard {
  id: string;
  content: string;
  layer: CardLayer;
  sourceUrl: string;
  memo: string;
  status: CardStatus;
  sourceTool: SourceTool;
  createdAt: string;
  /** B層から生成された検証案の場合、元カードID */
  derivedFromId?: string;
}

export interface WorkspaceState {
  version: 2;
  mode: ResearchMode;
  lockProfile: LockProfile;
  brief: string;
  cards: ResearchCard[];
  aiStatus: Record<AiToolId, RunState>;
  aiReports: Record<AiToolId, string>;
  aiComparison: string;
  nextSteps: string;
  /** C層の編集可能な最終レポート本文 */
  finalReport: string;
  verificationStatus: RunState;
}

export const MODE_LABELS: Record<ResearchMode, string> = {
  ACADEMIC: "学術",
  BUSINESS: "経営・市場",
  ART: "生成芸術・AI開発",
};

export const MODE_HINTS: Record<ResearchMode, string> = {
  ACADEMIC: "論文・理論・実証の調査",
  BUSINESS: "市場・企業・政策の分析",
  ART: "生成映像・AI音楽・ジェネラティブアート・AI開発ツール",
};

export const LAYER_LABELS: Record<CardLayer, string> = {
  A: "確認済み事実",
  B: "推測・仮説",
  C: "未確認・要検証",
};

/** 作業フロー（UI表示用・データ層 A/B/C は内部のまま） */
export const WORKFLOW_STEPS = [
  {
    step: 1,
    label: "AIレポートを見る",
    guide: "「3AIレポートを開く」で各AIの回答を確認します",
  },
  {
    step: 2,
    label: "重要文を採用する",
    guide: "共通まとめから、あなたが残したい文を選びます",
  },
  {
    step: 3,
    label: "最終レポートを作る",
    guide: "採用した重要文をもとに、最終本文を整えます",
  },
] as const;

/** パネル表示用（A/B/C層の表記は出さない） */
export const BOARD_PANELS: Record<
  CardLayer,
  { title: string; hint: string }
> = {
  A: {
    title: "AI共通まとめ",
    hint: "3つのAIに共通する論点・整理メモ",
  },
  B: {
    title: "採用する重要文",
    hint: "あなたが「残す」と判断した文",
  },
  C: {
    title: "最終レポート",
    hint: "採用した文を統合した、公開・保存用の本文",
  },
};

export const STATUS_LABELS: Record<CardStatus, string> = {
  adopted: "採用",
  pending: "保留",
  rejected: "却下",
};

export const SOURCE_TOOL_LABELS: Record<SourceTool, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  notebooklm: "NotebookLM",
  manual: "手入力",
};

export const AI_TOOLS: AiToolId[] = ["chatgpt", "gemini", "claude"];

export const DEFAULT_WORKSPACE: WorkspaceState = {
  version: 2,
  mode: "ART",
  lockProfile: "FULL",
  brief: "",
  cards: [],
  aiStatus: { chatgpt: "idle", gemini: "idle", claude: "idle" },
  aiReports: { chatgpt: "", gemini: "", claude: "" },
  aiComparison: "",
  nextSteps: "",
  finalReport: "",
  verificationStatus: "idle",
};
