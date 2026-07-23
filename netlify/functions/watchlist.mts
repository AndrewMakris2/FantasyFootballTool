import type { Config, Context } from "@netlify/functions";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "../../server/src/store/db.js";

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const playerIds = await getWatchlist();
    return Response.json({ playerIds });
  }

  if (req.method === "POST") {
    const body = (await req.json()) as { playerId?: string };
    if (!body.playerId) return Response.json({ error: "playerId is required" }, { status: 400 });
    const playerIds = await addToWatchlist(body.playerId);
    return Response.json({ playerIds });
  }

  if (req.method === "DELETE") {
    const playerId = new URL(req.url).searchParams.get("playerId");
    if (!playerId) return Response.json({ error: "playerId is required" }, { status: 400 });
    const playerIds = await removeFromWatchlist(playerId);
    return Response.json({ playerIds });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

export const config: Config = {
  path: "/api/watchlist",
};
