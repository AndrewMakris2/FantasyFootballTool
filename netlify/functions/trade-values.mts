import type { Config, Context } from "@netlify/functions";
import { getTradeValues } from "../../server/src/services/tradeValueClient.js";

export default async (req: Request, _context: Context) => {
  const isDynasty = new URL(req.url).searchParams.get("dynasty") === "true";

  try {
    const values = await getTradeValues(isDynasty);
    return Response.json({ values });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
};

export const config: Config = {
  path: "/api/trade-values",
};
