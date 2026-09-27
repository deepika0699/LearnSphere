/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useId } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  CourseCreatorCourse,
  CourseCreatorPagination,
  CourseStatus,
} from '../../services/api';
import { FeedbackState } from '../../components/FeedbackState';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  Archive,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
} from 'lucide-react';

export const CreatorCoursesShell: React.FC = () => {
  const { accessToken, isLoading: authLoading } = useApp();
  const searchInputId = useId();
  const statusFilterId = useId();
  const categoryFilterId = useId();

  // Data state
  const [courses, setCourses] = useState<CourseCreatorCourse[]>([]);
  const [pagination, setPagination] = useState<CourseCreatorPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Query / Filter state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!accessToken) return;

    setError(null);
    try {
      const data = await courseCreatorApi.getCourses(accessToken, {
        page,
        limit,
        search: searchFilter || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });

      setCourses(data.courses || []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve creator courses');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken, page, limit, searchFilter, statusFilter, categoryFilter]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchCourses();
    }
  }, [authLoading, accessToken, fetchCourses]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchFilter(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCourses();
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

  const hasActiveFilters = Boolean(searchFilter || statusFilter || categoryFilter);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              My Courses
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed mt-1">
              Manage your authoring catalog. Select a course to edit details, manage curriculum modules, or draft learning topics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              title="Refresh course list"
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

      {/* 2. Filters & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Query */}
          <div className="sm:col-span-6 relative">
            <label htmlFor={searchInputId} className="sr-only">Search courses</label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id={searchInputId}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search courses by title or description..."
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <label htmlFor={statusFilterId} className="sr-only">Filter by status</label>
            <select
              id={statusFilterId}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CourseStatus | '');
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3 flex gap-2">
            <label htmlFor={categoryFilterId} className="sr-only">Filter by category</label>
            <input
              id={categoryFilterId}
              type="text"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by category..."
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors"
            />

            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
            <span className="font-medium">Active filters:</span>
            {searchFilter && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                Search: "{searchFilter}"
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full capitalize">
                Status: {statusFilter}
              </span>
            )}
            {categoryFilter && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                Category: {categoryFilter}
              </span>
            )}
            <button
              type="button"
              onClick={handleClearFilters}
              className="ml-auto text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Content: Course List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <LoadingSpinner size="lg" label="Loading courses..." direction="col" />
          </div>
        ) : error ? (
          <div className="p-8">
            <FeedbackState
              title="Unable to load courses"
              message={error}
              onRetry={fetchCourses}
              retryLabel="Retry"
            />
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={BookOpen}
              title={hasActiveFilters ? 'No matching courses found' : 'No courses in your catalog'}
              description={
                hasActiveFilters
                  ? 'Try clearing or changing your search filters to find courses.'
                  : 'You have not created any courses yet. Begin authoring your first curriculum.'
              }
              action={
                hasActiveFilters
                  ? {
                      label: 'Clear Filters',
                      onClick: handleClearFilters,
                    }
                  : {
                      label: 'Create Course',
                      onClick: () => {
                        window.location.hash = '#/creator/courses/new';
                      },
                    }
              }
            />
          </div>
        ) : (
          <div>
            {/* Table / List View */}
            <div className="divide-y divide-slate-100">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {course.category}
                      </span>
                      {getStatusBadge(course.status)}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {formatDate(course.createdAt)}
                      </span>
                    </div>

                    <h2 className="font-display font-semibold text-base sm:text-lg text-slate-900 leading-snug">
                      {course.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 max-w-3xl leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Link
                      to={`/creator/courses/${course.id}`}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                    >
                      <span>View & Manage</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing page <span className="font-semibold text-slate-700">{pagination.page}</span> of{' '}
                  <span className="font-semibold text-slate-700">{pagination.totalPages}</span> ({pagination.total} total courses)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPreviousPage || loading}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorCoursesShell;
