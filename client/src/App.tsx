import { Routes, Route } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";
import { LeagueDetail } from "./pages/LeagueDetail";

function App() {
  return (
    <>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/leagues/:platform/:leagueId" element={<LeagueDetail />} />
      </Routes>
    </>
  );
}

export default App;
