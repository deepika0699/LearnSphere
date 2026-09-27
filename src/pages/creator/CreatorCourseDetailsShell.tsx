/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  CourseCreatorCourse,
  UpdateCourseCreatorCourseRequest,
} from '../../services/api';
import { FeedbackState } from '../../components/FeedbackState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CreatorModulesManager } from '../../components/creator/CreatorModulesManager';
import { CreatorAssessmentsManager } from '../../components/creator/CreatorAssessmentsManager';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Archive,
  Calendar,
  Layers,
  Edit2,
  BookOpen,
  Info,
  Save,
  X,
  Loader2,
  AlertCircle,
  FolderOpen,
  FileCheck,
} from 'lucide-react';

export const CreatorCourseDetailsShell: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { accessToken, isLoading: authLoading } = useApp();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseCreatorCourse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UpdateCourseCreatorCourseRequest>({
    title: '',
    category: '',
    description: '',
    thumbnail: '',
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Tab switcher state
  const [activeTab, setActiveTab] = useState<'modules' | 'assessments'>('modules');
  const [assessmentsCount, setAssessmentsCount] = useState<number>(0);

  const fetchCourse = useCallback(async () => {
    if (!accessToken || !courseId) return;

    setError(null);
    try {
      const data = await courseCreatorApi.getCourseById(accessToken, courseId);
      setCourse(data);
      setEditForm({
        title: data.title,
        category: data.category,
        description: data.description,
        thumbnail: data.thumbnail || '',
      });
    } catch (err: any) {
      setError(err?.message || 'Course not found or access denied');
    } finally {
      setLoading(false);
    }
  }, [accessToken, courseId]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchCourse();
    }
  }, [authLoading, accessToken, fetchCourse]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !courseId) return;

    setSaveError(null);
    setSaving(true);
    try {
      const updated = await courseCreatorApi.updateCourse(accessToken, courseId, {
        title: editForm.title?.trim(),
        category: editForm.category?.trim(),
        description: editForm.description?.trim(),
        thumbnail: editForm.thumbnail?.trim() || undefined,
      });
      setCourse(updated);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading course..." direction="col" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Link
          to="/creator/courses"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Courses</span>
        </Link>
        <FeedbackState
          title="Course Unavailable"
          message={error || 'The requested course could not be retrieved or is not owned by your account.'}
          onRetry={fetchCourse}
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/creator/courses"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Courses</span>
        </Link>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Course Details</span>
          </button>
        )}
      </div>

      {/* Main Course Details Card / Edit Mode Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        {isEditing ? (
          /* Inline Edit Form */
          <form onSubmit={handleSaveEdit} className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Edit Course Details
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="edit-title" className="block text-xs font-semibold text-slate-700">
                Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-category" className="block text-xs font-semibold text-slate-700">
                Category
              </label>
              <input
                id="edit-category"
                type="text"
                value={editForm.category}
                onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                required
                className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-description" className="block text-xs font-semibold text-slate-700">
                Description
              </label>
              <textarea
                id="edit-description"
                rows={5}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                required
                className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-thumbnail" className="block text-xs font-semibold text-slate-700">
                Thumbnail Image URL
              </label>
              <input
                id="edit-thumbnail"
                type="url"
                value={editForm.thumbnail}
                onChange={(e) => setEditForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            <div className="space-y-3">
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

              <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {course.title}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {/* Course Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Course ID
                </span>
                <span className="text-xs font-mono text-slate-700 font-semibold truncate block mt-0.5">
                  {course.id}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Lifecycle Status
                </span>
                <span className="text-xs text-slate-700 font-semibold capitalize block mt-0.5">
                  {course.status}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Author
                </span>
                <span className="text-xs text-slate-700 font-semibold truncate block mt-0.5">
                  {course.courseCreator?.name || 'You'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs between Curriculum Modules and Assessments */}
      <div className="flex items-center space-x-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === 'modules'
              ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Curriculum Modules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assessments')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === 'assessments'
              ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Assessments & Quizzes</span>
          {assessmentsCount > 0 && (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
              {assessmentsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content: Curriculum Modules Manager or Assessments Manager */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs">
        {activeTab === 'modules' ? (
          <CreatorModulesManager courseId={course.id} courseTitle={course.title} />
        ) : (
          <CreatorAssessmentsManager
            courseId={course.id}
            courseTitle={course.title}
            onAssessmentCountChange={setAssessmentsCount}
          />
        )}
      </div>
    </div>
  );
};

export default CreatorCourseDetailsShell;
