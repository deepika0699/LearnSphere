/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useId } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  adminApi,
  AdminCourse,
  AssessmentAuthorData,
  AdminAssessmentStats,
  DeleteAssessmentResponse,
} from '../../services/api';
import { AssessmentAuthoringModal } from '../../components/creator/AssessmentAuthoringModal';
import { AssessmentPreviewModal } from '../../components/creator/AssessmentPreviewModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FeedbackState } from '../../components/FeedbackState';
import { EmptyState } from '../../components/EmptyState';
import {
  ShieldCheck,
  FileCheck,
  Plus,
  Edit2,
  Trash2,
  BarChart2,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  Archive,
  ChevronDown,
  X,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminAssessmentsShell: React.FC = () => {
  const { accessToken, isLoading: authLoading } = useApp();
  const courseSelectId = useId();
  const searchInputId = useId();

  // Courses state
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  // Assessments state
  const [assessments, setAssessments] = useState<AssessmentAuthorData[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState<boolean>(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'topic' | 'course'>('all');

  // Authoring Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentAuthorData | null>(null);

  // Preview Modal State
  const [previewingAssessment, setPreviewingAssessment] = useState<AssessmentAuthorData | null>(null);

  // Stats Modal State
  const [statsModalAssessment, setStatsModalAssessment] = useState<AssessmentAuthorData | null>(null);
  const [statsData, setStatsData] = useState<AdminAssessmentStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingAssessment, setDeletingAssessment] = useState<AssessmentAuthorData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 1. Fetch courses for Admin
  const fetchCourses = useCallback(async () => {
    if (!accessToken) return;

    setLoadingCourses(true);
    setCourseError(null);
    try {
      const data = await adminApi.getCourses(accessToken, { limit: 100 });
      const loadedCourses = data.courses || [];
      setCourses(loadedCourses);

      if (loadedCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(loadedCourses[0].id);
      }
    } catch (err: any) {
      setCourseError(err?.message || 'Failed to retrieve course catalog');
    } finally {
      setLoadingCourses(false);
    }
  }, [accessToken, selectedCourseId]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchCourses();
    }
  }, [authLoading, accessToken, fetchCourses]);

  // 2. Fetch assessments for selected course
  const fetchAssessments = useCallback(async () => {
    if (!accessToken || !selectedCourseId) return;

    setLoadingAssessments(true);
    setAssessmentError(null);
    try {
      const data = await adminApi.getCourseAssessments(accessToken, selectedCourseId);
      setAssessments(data);
    } catch (err: any) {
      setAssessmentError(err?.message || 'Failed to retrieve assessments for this course');
    } finally {
      setLoadingAssessments(false);
    }
  }, [accessToken, selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchAssessments();
    }
  }, [selectedCourseId, fetchAssessments]);

  // 3. View Assessment Aggregate Stats
  const handleOpenStats = async (item: AssessmentAuthorData) => {
    if (!accessToken) return;

    setStatsModalAssessment(item);
    setStatsData(null);
    setStatsError(null);
    setLoadingStats(true);

    try {
      const stats = await adminApi.getAssessmentStats(accessToken, item.id);
      setStatsData(stats);
    } catch (err: any) {
      setStatsError(err?.message || 'Failed to fetch assessment performance statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  // 4. Delete / Archive Assessment
  const handleConfirmDelete = async () => {
    if (!accessToken || !deletingAssessment) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result: DeleteAssessmentResponse = await adminApi.deleteAssessment(
        accessToken,
        deletingAssessment.id
      );

      setActionSuccessMessage(result.message || 'Assessment successfully removed');
      setDeletingAssessment(null);
      await fetchAssessments();

      setTimeout(() => {
        setActionSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to remove or archive assessment');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Filtered List
  const filteredAssessments = assessments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchDesc = (a.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Published
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Archived
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
    }
  };

  if (loadingCourses) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading admin assessments console..." direction="col" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <FeedbackState
          title="Could Not Load Course Catalog"
          message={courseError}
          onRetry={fetchCourses}
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Admin Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-primary-600 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privileged Assessment Administration</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
              Assessment Management & Audit
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Audit, modify, configure, and inspect performance metrics for assessments across any catalog course.
            </p>
          </div>

          {/* Course Selector Dropdown */}
          <div className="min-w-[280px] space-y-1.5 self-start sm:self-auto">
            <label htmlFor={courseSelectId} className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Course Scope
            </label>
            <div className="relative">
              <select
                id={courseSelectId}
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full appearance-none px-3.5 py-2 pr-9 text-xs font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer transition-colors"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-primary-600" />
              <h2 className="font-display font-bold text-lg text-slate-900">
                {selectedCourse ? selectedCourse.title : 'Course Assessments'}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                ({assessments.length})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Administer quizzes, inspect questions, and review aggregate pass rates.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingAssessment(null);
              setIsModalOpen(true);
            }}
            disabled={!selectedCourseId}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in-50 duration-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        {assessments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                id={searchInputId}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessment title or instructions..."
                className="w-full pl-8 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Types
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('topic')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  typeFilter === 'topic'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Topic Quizzes
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('course')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  typeFilter === 'course'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Finals
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('published')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  statusFilter === 'published'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  statusFilter === 'draft'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Draft
              </button>
            </div>
          </div>
        )}

        {/* Assessments List / Empty / Loading */}
        {loadingAssessments ? (
          <div className="py-12 flex items-center justify-center">
            <LoadingSpinner size="md" label="Loading assessments..." direction="col" />
          </div>
        ) : assessmentError ? (
          <FeedbackState
            title="Assessment Load Failure"
            message={assessmentError}
            onRetry={fetchAssessments}
            retryLabel="Retry"
          />
        ) : filteredAssessments.length === 0 ? (
          assessments.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No Assessments in this Course"
              description="This course does not currently have any configured assessments."
              actionLabel="Create Assessment"
              onAction={() => {
                setEditingAssessment(null);
                setIsModalOpen(true);
              }}
            />
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl">
              No assessments match your current filters.
            </div>
          )
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Info Column */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">
                      {item.type === 'course' ? 'Course Final Assessment' : 'Topic Assessment'}
                    </span>
                    <span aria-hidden="true">·</span>
                    {getStatusBadge(item.status)}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] text-slate-400">ID: {item.id}</span>
                  </div>

                  <h3 className="font-display font-bold text-base text-slate-900 truncate">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Clean unboxed metadata */}
                  <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500 pt-1">
                    <span>{item.questionsCount || item.questions?.length || 0} Questions</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.passingScore}% passing score</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {item.timeLimitMinutes === 0
                        ? 'Untimed'
                        : `${item.timeLimitMinutes} min limit`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {item.maxAttempts === 0
                        ? 'Unlimited attempts'
                        : `${item.maxAttempts} max attempt${item.maxAttempts > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* View Stats Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenStats(item)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="View aggregate performance statistics"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Stats</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewingAssessment(item)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    title="Preview assessment questions and answer key"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAssessment(item);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingAssessment(item)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete or Archive Assessment"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authoring Modal (Admin Mode) */}
      {isModalOpen && selectedCourseId && (
        <AssessmentAuthoringModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courseId={selectedCourseId}
          courseTitle={selectedCourse?.title}
          assessment={editingAssessment}
          onSaved={() => {
            fetchAssessments();
            setActionSuccessMessage(
              editingAssessment ? 'Assessment updated successfully' : 'Assessment created successfully'
            );
            setTimeout(() => setActionSuccessMessage(null), 5000);
          }}
          mode="admin"
        />
      )}

      {/* Stats Modal */}
      {statsModalAssessment && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stats-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-5 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="stats-dialog-title" className="font-display font-bold text-sm text-slate-900">
                    Performance Statistics
                  </h3>
                  <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                    {statsModalAssessment.title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatsModalAssessment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Close statistics dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingStats ? (
              <div className="py-8 flex items-center justify-center">
                <LoadingSpinner size="md" label="Loading statistics..." direction="col" />
              </div>
            ) : statsError ? (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {statsError}
              </div>
            ) : statsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Total Attempts
                    </span>
                    <span className="text-xl font-display font-bold text-slate-900 mt-1 block">
                      {statsData.totalAttempts}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Pass Rate
                    </span>
                    <span className="text-xl font-display font-bold text-emerald-600 mt-1 block">
                      {statsData.passRate}%
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Average Score
                    </span>
                    <span className="text-xl font-display font-bold text-slate-900 mt-1 block">
                      {statsData.averageScore}%
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Completed
                    </span>
                    <span className="text-base font-semibold text-slate-800 mt-1 block">
                      {statsData.completedAttempts}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Passed
                    </span>
                    <span className="text-base font-semibold text-emerald-600 mt-1 block">
                      {statsData.passCount ?? (statsData as any).passedAttempts ?? 0}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Failed
                    </span>
                    <span className="text-base font-semibold text-rose-600 mt-1 block">
                      {statsData.failCount ?? Math.max(0, (statsData.completedAttempts || 0) - ((statsData as any).passedAttempts || 0))}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  Privacy notice: Statistics are strictly aggregated server-side. No individual student identities or personal identifiers are stored or exposed.
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStatsModalAssessment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deletingAssessment && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-delete-assessment-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 id="admin-delete-assessment-dialog-title" className="font-display font-bold text-base text-slate-900">
                Admin: Remove Assessment
              </h3>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-slate-900">"{deletingAssessment.title}"</span>?
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-normal">
              <strong>Database safety policy:</strong> If students have already submitted attempts for this assessment, the backend will automatically archive it instead of hard-deleting, preserving historical attempt records.
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingAssessment(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Removal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewingAssessment && (
        <AssessmentPreviewModal
          isOpen={Boolean(previewingAssessment)}
          onClose={() => setPreviewingAssessment(null)}
          assessment={previewingAssessment}
          mode="admin"
        />
      )}
    </div>
  );
};

export default AdminAssessmentsShell;
