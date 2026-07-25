import type { Config, Context } from "@netlify/functions";
import { getWeeklyStats } from "../../server/src/services/statsClient.js";

export default async (req: Request, _context: Context) => {
  const playerId = new URL(req.url).searchParams.get("playerId");
  if (!playerId) {
    return Response.json({ error: "playerId is required" }, { status: 400 });
  }

  try {
    const weekly = await getWeeklyStats();
    return Response.json({ weeks: weekly[playerId] ?? [] });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
};

export const config: Config = {
  path: "/api/player-stats-weekly",
};
