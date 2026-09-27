import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from './LoadingSpinner';

interface AdminRouteProps {
  children?: React.ReactNode;
}

/**
 * Route protection guard for admin-only routes.
 * Uses authoritative user authentication & role state from AppContext.
 * 
 * - Shows loading state while authentication is initializing
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated non-admin users to safe home page (/)
 * - Renders protected admin content only if user is confirmed admin
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { state, isLoading, isAuthenticated } = useApp();
  const location = useLocation();

  // 1. While authentication is initializing, show loading spinner (no premature redirect)
  if (isLoading) {
    return (
      <div id="admin-route-loading" className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Verifying authorization..." direction="col" />
      </div>
    );
  }

  // 2. If the user is not authenticated, redirect to the existing login page
  if (!isAuthenticated || !state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If the user is authenticated but is NOT an admin, redirect to safe student area
  if (state.user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. If the authenticated user is an admin, allow access to the protected admin route
  return children ? <>{children}</> : <Outlet />;
};
