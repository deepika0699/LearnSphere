/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useId } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  AssessmentAuthorData,
  DeleteAssessmentResponse,
} from '../../services/api';
import { AssessmentAuthoringModal } from './AssessmentAuthoringModal';
import { AssessmentPreviewModal } from './AssessmentPreviewModal';
import { LoadingSpinner } from '../LoadingSpinner';
import { FeedbackState } from '../FeedbackState';
import { EmptyState } from '../EmptyState';
import {
  FileCheck,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Award,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreatorAssessmentsManagerProps {
  courseId: string;
  courseTitle?: string;
  onAssessmentCountChange?: (count: number) => void;
}

export const CreatorAssessmentsManager: React.FC<CreatorAssessmentsManagerProps> = ({
  courseId,
  courseTitle,
  onAssessmentCountChange,
}) => {
  const { accessToken } = useApp();
  const searchInputId = useId();

  const [assessments, setAssessments] = useState<AssessmentAuthorData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  // Delete Confirmation State
  const [deletingAssessment, setDeletingAssessment] = useState<AssessmentAuthorData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async () => {
    if (!accessToken || !courseId) return;

    setError(null);
    try {
      const data = await courseCreatorApi.getAssessments(accessToken, courseId);
      setAssessments(data);
      if (onAssessmentCountChange) {
        onAssessmentCountChange(data.length);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load assessments for this course');
    } finally {
      setLoading(false);
    }
  }, [accessToken, courseId, onAssessmentCountChange]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingAssessment(null);
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (assessment: AssessmentAuthorData) => {
    setEditingAssessment(assessment);
    setIsModalOpen(true);
  };

  // Confirm Delete / Archive
  const handleConfirmDelete = async () => {
    if (!accessToken || !deletingAssessment) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result: DeleteAssessmentResponse = await courseCreatorApi.deleteAssessment(
        accessToken,
        courseId,
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

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <LoadingSpinner size="md" label="Loading assessments..." direction="col" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <FeedbackState
          title="Could Not Load Assessments"
          message={error}
          onRetry={fetchAssessments}
          retryLabel="Retry Loading"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-bold text-lg text-slate-900">
              Course Assessments & Quizzes
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              ({assessments.length})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Author and configure topic quizzes, knowledge checks, and the final course exam.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assessment</span>
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
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment title or instructions..."
              className="w-full pl-8 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
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

      {/* Assessment Cards List */}
      {filteredAssessments.length === 0 ? (
        assessments.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="No Assessments Yet"
            description="Create your first quiz or exam to assess students' mastery of this course."
            actionLabel="Create Assessment"
            onAction={handleOpenCreate}
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
                </div>

                <h3 className="font-display font-bold text-base text-slate-900 truncate">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Metadata details without pill enclosures */}
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
                  onClick={() => handleOpenEdit(item)}
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

      {/* Authoring Modal */}
      {isModalOpen && (
        <AssessmentAuthoringModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courseId={courseId}
          courseTitle={courseTitle}
          assessment={editingAssessment}
          onSaved={() => {
            fetchAssessments();
            setActionSuccessMessage(
              editingAssessment ? 'Assessment updated successfully' : 'Assessment created successfully'
            );
            setTimeout(() => setActionSuccessMessage(null), 5000);
          }}
          mode="creator"
        />
      )}

      {/* Preview Modal */}
      {previewingAssessment && (
        <AssessmentPreviewModal
          isOpen={Boolean(previewingAssessment)}
          onClose={() => setPreviewingAssessment(null)}
          assessment={previewingAssessment}
          mode="creator"
        />
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deletingAssessment && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-assessment-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 id="delete-assessment-dialog-title" className="font-display font-bold text-base text-slate-900">
                Remove Assessment
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
    </div>
  );
};

export default CreatorAssessmentsManager;
