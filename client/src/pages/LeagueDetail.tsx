import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeagueDetail, getLeagueDraft, getLeagueTransactions } from "../api/leagues";
import { RosterTable } from "../components/RosterTable";
import { StandingsTable } from "../components/StandingsTable";
import { PlatformBadge } from "../components/PlatformBadge";
import { LeagueSettingsSummary } from "../components/LeagueSettingsSummary";
import { TransactionsFeed } from "../components/TransactionsFeed";
import { DraftBoardGrid } from "../components/DraftBoardGrid";
import type { Platform } from "../types/league";

export function LeagueDetail() {
  const { platform, leagueId } = useParams<{ platform: Platform; leagueId: string }>();
  const enabled = Boolean(platform && leagueId);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["league", platform, leagueId],
    queryFn: () => getLeagueDetail(platform!, leagueId!),
    enabled,
  });
  const { data: transactionsData } = useQuery({
    queryKey: ["league-transactions", platform, leagueId],
    queryFn: () => getLeagueTransactions(platform!, leagueId!),
    enabled,
  });
  const { data: draftData } = useQuery({
    queryKey: ["league-draft", platform, leagueId],
    queryFn: () => getLeagueDraft(platform!, leagueId!),
    enabled,
  });

  const [selectedTeamId, setSelectedTeamId] = useState("");

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

          <div className="filter-bar">
            <Link
              to={`/trade-analyzer?league=${data.platform}:${data.leagueId}&team=${data.myTeam.teamId}`}
              className="back-link"
            >
              Analyze a trade for this league &rarr;
            </Link>
            <Link to="/waiver-wire" className="back-link">
              Check the waiver wire &rarr;
            </Link>
          </div>

          {data.currentMatchup && (
            <section>
              <h2>Week {data.currentMatchup.week} Matchup</h2>
              <div className="matchup-card">
                <div
                  className={`matchup-card__team ${
                    data.currentMatchup.myScore >= data.currentMatchup.opponentScore ? "matchup-card__team--leading" : ""
                  }`}
                >
                  <span className="matchup-card__name">{data.myTeam.teamName}</span>
                  <span className="matchup-card__score">{data.currentMatchup.myScore.toFixed(1)}</span>
                </div>
                <span className="matchup-card__vs">VS</span>
                <div
                  className={`matchup-card__team ${
                    data.currentMatchup.opponentScore > data.currentMatchup.myScore ? "matchup-card__team--leading" : ""
                  }`}
                >
                  <span className="matchup-card__name">{data.currentMatchup.opponentTeamName}</span>
                  <span className="matchup-card__score">{data.currentMatchup.opponentScore.toFixed(1)}</span>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2>League Settings</h2>
            <LeagueSettingsSummary settings={data.settings} />
          </section>

          <section>
            <h2>Rosters</h2>
            <div className="filter-bar">
              <select
                value={selectedTeamId || data.myTeam.teamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {data.teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamId === data.myTeam.teamId ? `${team.teamName} (Me)` : team.teamName}
                  </option>
                ))}
              </select>
            </div>
            <RosterTable
              roster={
                data.teams.find((t) => t.teamId === (selectedTeamId || data.myTeam.teamId))?.roster ??
                data.myTeam.roster
              }
            />
          </section>

          <section>
            <h2>Standings</h2>
            <StandingsTable standings={data.standings} />
          </section>

          <section>
            <h2>Draft Recap</h2>
            {draftData && draftData.picks.length > 0 ? (
              <DraftBoardGrid
                numTeams={draftData.numTeams}
                rounds={draftData.rounds}
                picks={draftData.picks}
                currentPick={undefined}
                playersById={
                  new Map(draftData.picks.map((p) => [p.playerId, { name: p.playerName, position: p.playerPosition }]))
                }
                teamLabel={(teamIndex) => draftData.picks.find((p) => p.teamIndex === teamIndex)?.teamName ?? `Team ${teamIndex + 1}`}
              />
            ) : (
              <p className="empty-state">
                {data.platform === "yahoo"
                  ? "Draft recap isn't available for Yahoo leagues yet."
                  : "This league hasn't drafted yet."}
              </p>
            )}
          </section>

          <section>
            <h2>Recent Activity</h2>
            <TransactionsFeed transactions={transactionsData?.transactions ?? []} />
          </section>
        </>
      )}
    </div>
  );
}
