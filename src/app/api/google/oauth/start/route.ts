import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

export async function GET() {
  const clientId =
    process.env.GA_OAUTH_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GA_OAUTH_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GA_OAUTH_REDIRECT_URI;
  const scopes =
    process.env.GA_OAUTH_SCOPES ??
    "https://www.googleapis.com/auth/analytics.readonly";

  const missing = [];
  if (!clientId) missing.push("GA_OAUTH_CLIENT_ID");
  if (!clientSecret) missing.push("GA_OAUTH_CLIENT_SECRET");
  if (!redirectUri) missing.push("GA_OAUTH_REDIRECT_URI");

  if (missing.length) {
    return NextResponse.json(
      { error: `Missing envs: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const oauthClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes.split(/\s+/),
  });

  return NextResponse.redirect(url);
}
