export type ProviderErrorCode =
  | "CONFIGURATION"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "AUTHENTICATION"
  | "SERVICE_UNAVAILABLE"
  | "UNKNOWN";

export interface PublicProviderError {
  code: ProviderErrorCode;
  message: string;
  retryable: boolean;
}

interface ErrorLike {
  name?: unknown;
  message?: unknown;
  status?: unknown;
  code?: unknown;
}

const MESSAGES: Record<ProviderErrorCode, string> = {
  CONFIGURATION:
    "サーバーのAPI設定が完了していません。管理者に確認してください。",
  RATE_LIMIT:
    "AIサービスの利用上限に達しています。利用枠を確認して、時間をおいて再実行してください。",
  TIMEOUT:
    "AIサービスとの通信がタイムアウトしました。時間をおいて再実行してください。",
  AUTHENTICATION:
    "AIサービスの認証に失敗しました。APIキー設定を確認してください。",
  SERVICE_UNAVAILABLE:
    "AIサービスが一時的に利用できません。時間をおいて再実行してください。",
  UNKNOWN:
    "AIサービスとの通信に失敗しました。時間をおいて再実行してください。",
};

export function classifyProviderError(error: unknown): PublicProviderError {
  const detail = toErrorDetail(error);
  const normalized = `${detail.name} ${detail.message} ${detail.code}`.toLowerCase();

  if (detail.message.startsWith("SERVER_CONFIGURATION_MISSING:")) {
    return result("CONFIGURATION", false);
  }

  if (
    detail.status === 429 ||
    includesAny(normalized, [
      "rate_limit",
      "rate limit",
      "quota",
      "resource_exhausted",
      "too many requests",
    ])
  ) {
    return result("RATE_LIMIT", true);
  }

  if (
    detail.name === "AbortError" ||
    detail.name === "TimeoutError" ||
    includesAny(normalized, ["timeout", "timed out", "deadline exceeded"])
  ) {
    return result("TIMEOUT", true);
  }

  if (
    detail.status === 401 ||
    detail.status === 403 ||
    includesAny(normalized, [
      "invalid api key",
      "incorrect api key",
      "authentication",
      "unauthorized",
      "permission denied",
    ])
  ) {
    return result("AUTHENTICATION", false);
  }

  if (
    (typeof detail.status === "number" && detail.status >= 500) ||
    includesAny(normalized, ["service unavailable", "bad gateway"])
  ) {
    return result("SERVICE_UNAVAILABLE", true);
  }

  return result("UNKNOWN", true);
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(/\bsk-ant-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED]")
    .replace(/\bAIza[0-9A-Za-z_-]{10,}\b/g, "[REDACTED]")
    .replace(/\bgithub_pat_[A-Za-z0-9_]{10,}\b/g, "[REDACTED]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{10,}\b/g, "[REDACTED]");
}

function result(code: ProviderErrorCode, retryable: boolean): PublicProviderError {
  return { code, message: MESSAGES[code], retryable };
}

function toErrorDetail(error: unknown): {
  name: string;
  message: string;
  status?: number;
  code: string;
} {
  if (!error || typeof error !== "object") {
    return { name: "Error", message: String(error ?? ""), code: "" };
  }

  const value = error as ErrorLike;
  return {
    name: typeof value.name === "string" ? value.name : "Error",
    message: typeof value.message === "string" ? value.message : "",
    status: typeof value.status === "number" ? value.status : undefined,
    code: typeof value.code === "string" ? value.code : "",
  };
}

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}
