import type { LeagueSettings } from "../types/league";
import { PositionBadge } from "./PositionBadge";

export function LeagueSettingsSummary({ settings }: { settings: LeagueSettings }) {
  return (
    <div className="ranking-cards">
      <div className="ranking-card">
        <span className="ranking-card__label">Scoring</span>
        <span className="ranking-card__value">{settings.scoringType}</span>
      </div>
      <div className="ranking-card">
        <span className="ranking-card__label">Teams</span>
        <span className="ranking-card__value">{settings.totalRosters}</span>
      </div>
      <div className="ranking-card">
        <span className="ranking-card__label">Playoff Teams</span>
        <span className="ranking-card__value">{settings.playoffTeams ?? "—"}</span>
      </div>
      {settings.rosterPositions.length > 0 && (
        <div className="ranking-card">
          <span className="ranking-card__label">Roster</span>
          <span className="ranking-card__value league-settings__positions">
            {settings.rosterPositions.map((pos, i) => (
              <PositionBadge key={`${pos}-${i}`} position={pos} />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
