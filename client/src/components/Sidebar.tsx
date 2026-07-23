import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : undefined);

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar__brand">
        <span className="sidebar__mark">⚔</span>
        <span>The War Room</span>
      </Link>
      <nav className="sidebar__nav">
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
        <NavLink to="/import-rankings" className={navLinkClass}>
          Import Rankings
        </NavLink>
      </nav>
    </aside>
  );
}
