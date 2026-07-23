import type { Config, Context } from "@netlify/functions";
import {
  getCustomRankingSets,
  setCustomRankingSet,
  deleteCustomRankingSet,
} from "../../server/src/store/db.js";
import type { TradeValueEntry } from "../../server/src/types/tradeValue.js";

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const sets = await getCustomRankingSets();
    return Response.json({ sets });
  }

  if (req.method === "POST") {
    const body = (await req.json()) as { name?: string; entries?: Record<string, TradeValueEntry> };
    if (!body.name || !body.entries) {
      return Response.json({ error: "name and entries are required" }, { status: 400 });
    }
    await setCustomRankingSet({ name: body.name, entries: body.entries, createdAt: Date.now() });
    return Response.json({ ok: true });
  }

  if (req.method === "DELETE") {
    const name = new URL(req.url).searchParams.get("name");
    if (!name) return Response.json({ error: "name is required" }, { status: 400 });
    await deleteCustomRankingSet(name);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

export const config: Config = {
  path: "/api/custom-rankings",
};
