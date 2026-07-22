import type { Config, Context } from "@netlify/functions";
import * as sleeper from "../../server/src/services/sleeperClient.js";
import * as yahoo from "../../server/src/services/yahooClient.js";
import {
  getLinkedSleeperLeagueIds,
  getLinkedYahooLeagueKeys,
  getSleeperUsername,
} from "../../server/src/store/db.js";
import type { League, LeagueSummary } from "../../server/src/types/league.js";

function toSummary(league: League): LeagueSummary {
  return {
    platform: league.platform,
    leagueId: league.leagueId,
    name: league.name,
    season: league.season,
    teamName: league.myTeam.teamName,
    record: league.myTeam.record,
  };
}

async function getMergedLeagues(): Promise<{ leagues: LeagueSummary[]; errors: string[] }> {
  const summaries: LeagueSummary[] = [];
  const errors: string[] = [];

  const sleeperUsername = await getSleeperUsername();
  const sleeperLeagueIds = await getLinkedSleeperLeagueIds();
  if (sleeperUsername && sleeperLeagueIds.length > 0) {
    try {
      const user = await sleeper.findUserByUsername(sleeperUsername);
      const results = await Promise.allSettled(
        sleeperLeagueIds.map((id) => sleeper.getLeagueDetail(id, user.user_id)),
      );
      for (const result of results) {
        if (result.status === "fulfilled") summaries.push(toSummary(result.value));
        else errors.push(`Sleeper: ${result.reason}`);
      }
    } catch (err) {
      errors.push(`Sleeper: ${(err as Error).message}`);
    }
  }

  const yahooLeagueKeys = await getLinkedYahooLeagueKeys();
  if (yahooLeagueKeys.length > 0) {
    const results = await Promise.allSettled(yahooLeagueKeys.map((key) => yahoo.getLeagueDetail(key)));
    for (const result of results) {
      if (result.status === "fulfilled") summaries.push(toSummary(result.value));
      else errors.push(`Yahoo: ${result.reason}`);
    }
  }

  return { leagues: summaries, errors };
}

export default async (req: Request, _context: Context) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/api/leagues" && req.method === "GET") {
    return Response.json(await getMergedLeagues());
  }

  const match = pathname.match(/^\/api\/leagues\/([^/]+)\/([^/]+)$/);
  if (match && req.method === "GET") {
    const [, platform, leagueId] = match;
    try {
      if (platform === "sleeper") {
        const username = await getSleeperUsername();
        if (!username) return Response.json({ error: "Sleeper is not linked" }, { status: 404 });
        const user = await sleeper.findUserByUsername(username);
        const league = await sleeper.getLeagueDetail(leagueId, user.user_id);
        return Response.json(league);
      }
      if (platform === "yahoo") {
        const league = await yahoo.getLeagueDetail(leagueId);
        return Response.json(league);
      }
      return Response.json({ error: `Unknown platform ${platform}` }, { status: 400 });
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 502 });
    }
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

export const config: Config = {
  path: ["/api/leagues", "/api/leagues/*"],
};
