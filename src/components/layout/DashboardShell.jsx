import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useWorkspaceSettings } from "../../hooks/useWorkspaceSettings";

function DashboardIcon({ name }) {
  const paths = {
    dashboard: "M4 4h7v7H4zm9 0h7v4h-7zM4 13h4v7H4zm6 2h10v5H10z",
    upload: "M12 3v11m0-11 4 4m-4-4-4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2",
    datasets: "M5 6c0-1.1 3.1-2 7-2s7 .9 7 2-3.1 2-7 2-7-.9-7-2Zm0 6c0 1.1 3.1 2 7 2s7-.9 7-2m-14 0V6m14 6V6m-14 6v6c0 1.1 3.1 2 7 2s7-.9 7-2v-6",
    analyze: "M4 18h4l2-5 3 3 4-9 3 11h0",
    charts: "M5 19V9m7 10V5m7 14v-7",
    settings: "M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm7.4 3.5a7.7 7.7 0 0 0-.1-1l2-1.6-2-3.4-2.4.9a8.6 8.6 0 0 0-1.7-1l-.4-2.5H9.2l-.4 2.5a8.6 8.6 0 0 0-1.7 1l-2.4-.9-2 3.4 2 1.6a7.7 7.7 0 0 0 0 2l-2 1.6 2 3.4 2.4-.9a8.6 8.6 0 0 0 1.7 1l.4 2.5h5.6l.4-2.5a8.6 8.6 0 0 0 1.7-1l2.4.9 2-3.4-2-1.6c.1-.3.1-.7.1-1Z",
    search: "m21 21-4.35-4.35M10.5 18A7.5 7.5 0 1 1 18 10.5 7.5 7.5 0 0 1 10.5 18Z",
    menu: "M4 7h16M4 12h16M4 17h16",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="dashboard-icon-svg">
      <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const datasetDetailsPattern = /^\/dashboard\/datasets\/[^/]+$/;

const routeGroups = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: "dashboard",
    sectionTitle: "Dashboard",
    matches: (pathname) => pathname === "/dashboard",
  },
  {
    label: "Upload Dataset",
    to: "/dashboard/upload",
    icon: "upload",
    sectionTitle: "Upload Dataset",
    matches: (pathname) => pathname === "/dashboard/upload",
  },
  {
    label: "My Datasets",
    to: "/dashboard/datasets",
    icon: "datasets",
    sectionTitle: "My Datasets",
    matches: (pathname) => pathname === "/dashboard/datasets" || datasetDetailsPattern.test(pathname),
  },
  {
    label: "Analyze",
    to: "/dashboard/analyze",
    icon: "analyze",
    sectionTitle: "Analyze",
    matches: (pathname) =>
      pathname === "/dashboard/analyze" || pathname.includes("/cleaner") || pathname.includes("/insights"),
  },
  {
    label: "Charts",
    to: "/dashboard/charts",
    icon: "charts",
    sectionTitle: "Charts Lab",
    matches: (pathname) => pathname === "/dashboard/charts",
  },
  {
    label: "Settings",
    to: "/dashboard/settings",
    icon: "settings",
    sectionTitle: "Settings",
    matches: (pathname) => pathname === "/dashboard/settings",
  },
];

const isDatasetSearchPage = (pathname) =>
  pathname === "/dashboard/datasets" || datasetDetailsPattern.test(pathname);

const getCurrentSection = (pathname) =>
  routeGroups.find((route) => route.matches(pathname))?.sectionTitle || "Analyze";

export default function DashboardShell() {
  const { auth, logout } = useAuth();
  const { settings } = useWorkspaceSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const isDatasetSearchRoute = isDatasetSearchPage(location.pathname);
  const displayName = settings.displayName.trim() || auth?.user?.name || "User";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextValue = searchValue.trim();

    if (!nextValue) {
      navigate("/dashboard/datasets");
      return;
    }

    navigate(`/dashboard/datasets?search=${encodeURIComponent(nextValue)}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className={`dashboard-app-shell ${settings.compactSidebar ? "is-compact-sidebar" : ""}`}>
      <aside className={`dashboard-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="dashboard-sidebar-top">
          <Link className="dashboard-sidebar-brand" to="/dashboard">
            <span className="dashboard-sidebar-mark">DV</span>
            <div>
              <strong>DataVista</strong>
              <span>Analytics workspace</span>
            </div>
          </Link>
          <p className="dashboard-sidebar-caption">Platform</p>
        </div>

        <nav className="dashboard-sidebar-nav" aria-label="Dashboard sidebar">
          {routeGroups.map((link) => {
            const active = link.matches(location.pathname);

            return (
              <NavLink
                key={link.label}
                to={link.to}
                className={`dashboard-sidebar-link ${active ? "is-active" : ""}`}
              >
                <span className="dashboard-sidebar-link-icon">
                  <DashboardIcon name={link.icon} />
                </span>
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {settings.showSidebarNote ? (
          <div className="dashboard-sidebar-footer">
            <div className="dashboard-sidebar-note">
              <span className="dashboard-sidebar-note-dot" />
              Ready for charts, cleaning, and AI insights
            </div>
          </div>
        ) : null}
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="dashboard-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className="dashboard-main-shell">
        <div className="dashboard-shell-atmosphere" aria-hidden="true">
          <span className="dashboard-shell-glow dashboard-shell-glow-a" />
          <span className="dashboard-shell-glow dashboard-shell-glow-b" />
          <span className="dashboard-shell-grid" />
        </div>
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button
              type="button"
              className="dashboard-menu-btn"
              onClick={() => setSidebarOpen((current) => !current)}
              aria-label="Toggle dashboard navigation"
            >
              <DashboardIcon name="menu" />
            </button>

            <div className="dashboard-topbar-title">
              <span className="dashboard-topbar-label">Workspace</span>
              <strong>{getCurrentSection(location.pathname)}</strong>
            </div>
          </div>

          <div className="dashboard-topbar-right">
            {isDatasetSearchRoute ? (
              <form className="dashboard-searchbar" onSubmit={handleSearchSubmit}>
                <DashboardIcon name="search" />
                <input
                  type="search"
                  placeholder="Search datasets..."
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </form>
            ) : null}

            <div className="dashboard-profile-inline">
              <span className="dashboard-avatar" aria-hidden="true">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
              <button type="button" className="btn nav-ghost-btn dashboard-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard-content-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
