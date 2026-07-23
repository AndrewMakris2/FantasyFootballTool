import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  linkSleeperLeagues,
  linkYahooLeagues,
  previewSleeperLeagues,
  previewYahooLeagues,
} from "../api/leagues";
import { getYahooStatus } from "../api/leagues";

export function Onboarding() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [lookupUsername, setLookupUsername] = useState<string | null>(null);
  const [selectedSleeperIds, setSelectedSleeperIds] = useState<Set<string>>(new Set());
  const [selectedYahooKeys, setSelectedYahooKeys] = useState<Set<string>>(new Set());
  const [linkError, setLinkError] = useState<string | null>(null);

  const sleeperPreview = useQuery({
    queryKey: ["sleeper-preview", lookupUsername],
    queryFn: () => previewSleeperLeagues(lookupUsername!),
    enabled: lookupUsername !== null,
  });

  const yahooStatus = useQuery({ queryKey: ["yahoo-status"], queryFn: getYahooStatus });
  const yahooPreview = useQuery({
    queryKey: ["yahoo-preview"],
    queryFn: previewYahooLeagues,
    enabled: yahooStatus.data?.connected === true,
  });

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  }

  async function handleFinish() {
    setLinkError(null);
    try {
      if (lookupUsername && selectedSleeperIds.size > 0) {
        await linkSleeperLeagues(lookupUsername, [...selectedSleeperIds]);
      }
      if (selectedYahooKeys.size > 0) {
        await linkYahooLeagues([...selectedYahooKeys]);
      }
      navigate("/");
    } catch (err) {
      setLinkError((err as Error).message);
    }
  }

  const hasSelections = selectedSleeperIds.size > 0 || selectedYahooKeys.size > 0;

  return (
    <div className="page">
      <h1>Connect your leagues</h1>

      <section className="onboarding-section onboarding-section--sleeper">
        <h2>Sleeper</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLookupUsername(username.trim());
          }}
        >
          <input
            type="text"
            placeholder="Sleeper username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit">Find leagues</button>
        </form>

        {sleeperPreview.isLoading && <p>Looking up leagues...</p>}
        {sleeperPreview.isError && <p className="error-text">{(sleeperPreview.error as Error).message}</p>}
        {sleeperPreview.data && (
          <ul className="checklist">
            {sleeperPreview.data.leagues.map((league) => (
              <li key={league.league_id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSleeperIds.has(league.league_id)}
                    onChange={() => toggle(selectedSleeperIds, setSelectedSleeperIds, league.league_id)}
                  />
                  {league.name} ({league.season})
                </label>
              </li>
            ))}
            {sleeperPreview.data.leagues.length === 0 && <li>No leagues found for this username.</li>}
          </ul>
        )}
      </section>

      <section className="onboarding-section onboarding-section--yahoo">
        <h2>Yahoo</h2>
        {!yahooStatus.data?.connected && (
          <a className="button-link" href="/api/yahoo/auth/start">
            Connect Yahoo
          </a>
        )}
        {yahooStatus.data?.connected && yahooPreview.data && (
          <ul className="checklist">
            {yahooPreview.data.leagues.map((league) => (
              <li key={league.league_key}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedYahooKeys.has(league.league_key)}
                    onChange={() => toggle(selectedYahooKeys, setSelectedYahooKeys, league.league_key)}
                  />
                  {league.name} ({league.season})
                </label>
              </li>
            ))}
            {yahooPreview.data.leagues.length === 0 && <li>No leagues found on this Yahoo account.</li>}
          </ul>
        )}
        {yahooStatus.data?.connected && yahooPreview.isError && (
          <p className="error-text">{(yahooPreview.error as Error).message}</p>
        )}
      </section>

      {linkError && <p className="error-text">{linkError}</p>}
      <button disabled={!hasSelections} onClick={handleFinish}>
        Add selected leagues to dashboard
      </button>
    </div>
  );
}
