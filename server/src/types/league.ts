export type Platform = "sleeper" | "yahoo";

export interface Player {
  playerId: string;
  name: string;
  position: string;
  team: string | null;
  slot?: string;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  record: TeamRecord;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
}

export interface Matchup {
  week: number;
  myScore: number;
  opponentScore: number;
  opponentTeamName: string;
}

export interface League {
  platform: Platform;
  leagueId: string;
  name: string;
  season: string;
  myTeam: {
    teamId: string;
    teamName: string;
    record: TeamRecord;
    roster: Player[];
  };
  standings: TeamStanding[];
  currentMatchup: Matchup | null;
}

export interface LeagueSummary {
  platform: Platform;
  leagueId: string;
  name: string;
  season: string;
  teamName: string;
  record: TeamRecord;
}
