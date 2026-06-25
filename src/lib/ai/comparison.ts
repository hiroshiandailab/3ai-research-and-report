import "server-only";

import {
  AI_TOOLS,
  SOURCE_TOOL_LABELS,
  type AiToolId,
} from "@/types/research";
import type { ProviderResearchResult } from "@/types/research-api";

type ProviderResults = Record<AiToolId, ProviderResearchResult>;

interface SourceLink {
  title: string;
  url: string;
  providers: Set<AiToolId>;
}

interface Statement {
  provider: AiToolId;
  text: string;
  normalized: string;
  sources: SourceLink[];
}

interface StatementCluster {
  statements: Statement[];
  providers: Set<AiToolId>;
  sources: SourceLink[];
}

const TARGET_SECTIONS = new Set([
  "調査サマリ",
  "主要な事実",
  "分析・示唆",
  "推奨アクション",
]);

const SOURCE_SECTION_NAMES = new Set(["Sources", "出典", "参考資料"]);

const COMMON_THRESHOLD = 0.18;
const MAX_PROVIDER_STATEMENTS = 14;

export function buildIntegratedComparison(results: ProviderResults): string {
  const allSources = collectSources(results);
  const statements = AI_TOOLS.flatMap((provider) =>
    extractStatements(provider, results[provider].report),
  );
  const clusters = buildCommonClusters(statements);
  const commonClusters = clusters
    .filter((cluster) => cluster.providers.size >= 2)
    .slice(0, 6);

  return [
    "# 3AI比較・出典統合",
    "",
    buildStatusSection(results),
    buildCommonSection(commonClusters),
    buildDifferenceSection(statements, commonClusters),
    buildAdoptionSection(commonClusters, statements),
    buildSourcesSection(allSources),
    buildCautionSection(results, commonClusters),
  ].join("\n\n");
}

function buildStatusSection(results: ProviderResults): string {
  return [
    "## 実行状況",
    "",
    ...AI_TOOLS.map((provider) => {
      const result = results[provider];
      const label = SOURCE_TOOL_LABELS[provider];
      return `- **${label}**: ${
        result.status === "done" ? `完了（${result.model}）` : `失敗 — ${result.error}`
      }`;
    }),
  ].join("\n");
}

function buildCommonSection(clusters: StatementCluster[]): string {
  if (clusters.length === 0) {
    return [
      "## 共通点",
      "",
      "- 2つ以上のAIで十分に近い論点はまだ抽出できませんでした。",
    ].join("\n");
  }

  return [
    "## 共通点",
    "",
    ...clusters.map((cluster) => {
      const text = representativeText(cluster);
      const providers = formatProviders(cluster.providers);
      const source = formatInlineSources(cluster.sources);
      return `- ${text}（一致: ${providers}）${source}`;
    }),
  ].join("\n");
}

function buildDifferenceSection(
  statements: Statement[],
  commonClusters: StatementCluster[],
): string {
  const common = new Set(commonClusters.flatMap((cluster) => cluster.statements));
  const lines = ["## 相違点", ""];

  for (const provider of AI_TOOLS) {
    const unique = statements
      .filter((statement) => statement.provider === provider && !common.has(statement))
      .slice(0, 2);

    if (unique.length === 0) continue;
    lines.push(`### ${SOURCE_TOOL_LABELS[provider]}`, "");
    for (const statement of unique) {
      lines.push(`- ${statement.text}${formatInlineSources(statement.sources)}`);
    }
    lines.push("");
  }

  if (lines.length === 2) {
    lines.push("- 主要な差分はまだ抽出できませんでした。");
  }

  return lines.join("\n").trimEnd();
}

function buildAdoptionSection(
  commonClusters: StatementCluster[],
  statements: Statement[],
): string {
  const candidates: Array<{ text: string; sources: SourceLink[] }> =
    commonClusters.length > 0
      ? commonClusters.map((cluster) => ({
          text: representativeText(cluster),
          sources: cluster.sources,
        }))
      : statements.slice(0, 5).map((statement) => ({
          text: statement.text,
          sources: statement.sources,
        }));

  return [
    "## 採用候補",
    "",
    ...(candidates.length > 0
      ? candidates.slice(0, 5).map((candidate) => {
          return `- ${candidate.text}${formatInlineSources(candidate.sources)}`;
        })
      : ["- 採用候補はまだありません。"]),
  ].join("\n");
}

function buildSourcesSection(sources: SourceLink[]): string {
  if (sources.length === 0) {
    return ["## 統合出典", "", "- 出典URLはまだ抽出できませんでした。"].join(
      "\n",
    );
  }

  return [
    "## 統合出典",
    "",
    ...sources.slice(0, 20).map((source) => {
      return `- [${source.title}](${source.url}) — ${formatProviders(source.providers)}`;
    }),
  ].join("\n");
}

function buildCautionSection(
  results: ProviderResults,
  commonClusters: StatementCluster[],
): string {
  const failed = AI_TOOLS.filter((provider) => results[provider].status === "error");
  const lines = ["## 注意点", ""];

  if (failed.length > 0) {
    lines.push(
      `- ${formatProviders(new Set(failed))} は失敗したため、比較は成功したAIの回答を中心に作成しています。`,
    );
  }
  if (commonClusters.length === 0) {
    lines.push(
      "- 共通点が少ない場合は、Main Questionを絞るか、Geminiの利用枠回復後に再実行してください。",
    );
  }
  lines.push("- 最終採用前に、統合出典の一次情報・公式情報を確認してください。");

  return lines.join("\n");
}

function collectSources(results: ProviderResults): SourceLink[] {
  const sourceMap = new Map<string, SourceLink>();

  for (const provider of AI_TOOLS) {
    for (const source of extractMarkdownLinks(results[provider].report)) {
      const key = normalizeUrl(source.url);
      const existing = sourceMap.get(key);
      if (existing) {
        existing.providers.add(provider);
      } else {
        sourceMap.set(key, {
          title: source.title,
          url: source.url,
          providers: new Set([provider]),
        });
      }
    }
  }

  return [...sourceMap.values()].sort((a, b) => {
    const providerDelta = b.providers.size - a.providers.size;
    if (providerDelta !== 0) return providerDelta;
    return a.title.localeCompare(b.title, "ja");
  });
}

function extractStatements(provider: AiToolId, report: string): Statement[] {
  const statements: Statement[] = [];
  let currentSection = "";

  for (const rawLine of report.split(/\r?\n/)) {
    const heading = rawLine.match(/^#{2,3}\s+(.+)$/);
    if (heading) {
      currentSection = heading[1].trim();
      continue;
    }
    if (
      currentSection &&
      !TARGET_SECTIONS.has(currentSection) &&
      !SOURCE_SECTION_NAMES.has(currentSection)
    ) {
      continue;
    }
    if (SOURCE_SECTION_NAMES.has(currentSection)) continue;

    const cleaned = cleanStatementText(rawLine);
    if (!isUsefulStatement(cleaned)) continue;

    const normalized = normalizeStatement(cleaned);
    if (!normalized) continue;

    statements.push({
      provider,
      text: cleaned,
      normalized,
      sources: extractMarkdownLinks(rawLine).map((source) => ({
        ...source,
        providers: new Set([provider]),
      })),
    });

    if (statements.filter((item) => item.provider === provider).length >= MAX_PROVIDER_STATEMENTS) {
      break;
    }
  }

  return statements;
}

function buildCommonClusters(statements: Statement[]): StatementCluster[] {
  const clusters: StatementCluster[] = [];

  for (const statement of statements) {
    let bestCluster: StatementCluster | null = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      if (cluster.providers.has(statement.provider)) continue;
      const score = Math.max(
        ...cluster.statements.map((item) =>
          similarity(item.normalized, statement.normalized),
        ),
      );
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestScore >= COMMON_THRESHOLD) {
      bestCluster.statements.push(statement);
      bestCluster.providers.add(statement.provider);
      bestCluster.sources = mergeSources([
        ...bestCluster.sources,
        ...statement.sources,
      ]);
    } else {
      clusters.push({
        statements: [statement],
        providers: new Set([statement.provider]),
        sources: statement.sources,
      });
    }
  }

  return clusters.sort((a, b) => {
    const providerDelta = b.providers.size - a.providers.size;
    if (providerDelta !== 0) return providerDelta;
    return b.sources.length - a.sources.length;
  });
}

function representativeText(cluster: StatementCluster): string {
  const sorted = [...cluster.statements].sort(
    (a, b) => scoreRepresentative(b) - scoreRepresentative(a),
  );
  return sorted[0]?.text ?? "";
}

function scoreRepresentative(statement: Statement): number {
  const sourceBonus = statement.sources.length > 0 ? 40 : 0;
  const lengthPenalty = Math.abs(statement.text.length - 90);
  return sourceBonus - lengthPenalty;
}

function mergeSources(sources: SourceLink[]): SourceLink[] {
  const map = new Map<string, SourceLink>();
  for (const source of sources) {
    const key = normalizeUrl(source.url);
    const existing = map.get(key);
    if (existing) {
      for (const provider of source.providers) existing.providers.add(provider);
    } else {
      map.set(key, {
        title: source.title,
        url: source.url,
        providers: new Set(source.providers),
      });
    }
  }
  return [...map.values()];
}

function extractMarkdownLinks(text: string): Array<{ title: string; url: string }> {
  const links: Array<{ title: string; url: string }> = [];
  const pattern = /(?<!!)\[([^\]]{1,180})\]\((https?:\/\/[^\s)]+)\)/g;
  for (const match of text.matchAll(pattern)) {
    links.push({
      title: sanitizeInline(match[1]),
      url: match[2].replace(/[.,;:]+$/, ""),
    });
  }
  return links;
}

function cleanStatementText(line: string): string {
  return sanitizeInline(
    line
      .replace(/^\s*[-*]\s+/, "")
      .replace(/^\s*\d+[.)]\s+/, "")
      .replace(/^>\s*/, "")
      .trim(),
  );
}

function sanitizeInline(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulStatement(text: string): boolean {
  if (text.length < 18 || text.length > 260) return false;
  if (text.startsWith("#")) return false;
  if (/^https?:\/\//.test(text)) return false;
  if (/^(Sources?|出典|参考資料)\s*:?$/i.test(text)) return false;
  return true;
}

function normalizeStatement(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[「」『』【】（）()[\]{}、。,.!?！？:：;；・\-ー\s]/g, "")
    .toLowerCase()
    .slice(0, 220);
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const gramsA = bigrams(a);
  const gramsB = bigrams(b);
  let overlap = 0;
  for (const gram of gramsA) {
    if (gramsB.has(gram)) overlap += 1;
  }
  return overlap / Math.max(gramsA.size, gramsB.size, 1);
}

function bigrams(value: string): Set<string> {
  if (value.length <= 2) return new Set([value]);
  const grams = new Set<string>();
  for (let index = 0; index < value.length - 1; index += 1) {
    grams.add(value.slice(index, index + 2));
  }
  return grams;
}

function normalizeUrl(url: string): string {
  return url.replace(/#.*$/, "").replace(/\/$/, "");
}

function formatProviders(providers: Set<AiToolId>): string {
  return [...providers]
    .sort((a, b) => AI_TOOLS.indexOf(a) - AI_TOOLS.indexOf(b))
    .map((provider) => SOURCE_TOOL_LABELS[provider])
    .join(" / ");
}

function formatInlineSources(sources: SourceLink[]): string {
  if (sources.length === 0) return "";
  const links = sources
    .slice(0, 2)
    .map((source) => `[${source.title}](${source.url})`)
    .join(" / ");
  return ` 出典: ${links}`;
}
