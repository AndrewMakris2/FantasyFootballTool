import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { getSeasonStats } from "../api/playerStats";
import type { SeasonStatsEntry } from "../types/playerStats";
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

// Which raw counting stats are worth showing depends entirely on position — a WR's
// completions are always zero and just clutter the card, same for a QB's targets.
function statFieldsFor(position: string): { label: string; key: keyof SeasonStatsEntry }[] {
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
        if (!seasonEntry || fields.length === 0) return null;
        return (
          <>
            <h2>{seasonEntry.season} Season Stats</h2>
            <p className="data-source-note">Real per-player stats via nflverse (open data) &middot; {seasonEntry.games} games played.</p>
            <div className="ranking-cards">
              {fields.map(({ label, key }) => (
                <div key={label} className="ranking-card">
                  <span className="ranking-card__label">{label}</span>
                  <span className="ranking-card__value">{(seasonEntry[key] as number).toLocaleString()}</span>
                </div>
              ))}
              <div className="ranking-card">
                <span className="ranking-card__label">Fantasy Pts (PPR)</span>
                <span className="ranking-card__value">{seasonEntry.fantasyPointsPpr.toFixed(1)}</span>
              </div>
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
