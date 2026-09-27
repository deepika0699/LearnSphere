/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  CourseCreatorTopic,
  CreateCourseCreatorTopicRequest,
  UpdateCourseCreatorTopicRequest,
} from '../../services/api';
import { LoadingSpinner } from '../LoadingSpinner';
import { FeedbackState } from '../FeedbackState';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { CreatorTopicContentEditor } from './CreatorTopicContentEditor';

interface CreatorTopicsManagerProps {
  courseId: string;
  courseTitle?: string;
  moduleId: string;
  moduleTitle: string;
  onTopicCountChange?: (count: number) => void;
}

export const CreatorTopicsManager: React.FC<CreatorTopicsManagerProps> = ({
  courseId,
  courseTitle,
  moduleId,
  moduleTitle,
  onTopicCountChange,
}) => {
  const { accessToken } = useApp();

  const [topics, setTopics] = useState<CourseCreatorTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Topic Educational Content Editor State
  const [editingContentTopic, setEditingContentTopic] = useState<CourseCreatorTopic | null>(null);

  // Create Topic Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<CreateCourseCreatorTopicRequest>({
    title: '',
    description: '',
  });
  const [createValidationErrors, setCreateValidationErrors] = useState<{ [key: string]: string }>({});
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Topic Modal State
  const [editingTopic, setEditingTopic] = useState<CourseCreatorTopic | null>(null);
  const [editForm, setEditForm] = useState<UpdateCourseCreatorTopicRequest>({
    title: '',
    description: '',
  });
  const [editValidationErrors, setEditValidationErrors] = useState<{ [key: string]: string }>({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Topic Modal State
  const [deletingTopic, setDeletingTopic] = useState<CourseCreatorTopic | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reordering State
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    if (!accessToken || !courseId || !moduleId) return;

    setError(null);
    try {
      const data = await courseCreatorApi.getTopics(accessToken, courseId, moduleId);
      const sorted = [...data].sort((a, b) => a.order - b.order);
      setTopics(sorted);
      if (onTopicCountChange) {
        onTopicCountChange(sorted.length);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load topics for this module');
    } finally {
      setLoading(false);
    }
  }, [accessToken, courseId, moduleId, onTopicCountChange]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Dismiss action success message after 4 seconds
  useEffect(() => {
    if (actionSuccessMessage) {
      const timer = setTimeout(() => {
        setActionSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessMessage]);

  // Validation helper for Create
  const validateCreate = (): boolean => {
    const errs: { [key: string]: string } = {};
    const title = createForm.title?.trim() || '';

    if (!title) {
      errs.title = 'Topic title is required';
    } else if (title.length < 2 || title.length > 200) {
      errs.title = 'Title must be between 2 and 200 characters';
    }

    if (createForm.description && createForm.description.length > 2000) {
      errs.description = 'Description cannot exceed 2000 characters';
    }

    setCreateValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validation helper for Edit
  const validateEdit = (): boolean => {
    const errs: { [key: string]: string } = {};
    const title = editForm.title?.trim() || '';

    if (!title) {
      errs.title = 'Topic title is required';
    } else if (title.length < 2 || title.length > 200) {
      errs.title = 'Title must be between 2 and 200 characters';
    }

    if (editForm.description && editForm.description.length > 2000) {
      errs.description = 'Description cannot exceed 2000 characters';
    }

    setEditValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handlers
  const handleOpenCreate = () => {
    setCreateForm({ title: '', description: '' });
    setCreateValidationErrors({});
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setCreateError(null);
    setCreateValidationErrors({});
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreate()) return;
    if (!accessToken || !courseId || !moduleId) return;

    setCreateError(null);
    setIsCreating(true);

    try {
      await courseCreatorApi.createTopic(accessToken, courseId, moduleId, {
        title: createForm.title.trim(),
        description: createForm.description?.trim() || undefined,
      });

      handleCloseCreate();
      setActionSuccessMessage('Topic created successfully');
      await fetchTopics();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create topic');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (topic: CourseCreatorTopic) => {
    setEditingTopic(topic);
    setEditForm({
      title: topic.title,
      description: topic.description || '',
    });
    setEditValidationErrors({});
    setEditError(null);
  };

  const handleCloseEdit = () => {
    setEditingTopic(null);
    setEditError(null);
    setEditValidationErrors({});
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEdit()) return;
    if (!accessToken || !courseId || !moduleId || !editingTopic) return;

    setEditError(null);
    setIsUpdating(true);

    try {
      await courseCreatorApi.updateTopic(accessToken, courseId, moduleId, editingTopic.id, {
        title: editForm.title?.trim(),
        description: editForm.description?.trim() || undefined,
      });

      handleCloseEdit();
      setActionSuccessMessage('Topic updated successfully');
      await fetchTopics();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update topic');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDelete = (topic: CourseCreatorTopic) => {
    setDeletingTopic(topic);
    setDeleteError(null);
  };

  const handleCloseDelete = () => {
    setDeletingTopic(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!accessToken || !courseId || !moduleId || !deletingTopic) return;

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await courseCreatorApi.deleteTopic(accessToken, courseId, moduleId, deletingTopic.id);
      handleCloseDelete();
      setActionSuccessMessage('Topic deleted successfully');
      await fetchTopics();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete topic');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reordering Handler (Accessible Move Up / Move Down)
  const handleMoveTopic = async (index: number, direction: 'up' | 'down') => {
    if (!accessToken || !courseId || !moduleId || isReordering) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    setReorderError(null);
    setIsReordering(true);

    // Optimistic reorder
    const updatedList = [...topics];
    const [movedItem] = updatedList.splice(index, 1);
    updatedList.splice(targetIndex, 0, movedItem);

    // Update order numbers sequentially
    const optimisticTopics = updatedList.map((t, idx) => ({
      ...t,
      order: idx,
    }));
    setTopics(optimisticTopics);

    try {
      // Must send the complete, ordered array of all topic IDs without duplicates or omissions
      const orderedIds = optimisticTopics.map((t) => t.id);
      const serverTopics = await courseCreatorApi.reorderTopics(
        accessToken,
        courseId,
        moduleId,
        orderedIds
      );
      const sorted = [...serverTopics].sort((a, b) => a.order - b.order);
      setTopics(sorted);
      if (onTopicCountChange) {
        onTopicCountChange(sorted.length);
      }
      setActionSuccessMessage('Topic order updated');
    } catch (err: any) {
      setReorderError(err?.message || 'Failed to reorder topics');
      // Revert optimistic reorder on failure
      await fetchTopics();
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="space-y-3.5 pt-2">
      {/* Topics Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
            Topics in {moduleTitle}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {topics.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 text-xs font-semibold rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Topic</span>
        </button>
      </div>

      {/* Action Success Alert Banner */}
      {actionSuccessMessage && (
        <div
          role="status"
          className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between transition-all"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="p-0.5 text-emerald-600 hover:text-emerald-800 rounded"
            aria-label="Dismiss message"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Reorder Error Banner */}
      {reorderError && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>{reorderError}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-6 bg-slate-50/50 border border-slate-100 rounded-lg flex items-center justify-center">
          <LoadingSpinner size="sm" label="Loading topics..." direction="row" />
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-2">
          <div className="flex items-center space-x-2 text-xs text-red-800 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Unable to load topics</span>
          </div>
          <p className="text-xs text-red-700">{error}</p>
          <button
            type="button"
            onClick={fetchTopics}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-red-800 bg-white border border-red-200 rounded hover:bg-red-50 shadow-2xs"
          >
            Retry Loading Topics
          </button>
        </div>
      ) : topics.length === 0 ? (
        /* Empty State */
        <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center space-y-2 bg-slate-50/40">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-700">No topics yet in this module</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Add individual topics to structure lesson concepts, code examples, and reading materials.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Topic</span>
          </button>
        </div>
      ) : (
        /* Topics List */
        <div className="space-y-2">
          {topics.map((topic, index) => {
            const isFirst = index === 0;
            const isLast = index === topics.length - 1;

            return (
              <div
                key={topic.id}
                className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                {/* Topic Info */}
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-700 shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-xs text-slate-900 truncate">
                        {topic.title}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-50 text-slate-500 border border-slate-200 shrink-0">
                        Order: {topic.order}
                      </span>
                    </div>

                    {topic.description ? (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {topic.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No description provided</p>
                    )}

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingContentTopic(topic)}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-md shadow-2xs transition-colors"
                        title="Open topic educational content editor"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Manage Content</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Topic Action Controls */}
                <div className="flex items-center space-x-1 self-end sm:self-start shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                  {/* Manage Content Button in Action Bar */}
                  <button
                    type="button"
                    onClick={() => setEditingContentTopic(topic)}
                    aria-label={`Manage educational content for topic "${topic.title}"`}
                    title="Manage content"
                    className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 rounded shadow-2xs transition-colors"
                  >
                    <BookOpen className="w-3 h-3 text-indigo-600" />
                    <span className="hidden sm:inline text-[11px]">Content</span>
                  </button>

                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveTopic(index, 'up')}
                    disabled={isFirst || isReordering}
                    aria-label={`Move topic "${topic.title}" up`}
                    title="Move up"
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveTopic(index, 'down')}
                    disabled={isLast || isReordering}
                    aria-label={`Move topic "${topic.title}" down`}
                    title="Move down"
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Topic */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(topic)}
                    aria-label={`Edit topic "${topic.title}"`}
                    title="Edit topic"
                    className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded shadow-2xs transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span className="hidden sm:inline text-[11px]">Edit</span>
                  </button>

                  {/* Delete Topic */}
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(topic)}
                    aria-label={`Delete topic "${topic.title}"`}
                    title="Delete topic"
                    className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded shadow-2xs transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                    <span className="hidden sm:inline text-[11px]">Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* Create Topic Modal */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-topic-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-lg max-w-lg w-full space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 id="create-topic-title" className="font-display font-bold text-base text-slate-900">
                    Add Topic
                  </h3>
                  <p className="text-[11px] text-slate-500">Module: {moduleTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCreate}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="create-topic-title-input" className="block text-xs font-semibold text-slate-700">
                  Topic Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-topic-title-input"
                  type="text"
                  value={createForm.title}
                  onChange={(e) => {
                    setCreateForm((prev) => ({ ...prev, title: e.target.value }));
                    if (createValidationErrors.title) {
                      setCreateValidationErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  placeholder="e.g., Variable Declarations & Scope Rules"
                  className={`w-full px-3.5 py-2 text-xs text-slate-900 bg-white border rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    createValidationErrors.title ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                  }`}
                  autoFocus
                />
                {createValidationErrors.title ? (
                  <p className="text-[11px] text-red-600 font-medium">{createValidationErrors.title}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Between 2 and 200 characters.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-topic-desc-input" className="block text-xs font-semibold text-slate-700">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="create-topic-desc-input"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => {
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }));
                    if (createValidationErrors.description) {
                      setCreateValidationErrors((prev) => ({ ...prev, description: '' }));
                    }
                  }}
                  placeholder="Brief summary of concepts addressed in this topic..."
                  className={`w-full px-3.5 py-2 text-xs text-slate-900 bg-white border rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    createValidationErrors.description ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                  }`}
                />
                {createValidationErrors.description ? (
                  <p className="text-[11px] text-red-600 font-medium">{createValidationErrors.description}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Max 2000 characters.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseCreate}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Topic</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Edit Topic Modal */}
      {/* ========================================================= */}
      {editingTopic && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-topic-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-lg max-w-lg w-full space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 id="edit-topic-title" className="font-display font-bold text-base text-slate-900">
                    Edit Topic
                  </h3>
                  <p className="text-[11px] text-slate-500">Module: {moduleTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-topic-title-input" className="block text-xs font-semibold text-slate-700">
                  Topic Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-topic-title-input"
                  type="text"
                  value={editForm.title}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, title: e.target.value }));
                    if (editValidationErrors.title) {
                      setEditValidationErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  className={`w-full px-3.5 py-2 text-xs text-slate-900 bg-white border rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    editValidationErrors.title ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                  }`}
                  autoFocus
                />
                {editValidationErrors.title && (
                  <p className="text-[11px] text-red-600 font-medium">{editValidationErrors.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-topic-desc-input" className="block text-xs font-semibold text-slate-700">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="edit-topic-desc-input"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, description: e.target.value }));
                    if (editValidationErrors.description) {
                      setEditValidationErrors((prev) => ({ ...prev, description: '' }));
                    }
                  }}
                  className={`w-full px-3.5 py-2 text-xs text-slate-900 bg-white border rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    editValidationErrors.description ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                  }`}
                />
                {editValidationErrors.description && (
                  <p className="text-[11px] text-red-600 font-medium">{editValidationErrors.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Delete Topic Confirmation Modal */}
      {/* ========================================================= */}
      {deletingTopic && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-topic-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-lg max-w-md w-full space-y-5 animate-in fade-in duration-150">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="delete-topic-title" className="font-display font-bold text-base text-slate-900">
                  Delete Topic
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{deletingTopic.title}"</span>?
                </p>
              </div>
            </div>

            {/* Cascade Notice */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="font-semibold flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Associated Content Deletion</span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                Deleting this topic will permanently remove it along with all associated educational content (explanations, sections, code examples, images, and notes) according to server cascade rules. This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Topic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Topic Educational Content Editor Modal */}
      {/* ========================================================= */}
      {editingContentTopic && (
        <CreatorTopicContentEditor
          courseId={courseId}
          courseTitle={courseTitle}
          moduleId={moduleId}
          moduleTitle={moduleTitle}
          topicId={editingContentTopic.id}
          topicTitle={editingContentTopic.title}
          onClose={() => setEditingContentTopic(null)}
          onSaved={() => {
            fetchTopics();
          }}
        />
      )}
    </div>
  );
};
