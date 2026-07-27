import { Routes, Route, useParams } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";
import { LeagueDetail } from "./pages/LeagueDetail";
import { Players } from "./pages/Players";
import { TradeAnalyzer } from "./pages/TradeAnalyzer";
import { PlayerComparison } from "./pages/PlayerComparison";
import { WaiverWire } from "./pages/WaiverWire";
import { PlayerProfile } from "./pages/PlayerProfile";
import { MockDraft } from "./pages/MockDraft";
import { ImportRankings } from "./pages/ImportRankings";
import { CheatSheets } from "./pages/CheatSheets";
import { CheatSheetEditor } from "./pages/CheatSheetEditor";
import { NotFound } from "./pages/NotFound";

// CheatSheetEditor keeps local component state (the sheet being edited) tied to the :id
// param. React Router reuses the same component instance across param changes on the
// same route, so without a param-derived key it would keep autosaving the previous
// sheet's data under the new URL if the id ever changed while mounted.
function CheatSheetEditorRoute() {
  const { id } = useParams<{ id: string }>();
  return <CheatSheetEditor key={id} />;
}

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/leagues/:platform/:leagueId" element={<LeagueDetail />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:playerId" element={<PlayerProfile />} />
          <Route path="/trade-analyzer" element={<TradeAnalyzer />} />
          <Route path="/compare" element={<PlayerComparison />} />
          <Route path="/waiver-wire" element={<WaiverWire />} />
          <Route path="/mock-draft" element={<MockDraft />} />
          <Route path="/import-rankings" element={<ImportRankings />} />
          <Route path="/cheat-sheets" element={<CheatSheets />} />
          <Route path="/cheat-sheets/:id" element={<CheatSheetEditorRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
