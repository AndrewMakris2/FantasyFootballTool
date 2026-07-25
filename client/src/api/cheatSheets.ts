import { apiGet, apiPost } from "./client";
import type { CheatSheet } from "../types/cheatSheet";

export function getCheatSheets() {
  return apiGet<{ sheets: Record<string, CheatSheet> }>("/cheat-sheets");
}

export function saveCheatSheet(sheet: CheatSheet) {
  return apiPost<{ ok: true; sheet: CheatSheet }>("/cheat-sheets", sheet);
}

export async function deleteCheatSheet(id: string): Promise<void> {
  const res = await fetch(`/api/cheat-sheets?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
}
