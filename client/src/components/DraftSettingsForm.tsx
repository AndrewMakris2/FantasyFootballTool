import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { defaultRosterSlots, totalRounds } from "../lib/mockDraftEngine";
import type { DraftSettings, RosterSlotKey } from "../types/draft";
import type { ValueSource } from "../lib/rankingFormats";
import { getCustomRankingSets } from "../api/customRankings";

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

function encodeValueSource(source: ValueSource): string {
  return source.kind === "builtin" ? `builtin:${source.format}` : `custom:${source.name}`;
}

function decodeValueSource(value: string): ValueSource {
  if (value.startsWith("custom:")) return { kind: "custom", name: value.slice("custom:".length) };
  const format = value.slice("builtin:".length) as "standard" | "half" | "full" | "dynasty";
  return { kind: "builtin", format };
}

export function DraftSettingsForm({ onStart }: { onStart: (settings: DraftSettings) => void }) {
  const [numTeams, setNumTeams] = useState(12);
  const [userTeamIndex, setUserTeamIndex] = useState<number | "random">(0);
  const [valueSource, setValueSource] = useState<ValueSource>({ kind: "builtin", format: "full" });
  const [rosterSlots, setRosterSlots] = useState(defaultRosterSlots());
  const { data: customSetsData } = useQuery({ queryKey: ["custom-rankings"], queryFn: getCustomRankingSets });
  const customSets = customSetsData ? Object.values(customSetsData.sets) : [];

  function updateSlot(key: RosterSlotKey, value: number) {
    setRosterSlots({ ...rosterSlots, [key]: Math.max(0, value) });
  }

  function handleStart() {
    const resolvedTeamIndex = userTeamIndex === "random" ? Math.floor(Math.random() * numTeams) : userTeamIndex;
    onStart({ numTeams, userTeamIndex: resolvedTeamIndex, valueSource, rosterSlots });
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
          <select
            value={encodeValueSource(valueSource)}
            onChange={(e) => setValueSource(decodeValueSource(e.target.value))}
          >
            <option value="builtin:standard">Standard</option>
            <option value="builtin:half">Half PPR</option>
            <option value="builtin:full">Full PPR</option>
            <option value="builtin:dynasty">Dynasty</option>
            {customSets.length > 0 && (
              <optgroup label="Custom">
                {customSets.map((set) => (
                  <option key={set.name} value={`custom:${set.name}`}>
                    {set.name}
                  </option>
                ))}
              </optgroup>
            )}
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
