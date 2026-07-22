import type { Config, Context } from "@netlify/functions";
import { getTrendingPlayers } from "../../server/src/services/sleeperClient.js";

export default async (req: Request, _context: Context) => {
  const type = new URL(req.url).searchParams.get("type") === "drop" ? "drop" : "add";

  try {
    const players = await getTrendingPlayers(type);
    return Response.json({ players });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
};

export const config: Config = {
  path: "/api/trending-players",
};
