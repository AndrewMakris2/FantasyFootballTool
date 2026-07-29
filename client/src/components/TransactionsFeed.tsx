import type { LeagueTransaction } from "../types/league";

const TYPE_LABELS: Record<string, string> = {
  trade: "Trade",
  waiver: "Waiver Claim",
  free_agent: "Free Agent Move",
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TransactionsFeed({ transactions }: { transactions: LeagueTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="empty-state">No recent league activity.</p>;
  }
  return (
    <ul className="transactions-feed">
      {transactions.map((tx) => (
        <li key={tx.id} className="transactions-feed__row">
          <span className="transactions-feed__type">{TYPE_LABELS[tx.type] ?? tx.type}</span>
          <div className="transactions-feed__body">
            {tx.adds.map((ref) => (
              <p key={`add-${ref.playerId}`}>
                <strong>{ref.teamName}</strong> added {ref.playerName}
              </p>
            ))}
            {tx.drops.map((ref) => (
              <p key={`drop-${ref.playerId}`}>
                <strong>{ref.teamName}</strong> dropped {ref.playerName}
              </p>
            ))}
          </div>
          <span className="transactions-feed__date">{formatDate(tx.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
