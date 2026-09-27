/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from './LoadingSpinner';

interface CreatorRouteProps {
  children?: React.ReactNode;
}

/**
 * Route protection guard for Course Creator-only routes.
 * Uses authoritative user authentication & role state from AppContext.
 *
 * - Shows loading state while authentication is initializing (no UI flash)
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated students to /dashboard
 * - Redirects authenticated admins to /admin
 * - Renders protected creator area only if role is strictly 'courseCreator'
 */
export const CreatorRoute: React.FC<CreatorRouteProps> = ({ children }) => {
  const { state, isLoading, isAuthenticated } = useApp();
  const location = useLocation();

  // 1. While authentication is initializing, show loading spinner (no premature redirect or flash)
  if (isLoading) {
    return (
      <div id="creator-route-loading" className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Verifying creator authorization..." direction="col" />
      </div>
    );
  }

  // 2. If the user is not authenticated, redirect to the existing login page
  if (!isAuthenticated || !state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If the user is authenticated but is NOT a courseCreator, redirect appropriately
  if (state.user.role !== 'courseCreator') {
    if (state.user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 4. If the authenticated user is a verified courseCreator, allow access
  return children ? <>{children}</> : <Outlet />;
};

export default CreatorRoute;
