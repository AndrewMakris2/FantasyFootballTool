import { getStore, getDeployStore } from "@netlify/blobs";
import { encrypt, decrypt } from "./crypto.js";
import type { CustomRankingSet } from "../types/customRanking.js";

export interface YahooTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

const STORE_NAME = "app-data";

function appStore() {
  const context = Netlify.context?.deploy?.context;
  if (context === "production") {
    return getStore(STORE_NAME);
  }
  return getDeployStore(STORE_NAME);
}

function requireSecret(): string {
  const secret = Netlify.env.get("SESSION_SECRET");
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — required to store Yahoo tokens securely.");
  }
  return secret;
}

export async function getSleeperUsername(): Promise<string | null> {
  return (await appStore().get("sleeperUsername", { type: "text" })) ?? null;
}

export async function setSleeperUsername(username: string): Promise<void> {
  await appStore().set("sleeperUsername", username);
}

export async function getLinkedSleeperLeagueIds(): Promise<string[]> {
  return (await appStore().get("linkedSleeperLeagueIds", { type: "json" })) ?? [];
}

export async function setLinkedSleeperLeagueIds(ids: string[]): Promise<void> {
  await appStore().setJSON("linkedSleeperLeagueIds", ids);
}

export async function getYahooTokens(): Promise<YahooTokens | null> {
  const encrypted = await appStore().get("yahooTokensEncrypted", { type: "text" });
  if (!encrypted) return null;
  const secret = requireSecret();
  const json = decrypt(encrypted, secret);
  return JSON.parse(json) as YahooTokens;
}

export async function setYahooTokens(tokens: YahooTokens): Promise<void> {
  const secret = requireSecret();
  const encrypted = encrypt(JSON.stringify(tokens), secret);
  await appStore().set("yahooTokensEncrypted", encrypted);
}

export async function clearYahooTokens(): Promise<void> {
  await appStore().delete("yahooTokensEncrypted");
}

export async function getLinkedYahooLeagueKeys(): Promise<string[]> {
  return (await appStore().get("linkedYahooLeagueKeys", { type: "json" })) ?? [];
}

export async function setLinkedYahooLeagueKeys(keys: string[]): Promise<void> {
  await appStore().setJSON("linkedYahooLeagueKeys", keys);
}

export async function getCustomRankingSets(): Promise<Record<string, CustomRankingSet>> {
  return (await appStore().get("customRankingSets", { type: "json" })) ?? {};
}

export async function setCustomRankingSet(set: CustomRankingSet): Promise<void> {
  const sets = await getCustomRankingSets();
  sets[set.name] = set;
  await appStore().setJSON("customRankingSets", sets);
}

export async function deleteCustomRankingSet(name: string): Promise<void> {
  const sets = await getCustomRankingSets();
  delete sets[name];
  await appStore().setJSON("customRankingSets", sets);
}
