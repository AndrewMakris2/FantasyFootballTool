import type { Config, Context } from "@netlify/functions";
import { getTradeValues } from "../../server/src/services/tradeValueClient.js";

export default async (req: Request, _context: Context) => {
  const params = new URL(req.url).searchParams;
  const isDynasty = params.get("dynasty") === "true";
  const pprParam = params.get("ppr");
  const ppr = pprParam !== null ? Number(pprParam) : 1;

  try {
    const values = await getTradeValues(isDynasty, ppr);
    return Response.json({ values });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
};

export const config: Config = {
  path: "/api/trade-values",
};
