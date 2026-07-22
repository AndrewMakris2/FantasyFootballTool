import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="site-header__brand">
        <span className="site-header__mark">⚔</span>
        The War Room
      </Link>
    </header>
  );
}
