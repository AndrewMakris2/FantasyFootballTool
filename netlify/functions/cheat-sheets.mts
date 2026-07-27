import type { Config, Context } from "@netlify/functions";
import { getCheatSheets, saveCheatSheet, deleteCheatSheet } from "../../server/src/store/db.js";
import type { CheatSheet } from "../../server/src/types/cheatSheet.js";

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const sheets = await getCheatSheets();
    return Response.json({ sheets });
  }

  if (req.method === "POST") {
    let body: Partial<CheatSheet>;
    try {
      body = (await req.json()) as Partial<CheatSheet>;
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body.id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }
    const sheet: CheatSheet = {
      id: body.id,
      name: body.name ?? "",
      scoringFormat: body.scoringFormat ?? "full",
      numTeams: body.numTeams ?? 12,
      notes: body.notes ?? "",
      players: body.players ?? [],
      updatedAt: Date.now(),
    };
    await saveCheatSheet(sheet);
    return Response.json({ ok: true, sheet });
  }

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    await deleteCheatSheet(id);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
};

export const config: Config = {
  path: "/api/cheat-sheets",
};
