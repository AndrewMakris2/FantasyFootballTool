import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "../api/watchlist";

export function WatchlistButton({ playerId }: { playerId: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["watchlist"], queryFn: getWatchlist });
  const isWatched = data?.playerIds.includes(playerId) ?? false;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isWatched) {
      await removeFromWatchlist(playerId);
    } else {
      await addToWatchlist(playerId);
    }
    queryClient.invalidateQueries({ queryKey: ["watchlist"] });
  }

  return (
    <button
      type="button"
      className={`watchlist-button ${isWatched ? "watchlist-button--active" : ""}`}
      onClick={toggle}
      aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      {isWatched ? "★" : "☆"}
    </button>
  );
}
