import { useState } from "react";
import { defaultRosterSlots, totalRounds } from "../lib/mockDraftEngine";
import type { DraftSettings, RosterSlotKey } from "../types/draft";
import type { RankingFormat } from "../lib/rankingFormats";

const SLOT_LABELS: { key: RosterSlotKey; label: string }[] = [
  { key: "QB", label: "QB" },
  { key: "RB", label: "RB" },
  { key: "WR", label: "WR" },
  { key: "TE", label: "TE" },
  { key: "FLEX", label: "FLEX (RB/WR/TE)" },
  { key: "K", label: "K" },
  { key: "DEF", label: "DEF" },
  { key: "BENCH", label: "Bench" },
];

export function DraftSettingsForm({ onStart }: { onStart: (settings: DraftSettings) => void }) {
  const [numTeams, setNumTeams] = useState(12);
  const [userTeamIndex, setUserTeamIndex] = useState<number | "random">(0);
  const [format, setFormat] = useState<RankingFormat>("full");
  const [rosterSlots, setRosterSlots] = useState(defaultRosterSlots());

  function updateSlot(key: RosterSlotKey, value: number) {
    setRosterSlots({ ...rosterSlots, [key]: Math.max(0, value) });
  }

  function handleStart() {
    const resolvedTeamIndex = userTeamIndex === "random" ? Math.floor(Math.random() * numTeams) : userTeamIndex;
    onStart({ numTeams, userTeamIndex: resolvedTeamIndex, format, rosterSlots });
  }

  return (
    <div className="draft-settings">
      <div className="draft-settings__row">
        <label>
          Number of teams
          <input
            type="number"
            min={2}
            max={16}
            value={numTeams}
            onChange={(e) => setNumTeams(Math.min(16, Math.max(2, Number(e.target.value))))}
          />
        </label>

        <label>
          Your draft slot
          <select
            value={userTeamIndex}
            onChange={(e) => setUserTeamIndex(e.target.value === "random" ? "random" : Number(e.target.value))}
          >
            <option value="random">Randomize</option>
            {Array.from({ length: numTeams }, (_, i) => (
              <option key={i} value={i}>
                Pick {i + 1}
              </option>
            ))}
          </select>
        </label>

        <label>
          Scoring format
          <select value={format} onChange={(e) => setFormat(e.target.value as RankingFormat)}>
            <option value="standard">Standard</option>
            <option value="half">Half PPR</option>
            <option value="full">Full PPR</option>
            <option value="dynasty">Dynasty</option>
          </select>
        </label>
      </div>

      <h2>Roster Slots</h2>
      <div className="draft-settings__slots">
        {SLOT_LABELS.map(({ key, label }) => (
          <label key={key} className="draft-settings__slot">
            {label}
            <input
              type="number"
              min={0}
              max={10}
              value={rosterSlots[key]}
              onChange={(e) => updateSlot(key, Number(e.target.value))}
            />
          </label>
        ))}
      </div>

      <p className="empty-state">
        {totalRounds(rosterSlots)} rounds &middot; {numTeams * totalRounds(rosterSlots)} total picks
      </p>

      <button type="button" onClick={handleStart}>
        Start Draft
      </button>
    </div>
  );
}
