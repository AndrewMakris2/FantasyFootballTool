import { Link } from "react-router-dom";
import type { TradeValueEntry } from "../types/tradeValue";
import { PlayerAvatar } from "./PlayerAvatar";
import { PositionBadge } from "./PositionBadge";
import { TeamTag } from "./TeamTag";
import { medalClass } from "../lib/medal";
import { teamColor } from "../lib/teamColors";
import { byeWeekFor } from "../lib/byeWeeks";

// Permissive so both full PlayerProfile objects and lighter TradeCandidate/roster
// entries (which may be missing bio fields) can be rendered by the same card.
export interface DetailPlayer {
  playerId: string;
  name: string;
  position: string;
  team: string | null;
  age?: number | null;
  heightInches?: number | null;
  weightLbs?: number | null;
  college?: string | null;
  yearsExp?: number | null;
  injuryStatus?: string | null;
  depthChartPosition?: string | null;
  depthChartOrder?: number | null;
}

function formatHeight(inches: number | null | undefined): string {
  if (inches === null || inches === undefined) return "—";
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
}

interface PlayerDetailCardProps {
  player: DetailPlayer;
  entry?: TradeValueEntry;
  label?: string;
}

export function PlayerDetailCard({ player, entry, label }: PlayerDetailCardProps) {
  const bye = byeWeekFor(player.team);
  const isPick = player.position === "PICK";

  return (
    <div className="player-detail-card">
      {label && <span className="player-detail-card__label">{label}</span>}
      <div className="player-detail-card__header">
        <PlayerAvatar
          playerId={player.playerId}
          name={player.name}
          position={player.position}
          team={player.team}
          size="md"
          ringColor={teamColor(player.team)}
        />
        <div>
          {isPick ? (
            <span className="player-detail-card__name">{player.name}</span>
          ) : (
            <Link to={`/players/${player.playerId}`} className="player-detail-card__name">
              {player.name}
            </Link>
          )}
          <div className="player-detail-card__meta">
            <PositionBadge position={player.position} />
            {!isPick && <TeamTag team={player.team} />}
            {player.injuryStatus && <span className="injury-badge">{player.injuryStatus}</span>}
          </div>
        </div>
      </div>

      {isPick ? (
        <div className="player-detail-card__grid">
          <div>
            <span className="player-detail-card__stat-label">Estimated Value</span>
            <span>{entry ? entry.value.toLocaleString() : "—"}</span>
          </div>
        </div>
      ) : (
        <div className="player-detail-card__grid">
        <div>
          <span className="player-detail-card__stat-label">Rank</span>
          <span className={medalClass(entry?.overallRank)}>{entry ? `#${entry.overallRank}` : "Unranked"}</span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">Value</span>
          <span>{entry ? entry.value.toLocaleString() : "—"}</span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">Pos Rank</span>
          <span>{entry ? `${player.position}${entry.positionRank}` : "—"}</span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">30-Day Trend</span>
          <span>
            {entry
              ? entry.trend30Day === 0
                ? "Flat"
                : `${entry.trend30Day > 0 ? "▲" : "▼"} ${Math.abs(entry.trend30Day).toLocaleString()}`
              : "—"}
          </span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">Bye Week</span>
          <span>{bye ?? "—"}</span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">Depth Chart</span>
          <span>{player.depthChartPosition ? `${player.depthChartPosition}${player.depthChartOrder ?? ""}` : "—"}</span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">Age</span>
          <span>{player.age ?? "—"}</span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">Ht/Wt</span>
          <span>
            {formatHeight(player.heightInches)}
            {player.weightLbs !== null && player.weightLbs !== undefined ? ` / ${player.weightLbs} lb` : ""}
          </span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">College</span>
          <span>{player.college ?? "—"}</span>
        </div>
        <div>
          <span className="player-detail-card__stat-label">Experience</span>
          <span>{player.yearsExp !== null && player.yearsExp !== undefined ? `${player.yearsExp} yrs` : "—"}</span>
        </div>
      </div>
      )}
    </div>
  );
}
