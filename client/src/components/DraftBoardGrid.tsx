import type { DraftPick, PickSlot } from "../types/draft";
import type { PlayerProfile } from "../types/player";
import { PositionBadge } from "./PositionBadge";

interface DraftBoardGridProps {
  numTeams: number;
  rounds: number;
  picks: DraftPick[];
  currentPick: PickSlot | undefined;
  playersById: Map<string, PlayerProfile>;
  teamLabel: (teamIndex: number) => string;
}

export function DraftBoardGrid({ numTeams, rounds, picks, currentPick, playersById, teamLabel }: DraftBoardGridProps) {
  const byRoundTeam = new Map<string, DraftPick>();
  for (const pick of picks) byRoundTeam.set(`${pick.round}-${pick.teamIndex}`, pick);

  const teamIndices = Array.from({ length: numTeams }, (_, i) => i);
  const roundNumbers = Array.from({ length: rounds }, (_, i) => i + 1);

  return (
    <div className="draft-board-scroll">
      <table className="draft-board">
        <thead>
          <tr>
            <th className="draft-board__corner">Rd</th>
            {teamIndices.map((teamIndex) => (
              <th key={teamIndex}>{teamLabel(teamIndex)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roundNumbers.map((round) => (
            <tr key={round}>
              <td className="draft-board__round">{round}</td>
              {teamIndices.map((teamIndex) => {
                const pick = byRoundTeam.get(`${round}-${teamIndex}`);
                const player = pick ? playersById.get(pick.playerId) : undefined;
                const isCurrent = currentPick && currentPick.round === round && currentPick.teamIndex === teamIndex;
                return (
                  <td
                    key={teamIndex}
                    className={`draft-board__cell ${isCurrent ? "draft-board__cell--current" : ""}`}
                  >
                    {player ? (
                      <>
                        <span className="draft-board__player-name">{player.name}</span>
                        <PositionBadge position={player.position} />
                      </>
                    ) : isCurrent ? (
                      <span className="draft-board__on-clock">On the clock</span>
                    ) : (
                      <span className="draft-board__empty">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
