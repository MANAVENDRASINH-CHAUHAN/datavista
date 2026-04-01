import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute() {
  const { auth, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
