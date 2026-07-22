import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeagues } from "../api/leagues";
import { LeagueCard } from "../components/LeagueCard";

export function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["leagues"], queryFn: getLeagues });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Your Leagues</h1>
        <Link to="/onboarding" className="button-link">
          + Add leagues
        </Link>
      </div>

      {isLoading && <p>Loading leagues...</p>}
      {isError && <p className="error-text">{(error as Error).message}</p>}

      {data && data.errors.length > 0 && (
        <div className="warning-banner">
          {data.errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {data && data.leagues.length === 0 && (
        <p className="empty-state">
          No leagues linked yet. <Link to="/onboarding">Connect Sleeper or Yahoo</Link> to get started.
        </p>
      )}

      <div className="league-grid">
        {data?.leagues.map((league) => (
          <LeagueCard key={`${league.platform}-${league.leagueId}`} league={league} />
        ))}
      </div>
    </div>
  );
}
