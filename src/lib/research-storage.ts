import {
  DEFAULT_WORKSPACE,
  type AiToolId,
  type CardLayer,
  type CardStatus,
  type ResearchCard,
  type ResearchMode,
  type RunState,
  type SourceTool,
  type WorkspaceState,
} from "@/types/research";

const STORAGE_KEY = "research-workbench-v2";
const LEGACY_KEY = "research-workbench-v1";

function sanitizeCard(raw: unknown): ResearchCard | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<ResearchCard>;
  if (typeof c.id !== "string" || typeof c.content !== "string") return null;

  const layer: CardLayer =
    c.layer === "A" || c.layer === "B" || c.layer === "C" ? c.layer : "C";
  const status: CardStatus =
    c.status === "adopted" || c.status === "pending" || c.status === "rejected"
      ? c.status
      : "pending";
  const sourceTool: SourceTool =
    c.sourceTool === "chatgpt" ||
    c.sourceTool === "gemini" ||
    c.sourceTool === "claude" ||
    c.sourceTool === "notebooklm"
      ? c.sourceTool
      : "manual";

  return {
    id: c.id,
    content: c.content,
    layer,
    sourceUrl: typeof c.sourceUrl === "string" ? c.sourceUrl : "",
    memo: typeof c.memo === "string" ? c.memo : "",
    status,
    sourceTool,
    createdAt: typeof c.createdAt === "string" ? c.createdAt : new Date().toISOString(),
    derivedFromId: typeof c.derivedFromId === "string" ? c.derivedFromId : undefined,
  };
}

function sanitizeMode(raw: unknown): ResearchMode {
  if (raw === "ACADEMIC" || raw === "ART") return raw;
  return "BUSINESS";
}

function sanitizeRunState(raw: unknown): RunState {
  if (raw === "running" || raw === "done") return raw;
  return "idle";
}

function sanitizeAiReports(raw: unknown): WorkspaceState["aiReports"] {
  const base = { ...DEFAULT_WORKSPACE.aiReports };
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  for (const tool of ["chatgpt", "gemini", "claude"] as AiToolId[]) {
    if (typeof r[tool] === "string") base[tool] = r[tool];
  }
  return base;
}

function sanitizeAiStatus(raw: unknown): WorkspaceState["aiStatus"] {
  const base = { ...DEFAULT_WORKSPACE.aiStatus };
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Record<string, unknown>;
  for (const tool of ["chatgpt", "gemini", "claude"] as AiToolId[]) {
    base[tool] = sanitizeRunState(s[tool]);
  }
  return base;
}

function migrateToV2(parsed: Record<string, unknown>): WorkspaceState {
  return {
    version: 2,
    mode: sanitizeMode(parsed.mode),
    lockProfile: parsed.lockProfile === "LITE" ? "LITE" : "FULL",
    brief: typeof parsed.brief === "string" ? parsed.brief : "",
    cards: Array.isArray(parsed.cards)
      ? parsed.cards.map(sanitizeCard).filter((c): c is ResearchCard => c !== null)
      : [],
    aiStatus: sanitizeAiStatus(parsed.aiStatus),
    aiReports: sanitizeAiReports(parsed.aiReports),
    aiComparison: typeof parsed.aiComparison === "string" ? parsed.aiComparison : "",
    nextSteps: typeof parsed.nextSteps === "string" ? parsed.nextSteps : "",
    finalReport: typeof parsed.finalReport === "string" ? parsed.finalReport : "",
    verificationStatus: sanitizeRunState(parsed.verificationStatus),
  };
}

export function loadWorkspace(): WorkspaceState {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE;

  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
    }
    if (!raw) return DEFAULT_WORKSPACE;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.version === 2 || parsed.version === 1) {
      return migrateToV2(parsed);
    }
    return DEFAULT_WORKSPACE;
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

export function saveWorkspace(state: WorkspaceState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearWorkspaceStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
