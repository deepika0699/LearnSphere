/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  studentDashboardApi,
  StudentDashboardResponse,
  StudentDashboardCourseSummary,
} from '../../services/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FeedbackState } from '../../components/FeedbackState';
import { EmptyState } from '../../components/EmptyState';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  AlertCircle,
} from 'lucide-react';

/**
 * Validates that an image URL string is strictly HTTP or HTTPS.
 * Prevents javascript:, data:, vbscript:, and invalid relative protocol strings.
 */
function isValidHttpUrl(urlStr?: string | null): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const Dashboard: React.FC = () => {
  useDocumentTitle('Student Dashboard');
  const { accessToken, state, isLoading: authLoading } = useApp();
  const { user } = state;
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Component-level refs to guard against unmount state updates and race conditions
  const isMountedRef = useRef<boolean>(true);
  const activeRequestIdRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!accessToken) return;

    const currentRequestId = ++activeRequestIdRef.current;
    setError(null);

    try {
      const data = await studentDashboardApi.getDashboard(accessToken);
      if (isMountedRef.current && currentRequestId === activeRequestIdRef.current) {
        setDashboardData(data);
      }
    } catch (err: any) {
      if (isMountedRef.current && currentRequestId === activeRequestIdRef.current) {
        setError(err?.message || 'Failed to load student dashboard. Please try again.');
      }
    } finally {
      if (isMountedRef.current && currentRequestId === activeRequestIdRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchDashboard();
    } else if (!authLoading && !accessToken) {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [authLoading, accessToken, fetchDashboard]);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchDashboard();
  };

  // 1. Authentication initializing or initial dashboard data loading
  if ((authLoading || loading) && !dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" label="Loading student dashboard..." direction="col" />
      </div>
    );
  }

  // 2. Error state with retry action
  if (error && !dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FeedbackState
          title="Unable to load dashboard"
          message={error}
          onRetry={fetchDashboard}
          retryLabel="Try Again"
        />
      </div>
    );
  }

  // 3. Fallback if session is unexpectedly unauthenticated
  if (!dashboardData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-6">
        <GraduationCap className="w-14 h-14 text-slate-300 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-slate-800">Student Portal</h2>
        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed text-sm">
          Please sign in to access your course enrollments, verified learning progress, and curriculum records.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-colors shadow-xs"
          >
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  const { student, stats, courses, recentCourses } = dashboardData;
  const studentFirstName = student.name ? student.name.split(' ')[0] : user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Non-blocking error banner during background refresh */}
      {error && dashboardData && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Failed to refresh dashboard: {error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="font-semibold underline hover:no-underline ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header Greeting & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xs gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-primary-600 font-mono text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 fill-primary-100" />
            <span>STUDENT PORTAL</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, <span className="text-primary-600">{studentFirstName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg">
            Track your enrolled courses, view verified module completion, and continue structured learning.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/courses"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>

      {/* Server-Authoritative Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Enrollments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200 flex-shrink-0">
            <Layers className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Total Enrollments
            </div>
            <div className="text-xl font-bold text-slate-800">{stats.totalEnrollments}</div>
          </div>
        </div>

        {/* Active Enrollments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center border border-primary-100 flex-shrink-0">
            <BookOpen className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Active Courses
            </div>
            <div className="text-xl font-bold text-slate-800">{stats.activeEnrollments}</div>
          </div>
        </div>

        {/* In-Progress Courses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              In-Progress
            </div>
            <div className="text-xl font-bold text-slate-800">{stats.inProgressCourses}</div>
          </div>
        </div>

        {/* Completed Courses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Completed
            </div>
            <div className="text-xl font-bold text-slate-800">{stats.completedCourses}</div>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Enrolled Courses & Recent Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Enrolled Courses List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2">
              <span>My Enrolled Courses</span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {courses.length}
              </span>
            </h2>

            {courses.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                {stats.completedCourses} of {courses.length} completed
              </span>
            )}
          </div>

          {courses.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No active enrollments"
              description="You have not enrolled in any published courses yet. Explore the course catalog to begin your learning journey."
              action={{
                label: 'Explore Course Catalog',
                onClick: () => navigate('/courses'),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {courses.map((course: StudentDashboardCourseSummary) => {
                const isComplete = course.isCompleted;
                const hasStarted = course.completedTopics > 0;
                const courseUrl = `/courses/${course.courseId || course.id}`;

                return (
                  <div
                    key={course.id || course.courseId}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-start sm:items-center space-x-4 min-w-0">
                        {/* Course Thumbnail or Category Icon */}
                        {isValidHttpUrl(course.thumbnail) ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-slate-100 border border-slate-200"
                            onError={(e) => {
                              // Fallback on image loading failure
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-14 h-14 rounded-lg bg-primary-50 text-primary-600 items-center justify-center border border-primary-100 flex-shrink-0 ${
                            isValidHttpUrl(course.thumbnail) ? 'hidden' : 'flex'
                          }`}
                        >
                          <BookOpen className="w-6 h-6" />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                              {course.category}
                            </span>
                            {isComplete ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Completed</span>
                              </span>
                            ) : hasStarted ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-primary-600" />
                                <span>In Progress</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                Not Started
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-semibold text-base text-slate-900 leading-snug truncate">
                            {course.title}
                          </h3>

                          {course.courseCreator?.name && (
                            <p className="text-xs text-slate-500">
                              Instructor: <span className="font-medium text-slate-700">{course.courseCreator.name}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Course Action Link */}
                      <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2 flex-shrink-0 pt-2 sm:pt-0">
                        <Link
                          to={courseUrl}
                          className="inline-flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-2xs w-full sm:w-auto text-center"
                        >
                          <span>{isComplete ? 'Review Course' : hasStarted ? 'Resume Study' : 'Start Course'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Progress Bar & Real Topic Counts */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span>Progress:</span>
                        <span className="font-semibold text-slate-800">{course.completionPercentage}%</span>
                        <span className="text-slate-400">
                          ({course.completedTopics} of {course.totalTopics} topics)
                        </span>
                        {course.totalAssessments !== undefined && course.totalAssessments > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {course.passedAssessments || 0}/{course.totalAssessments} Assessments
                          </span>
                        )}
                      </div>
                      <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isComplete ? 'bg-emerald-600' : 'bg-primary-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, course.completionPercentage))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Recently Enrolled & Curriculum Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recently Enrolled Courses */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-semibold text-xs text-slate-500 uppercase tracking-widest">
                Recently Enrolled
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {recentCourses.length} RECENT
              </span>
            </div>

            {recentCourses.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No recent enrollments to display.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCourses.map((recent: StudentDashboardCourseSummary) => (
                  <Link
                    key={`recent-${recent.id || recent.courseId}`}
                    to={`/courses/${recent.courseId || recent.id}`}
                    className="block p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-colors space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-slate-500 uppercase tracking-wider">
                        {recent.category}
                      </span>
                      {recent.enrolledAt && (
                        <span className="text-slate-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(recent.enrolledAt).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-xs text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                      {recent.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{recent.completionPercentage}% complete</span>
                      <span className="text-[10px] text-primary-600 font-semibold group-hover:underline flex items-center">
                        Continue <ArrowRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Educational Framework Guide */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-primary-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary-400">
                Curriculum Access
              </span>
            </div>
            <h4 className="font-display font-bold text-sm leading-snug">
              Structured Educational Delivery
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every course is divided into structured modules and verified educational topics. Topics completed in the reader update your progress metrics in real time.
            </p>
            <div className="pt-1">
              <Link
                to="/courses"
                className="inline-flex items-center space-x-1.5 text-xs text-white hover:text-slate-200 font-semibold"
              >
                <span>Browse Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
