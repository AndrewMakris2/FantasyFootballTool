import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand">
          <span className="site-header__mark">⚔</span>
          The War Room
        </Link>
        <nav className="site-header__nav">
          <Link to="/">Dashboard</Link>
          <Link to="/players">Players</Link>
          <Link to="/trade-analyzer">Trade Analyzer</Link>
        </nav>
      </div>
    </header>
  );
}
