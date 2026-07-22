import { Routes, Route } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";
import { LeagueDetail } from "./pages/LeagueDetail";
import { Players } from "./pages/Players";
import { TradeAnalyzer } from "./pages/TradeAnalyzer";
import { PlayerComparison } from "./pages/PlayerComparison";
import { WaiverWire } from "./pages/WaiverWire";
import { PlayerProfile } from "./pages/PlayerProfile";
import { MockDraft } from "./pages/MockDraft";

function App() {
  return (
    <>
      <SiteHeader />
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
      </Routes>
    </>
  );
}

export default App;
