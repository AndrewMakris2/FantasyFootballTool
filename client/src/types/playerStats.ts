export interface SeasonStatsEntry {
  season: number;
  games: number;

  // Passing
  completions: number;
  attempts: number;
  passingYards: number;
  passingTds: number;
  interceptions: number;
  sacks: number;
  sackYards: number;
  passingAirYards: number;
  passingYardsAfterCatch: number;
  passingFirstDowns: number;
  passingEpa: number;
  passing2ptConversions: number;
  /** Passing yards / passing air yards. Null when the player has no air yards on record. */
  pacr: number | null;
  /** nflfastR's regression-based QB efficiency metric, attempts-weighted across the season. */
  dakota: number | null;

  // Rushing
  carries: number;
  rushingYards: number;
  rushingTds: number;
  rushingFumbles: number;
  rushingFumblesLost: number;
  rushingFirstDowns: number;
  rushingEpa: number;
  rushing2ptConversions: number;

  // Receiving
  receptions: number;
  targets: number;
  receivingYards: number;
  receivingTds: number;
  receivingFumbles: number;
  receivingFumblesLost: number;
  receivingAirYards: number;
  receivingYardsAfterCatch: number;
  receivingFirstDowns: number;
  receivingEpa: number;
  receiving2ptConversions: number;
  /** Receiving yards / receiving air yards. Null when the player has no air yards on record. */
  racr: number | null;
  /** Share of team targets while on the field, averaged across games played. */
  targetShare: number | null;
  /** Share of team air yards while on the field, averaged across games played. */
  airYardsShare: number | null;
  /** Weighted Opportunity Rating (1.5 * target share + 0.7 * air yards share), averaged across games. */
  wopr: number | null;

  specialTeamsTds: number;
  fantasyPoints: number;
  fantasyPointsPpr: number;
}

export interface WeeklyStatLine {
  week: number;
  opponentTeam: string;
  completions: number;
  attempts: number;
  passingYards: number;
  passingTds: number;
  interceptions: number;
  carries: number;
  rushingYards: number;
  rushingTds: number;
  receptions: number;
  targets: number;
  receivingYards: number;
  receivingTds: number;
  targetShare: number | null;
  wopr: number | null;
  fantasyPoints: number;
  fantasyPointsPpr: number;
}
