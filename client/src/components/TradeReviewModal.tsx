import { Modal } from "./Modal";
import { PlayerDetailCard, type DetailPlayer } from "./PlayerDetailCard";
import type { TradeValueEntry } from "../types/tradeValue";

interface TradeReviewModalProps {
  sideA: DetailPlayer[];
  sideB: DetailPlayer[];
  values: Record<string, TradeValueEntry>;
  verdict: string;
  onClose: () => void;
}

export function TradeReviewModal({ sideA, sideB, values, verdict, onClose }: TradeReviewModalProps) {
  return (
    <Modal title="Review Trade" onClose={onClose}>
      <p className="trade-review-modal__verdict">{verdict}</p>
      <div className="trade-review-modal__columns">
        <div>
          <h3>Side A gives</h3>
          {sideA.length === 0 && <p className="empty-state">No players.</p>}
          <div className="comparison-modal__stack">
            {sideA.map((player) => (
              <PlayerDetailCard key={player.playerId} player={player} entry={values[player.playerId]} />
            ))}
          </div>
        </div>
        <div>
          <h3>Side B gives</h3>
          {sideB.length === 0 && <p className="empty-state">No players.</p>}
          <div className="comparison-modal__stack">
            {sideB.map((player) => (
              <PlayerDetailCard key={player.playerId} player={player} entry={values[player.playerId]} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
