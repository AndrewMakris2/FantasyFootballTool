import { Routes, Route } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";
import { LeagueDetail } from "./pages/LeagueDetail";
import { Players } from "./pages/Players";
import { TradeAnalyzer } from "./pages/TradeAnalyzer";

function App() {
  return (
    <>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/leagues/:platform/:leagueId" element={<LeagueDetail />} />
        <Route path="/players" element={<Players />} />
        <Route path="/trade-analyzer" element={<TradeAnalyzer />} />
      </Routes>
    </>
  );
}

export default App;
