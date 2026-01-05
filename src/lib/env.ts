const REQUIRED_ENV = [
  "GA4_PROPERTY_ID",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
] as const;

export type RequiredEnvKey = (typeof REQUIRED_ENV)[number];

export function getMissingEnvVars(): RequiredEnvKey[] {
  return REQUIRED_ENV.filter((key) => {
    const value = process.env[key];
    return !value || value.length === 0;
  });
}

export function envStatusMessage(): string | null {
  const missing = getMissingEnvVars();
  if (!missing.length) return null;
  return `Environment not configured. Missing: ${missing.join(", ")}`;
}
