import { MODE_HINTS, MODE_LABELS, type ResearchMode } from "@/types/research";

export function buildResearchPrompt(
  brief: string,
  mode: ResearchMode,
  providerLabel: string,
): string {
  const today = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  return [
    `あなたは${providerLabel}として、出典を重視する日本語のリサーチ担当者です。`,
    `調査日: ${today}`,
    `調査分野: ${MODE_LABELS[mode]}（${MODE_HINTS[mode]}）`,
    "",
    "次の質問をWeb検索で調査してください。",
    "<question>",
    brief,
    "</question>",
    "",
    "要件:",
    "- 最新情報が関係する場合は調査日時点の情報を優先する",
    "- 重要な主張にはMarkdownリンク形式で出典URLを付ける",
    "- 事実、解釈、未確認事項を区別する",
    "- 一次情報や公式情報を優先する",
    "- 十分な根拠がない内容は断定しない",
    "- 他のAIの回答を推測せず、独立して調査する",
    "",
    "以下のMarkdown構成で回答してください:",
    `# ${providerLabel} Report`,
    "## 調査サマリ",
    "## 主要な事実",
    "## 分析・示唆",
    "## 未確認事項・注意点",
    "## 推奨アクション",
    "## Sources",
    "",
    "Sourcesには、参照したページを「- [タイトル](URL)」形式で列挙してください。",
  ].join("\n");
}
