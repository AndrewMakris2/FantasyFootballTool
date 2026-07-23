import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeagues } from "../api/leagues";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { LeagueCard } from "../components/LeagueCard";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { PositionBadge } from "../components/PositionBadge";
import { FootballIcon } from "../components/FootballIcon";
import { medalClass } from "../lib/medal";

const TOP_PLAYERS_COUNT = 10;

export function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["leagues"], queryFn: getLeagues });
  const { data: playersData } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const { data: tradeValuesData } = useQuery({
    queryKey: ["trade-values", false, 1],
    queryFn: () => getTradeValues(false, 1),
  });

  const topPlayers = playersData?.players
    .map((p) => ({ player: p, entry: tradeValuesData?.values[p.playerId] }))
    .filter((x) => x.entry)
    .sort((a, b) => a.entry!.overallRank - b.entry!.overallRank)
    .slice(0, TOP_PLAYERS_COUNT);

  return (
    <>
      <div className="hero">
        <div className="hero__field" />
        <FootballIcon className="hero__football hero__football--left" />
        <FootballIcon className="hero__football hero__football--right" />
        <div className="hero__content">
          <h1 className="hero__title">The War Room</h1>
          <p className="hero__subtitle">Your leagues, your players, your edge — all in one place.</p>
          <Link to="/onboarding" className="button-link">
            + Add leagues
          </Link>
        </div>
      </div>

      <div className="page">
        {topPlayers && topPlayers.length > 0 && (
          <section>
            <h2>Top Fantasy Players</h2>
            <div className="top-players-strip">
              {topPlayers.map(({ player, entry }) => (
                <Link key={player.playerId} to={`/players/${player.playerId}`} className="top-player-card">
                  <PlayerAvatar
                    playerId={player.playerId}
                    name={player.name}
                    position={player.position}
                    team={player.team}
                    size="md"
                  />
                  <span className={`top-player-card__rank ${medalClass(entry!.overallRank)}`}>
                    #{entry!.overallRank}
                  </span>
                  <span className="top-player-card__name">{player.name}</span>
                  <PositionBadge position={player.position} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="page-header">
          <h2>Your Leagues</h2>
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
    </>
  );
}
