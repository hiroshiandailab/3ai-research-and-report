import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyProviderError,
  redactSensitiveText,
} from "../src/lib/ai/error-policy";

test("classifies configuration, quota, timeout, and authentication errors", () => {
  assert.equal(
    classifyProviderError(
      new Error("SERVER_CONFIGURATION_MISSING:GEMINI_API_KEY"),
    ).code,
    "CONFIGURATION",
  );
  assert.equal(
    classifyProviderError(
      Object.assign(new Error("quota exceeded"), { status: 429 }),
    ).code,
    "RATE_LIMIT",
  );
  assert.equal(
    classifyProviderError(
      Object.assign(new Error("request aborted"), { name: "AbortError" }),
    ).code,
    "TIMEOUT",
  );
  assert.equal(
    classifyProviderError(
      Object.assign(new Error("unauthorized"), { status: 401 }),
    ).code,
    "AUTHENTICATION",
  );
});

test("redacts provider and GitHub credentials from logs", () => {
  const value = [
    ["sk", "ant", "abcdefghijklmnopqrstuvwxyz"].join("-"),
    ["sk", "abcdefghijklmnopqrstuvwxyz"].join("-"),
    ["AI", "za", "abcdefghijklmnopqrstuvwxyz"].join(""),
    ["github", "pat", "abcdefghijklmnopqrstuvwxyz"].join("_"),
    ["ghp", "abcdefghijklmnopqrstuvwxyz"].join("_"),
  ].join(" ");
  const redacted = redactSensitiveText(value);

  assert.equal(redacted.includes("abcdefghijklmnopqrstuvwxyz"), false);
  assert.equal(redacted.match(/\[REDACTED\]/g)?.length, 5);
});
