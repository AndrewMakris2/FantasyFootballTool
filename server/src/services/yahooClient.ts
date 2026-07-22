import type { League, Matchup, Player, TeamRoster, TeamStanding } from "../types/league.js";
import { getYahooTokens, setYahooTokens, type YahooTokens } from "../store/db.js";

const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const FANTASY_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

function requireEnv(name: string): string {
  const value = Netlify.env.get(name);
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("YAHOO_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    // Yahoo's app dashboard no longer has a "Fantasy Sports" permission checkbox —
    // read access has to be requested explicitly here instead.
    scope: "fspt-r",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function requestToken(body: URLSearchParams): Promise<YahooTokens> {
  const clientId = requireEnv("YAHOO_CLIENT_ID");
  const clientSecret = requireEnv("YAHOO_CLIENT_SECRET");
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo token request failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<YahooTokens> {
  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  );
  await setYahooTokens(tokens);
  return tokens;
}

async function refreshTokens(refreshToken: string): Promise<YahooTokens> {
  // Refresh doesn't require redirect_uri per OAuth2 (RFC 6749 §6) — only the
  // initial authorization_code exchange needs it.
  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
  await setYahooTokens(tokens);
  return tokens;
}

async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getYahooTokens();
  if (!tokens) return null;
  const expiringSoon = tokens.expiresAt - Date.now() < 60_000;
  if (!expiringSoon) return tokens.accessToken;
  const refreshed = await refreshTokens(tokens.refreshToken);
  return refreshed.accessToken;
}

export async function isYahooConnected(): Promise<boolean> {
  return (await getYahooTokens()) !== null;
}

async function yahooGet<T>(pathname: string): Promise<T> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error("Yahoo is not connected");

  const res = await fetch(`${FANTASY_BASE}${pathname}?format=json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

// Yahoo's JSON responses nest arrays as objects keyed by index with a
// trailing "count" field. This helper pulls the actual items out.
function extractItems(collection: Record<string, unknown>): unknown[] {
  const items: unknown[] = [];
  for (const key of Object.keys(collection)) {
    if (key === "count") continue;
    items.push(collection[key]);
  }
  return items;
}

function parseTeamRoster(teamWrapper: any): Player[] {
  const roster: Player[] = [];
  if (!teamWrapper?.team[1]?.roster) return roster;

  const rosterPlayers = extractItems(teamWrapper.team[1].roster[0].players) as any[];
  for (const playerWrapper of rosterPlayers) {
    const playerMeta = playerWrapper.player[0] as any[];
    const name = playerMeta.find((e: any) => e && e.name)?.name?.full;
    const position = playerMeta.find((e: any) => e && e.display_position)?.display_position;
    const team = playerMeta.find((e: any) => e && e.editorial_team_abbr)?.editorial_team_abbr;
    const playerKey = playerMeta.find((e: any) => e && e.player_key)?.player_key;
    roster.push({
      playerId: playerKey ?? name ?? "unknown",
      name: name ?? "Unknown Player",
      position: position ?? "UNK",
      team: team ?? null,
    });
  }
  return roster;
}

interface YahooLeagueRef {
  league_key: string;
  league_id: string;
  name: string;
  season: string;
}

export async function getLeaguesForCurrentUser(): Promise<YahooLeagueRef[]> {
  const data = await yahooGet<any>("/users;use_login=1/games;game_keys=nfl/leagues");
  const users = extractItems(data.fantasy_content.users);
  const leagues: YahooLeagueRef[] = [];
  for (const user of users as any[]) {
    const games = extractItems(user.user[1].games);
    for (const game of games as any[]) {
      const gameLeagues = extractItems(game.game[1].leagues);
      for (const leagueWrapper of gameLeagues as any[]) {
        const league = leagueWrapper.league[0];
        leagues.push({
          league_key: league.league_key,
          league_id: league.league_id,
          name: league.name,
          season: league.season,
        });
      }
    }
  }
  return leagues;
}

export async function getLeagueDetail(leagueKey: string): Promise<League> {
  const data = await yahooGet<any>(
    `/league/${leagueKey};out=settings,standings/teams;out=roster`,
  );
  const leagueNode = data.fantasy_content.league;
  const leagueMeta = leagueNode[0];

  const standingsTeamsRaw = extractItems(leagueNode[1].standings[0].teams) as any[];
  const standings: TeamStanding[] = standingsTeamsRaw.map((teamWrapper) => {
    const teamArr = teamWrapper.team;
    const teamMeta = extractItems(teamArr[0][0] ? teamArr[0] : teamArr[0]) as any[];
    const teamStandings = teamArr[1]?.team_standings ?? {};
    const nameEntry = teamArr[0].find((e: any) => e && e.name);
    return {
      teamId: String(teamMeta.find((e: any) => e && e.team_id)?.team_id ?? ""),
      teamName: nameEntry?.name ?? "Unknown Team",
      record: {
        wins: Number(teamStandings.outcome_totals?.wins ?? 0),
        losses: Number(teamStandings.outcome_totals?.losses ?? 0),
        ties: Number(teamStandings.outcome_totals?.ties ?? 0),
      },
      pointsFor: Number(teamStandings.points_for ?? 0),
      pointsAgainst: Number(teamStandings.points_against ?? 0),
      rank: Number(teamStandings.rank ?? 0),
    };
  });

  // Yahoo doesn't cleanly tell us "my team" from this endpoint without the
  // logged-in user's GUID; find it via is_owned_by_current_login flag instead.
  const myTeamWrapper = standingsTeamsRaw.find((teamWrapper) => {
    const teamMeta = teamWrapper.team[0] as any[];
    return teamMeta.some((e) => e && e.is_owned_by_current_login === 1);
  });

  const myTeamMeta = myTeamWrapper ? (myTeamWrapper.team[0] as any[]) : [];
  const myTeamName = myTeamMeta.find((e: any) => e && e.name)?.name ?? "My Team";
  const myTeamId = String(myTeamMeta.find((e: any) => e && e.team_id)?.team_id ?? "");
  const myStanding = standings.find((s) => s.teamId === myTeamId);

  const roster = parseTeamRoster(myTeamWrapper);

  const teams: TeamRoster[] = standingsTeamsRaw.map((teamWrapper) => {
    const teamMeta = teamWrapper.team[0] as any[];
    return {
      teamId: String(teamMeta.find((e: any) => e && e.team_id)?.team_id ?? ""),
      teamName: teamMeta.find((e: any) => e && e.name)?.name ?? "Unknown Team",
      roster: parseTeamRoster(teamWrapper),
    };
  });

  const currentMatchup: Matchup | null = null; // Deferred: Yahoo matchup parsing follows the same nested-array pattern.

  return {
    platform: "yahoo",
    leagueId: leagueKey,
    name: leagueMeta.name,
    season: String(leagueMeta.season),
    myTeam: {
      teamId: myTeamId,
      teamName: myTeamName,
      record: myStanding?.record ?? { wins: 0, losses: 0, ties: 0 },
      roster,
    },
    teams,
    standings,
    currentMatchup,
  };
}
