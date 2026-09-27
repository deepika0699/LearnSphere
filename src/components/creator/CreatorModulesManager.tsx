/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  CourseCreatorModule,
  CreateCourseCreatorModuleRequest,
  UpdateCourseCreatorModuleRequest,
} from '../../services/api';
import { LoadingSpinner } from '../LoadingSpinner';
import { FeedbackState } from '../FeedbackState';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  FolderPlus,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CreatorTopicsManager } from './CreatorTopicsManager';

interface CreatorModulesManagerProps {
  courseId: string;
  courseTitle?: string;
}

export const CreatorModulesManager: React.FC<CreatorModulesManagerProps> = ({
  courseId,
  courseTitle,
}) => {
  const { accessToken } = useApp();

  const [modules, setModules] = useState<CourseCreatorModule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Expansion & Topic Count per Module
  const [expandedModules, setExpandedModules] = useState<{ [moduleId: string]: boolean }>({});
  const [moduleTopicCounts, setModuleTopicCounts] = useState<{ [moduleId: string]: number }>({});

  // Create Module Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<CreateCourseCreatorModuleRequest>({
    title: '',
    description: '',
  });
  const [createValidationErrors, setCreateValidationErrors] = useState<{ [key: string]: string }>({});
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Module Modal State
  const [editingModule, setEditingModule] = useState<CourseCreatorModule | null>(null);
  const [editForm, setEditForm] = useState<UpdateCourseCreatorModuleRequest>({
    title: '',
    description: '',
  });
  const [editValidationErrors, setEditValidationErrors] = useState<{ [key: string]: string }>({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Module Modal State
  const [deletingModule, setDeletingModule] = useState<CourseCreatorModule | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reordering State
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!accessToken || !courseId) return;

    setError(null);
    try {
      const data = await courseCreatorApi.getModules(accessToken, courseId);
      // Ensure sorted by server order
      const sorted = [...data].sort((a, b) => a.order - b.order);
      setModules(sorted);
    } catch (err: any) {
      setError(err?.message || 'Failed to load course modules');
    } finally {
      setLoading(false);
    }
  }, [accessToken, courseId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

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
      errs.title = 'Module title is required';
    } else if (title.length < 2 || title.length > 150) {
      errs.title = 'Title must be between 2 and 150 characters';
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
      errs.title = 'Module title is required';
    } else if (title.length < 2 || title.length > 150) {
      errs.title = 'Title must be between 2 and 150 characters';
    }

    if (editForm.description && editForm.description.length > 2000) {
      errs.description = 'Description cannot exceed 2000 characters';
    }

    setEditValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handlers
  // Toggle module expansion (default open)
  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: prev[moduleId] !== undefined ? !prev[moduleId] : false,
    }));
  };

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
    if (!accessToken || !courseId) return;

    setCreateError(null);
    setIsCreating(true);

    try {
      await courseCreatorApi.createModule(accessToken, courseId, {
        title: createForm.title.trim(),
        description: createForm.description?.trim() || undefined,
      });

      handleCloseCreate();
      setActionSuccessMessage('Module created successfully');
      await fetchModules();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create module');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (mod: CourseCreatorModule) => {
    setEditingModule(mod);
    setEditForm({
      title: mod.title,
      description: mod.description || '',
    });
    setEditValidationErrors({});
    setEditError(null);
  };

  const handleCloseEdit = () => {
    setEditingModule(null);
    setEditError(null);
    setEditValidationErrors({});
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEdit()) return;
    if (!accessToken || !courseId || !editingModule) return;

    setEditError(null);
    setIsUpdating(true);

    try {
      await courseCreatorApi.updateModule(accessToken, courseId, editingModule.id, {
        title: editForm.title?.trim(),
        description: editForm.description?.trim() || undefined,
      });

      handleCloseEdit();
      setActionSuccessMessage('Module updated successfully');
      await fetchModules();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update module');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDelete = (mod: CourseCreatorModule) => {
    setDeletingModule(mod);
    setDeleteError(null);
  };

  const handleCloseDelete = () => {
    setDeletingModule(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!accessToken || !courseId || !deletingModule) return;

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await courseCreatorApi.deleteModule(accessToken, courseId, deletingModule.id);
      handleCloseDelete();
      setActionSuccessMessage('Module deleted successfully');
      await fetchModules();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete module');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reordering Handler (Accessible Move Up / Move Down)
  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    if (!accessToken || !courseId || isReordering) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    setReorderError(null);
    setIsReordering(true);

    // Optimistic reorder
    const updatedList = [...modules];
    const [movedItem] = updatedList.splice(index, 1);
    updatedList.splice(targetIndex, 0, movedItem);

    // Update order numbers sequentially
    const optimisticModules = updatedList.map((mod, idx) => ({
      ...mod,
      order: idx,
    }));
    setModules(optimisticModules);

    try {
      // Must send the complete, ordered array of all module IDs without duplicates or omissions
      const orderedIds = optimisticModules.map((m) => m.id);
      const serverModules = await courseCreatorApi.reorderModules(
        accessToken,
        courseId,
        orderedIds
      );
      setModules([...serverModules].sort((a, b) => a.order - b.order));
      setActionSuccessMessage('Module order updated');
    } catch (err: any) {
      setReorderError(err?.message || 'Failed to reorder modules');
      // Revert optimistic reorder on failure
      await fetchModules();
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-bold text-lg text-slate-900">
              Curriculum Modules
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {modules.length} {modules.length === 1 ? 'module' : 'modules'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Structure your course curriculum into sequential learning modules. Topics are authored within modules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Module</span>
        </button>
      </div>

      {/* Action Success Alert Banner */}
      {actionSuccessMessage && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between transition-all"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800 rounded"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Reorder Error Banner */}
      {reorderError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{reorderError}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
          <LoadingSpinner size="md" label="Loading curriculum modules..." direction="col" />
        </div>
      ) : error ? (
        /* Error State with Retry */
        <FeedbackState
          title="Unable to Load Modules"
          message={error}
          onRetry={fetchModules}
          retryLabel="Retry Loading Modules"
        />
      ) : modules.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-base text-slate-800">
              No Modules Yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              This course does not have any modules. Modules divide course material into structured sections.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Module</span>
            </button>
          </div>
        </div>
      ) : (
        /* Module List */
        <div className="space-y-3">
          {modules.map((mod, index) => {
            const isFirst = index === 0;
            const isLast = index === modules.length - 1;
            const isExpanded = expandedModules[mod.id] !== false; // Default open
            const topicCount = moduleTopicCounts[mod.id];

            return (
              <div
                key={mod.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between gap-4"
              >
                {/* Module Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Module Info & Order Badge */}
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0 mt-0.5">
                      {index + 1}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-sm text-slate-900 truncate">
                          {mod.title}
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          Order: {mod.order}
                        </span>
                      </div>

                      {mod.description ? (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {mod.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No description provided</p>
                      )}

                      <div className="pt-0.5 flex items-center space-x-4 text-[11px] text-slate-500">
                        <span className="flex items-center space-x-1 font-medium text-slate-600">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>
                            {topicCount !== undefined
                              ? `${topicCount} ${topicCount === 1 ? 'Topic' : 'Topics'}`
                              : 'Topics'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Module Action Controls */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                    {/* Expand/Collapse Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleModuleExpanded(mod.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} topics for module "${mod.title}"`}
                      title={isExpanded ? 'Collapse topics' : 'Expand topics'}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                    >
                      <span className="text-[11px]">{isExpanded ? 'Hide Topics' : 'View Topics'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => handleMoveModule(index, 'up')}
                      disabled={isFirst || isReordering}
                      aria-label={`Move module "${mod.title}" up`}
                      title="Move up"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => handleMoveModule(index, 'down')}
                      disabled={isLast || isReordering}
                      aria-label={`Move module "${mod.title}" down`}
                      title="Move down"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Edit Module */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(mod)}
                      aria-label={`Edit module "${mod.title}"`}
                      title="Edit module"
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* Delete Module */}
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(mod)}
                      aria-label={`Delete module "${mod.title}"`}
                      title="Delete module"
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg shadow-2xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Topics Section (Rendered when expanded) */}
                {isExpanded && (
                  <div className="mt-2 pt-3 border-t border-slate-100 bg-slate-50/60 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-xl">
                    <CreatorTopicsManager
                      courseId={courseId}
                      courseTitle={courseTitle}
                      moduleId={mod.id}
                      moduleTitle={mod.title}
                      onTopicCountChange={(count) => {
                        setModuleTopicCounts((prev) => ({ ...prev, [mod.id]: count }));
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* Create Module Modal */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-module-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-lg max-w-lg w-full space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 id="create-module-title" className="font-display font-bold text-base text-slate-900">
                  Create Module
                </h3>
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
                <label htmlFor="create-module-title-input" className="block text-xs font-semibold text-slate-700">
                  Module Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-module-title-input"
                  type="text"
                  value={createForm.title}
                  onChange={(e) => {
                    setCreateForm((prev) => ({ ...prev, title: e.target.value }));
                    if (createValidationErrors.title) {
                      setCreateValidationErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  placeholder="e.g., Fundamentals of High-Throughput Pipelines"
                  className={`w-full px-3.5 py-2 text-xs text-slate-900 bg-white border rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    createValidationErrors.title ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                  }`}
                  autoFocus
                />
                {createValidationErrors.title ? (
                  <p className="text-[11px] text-red-600 font-medium">{createValidationErrors.title}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Between 2 and 150 characters.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-module-desc-input" className="block text-xs font-semibold text-slate-700">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="create-module-desc-input"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => {
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }));
                    if (createValidationErrors.description) {
                      setCreateValidationErrors((prev) => ({ ...prev, description: '' }));
                    }
                  }}
                  placeholder="Summary of skills or concepts covered in this module..."
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
                      <span>Create Module</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Edit Module Modal */}
      {/* ========================================================= */}
      {editingModule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-module-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-lg max-w-lg w-full space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 id="edit-module-title" className="font-display font-bold text-base text-slate-900">
                  Edit Module
                </h3>
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
                <label htmlFor="edit-module-title-input" className="block text-xs font-semibold text-slate-700">
                  Module Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-module-title-input"
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
                <label htmlFor="edit-module-desc-input" className="block text-xs font-semibold text-slate-700">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="edit-module-desc-input"
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
      {/* Delete Module Confirmation Modal */}
      {/* ========================================================= */}
      {deletingModule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-module-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-lg max-w-md w-full space-y-5 animate-in fade-in duration-150">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="delete-module-title" className="font-display font-bold text-base text-slate-900">
                  Delete Module
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{deletingModule.title}"</span>?
                </p>
              </div>
            </div>

            {/* Cascade Notice */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="font-semibold flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Cascade Content Deletion</span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                Deleting this module will permanently remove it along with all associated topics and curriculum content according to server cascade rules. This action cannot be undone.
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
                    <span>Delete Module</span>
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
