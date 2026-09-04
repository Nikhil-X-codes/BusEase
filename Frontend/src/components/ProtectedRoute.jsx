import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

export default function ProtectedRoute({ children, requireAuth = false, requireAdmin = false, guestOnly = false }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Checking session...</main>;
  }

  if (guestOnly && isAuthenticated) return <Navigate to="/home" replace />;
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }
  if (requireAdmin && !["admin", "superadmin"].includes(user?.role)) {
    return <Navigate to="/home" replace />;
  }
  return children;
}
