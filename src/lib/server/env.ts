import "server-only";

export type SecretEnvName =
  | "OPENAI_API_KEY"
  | "ANTHROPIC_API_KEY"
  | "GEMINI_API_KEY"
  | "GOOGLE_DRIVE_GAS_SHARED_SECRET";

const FORBIDDEN_PUBLIC_SECRETS = [
  "NEXT_PUBLIC_OPENAI_API_KEY",
  "NEXT_PUBLIC_ANTHROPIC_API_KEY",
  "NEXT_PUBLIC_GEMINI_API_KEY",
  "NEXT_PUBLIC_GOOGLE_DRIVE_GAS_SHARED_SECRET",
] as const;

for (const name of FORBIDDEN_PUBLIC_SECRETS) {
  if (process.env[name]) {
    throw new Error(`FORBIDDEN_PUBLIC_SECRET:${name}`);
  }
}

export function requireSecret(name: SecretEnvName): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`SERVER_CONFIGURATION_MISSING:${name}`);
  }
  return value;
}

export function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`SERVER_CONFIGURATION_MISSING:${name}`);
  }
  return value;
}
