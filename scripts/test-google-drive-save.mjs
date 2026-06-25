import { loadEnvFile } from "node:process";

loadEnvFile(".env.local");

const endpoint = process.env.GOOGLE_DRIVE_GAS_WEB_APP_URL?.trim();
const secret = process.env.GOOGLE_DRIVE_GAS_SHARED_SECRET?.trim();

if (!endpoint || !secret) {
  const missing = [
    !endpoint && "GOOGLE_DRIVE_GAS_WEB_APP_URL",
    !secret && "GOOGLE_DRIVE_GAS_SHARED_SECRET",
  ].filter(Boolean);
  console.error(`Google Drive: NOT_CONFIGURED | missing=${missing.join(",")}`);
  process.exit(1);
}

const startedAt = Date.now();

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      secret,
      title: "3AI Research Report Drive Test",
      brief: "Google Drive保存テスト",
      content:
        "これは3AI Research & ReportからGoogle Driveへ.docx保存できるかを確認するテスト本文です。",
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `HTTP_${response.status}`);
  }

  console.log(
    `Google Drive: OK | ${Date.now() - startedAt}ms | file=${payload.fileName || "(no name)"}`,
  );
  if (payload.url) {
    console.log(`URL: ${payload.url}`);
  }
} catch (error) {
  console.error(
    `Google Drive: FAILED | ${Date.now() - startedAt}ms | ${safeError(error)}`,
  );
  process.exit(1);
}

function safeError(error) {
  if (!(error instanceof Error)) return "Unknown error";
  return error.message.slice(0, 240);
}
