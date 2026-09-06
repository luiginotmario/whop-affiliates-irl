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
  // Every scope here must ALSO be declared on the app's Permissions tab —
  // asking for one the app has not declared makes Whop reject the authorize.
  oauthScope: () =>
    process.env.WHOP_OAUTH_SCOPE ??
    "openid profile email partner:create partner:basic:read",
  appUrl: () => process.env.APP_URL ?? "http://localhost:3001",
  redirectUri: () =>
    process.env.WHOP_REDIRECT_URI ??
    `${process.env.APP_URL ?? "http://localhost:3001"}/oauth/callback`,
  firecrawl: () => process.env.FIRECRAWL_API_KEY ?? null,
  whopBaseUrl: () =>
    process.env.WHOP_API_BASE_URL ?? "https://api.whop.com/api/v1",
  model: () => process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5",
  /** Tool research is a short factual lookup behind a web search — it does not
   *  need the model that writes the pitch, and it is on the critical path. */
  researchModel: () =>
    process.env.OPENROUTER_RESEARCH_MODEL ?? "anthropic/claude-haiku-4-5",
};
