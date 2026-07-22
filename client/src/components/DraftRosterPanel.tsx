import { SLOT_PRIORITY } from "../lib/mockDraftEngine";
import type { DraftPick, RosterSlotKey, RosterSlots } from "../types/draft";
import type { PlayerProfile } from "../types/player";
import { PositionBadge } from "./PositionBadge";

interface DraftRosterPanelProps {
  picks: DraftPick[];
  rosterSlots: RosterSlots;
  playersById: Map<string, PlayerProfile>;
}

const ALL_SLOTS: RosterSlotKey[] = [...SLOT_PRIORITY, "BENCH"];

export function DraftRosterPanel({ picks, rosterSlots, playersById }: DraftRosterPanelProps) {
  const bySlot = new Map<RosterSlotKey, DraftPick[]>();
  for (const pick of picks) {
    const list = bySlot.get(pick.slot) ?? [];
    list.push(pick);
    bySlot.set(pick.slot, list);
  }

  return (
    <div className="draft-roster-panel">
      {ALL_SLOTS.map((slot) => {
        const slotPicks = bySlot.get(slot) ?? [];
        const count = rosterSlots[slot];
        if (count === 0) return null;
        return (
          <div key={slot} className="draft-roster-panel__group">
            <span className="draft-roster-panel__slot-label">{slot}</span>
            {Array.from({ length: count }, (_, i) => {
              const pick = slotPicks[i];
              const player = pick ? playersById.get(pick.playerId) : undefined;
              return (
                <div key={i} className="draft-roster-panel__row">
                  {player ? (
                    <>
                      <span>{player.name}</span>
                      <PositionBadge position={player.position} />
                    </>
                  ) : (
                    <span className="empty-state">Empty</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
