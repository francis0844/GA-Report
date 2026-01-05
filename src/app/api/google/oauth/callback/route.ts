import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const clientId = process.env.GA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GA_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GA_OAUTH_REDIRECT_URI;

  if (!code || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Missing code or GA OAuth envs." },
      { status: 400 }
    );
  }

  const client = new OAuth2Client(clientId, clientSecret, redirectUri);
  const { tokens } = await client.getToken(code);

  const refreshToken = tokens.refresh_token;
  const accessToken = tokens.access_token;

  const html = `
    <html>
      <body style="font-family: sans-serif; padding: 24px;">
        <h2>GA OAuth callback</h2>
        <p>Copy the refresh token below into your environment as <code>GA_OAUTH_REFRESH_TOKEN</code>.</p>
        <pre style="background:#111;color:#0f0;padding:12px;border-radius:8px;">${refreshToken ?? "No refresh token returned. Ensure access_type=offline & prompt=consent."}</pre>
        <p>Access token (short-lived):</p>
        <pre style="background:#111;color:#0cf;padding:12px;border-radius:8px;">${accessToken ?? "None"}</pre>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
