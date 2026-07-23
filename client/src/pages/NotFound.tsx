import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Page not found</h1>
      </div>
      <p className="empty-state">That page doesn't exist, or the link is broken.</p>
      <Link to="/" className="button-link">
        Back to Dashboard
      </Link>
    </div>
  );
}
