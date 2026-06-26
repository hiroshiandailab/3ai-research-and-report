import assert from "node:assert/strict";
import test from "node:test";
import {
  getResearchCostPolicy,
  ResearchRateLimiter,
} from "../src/lib/server/research-cost-control";

test("uses safe defaults and bounds environment overrides", () => {
  assert.deepEqual(getResearchCostPolicy({}), {
    maxRunsPerHour: 6,
    cooldownSeconds: 30,
    maxOutputTokens: 4000,
  });
  assert.equal(
    getResearchCostPolicy({ AI_MAX_OUTPUT_TOKENS: "" }).maxOutputTokens,
    4000,
  );
  assert.deepEqual(
    getResearchCostPolicy({
      RESEARCH_MAX_RUNS_PER_HOUR: "1000",
      RESEARCH_COOLDOWN_SECONDS: "-5",
      AI_MAX_OUTPUT_TOKENS: "9000",
    }),
    {
      maxRunsPerHour: 60,
      cooldownSeconds: 0,
      maxOutputTokens: 8000,
    },
  );
});

test("blocks rapid repeats and enforces the hourly limit", () => {
  const limiter = new ResearchRateLimiter();
  const policy = {
    maxRunsPerHour: 2,
    cooldownSeconds: 30,
    maxOutputTokens: 4000,
  };
  const startedAt = 1_000_000;

  assert.equal(
    limiter.consume("User@example.com", policy, startedAt).allowed,
    true,
  );

  const cooldown = limiter.consume(
    "user@example.com",
    policy,
    startedAt + 10_000,
  );
  assert.equal(cooldown.allowed, false);
  assert.equal(cooldown.reason, "COOLDOWN");
  assert.equal(cooldown.retryAfterSeconds, 20);

  assert.equal(
    limiter.consume("user@example.com", policy, startedAt + 30_000).allowed,
    true,
  );

  const hourly = limiter.consume("user@example.com", policy, startedAt + 61_000);
  assert.equal(hourly.allowed, false);
  assert.equal(hourly.reason, "HOURLY_LIMIT");
  assert.equal(hourly.remaining, 0);
});

test("resets the hourly window", () => {
  const limiter = new ResearchRateLimiter();
  const policy = {
    maxRunsPerHour: 1,
    cooldownSeconds: 0,
    maxOutputTokens: 4000,
  };

  assert.equal(limiter.consume("user", policy, 1).allowed, true);
  assert.equal(limiter.consume("user", policy, 1000).allowed, false);
  assert.equal(limiter.consume("user", policy, 3_600_001).allowed, true);
});
