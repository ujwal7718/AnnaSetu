import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'volunteer':
      return <Navigate to="/volunteer" replace />;
    case 'donor':
      return <Navigate to="/donor" replace />;
    case 'ngo':
      return <Navigate to="/ngo" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default DashboardRedirect;
