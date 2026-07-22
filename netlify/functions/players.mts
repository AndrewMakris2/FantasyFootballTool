import type { Config, Context } from "@netlify/functions";
import { getFantasyRelevantPlayers } from "../../server/src/services/sleeperClient.js";

export default async (_req: Request, _context: Context) => {
  try {
    const players = await getFantasyRelevantPlayers();
    return Response.json({ players });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
};

export const config: Config = {
  path: "/api/players",
};
