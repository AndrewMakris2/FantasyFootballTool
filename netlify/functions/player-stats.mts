import type { Config, Context } from "@netlify/functions";
import { getSeasonStats } from "../../server/src/services/statsClient.js";

export default async (_req: Request, _context: Context) => {
  try {
    const stats = await getSeasonStats();
    return Response.json({ stats });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
};

export const config: Config = {
  path: "/api/player-stats",
};
