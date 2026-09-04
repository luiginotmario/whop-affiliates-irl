function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  googlePlaces: () => required("GOOGLE_PLACES_API_KEY"),
  openRouter: () => required("OPENROUTER_API_KEY"),
  whopClientId: () =>
    process.env.WHOP_CLIENT_ID ?? required("NEXT_PUBLIC_WHOP_APP_ID"),
  oauthScope: () =>
    process.env.WHOP_OAUTH_SCOPE ?? "openid profile partner:create",
  appUrl: () => process.env.APP_URL ?? "http://localhost:3001",
  redirectUri: () =>
    process.env.WHOP_REDIRECT_URI ??
    `${process.env.APP_URL ?? "http://localhost:3001"}/oauth/callback`,
  firecrawl: () => process.env.FIRECRAWL_API_KEY ?? null,
  whopBaseUrl: () =>
    process.env.WHOP_API_BASE_URL ?? "https://api.whop.com/api/v1",
  model: () => process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5",
};
