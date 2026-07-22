import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : undefined);

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand">
          <span className="site-header__mark">⚔</span>
          The War Room
        </Link>
        <nav className="site-header__nav">
          <NavLink to="/" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/players" className={navLinkClass}>
            Players
          </NavLink>
          <NavLink to="/trade-analyzer" className={navLinkClass}>
            Trade Analyzer
          </NavLink>
          <NavLink to="/compare" className={navLinkClass}>
            Compare
          </NavLink>
          <NavLink to="/waiver-wire" className={navLinkClass}>
            Waiver Wire
          </NavLink>
          <NavLink to="/mock-draft" className={navLinkClass}>
            Mock Draft
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
