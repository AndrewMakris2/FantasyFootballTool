import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
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

      <div className="player-profile__header">
        <PlayerAvatar
          playerId={player.playerId}
          name={player.name}
          position={player.position}
          team={player.team}
          size="lg"
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

      <div className="player-profile__bio-grid">
        <div>
          <span className="player-profile__bio-label">Age</span>
          <span>{player.age ?? "—"}</span>
        </div>
        <div>
          <span className="player-profile__bio-label">Height/Weight</span>
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
          <span className="player-profile__bio-label">Experience</span>
          <span>{player.yearsExp !== null ? `${player.yearsExp} yrs` : "—"}</span>
        </div>
        <div>
          <span className="player-profile__bio-label">Bye Week</span>
          <span>{byeWeekFor(player.team) ?? "—"}</span>
        </div>
      </div>

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
