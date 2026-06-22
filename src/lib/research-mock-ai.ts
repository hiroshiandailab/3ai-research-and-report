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
