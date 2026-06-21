import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NGOPendingScreen from '../pages/NGOPendingScreen';

/**
 * PrivateRoute
 *
 * Guards a route behind:
 *  1. Authentication (valid JWT / session)
 *  2. Role check (requiredRole prop)
 *  3. NGO approval check — if the route requires role=ngo, the user must
 *     also have approvalStatus === 'approved'. Pending and rejected NGOs
 *     see a dedicated screen instead of being silently redirected.
 */
const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-red-600 font-medium">
          Access Denied: You don't have permission to view this page.
        </div>
      </div>
    );
  }

  // ── NGO-specific: approval gate ──────────────────────────────────────────
  // Only applies when the route requires the 'ngo' role.
  // Pending and rejected NGOs see a friendly screen, not a generic error.
  if (requiredRole === 'ngo' && user?.approvalStatus !== 'approved') {
    return (
      <NGOPendingScreen
        status={user?.approvalStatus || 'pending'}
        note={user?.approvalNote || null}
      />
    );
  }

  return children;
};

export default PrivateRoute;
