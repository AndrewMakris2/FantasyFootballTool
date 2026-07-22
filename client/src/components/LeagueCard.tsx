import { Link } from "react-router-dom";
import type { LeagueSummary } from "../types/league";
import { PlatformBadge } from "./PlatformBadge";

export function LeagueCard({ league }: { league: LeagueSummary }) {
  const { record } = league;
  return (
    <Link to={`/leagues/${league.platform}/${league.leagueId}`} className="league-card">
      <div className="league-card__header">
        <h3>{league.name}</h3>
        <PlatformBadge platform={league.platform} />
      </div>
      <p className="league-card__team">{league.teamName}</p>
      <p className="league-card__record">
        {record.wins}-{record.losses}
        {record.ties > 0 ? `-${record.ties}` : ""} &middot; {league.season}
      </p>
    </Link>
  );
}
