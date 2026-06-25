import "server-only";

import { requireSecret, requireServerEnv } from "@/lib/server/env";

const REQUEST_TIMEOUT_MS = 60_000;

export interface GoogleDriveSaveInput {
  title: string;
  content: string;
  brief: string;
}

export interface GoogleDriveSaveResult {
  fileId: string;
  fileName: string;
  url: string;
}

interface GasSaveResponse {
  ok?: boolean;
  fileId?: string;
  fileName?: string;
  url?: string;
  error?: string;
}

export async function saveFinalReportToGoogleDrive(
  input: GoogleDriveSaveInput,
): Promise<GoogleDriveSaveResult> {
  const endpoint = requireServerEnv("GOOGLE_DRIVE_GAS_WEB_APP_URL");
  const secret = requireSecret("GOOGLE_DRIVE_GAS_SHARED_SECRET");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      secret,
      title: input.title,
      content: input.content,
      brief: input.brief,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  let payload: GasSaveResponse;
  try {
    payload = (await response.json()) as GasSaveResponse;
  } catch {
    throw new Error("GAS_INVALID_JSON_RESPONSE");
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `GAS_SAVE_FAILED:${response.status}`);
  }

  if (!payload.fileId || !payload.fileName || !payload.url) {
    throw new Error("GAS_SAVE_RESPONSE_INCOMPLETE");
  }

  return {
    fileId: payload.fileId,
    fileName: payload.fileName,
    url: payload.url,
  };
}
