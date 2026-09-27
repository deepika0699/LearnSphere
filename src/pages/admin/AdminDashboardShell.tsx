/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { adminApi, AdminDashboardData } from '../../services/api';
import { FeedbackState } from '../../components/FeedbackState';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  RefreshCw, 
  Database 
} from 'lucide-react';

export const AdminDashboardShell: React.FC = () => {
  const { accessToken } = useApp();
  const [metrics, setMetrics] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (!accessToken) return;

    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await adminApi.getDashboard(accessToken);
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load administrative metrics. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchDashboardData();
    }
  }, [accessToken, fetchDashboardData]);

  return (
    <div id="admin-dashboard-container" className="space-y-6">
      {/* Header with Title and Manual Refresh Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 id="admin-dashboard-heading" className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time platform metrics and authoritative user distribution.
          </p>
        </div>

        <button
          id="btn-refresh-dashboard"
          type="button"
          onClick={() => fetchDashboardData(true)}
          disabled={loading || isRefreshing}
          className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs self-start sm:self-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
          title="Refresh dashboard metrics from database"
          aria-label="Refresh metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary-600' : 'text-slate-500'}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Loading Skeleton View */}
      {loading && (
        <div id="admin-dashboard-skeleton" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              id={`skeleton-metric-card-${idx}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs animate-pulse space-y-3"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-100 rounded w-24" />
                <div className="w-9 h-9 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-8 bg-slate-100 rounded w-16" />
              <div className="h-3 bg-slate-100 rounded w-32" />
            </div>
          ))}
        </div>
      )}

      {/* Error State View */}
      {!loading && error && (
        <div id="admin-dashboard-error" className="py-8">
          <FeedbackState
            title="Failed to Retrieve Metrics"
            message={error}
            onRetry={() => fetchDashboardData(false)}
            retryLabel="Try Again"
          />
        </div>
      )}

      {/* Real Data Metrics Display */}
      {!loading && !error && metrics && (
        <div className="space-y-6">
          <div id="admin-dashboard-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Total Users */}
            <div 
              id="metric-card-total-users" 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Users
                </span>
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span id="metric-value-total-users" className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
                  {metrics.users.total}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All registered accounts
              </p>
            </div>

            {/* Card 2: Students */}
            <div 
              id="metric-card-students" 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Students
                </span>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span id="metric-value-students" className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
                  {metrics.users.students}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Active learners enrolled
              </p>
            </div>

            {/* Card 3: Course Creators */}
            <div 
              id="metric-card-course-creators" 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Course Creators
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span id="metric-value-course-creators" className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
                  {metrics.users.courseCreators}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Course content creators
              </p>
            </div>

            {/* Card 4: Administrators */}
            <div 
              id="metric-card-administrators" 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Administrators
                </span>
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span id="metric-value-administrators" className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
                  {metrics.users.admins}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Privileged access accounts
              </p>
            </div>
          </div>

          {/* Real Data Source Verification Note */}
          <div id="admin-dashboard-source-info" className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-slate-900">
                  Database Synchronization
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Metrics reflect live aggregations directly from the MongoDB database collection via <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">GET /api/admin/dashboard</code>. No simulated or mock data is injected.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
