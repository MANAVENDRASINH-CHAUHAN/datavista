import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useWorkspaceSettings } from "../../hooks/useWorkspaceSettings";

export default function MainHeader({ showBackHome = false }) {
  const location = useLocation();
  const { auth, logout } = useAuth();
  const { settings } = useWorkspaceSettings();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const showUserActions = Boolean(auth?.user);
  const showHeaderActions = showBackHome || showUserActions;
  const displayName = settings.displayName.trim() || auth?.user?.name || "User";

  return (
    <nav className="navbar navbar-expand-lg navbar-light site-navbar">
      <div className="container">
        <Link className="navbar-brand site-brand" to="/">
          <span className="brand-mark">DV</span>
          <span className="brand-word">DataVista</span>
        </Link>

        {showHeaderActions ? (
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#siteNav"
            aria-controls="siteNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
        ) : null}

        <div className={`collapse navbar-collapse ${showHeaderActions ? "" : "d-none"}`} id="siteNav">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 site-nav-actions ms-auto">
            {showBackHome ? (
              <Link to="/" className="btn btn-outline-secondary nav-ghost-btn">
                Back to Home
              </Link>
            ) : null}

            {showUserActions ? (
              <>
                {!isDashboardRoute ? (
                  <Link to="/dashboard" className="btn nav-primary-btn">
                    Dashboard
                  </Link>
                ) : null}
                <div className="site-user-cluster">
                  <span className="site-user-avatar" aria-hidden="true">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="user-pill">
                    {displayName} · {auth.user.role}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary nav-ghost-btn"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
