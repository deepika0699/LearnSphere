/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  CourseCreatorCourse,
  CourseCreatorPagination,
} from '../../services/api';
import { FeedbackState } from '../../components/FeedbackState';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  RefreshCw,
  FolderOpen,
  Calendar,
  Layers,
} from 'lucide-react';

export const CreatorDashboardShell: React.FC = () => {
  const { accessToken, state, isLoading: authLoading } = useApp();
  const { user } = state;

  const [recentCourses, setRecentCourses] = useState<CourseCreatorCourse[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorOverview = useCallback(async () => {
    if (!accessToken) return;

    setError(null);
    try {
      const data = await courseCreatorApi.getCourses(accessToken, { page: 1, limit: 5 });
      setRecentCourses(data.courses || []);
      setTotalCount(data.pagination?.total ?? 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load course creator dashboard');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchCreatorOverview();
    }
  }, [authLoading, accessToken, fetchCreatorOverview]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCreatorOverview();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Published
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Archive className="w-3 h-3 text-slate-500" />
            Archived
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Draft
          </span>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header / Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Course Creator Studio</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Creator'}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Manage your courses and learning content. Build curriculum modules, draft topics, and prepare courses for LearnSphere learners.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              title="Refresh course data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              to="/creator/courses/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Course</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Real Authoritative Profile & Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: My Courses Quick Navigation */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Authoring Catalog
              </span>
              <h2 className="font-display font-bold text-lg text-slate-900">
                My Courses
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                View, filter, and access all courses created under your authoring account.
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              {totalCount !== null ? `${totalCount} ${totalCount === 1 ? 'course' : 'courses'} total` : 'Loading...'}
            </span>
            <Link
              to="/creator/courses"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>View catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Create Course Quick Action */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                New Publication
              </span>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Create Course
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Start a new course draft. Every new course begins in Draft lifecycle status.
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Draft by default</span>
            <Link
              to="/creator/courses/new"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <span>Draft course</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Authoritative Account Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Creator Account
              </span>
              <h2 className="font-display font-bold text-lg text-slate-900">
                {user?.name || 'Creator'}
              </h2>
              <p className="text-xs text-slate-500 truncate" title={user?.email}>
                {user?.email || '—'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Authoritative Role</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              courseCreator
            </span>
          </div>
        </div>
      </div>

      {/* 3. Real Recent Courses Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
              Recent Courses
            </h2>
            <p className="text-xs text-slate-500">
              Your most recently created or updated courses
            </p>
          </div>
          <Link
            to="/creator/courses"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            All Courses ({totalCount ?? 0}) &rarr;
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <LoadingSpinner size="md" label="Loading recent courses..." direction="col" />
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8">
            <FeedbackState
              title="Unable to load courses"
              message={error}
              onRetry={fetchCreatorOverview}
              retryLabel="Retry"
            />
          </div>
        ) : recentCourses.length === 0 ? (
          /* Empty State */
          <div className="p-8">
            <EmptyState
              icon={BookOpen}
              title="No courses created yet"
              description="You haven't created any courses yet. Begin by drafting your first course."
              action={{
                label: 'Create Your First Course',
                onClick: () => {
                  window.location.hash = '#/creator/courses/new';
                },
              }}
            />
          </div>
        ) : (
          /* Real Courses Table/List */
          <div className="divide-y divide-slate-100">
            {recentCourses.map((course) => (
              <div
                key={course.id}
                className="p-5 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {course.category}
                    </span>
                    {getStatusBadge(course.status)}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(course.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900 truncate">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                    {course.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to={`/creator/courses/${course.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDashboardShell;
