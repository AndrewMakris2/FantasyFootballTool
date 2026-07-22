import type { Config, Context } from "@netlify/functions";
import * as yahoo from "../../server/src/services/yahooClient.js";
import { createState, verifyState } from "../../server/src/store/oauthState.js";
import { getLinkedYahooLeagueKeys, setLinkedYahooLeagueKeys } from "../../server/src/store/db.js";

function requireSessionSecret(): string {
  const secret = Netlify.env.get("SESSION_SECRET");
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const { pathname } = url;
  const redirectUri = `${url.origin}/api/yahoo/auth/callback`;

  if (pathname === "/api/yahoo/auth/start" && req.method === "GET") {
    const state = createState(requireSessionSecret());
    return Response.redirect(yahoo.buildAuthorizeUrl(state, redirectUri), 302);
  }

  if (pathname === "/api/yahoo/auth/callback" && req.method === "GET") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !verifyState(state, requireSessionSecret())) {
      return new Response(
        "Invalid or expired authorization attempt. Please try connecting Yahoo again.",
        { status: 400 },
      );
    }

    try {
      await yahoo.exchangeCodeForTokens(code, redirectUri);
      return Response.redirect(new URL("/?yahooConnected=1", url.origin).toString(), 302);
    } catch (err) {
      return new Response(`Yahoo authorization failed: ${(err as Error).message}`, { status: 502 });
    }
  }

  if (pathname === "/api/yahoo/status" && req.method === "GET") {
    const connected = await yahoo.isYahooConnected();
    const leagueKeys = await getLinkedYahooLeagueKeys();
    return Response.json({ connected, leagueKeys });
  }

  if (pathname === "/api/yahoo/preview" && req.method === "GET") {
    try {
      const leagues = await yahoo.getLeaguesForCurrentUser();
      return Response.json({ leagues });
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 502 });
    }
  }

  if (pathname === "/api/yahoo/link" && req.method === "POST") {
    const { leagueKeys } = (await req.json()) as { leagueKeys: string[] };
    if (!Array.isArray(leagueKeys)) {
      return Response.json({ error: "leagueKeys is required" }, { status: 400 });
    }
    await setLinkedYahooLeagueKeys(leagueKeys);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

export const config: Config = {
  path: "/api/yahoo/*",
};
