import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCheatSheets, deleteCheatSheet } from "../api/cheatSheets";

const FORMAT_LABELS: Record<string, string> = {
  standard: "Standard",
  half: "Half PPR",
  full: "Full PPR",
  dynasty: "Dynasty",
};

export function CheatSheets() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["cheat-sheets"], queryFn: getCheatSheets });

  const deleteMutation = useMutation({
    mutationFn: deleteCheatSheet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cheat-sheets"] }),
  });

  const sheets = data ? Object.values(data.sheets).sort((a, b) => b.updatedAt - a.updatedAt) : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Cheat Sheets</h1>
        <Link to="/cheat-sheets/new" className="button-link">
          + New Cheat Sheet
        </Link>
      </div>
      <p className="data-source-note">
        Build a custom draft cheat sheet per league — rounds, notes, and live draft-day checkoffs.
      </p>

      {isLoading && <p className="empty-state">Loading cheat sheets...</p>}
      {!isLoading && sheets.length === 0 && (
        <p className="empty-state">No cheat sheets yet. Create one to get started.</p>
      )}

      <div className="cheat-sheet-grid">
        {sheets.map((sheet) => (
          <div key={sheet.id} className="cheat-sheet-card">
            <Link to={`/cheat-sheets/${sheet.id}`} className="cheat-sheet-card__body">
              <h3>{sheet.name || "Untitled Cheat Sheet"}</h3>
              <p className="cheat-sheet-card__meta">
                {sheet.numTeams}-team &middot; {FORMAT_LABELS[sheet.scoringFormat]} &middot; {sheet.players.length}{" "}
                players
              </p>
            </Link>
            <button
              type="button"
              className="cheat-sheet-card__delete"
              onClick={() => {
                if (confirm(`Delete "${sheet.name || "Untitled Cheat Sheet"}"?`)) {
                  deleteMutation.mutate(sheet.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
