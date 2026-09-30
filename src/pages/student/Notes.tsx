/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FeedbackState } from '../../components/FeedbackState';
import { EmptyState } from '../../components/EmptyState';
import {
  studentNoteApi,
  StudentNote,
  StudentNoteType,
  StudentNoteColor,
  StudentNotesStats,
  StudentNotesPagination,
  courseApi,
  PublicCourse,
} from '../../services/api';
import {
  StickyNote,
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Filter,
} from 'lucide-react';

const COLOR_CONFIG: Record<
  StudentNoteColor,
  { label: string; dotClass: string; barClass: string; bgClass: string }
> = {
  default: {
    label: 'Classic',
    dotClass: 'bg-slate-400',
    barClass: 'bg-slate-400',
    bgClass: 'bg-white',
  },
  amber: {
    label: 'Amber',
    dotClass: 'bg-amber-400',
    barClass: 'bg-amber-400',
    bgClass: 'bg-white',
  },
  emerald: {
    label: 'Emerald',
    dotClass: 'bg-emerald-400',
    barClass: 'bg-emerald-400',
    bgClass: 'bg-white',
  },
  sky: {
    label: 'Sky',
    dotClass: 'bg-sky-400',
    barClass: 'bg-sky-400',
    bgClass: 'bg-white',
  },
  indigo: {
    label: 'Indigo',
    dotClass: 'bg-indigo-400',
    barClass: 'bg-indigo-400',
    bgClass: 'bg-white',
  },
  rose: {
    label: 'Rose',
    dotClass: 'bg-rose-400',
    barClass: 'bg-rose-400',
    bgClass: 'bg-white',
  },
  purple: {
    label: 'Purple',
    dotClass: 'bg-purple-400',
    barClass: 'bg-purple-400',
    bgClass: 'bg-white',
  },
};

const COLOR_OPTIONS: StudentNoteColor[] = [
  'default',
  'amber',
  'emerald',
  'sky',
  'indigo',
  'rose',
  'purple',
];

function formatDate(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export const Notes: React.FC = () => {
  useDocumentTitle('My Notes — LearnSphere');
  const { accessToken } = useApp();

  // Data states
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [stats, setStats] = useState<StudentNotesStats | null>(null);
  const [pagination, setPagination] = useState<StudentNotesPagination>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [courses, setCourses] = useState<PublicCourse[]>([]);

  // Filter & Search states
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedNoteType, setSelectedNoteType] = useState<StudentNoteType | 'all'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<
    'newest' | 'oldest' | 'updated' | 'title_asc' | 'title_desc'
  >('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Status states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<StudentNote | null>(null);

  // Form states for Create Modal
  const [createTitle, setCreateTitle] = useState<string>('');
  const [createContent, setCreateContent] = useState<string>('');
  const [createTags, setCreateTags] = useState<string>('');
  const [createColor, setCreateColor] = useState<StudentNoteColor>('default');
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states for Edit Modal
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [editColor, setEditColor] = useState<StudentNoteColor>('default');
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Guard refs
  const isMountedRef = useRef<boolean>(true);
  const activeReqIdRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Debounce search keyword input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Load courses once for the course filter dropdown
  useEffect(() => {
    let mounted = true;
    async function loadCourseOptions() {
      try {
        const res = await courseApi.getCourses({ limit: 50 });
        if (mounted && res?.courses) {
          setCourses(res.courses);
        }
      } catch {
        // Non-blocking: course options are an enhancement
      }
    }
    loadCourseOptions();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch stats and notes from server
  const fetchNotesAndStats = useCallback(
    async (isManualRefresh = false) => {
      if (!accessToken) return;

      const reqId = ++activeReqIdRef.current;
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [notesRes, statsRes] = await Promise.all([
          studentNoteApi.getNotes(
            {
              page: currentPage,
              limit: 12,
              search: debouncedSearch.trim() || undefined,
              noteType: selectedNoteType === 'all' ? undefined : selectedNoteType,
              courseId: selectedCourseId === 'all' ? undefined : selectedCourseId,
              sort: selectedSort,
            },
            accessToken
          ),
          studentNoteApi.getNotesStats(accessToken),
        ]);

        if (isMountedRef.current && reqId === activeReqIdRef.current) {
          setNotes(notesRes.notes);
          setPagination(notesRes.pagination);
          setStats(statsRes);
        }
      } catch (err: any) {
        if (isMountedRef.current && reqId === activeReqIdRef.current) {
          setError(err?.message || 'Failed to load notes. Please check your connection.');
        }
      } finally {
        if (isMountedRef.current && reqId === activeReqIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [accessToken, currentPage, debouncedSearch, selectedNoteType, selectedCourseId, selectedSort]
  );

  useEffect(() => {
    fetchNotesAndStats();
  }, [fetchNotesAndStats]);

  // Reset page when filters change
  const handleTypeFilterChange = (type: StudentNoteType | 'all') => {
    setSelectedNoteType(type);
    setCurrentPage(1);
  };

  const handleCourseFilterChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentPage(1);
  };

  const handleSortChange = (
    sort: 'newest' | 'oldest' | 'updated' | 'title_asc' | 'title_desc'
  ) => {
    setSelectedSort(sort);
    setCurrentPage(1);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setCreateTitle('');
    setCreateContent('');
    setCreateTags('');
    setCreateColor('default');
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  // Submit Create Standalone Note
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!createTitle.trim() && !createContent.trim()) {
      setCreateError('Please enter either a title or note content.');
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    const parsedTags = createTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 10);

    try {
      await studentNoteApi.createNote(
        {
          noteType: 'standalone',
          title: createTitle.trim(),
          content: createContent.trim(),
          tags: parsedTags,
          color: createColor,
        },
        accessToken
      );

      setIsCreateModalOpen(false);
      // Refresh list to display newly created note
      await fetchNotesAndStats(true);
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create note. Please try again.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (note: StudentNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setEditColor(note.color);
    setEditError(null);
  };

  // Submit Edit Note
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !editingNote) return;

    if (
      editingNote.noteType === 'standalone' &&
      !editTitle.trim() &&
      !editContent.trim()
    ) {
      setEditError('Standalone note must retain either a title or content.');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 10);

    try {
      const updated = await studentNoteApi.updateNote(
        editingNote.id,
        {
          title: editTitle.trim(),
          content: editContent.trim(),
          tags: parsedTags,
          color: editColor,
        },
        accessToken
      );

      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setEditingNote(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update note. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Confirm Delete Note
  const handleDeleteConfirm = async () => {
    if (!accessToken || !deletingNote) return;

    try {
      await studentNoteApi.deleteNote(deletingNote.id, accessToken);
      setDeletingNote(null);
      // Synchronize with server after deletion
      await fetchNotesAndStats(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete note.');
      setDeletingNote(null);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedNoteType('all');
    setSelectedCourseId('all');
    setSelectedSort('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 ||
    selectedNoteType !== 'all' ||
    selectedCourseId !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-1">
              <span>Student Workspace</span>
              <span aria-hidden="true">·</span>
              <span>Notebook & Revision</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900">
              My Notes
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Personal study notes, bookmarked takeaways, and highlighted course insights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchNotesAndStats(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 transition-all shadow-2xs disabled:opacity-60"
              title="Refresh notes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note</span>
            </button>
          </div>
        </div>

        {/* Quiet, Unboxed Metric Row (Anti-Slop Discipline) */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Notes
              </span>
              <p className="text-xl font-bold font-display text-slate-900">
                {stats.totalNotes}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Standalone Notes
              </span>
              <p className="text-xl font-bold font-display text-slate-700">
                {stats.standaloneNotes}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Course Highlights
              </span>
              <p className="text-xl font-bold font-display text-amber-700">
                {stats.highlightNotes}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Courses Referenced
              </span>
              <p className="text-xl font-bold font-display text-primary-700">
                {stats.coursesWithNotesCount}
              </p>
            </div>
          </div>
        )}

        {/* Filter, Search & Segmented Controls Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Search notes, quotes, topics, or tags..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-sm"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Type Controls (Functional Filter Buttons) */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleTypeFilterChange('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  selectedNoteType === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Notes
              </button>
              <button
                type="button"
                onClick={() => handleTypeFilterChange('standalone')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  selectedNoteType === 'standalone'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standalone
              </button>
              <button
                type="button"
                onClick={() => handleTypeFilterChange('highlight')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  selectedNoteType === 'highlight'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Course Highlights
              </button>
            </div>
          </div>

          {/* Secondary Filters: Course Filter & Sort Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Course Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Course:</span>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseFilterChange(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all text-xs"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Sort:</span>
                <select
                  value={selectedSort}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all text-xs"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="updated">Recently Updated</option>
                  <option value="title_asc">Title A–Z</option>
                  <option value="title_desc">Title Z–A</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Section: Loading, Error, Empty, or Cards Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" label="Loading your notes..." direction="col" />
          </div>
        ) : error ? (
          <div className="py-12">
            <FeedbackState
              title="Unable to load notes"
              message={error}
              onRetry={() => fetchNotesAndStats()}
              retryLabel="Reload Notes"
            />
          </div>
        ) : notes.length === 0 ? (
          <div className="py-12">
            {hasActiveFilters ? (
              <EmptyState
                icon={Search}
                title="No notes match your filters"
                description="Try clearing your search query or switching to 'All Notes' to see your complete notebook."
                action={{
                  label: 'Clear Filters',
                  onClick: handleClearFilters,
                }}
              />
            ) : (
              <EmptyState
                icon={StickyNote}
                title="Your notebook is empty"
                description="Create a standalone note to jot down thoughts, or highlight key concepts directly inside courses to build your revision library."
                action={{
                  label: 'Create Your First Note',
                  onClick: openCreateModal,
                }}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {notes.map((note) => {
                const colorMeta = COLOR_CONFIG[note.color] || COLOR_CONFIG.default;
                const isHighlight = note.noteType === 'highlight';

                return (
                  <article
                    key={note.id}
                    className={`relative flex flex-col bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:shadow-sm transition-all overflow-hidden ${colorMeta.bgClass}`}
                  >
                    {/* Top Color Accent Strip */}
                    <div className={`h-1.5 w-full ${colorMeta.barClass}`} />

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Top Meta & Breadcrumb (for Highlight Note) */}
                      <div className="space-y-2">
                        {isHighlight && (
                          <div className="space-y-1">
                            {/* Breadcrumb (Course -> Module -> Topic) */}
                            <nav
                              aria-label="Note source hierarchy"
                              className="text-[11px] font-medium text-slate-500 flex flex-wrap items-center gap-1.5 leading-snug"
                            >
                              <span className="text-slate-800 font-semibold truncate max-w-[140px]">
                                {note.courseTitle || 'Course'}
                              </span>
                              <span aria-hidden="true" className="text-slate-300">
                                /
                              </span>
                              <span className="truncate max-w-[120px]">
                                {note.moduleTitle || 'Module'}
                              </span>
                              <span aria-hidden="true" className="text-slate-300">
                                /
                              </span>
                              <span className="text-slate-600 truncate max-w-[140px]">
                                {note.topicTitle || 'Topic'}
                              </span>
                            </nav>
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="text-base font-bold font-display text-slate-900 tracking-tight leading-snug">
                          {note.title || (isHighlight ? 'Course Highlight' : 'Personal Note')}
                        </h2>

                        {/* Highlighted Quote Box (Strict plain text rendering) */}
                        {isHighlight && note.selectedText && (
                          <blockquote className="my-2 pl-3 py-1.5 border-l-2 border-amber-500 bg-amber-50/40 rounded-r-md">
                            <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-wrap select-text font-serif">
                              &ldquo;{note.selectedText}&rdquo;
                            </p>
                          </blockquote>
                        )}

                        {/* Student's Personal Content / Commentary */}
                        {note.content && (
                          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">
                            {note.content}
                          </div>
                        )}

                        {/* Tags */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {note.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-100/80 px-2 py-0.5 rounded-sm"
                              >
                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                <span>{tag}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Timestamps & Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(note.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* "Go to Source" Action for Highlight Notes */}
                          {isHighlight && note.courseId && note.topicId && (
                            <Link
                              to={`/courses/${note.courseId}/learn/${note.topicId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800 bg-primary-50/70 hover:bg-primary-100/70 rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 mr-1"
                              title="Navigate back to course topic"
                            >
                              <span>View in Course</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(note)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                            aria-label={`Edit note: ${note.title}`}
                            title="Edit Note"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingNote(note)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                            aria-label={`Delete note: ${note.title}`}
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <p className="text-xs text-slate-500">
                  Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
                  <span className="font-semibold text-slate-800">{pagination.totalPages}</span>{' '}
                  ({pagination.total} total notes)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage >= pagination.totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
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

      {/* ========================================================================= */}
      {/* Create Standalone Note Modal */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-note-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 id="create-note-title" className="text-base font-bold font-display text-slate-900">
                  New Personal Note
                </h3>
                <p className="text-xs text-slate-500">
                  Capture thoughts, revision summaries, or personal study plans.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="create-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Title (optional)
                </label>
                <input
                  id="create-title-input"
                  type="text"
                  maxLength={200}
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Key Takeaways on Concurrency"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="create-content-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Content
                </label>
                <textarea
                  id="create-content-input"
                  rows={5}
                  maxLength={10000}
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  placeholder="Type your notes, code snippets, or thoughts here..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-y"
                />
              </div>

              <div>
                <label htmlFor="create-tags-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags (comma separated, optional)
                </label>
                <input
                  id="create-tags-input"
                  type="text"
                  value={createTags}
                  onChange={(e) => setCreateTags(e.target.value)}
                  placeholder="e.g. revision, algorithms, exam"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Color Accent
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCreateColor(c)}
                      className={`w-6 h-6 rounded-full ${
                        COLOR_CONFIG[c].dotClass
                      } transition-transform flex items-center justify-center ${
                        createColor === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={COLOR_CONFIG[c].label}
                      aria-label={`Select ${COLOR_CONFIG[c].label} color`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60"
                >
                  {createSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Note</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Edit Note Modal */}
      {/* ========================================================================= */}
      {editingNote && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-note-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 id="edit-note-title" className="text-base font-bold font-display text-slate-900">
                  Edit {editingNote.noteType === 'highlight' ? 'Course Highlight Note' : 'Personal Note'}
                </h3>
                <p className="text-xs text-slate-500">
                  Update your title, commentary, tags, or accent color.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Source Provenance for Highlight Notes (Strictly Immutable) */}
            {editingNote.noteType === 'highlight' && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Source Reference (Immutable)
                  </span>
                  <span>{editingNote.courseTitle}</span>
                </div>
                {editingNote.selectedText && (
                  <blockquote className="pl-2 border-l-2 border-amber-400 text-slate-600 italic">
                    &ldquo;{editingNote.selectedText}&rdquo;
                  </blockquote>
                )}
              </div>
            )}

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  id="edit-title-input"
                  type="text"
                  maxLength={200}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="edit-content-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingNote.noteType === 'highlight' ? 'Personal Explanation / Commentary' : 'Note Content'}
                </label>
                <textarea
                  id="edit-content-input"
                  rows={5}
                  maxLength={10000}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-y"
                />
              </div>

              <div>
                <label htmlFor="edit-tags-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  id="edit-tags-input"
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Color Accent
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-6 h-6 rounded-full ${
                        COLOR_CONFIG[c].dotClass
                      } transition-transform flex items-center justify-center ${
                        editColor === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={COLOR_CONFIG[c].label}
                      aria-label={`Select ${COLOR_CONFIG[c].label} color`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60"
                >
                  {editSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
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

      {/* ========================================================================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {deletingNote && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-note-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 id="delete-note-title" className="text-base font-bold font-display text-slate-900">
                Delete Note?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-800">&ldquo;{deletingNote.title || 'this note'}&rdquo;</span>? This action cannot be undone.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
