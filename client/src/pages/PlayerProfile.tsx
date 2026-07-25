import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { getSeasonStats, getWeeklyStats } from "../api/playerStats";
import type { SeasonStatsEntry, WeeklyStatLine } from "../types/playerStats";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { PositionBadge } from "../components/PositionBadge";
import { FORMAT_PARAMS } from "../lib/rankingFormats";
import { byeWeekFor } from "../lib/byeWeeks";
import { medalClass } from "../lib/medal";
import { teamColor } from "../lib/teamColors";
import { TeamTag } from "../components/TeamTag";
import { WatchlistButton } from "../components/WatchlistButton";

function formatHeight(inches: number | null): string {
  if (inches === null) return "—";
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
}

type StatField = { label: string; key: keyof SeasonStatsEntry; format?: (value: number) => string };

const asInt = (value: number) => value.toLocaleString();
const asDecimal1 = (value: number) => value.toFixed(1);
const asDecimal2 = (value: number) => value.toFixed(2);
const asPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

function renderStatValue(entry: SeasonStatsEntry, field: StatField): string {
  const raw = entry[field.key];
  if (raw === null || raw === undefined) return "—";
  return (field.format ?? asInt)(raw as number);
}

// Which raw counting stats are worth showing depends entirely on position — a WR's
// completions are always zero and just clutter the card, same for a QB's targets.
function statFieldsFor(position: string): StatField[] {
  switch (position) {
    case "QB":
      return [
        { label: "Comp", key: "completions" },
        { label: "Att", key: "attempts" },
        { label: "Pass Yds", key: "passingYards" },
        { label: "Pass TD", key: "passingTds" },
        { label: "INT", key: "interceptions" },
        { label: "Rush Yds", key: "rushingYards" },
        { label: "Rush TD", key: "rushingTds" },
      ];
    case "RB":
      return [
        { label: "Carries", key: "carries" },
        { label: "Rush Yds", key: "rushingYards" },
        { label: "Rush TD", key: "rushingTds" },
        { label: "Rec", key: "receptions" },
        { label: "Rec Yds", key: "receivingYards" },
        { label: "Rec TD", key: "receivingTds" },
      ];
    case "WR":
    case "TE":
      return [
        { label: "Targets", key: "targets" },
        { label: "Rec", key: "receptions" },
        { label: "Rec Yds", key: "receivingYards" },
        { label: "Rec TD", key: "receivingTds" },
      ];
    default:
      return [];
  }
}

// The deep-cut advanced metrics nflverse's data unlocks — efficiency and opportunity
// stats beyond the box score, again split by position since a QB's target share and a
// WR's DAKOTA are both meaningless.
function advancedFieldsFor(position: string): StatField[] {
  switch (position) {
    case "QB":
      return [
        { label: "Sacks", key: "sacks" },
        { label: "Sack Yds", key: "sackYards" },
        { label: "Pass Air Yds", key: "passingAirYards" },
        { label: "Pass YAC", key: "passingYardsAfterCatch" },
        { label: "Pass 1st Downs", key: "passingFirstDowns" },
        { label: "Pass EPA", key: "passingEpa", format: asDecimal1 },
        { label: "PACR", key: "pacr", format: asDecimal2 },
        { label: "DAKOTA", key: "dakota", format: asDecimal2 },
        { label: "Pass 2PT", key: "passing2ptConversions" },
      ];
    case "RB":
      return [
        { label: "Fumbles", key: "rushingFumbles" },
        { label: "Fumbles Lost", key: "rushingFumblesLost" },
        { label: "Rush 1st Downs", key: "rushingFirstDowns" },
        { label: "Rush EPA", key: "rushingEpa", format: asDecimal1 },
        { label: "Rec EPA", key: "receivingEpa", format: asDecimal1 },
        { label: "Target Share", key: "targetShare", format: asPercent },
        { label: "WOPR", key: "wopr", format: asDecimal2 },
      ];
    case "WR":
    case "TE":
      return [
        { label: "Air Yards", key: "receivingAirYards" },
        { label: "YAC", key: "receivingYardsAfterCatch" },
        { label: "Rec 1st Downs", key: "receivingFirstDowns" },
        { label: "Rec EPA", key: "receivingEpa", format: asDecimal1 },
        { label: "RACR", key: "racr", format: asDecimal2 },
        { label: "Target Share", key: "targetShare", format: asPercent },
        { label: "Air Yards Share", key: "airYardsShare", format: asPercent },
        { label: "WOPR", key: "wopr", format: asDecimal2 },
        { label: "Fumbles", key: "receivingFumbles" },
      ];
    default:
      return [];
  }
}

type WeeklyColumn = { label: string; render: (week: WeeklyStatLine) => string };

// Same position-driven idea as statFieldsFor, but against a single week's box score
// instead of a season total — QB gets Comp/Att, WR/TE gets targets, etc.
function weeklyColumnsFor(position: string): WeeklyColumn[] {
  switch (position) {
    case "QB":
      return [
        { label: "Comp/Att", render: (w) => `${w.completions}/${w.attempts}` },
        { label: "Pass Yds", render: (w) => w.passingYards.toLocaleString() },
        { label: "Pass TD", render: (w) => String(w.passingTds) },
        { label: "INT", render: (w) => String(w.interceptions) },
        { label: "Rush Yds", render: (w) => w.rushingYards.toLocaleString() },
      ];
    case "RB":
      return [
        { label: "Carries", render: (w) => String(w.carries) },
        { label: "Rush Yds", render: (w) => w.rushingYards.toLocaleString() },
        { label: "Rush TD", render: (w) => String(w.rushingTds) },
        { label: "Rec", render: (w) => String(w.receptions) },
        { label: "Rec Yds", render: (w) => w.receivingYards.toLocaleString() },
      ];
    case "WR":
    case "TE":
      return [
        { label: "Tgt", render: (w) => String(w.targets) },
        { label: "Rec", render: (w) => String(w.receptions) },
        { label: "Rec Yds", render: (w) => w.receivingYards.toLocaleString() },
        { label: "Rec TD", render: (w) => String(w.receivingTds) },
      ];
    default:
      return [];
  }
}

const FORMATS: { key: keyof typeof FORMAT_PARAMS; label: string }[] = [
  { key: "standard", label: "Standard" },
  { key: "half", label: "Half PPR" },
  { key: "full", label: "Full PPR" },
  { key: "dynasty", label: "Dynasty" },
];

export function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const { data: playersData, isLoading } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const player = playersData?.players.find((p) => p.playerId === playerId);

  const standard = useQuery({
    queryKey: ["trade-values", false, 0],
    queryFn: () => getTradeValues(false, 0),
  });
  const half = useQuery({
    queryKey: ["trade-values", false, 0.5],
    queryFn: () => getTradeValues(false, 0.5),
  });
  const full = useQuery({
    queryKey: ["trade-values", false, 1],
    queryFn: () => getTradeValues(false, 1),
  });
  const dynasty = useQuery({
    queryKey: ["trade-values", true, 1],
    queryFn: () => getTradeValues(true, 1),
  });
  const { data: seasonStatsData } = useQuery({ queryKey: ["season-stats"], queryFn: getSeasonStats });
  const { data: weeklyStatsData } = useQuery({
    queryKey: ["weekly-stats", player?.playerId],
    queryFn: () => getWeeklyStats(player!.playerId),
    enabled: !!player,
  });

  const queriesByFormat = { standard, half, full, dynasty };

  if (isLoading) {
    return (
      <div className="page">
        <p>Loading player...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="page">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          &larr; Back to players
        </button>
        <p className="error-text">Player not found.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        &larr; Back to players
      </button>

      <div className="player-profile__banner">
        <div className="player-profile__identity">
          <PlayerAvatar
            playerId={player.playerId}
            name={player.name}
            position={player.position}
            team={player.team}
            size="md"
            ringColor={teamColor(player.team)}
          />
          <div>
            <h1>
              {player.name}
              {player.jerseyNumber !== null && (
                <span className="player-profile__number">No. {player.jerseyNumber}</span>
              )}
              <WatchlistButton playerId={player.playerId} />
            </h1>
            <div className="player-profile__meta">
              <PositionBadge position={player.position} />
              <TeamTag team={player.team} />
              {player.injuryStatus && <span className="injury-badge">{player.injuryStatus}</span>}
            </div>
          </div>
        </div>

        <div className="player-profile__stats">
          <div>
            <span className="player-profile__bio-label">Age</span>
            <span>{player.age ?? "—"}</span>
          </div>
          <div>
            <span className="player-profile__bio-label">Ht/Wt</span>
            <span>
              {formatHeight(player.heightInches)}
              {player.weightLbs !== null ? ` / ${player.weightLbs} lb` : ""}
            </span>
          </div>
          <div>
            <span className="player-profile__bio-label">College</span>
            <span>{player.college ?? "—"}</span>
          </div>
          <div>
            <span className="player-profile__bio-label">Exp</span>
            <span>{player.yearsExp !== null ? `${player.yearsExp} yrs` : "—"}</span>
          </div>
          <div>
            <span className="player-profile__bio-label">Bye</span>
            <span>{byeWeekFor(player.team) ?? "—"}</span>
          </div>
        </div>
      </div>

      {(() => {
        const seasonEntry = seasonStatsData?.stats[player.playerId];
        const fields = statFieldsFor(player.position);
        const advancedFields = advancedFieldsFor(player.position);
        if (!seasonEntry || fields.length === 0) return null;
        return (
          <>
            <h2>{seasonEntry.season} Season Stats</h2>
            <p className="data-source-note">Real per-player stats via nflverse (open data) &middot; {seasonEntry.games} games played.</p>
            <div className="ranking-cards">
              {fields.map((field) => (
                <div key={field.label} className="ranking-card">
                  <span className="ranking-card__label">{field.label}</span>
                  <span className="ranking-card__value">{renderStatValue(seasonEntry, field)}</span>
                </div>
              ))}
              <div className="ranking-card">
                <span className="ranking-card__label">Fantasy Pts (PPR)</span>
                <span className="ranking-card__value">{seasonEntry.fantasyPointsPpr.toFixed(1)}</span>
              </div>
            </div>

            {advancedFields.length > 0 && (
              <>
                <h2>Advanced Metrics</h2>
                <p className="data-source-note">Efficiency &amp; opportunity stats &mdash; EPA, air yards, target share, and friends.</p>
                <div className="ranking-cards">
                  {advancedFields.map((field) => (
                    <div key={field.label} className="ranking-card">
                      <span className="ranking-card__label">{field.label}</span>
                      <span className="ranking-card__value">{renderStatValue(seasonEntry, field)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        );
      })()}

      {(() => {
        const weeks = weeklyStatsData?.weeks;
        const columns = weeklyColumnsFor(player.position);
        if (!weeks || weeks.length === 0 || columns.length === 0) return null;
        const maxPoints = Math.max(...weeks.map((w) => w.fantasyPointsPpr), 1);
        return (
          <>
            <h2>Game Log</h2>
            <p className="data-source-note">Week-by-week box score via nflverse (open data).</p>
            <div className="data-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Opp</th>
                    {columns.map((col) => (
                      <th key={col.label}>{col.label}</th>
                    ))}
                    <th>Fantasy Pts (PPR)</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week) => (
                    <tr key={week.week}>
                      <td>{week.week}</td>
                      <td>{week.opponentTeam}</td>
                      {columns.map((col) => (
                        <td key={col.label}>{col.render(week)}</td>
                      ))}
                      <td>
                        <div className="game-log-points">
                          <div className="game-log-points__track">
                            <div
                              className="game-log-points__bar"
                              style={{ width: `${Math.max((week.fantasyPointsPpr / maxPoints) * 100, 3)}%` }}
                            />
                          </div>
                          <span>{week.fantasyPointsPpr.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      <h2>Rankings by Format</h2>
      <p className="data-source-note">Trade values via FantasyCalc.</p>
      <div className="ranking-cards">
        {FORMATS.map(({ key, label }) => {
          const query = queriesByFormat[key];
          const entry = query.data?.values[player.playerId];
          return (
            <div key={key} className="ranking-card">
              <span className="ranking-card__label">{label}</span>
              {query.isLoading ? (
                <span className="ranking-card__unranked">Loading…</span>
              ) : entry ? (
                <>
                  <span className={`ranking-card__rank ${medalClass(entry.overallRank)}`}>#{entry.overallRank}</span>
                  <span className="ranking-card__value">{entry.value.toLocaleString()}</span>
                </>
              ) : (
                <span className="ranking-card__unranked">Unranked</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
