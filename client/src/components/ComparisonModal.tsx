import { Modal } from "./Modal";
import { PlayerDetailCard } from "./PlayerDetailCard";
import type { PlayerProfile } from "../types/player";
import type { TradeValueEntry } from "../types/tradeValue";

interface ComparisonModalProps {
  players: PlayerProfile[];
  values: Record<string, TradeValueEntry>;
  onClose: () => void;
}

export function ComparisonModal({ players, values, onClose }: ComparisonModalProps) {
  return (
    <Modal title="Full Comparison" onClose={onClose}>
      <div className="comparison-modal__stack">
        {players.map((player) => (
          <PlayerDetailCard key={player.playerId} player={player} entry={values[player.playerId]} />
        ))}
      </div>
    </Modal>
  );
}
