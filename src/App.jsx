import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import DashboardShell from "./components/layout/DashboardShell";
import MainHeader from "./components/layout/MainHeader";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import SignUpPage from "./pages/auth/SignUpPage";
import AnalyzeDataPage from "./pages/dashboard/AnalyzeDataPage";
import ChartsPage from "./pages/dashboard/ChartsPage";
import DataCleanerPage from "./pages/dashboard/DataCleanerPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import DatasetDetailsPage from "./pages/dashboard/DatasetDetailsPage";
import InsightsPage from "./pages/dashboard/InsightsPage";
import MyDatasetsPage from "./pages/dashboard/MyDatasetsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import UploadDatasetPage from "./pages/dashboard/UploadDatasetPage";
import LandingPage from "./pages/public/LandingPage";

const dashboardRoutes = [
  { index: true, element: <DashboardPage /> },
  { path: "upload", element: <UploadDatasetPage /> },
  { path: "datasets", element: <MyDatasetsPage /> },
  { path: "datasets/:datasetId", element: <DatasetDetailsPage /> },
  { path: "datasets/:datasetId/cleaner", element: <DataCleanerPage /> },
  { path: "datasets/:datasetId/insights", element: <InsightsPage /> },
  { path: "analyze", element: <AnalyzeDataPage /> },
  { path: "charts", element: <ChartsPage /> },
  { path: "settings", element: <SettingsPage /> },
];

const publicOnlyRoutes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <SignUpPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password/:token", element: <ResetPasswordPage /> },
];

const authPagePaths = ["/login", "/register", "/forgot-password"];
const resetPasswordPrefix = "/reset-password/";

const isAuthPath = (pathname) =>
  authPagePaths.includes(pathname) || pathname.startsWith(resetPasswordPrefix);

const getShellClassName = (pathname) =>
  [
    "app-shell",
    pathname.startsWith("/dashboard") ? "app-shell-dashboard" : "app-shell-public",
    isAuthPath(pathname) ? "app-shell-auth" : "",
  ]
    .filter(Boolean)
    .join(" ");

export default function App() {
  const location = useLocation();
  const { auth, isLoading } = useAuth();
  const isAuthPage = isAuthPath(location.pathname);
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const shellClassName = getShellClassName(location.pathname);

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 mb-0 text-secondary">Loading your session...</p>
        </div>
      </div>
    );
  }

  const renderPublicOnlyRoute = (element) =>
    auth?.user ? <Navigate to="/dashboard" replace /> : element;

  return (
    <div className={shellClassName}>
      <div className="app-atmosphere" aria-hidden="true">
        <span className="app-aurora app-aurora-a" />
        <span className="app-aurora app-aurora-b" />
        <span className="app-aurora app-aurora-c" />
        <span className="app-grid-glow" />
      </div>
      {!isDashboardRoute ? <MainHeader showBackHome={isAuthPage} /> : null}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {publicOnlyRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={renderPublicOnlyRoute(route.element)}
          />
        ))}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardShell />}>
            {dashboardRoutes.map((route) => (
              <Route
                key={route.path || "dashboard-index"}
                index={route.index}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={auth?.user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </div>
  );
}
