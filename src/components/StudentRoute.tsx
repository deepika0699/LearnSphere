/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from './LoadingSpinner';

interface StudentRouteProps {
  children?: React.ReactNode;
}

/**
 * Route protection guard for student-only routes.
 * Uses authoritative user authentication & role state from AppContext.
 *
 * - Shows loading state while authentication is initializing (no premature redirect)
 * - Redirects unauthenticated users to /login with return location
 * - Redirects authenticated admins to /admin/dashboard
 * - Redirects authenticated courseCreators to /creator/dashboard
 * - Renders protected student content only if user is confirmed student
 */
export const StudentRoute: React.FC<StudentRouteProps> = ({ children }) => {
  const { state, isLoading, isAuthenticated } = useApp();
  const location = useLocation();

  // 1. While authentication is initializing, show loading spinner (no premature redirect)
  if (isLoading) {
    return (
      <div id="student-route-loading" className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Verifying student authorization..." direction="col" />
      </div>
    );
  }

  // 2. If the user is not authenticated, redirect to /login with return-route state
  if (!isAuthenticated || !state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If the user is authenticated but is NOT a student, redirect to their role home
  if (state.user.role !== 'student') {
    if (state.user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (state.user.role === 'courseCreator') {
      return <Navigate to="/creator/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // 4. If the authenticated user is a verified student, allow access
  return children ? <>{children}</> : <Outlet />;
};

export default StudentRoute;
