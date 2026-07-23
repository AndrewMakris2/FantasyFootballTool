import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeagues } from "../api/leagues";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { getWatchlist } from "../api/watchlist";
import { LeagueCard } from "../components/LeagueCard";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { PositionBadge } from "../components/PositionBadge";
import { PlayerDetailCard } from "../components/PlayerDetailCard";
import { TeamTag } from "../components/TeamTag";
import { medalClass } from "../lib/medal";

const TOP_PLAYERS_COUNT = 10;

export function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["leagues"], queryFn: getLeagues });
  const { data: playersData } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const { data: tradeValuesData } = useQuery({
    queryKey: ["trade-values", false, 1],
    queryFn: () => getTradeValues(false, 1),
  });
  const { data: watchlistData } = useQuery({ queryKey: ["watchlist"], queryFn: getWatchlist });

  const watchedPlayers = playersData?.players.filter((p) => watchlistData?.playerIds.includes(p.playerId)) ?? [];

  const topPlayers = playersData?.players
    .map((p) => ({ player: p, entry: tradeValuesData?.values[p.playerId] }))
    .filter((x) => x.entry)
    .sort((a, b) => a.entry!.overallRank - b.entry!.overallRank)
    .slice(0, TOP_PLAYERS_COUNT);

  return (
    <div className="page page--wide">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/onboarding" className="button-link">
          + Add leagues
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-widget dashboard-widget--wide">
          <div className="dashboard-widget__header">
            <h2>Top Fantasy Players</h2>
            <span className="data-source-note">Trade values via FantasyCalc.</span>
          </div>
          {topPlayers && topPlayers.length > 0 ? (
            <div className="top-players-list">
              {topPlayers.map(({ player, entry }) => (
                <Link key={player.playerId} to={`/players/${player.playerId}`} className="top-player-row">
                  <span className={`top-player-row__rank ${medalClass(entry!.overallRank)}`}>
                    #{entry!.overallRank}
                  </span>
                  <PlayerAvatar
                    playerId={player.playerId}
                    name={player.name}
                    position={player.position}
                    team={player.team}
                    size="sm"
                  />
                  <span className="top-player-row__name">{player.name}</span>
                  <PositionBadge position={player.position} />
                  <TeamTag team={player.team} />
                  <span className="top-player-row__value">{entry!.value.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-state">Loading rankings...</p>
          )}
        </section>

        <section className="dashboard-widget">
          <div className="dashboard-widget__header">
            <h2>Your Watchlist</h2>
          </div>
          {watchedPlayers.length === 0 ? (
            <p className="empty-state">
              Star a player anywhere on the site (Players, Waiver Wire, or their profile) to pin them here.
            </p>
          ) : (
            <div className="dashboard-widget__stack">
              {watchedPlayers.map((player) => (
                <PlayerDetailCard
                  key={player.playerId}
                  player={player}
                  entry={tradeValuesData?.values[player.playerId]}
                />
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-widget">
          <div className="dashboard-widget__header">
            <h2>Your Leagues</h2>
          </div>

          {isLoading && <p className="empty-state">Loading leagues...</p>}
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
        </section>
      </div>
    </div>
  );
}
