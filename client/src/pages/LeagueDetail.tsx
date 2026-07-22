import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeagueDetail } from "../api/leagues";
import { RosterTable } from "../components/RosterTable";
import { StandingsTable } from "../components/StandingsTable";
import { PlatformBadge } from "../components/PlatformBadge";
import type { Platform } from "../types/league";

export function LeagueDetail() {
  const { platform, leagueId } = useParams<{ platform: Platform; leagueId: string }>();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["league", platform, leagueId],
    queryFn: () => getLeagueDetail(platform!, leagueId!),
    enabled: Boolean(platform && leagueId),
  });

  return (
    <div className="page">
      <Link to="/" className="back-link">
        &larr; Back to dashboard
      </Link>

      {isLoading && <p>Loading league...</p>}
      {isError && <p className="error-text">{(error as Error).message}</p>}

      {data && (
        <>
          <div className="page-header">
            <h1>
              {data.name} <PlatformBadge platform={data.platform} />
            </h1>
          </div>

          {data.currentMatchup && (
            <section>
              <h2>Week {data.currentMatchup.week} Matchup</h2>
              <p>
                {data.myTeam.teamName}: {data.currentMatchup.myScore.toFixed(1)} vs{" "}
                {data.currentMatchup.opponentTeamName}: {data.currentMatchup.opponentScore.toFixed(1)}
              </p>
            </section>
          )}

          <section>
            <h2>My Roster</h2>
            <RosterTable roster={data.myTeam.roster} />
          </section>

          <section>
            <h2>Standings</h2>
            <StandingsTable standings={data.standings} />
          </section>
        </>
      )}
    </div>
  );
}
