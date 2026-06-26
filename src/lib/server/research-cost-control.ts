export interface ResearchCostPolicy {
  maxRunsPerHour: number;
  cooldownSeconds: number;
  maxOutputTokens: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  reason?: "COOLDOWN" | "HOURLY_LIMIT";
}

interface RateLimitEntry {
  windowStartedAt: number;
  count: number;
  lastAcceptedAt: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_MAX_RUNS_PER_HOUR = 6;
const DEFAULT_COOLDOWN_SECONDS = 30;
const DEFAULT_MAX_OUTPUT_TOKENS = 4000;

export function getResearchCostPolicy(
  env: NodeJS.ProcessEnv = process.env,
): ResearchCostPolicy {
  return {
    maxRunsPerHour: readBoundedInteger(
      env.RESEARCH_MAX_RUNS_PER_HOUR,
      DEFAULT_MAX_RUNS_PER_HOUR,
      1,
      60,
    ),
    cooldownSeconds: readBoundedInteger(
      env.RESEARCH_COOLDOWN_SECONDS,
      DEFAULT_COOLDOWN_SECONDS,
      0,
      3600,
    ),
    maxOutputTokens: readBoundedInteger(
      env.AI_MAX_OUTPUT_TOKENS,
      DEFAULT_MAX_OUTPUT_TOKENS,
      1000,
      8000,
    ),
  };
}

export function getAiMaxOutputTokens(
  env: NodeJS.ProcessEnv = process.env,
): number {
  return getResearchCostPolicy(env).maxOutputTokens;
}

export class ResearchRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  consume(
    key: string,
    policy: ResearchCostPolicy,
    now = Date.now(),
  ): RateLimitResult {
    this.removeExpiredEntries(now);
    const normalizedKey = key.trim().toLowerCase();
    let entry = this.entries.get(normalizedKey);

    if (!entry || now - entry.windowStartedAt >= HOUR_MS) {
      entry = { windowStartedAt: now, count: 0, lastAcceptedAt: 0 };
      this.entries.set(normalizedKey, entry);
    }

    const cooldownMs = policy.cooldownSeconds * 1000;
    const cooldownRemaining = cooldownMs - (now - entry.lastAcceptedAt);
    if (entry.lastAcceptedAt > 0 && cooldownRemaining > 0) {
      return {
        allowed: false,
        limit: policy.maxRunsPerHour,
        remaining: Math.max(0, policy.maxRunsPerHour - entry.count),
        retryAfterSeconds: Math.max(1, Math.ceil(cooldownRemaining / 1000)),
        reason: "COOLDOWN",
      };
    }

    if (entry.count >= policy.maxRunsPerHour) {
      const windowRemaining = HOUR_MS - (now - entry.windowStartedAt);
      return {
        allowed: false,
        limit: policy.maxRunsPerHour,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(windowRemaining / 1000)),
        reason: "HOURLY_LIMIT",
      };
    }

    entry.count += 1;
    entry.lastAcceptedAt = now;
    return {
      allowed: true,
      limit: policy.maxRunsPerHour,
      remaining: Math.max(0, policy.maxRunsPerHour - entry.count),
      retryAfterSeconds: 0,
    };
  }

  reset(): void {
    this.entries.clear();
  }

  private removeExpiredEntries(now: number): void {
    if (this.entries.size < 100) return;
    for (const [key, entry] of this.entries) {
      if (now - entry.windowStartedAt >= HOUR_MS) this.entries.delete(key);
    }
  }
}

export const researchRateLimiter = new ResearchRateLimiter();

function readBoundedInteger(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
