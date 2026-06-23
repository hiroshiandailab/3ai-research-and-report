import { loadEnvFile } from "node:process";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

loadEnvFile(".env.local");

const REQUEST_TIMEOUT_MS = 60_000;

const tests = [
  {
    provider: "OpenAI",
    model: process.env.OPENAI_MODEL || "gpt-5.5",
    run: async () => {
      const client = new OpenAI({
        apiKey: requireKey("OPENAI_API_KEY"),
        maxRetries: 0,
        timeout: REQUEST_TIMEOUT_MS,
      });
      const response = await client.responses.create(
        {
          model: process.env.OPENAI_MODEL || "gpt-5.5",
          tools: [{ type: "web_search", search_context_size: "low" }],
          input:
            "Web検索を1回だけ使い、OpenAI公式サイトのページタイトルを1つ確認して、日本語1文で答えてください。",
        },
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
      );
      return response.output_text;
    },
  },
  {
    provider: "Claude",
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    run: async () => {
      const client = new Anthropic({
        apiKey: requireKey("ANTHROPIC_API_KEY"),
        maxRetries: 0,
        timeout: REQUEST_TIMEOUT_MS,
      });
      const response = await client.messages.create(
        {
          model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content:
                "Web検索を1回だけ使い、Anthropic公式サイトのページタイトルを1つ確認して、日本語1文で答えてください。",
            },
          ],
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search",
              max_uses: 1,
            },
          ],
        },
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
      );
      return response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");
    },
  },
  {
    provider: "Gemini",
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    run: async () => {
      const client = new GoogleGenAI({
        apiKey: requireKey("GEMINI_API_KEY"),
      });
      const response = await client.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
        contents:
          "Google検索を使い、Google AI for Developers公式サイトのページタイトルを1つ確認して、日本語1文で答えてください。",
        config: {
          tools: [{ googleSearch: {} }],
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      });
      return response.text || "";
    },
    verifyCredential: async () => {
      const client = new GoogleGenAI({
        apiKey: requireKey("GEMINI_API_KEY"),
      });
      await client.models.list({ config: { pageSize: 1 } });
      return true;
    },
  },
];

function requireKey(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function safeError(error) {
  if (!(error instanceof Error)) return "Unknown error";
  return error.message
    .replace(/\bsk-ant-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED]")
    .replace(/\bAIza[0-9A-Za-z_-]{10,}\b/g, "[REDACTED]")
    .slice(0, 240);
}

let failed = false;

for (const test of tests) {
  const startedAt = Date.now();
  try {
    const text = (await test.run()).trim();
    if (!text) throw new Error("Empty response");
    console.log(
      `${test.provider}: OK | model=${test.model} | ${Date.now() - startedAt}ms | chars=${text.length}`,
    );
  } catch (error) {
    const detail = safeError(error);
    if (
      test.verifyCredential &&
      (detail.includes('"code":429') || detail.includes("quota"))
    ) {
      try {
        await test.verifyCredential();
        failed = true;
        console.error(
          `${test.provider}: KEY_OK_QUOTA_BLOCKED | model=${test.model} | ${Date.now() - startedAt}ms`,
        );
        continue;
      } catch (credentialError) {
        console.error(
          `${test.provider}: FAILED | model=${test.model} | ${Date.now() - startedAt}ms | ${safeError(credentialError)}`,
        );
        failed = true;
        continue;
      }
    }

    failed = true;
    console.error(
      `${test.provider}: FAILED | model=${test.model} | ${Date.now() - startedAt}ms | ${detail}`,
    );
  }
}

if (failed) process.exit(1);
