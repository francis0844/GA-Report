type EnvRequirement = {
  key: string;
  alt?: string;
  label?: string;
};

const REQUIRED_ENV: EnvRequirement[] = [
  { key: "GA4_PROPERTY_ID" },
  { key: "SUPABASE_URL" },
  { key: "SUPABASE_ANON_KEY" },
  { key: "SUPABASE_SERVICE_ROLE_KEY" },
  { key: "OPENAI_API_KEY" },
  { key: "GA_OAUTH_CLIENT_ID", alt: "GOOGLE_CLIENT_ID", label: "GA_OAUTH_CLIENT_ID (or GOOGLE_CLIENT_ID)" },
  { key: "GA_OAUTH_CLIENT_SECRET", alt: "GOOGLE_CLIENT_SECRET", label: "GA_OAUTH_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET)" },
];

function isPresent(key?: string) {
  if (!key) return false;
  const value = process.env[key];
  return Boolean(value && value.length > 0);
}

export function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  REQUIRED_ENV.forEach((item) => {
    const hasPrimary = isPresent(item.key);
    const hasAlt = isPresent(item.alt);
    if (!hasPrimary && !hasAlt) {
      missing.push(item.label ?? item.key);
    }
  });
  return missing;
}

export function envStatusMessage(): string | null {
  const missing = getMissingEnvVars();
  if (!missing.length) return null;
  return `Environment not configured. Missing: ${missing.join(", ")}`;
}
