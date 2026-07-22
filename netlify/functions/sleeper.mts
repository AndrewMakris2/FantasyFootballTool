import type { Config, Context } from "@netlify/functions";
import * as sleeper from "../../server/src/services/sleeperClient.js";
import {
  getLinkedSleeperLeagueIds,
  getSleeperUsername,
  setLinkedSleeperLeagueIds,
  setSleeperUsername,
} from "../../server/src/store/db.js";

export default async (req: Request, _context: Context) => {
  const { pathname } = new URL(req.url);

  // Look up a Sleeper user's leagues without linking anything yet — lets the
  // Onboarding page show a preview before the user confirms.
  if (pathname === "/api/sleeper/preview" && req.method === "GET") {
    const username = new URL(req.url).searchParams.get("username") ?? "";
    if (!username) return Response.json({ error: "username is required" }, { status: 400 });

    try {
      const user = await sleeper.findUserByUsername(username);
      const leagues = await sleeper.getLeaguesForUser(user.user_id);
      return Response.json({ userId: user.user_id, leagues });
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 502 });
    }
  }

  if (pathname === "/api/sleeper/link" && req.method === "POST") {
    const { username, leagueIds } = (await req.json()) as { username: string; leagueIds: string[] };
    if (!username || !Array.isArray(leagueIds)) {
      return Response.json({ error: "username and leagueIds are required" }, { status: 400 });
    }
    await setSleeperUsername(username);
    await setLinkedSleeperLeagueIds(leagueIds);
    return Response.json({ ok: true });
  }

  if (pathname === "/api/sleeper/status" && req.method === "GET") {
    const username = await getSleeperUsername();
    const leagueIds = await getLinkedSleeperLeagueIds();
    return Response.json({ connected: Boolean(username), username, leagueIds });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

export const config: Config = {
  path: "/api/sleeper/*",
};
