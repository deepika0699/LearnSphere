/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  studentNoteApi,
  StudentNoteColor,
} from '../../services/api';
import {
  StickyNote,
  X,
  Tag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

const COLOR_CONFIG: Record<
  StudentNoteColor,
  { label: string; dotClass: string; barClass: string }
> = {
  default: { label: 'Classic', dotClass: 'bg-slate-400', barClass: 'bg-slate-400' },
  amber: { label: 'Amber', dotClass: 'bg-amber-400', barClass: 'bg-amber-400' },
  emerald: { label: 'Emerald', dotClass: 'bg-emerald-400', barClass: 'bg-emerald-400' },
  sky: { label: 'Sky', dotClass: 'bg-sky-400', barClass: 'bg-sky-400' },
  indigo: { label: 'Indigo', dotClass: 'bg-indigo-400', barClass: 'bg-indigo-400' },
  rose: { label: 'Rose', dotClass: 'bg-rose-400', barClass: 'bg-rose-400' },
  purple: { label: 'Purple', dotClass: 'bg-purple-400', barClass: 'bg-purple-400' },
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

const ALLOWED_EDUCATIONAL_SELECTORS = [
  '#topic-title',
  '#topic-description',
  '#topic-explanation-section',
  '#topic-ordered-sections',
  '#topic-important-points-section',
  '#topic-code-examples-section',
];

interface FloatingPosition {
  top: number;
  left: number;
}

interface TopicHighlightNoteTriggerProps {
  courseId: string;
  moduleId: string | null;
  topicId: string;
  courseTitle?: string;
  moduleTitle?: string;
  topicTitle?: string;
  accessToken?: string | null;
  isStudent: boolean;
  contentContainerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Checks if a given DOM Node belongs to an allowed educational content section.
 * Explicitly rejects UI controls, buttons, copy actions, modals, and sidebar nodes.
 */
function isNodeInsideEducationalContent(node: Node | null): boolean {
  if (!node) return false;
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  if (!el) return false;

  // Strictly exclude non-content and interactive control areas
  if (
    el.closest('button') ||
    el.closest('[data-highlight-trigger]') ||
    el.closest('[role="dialog"]') ||
    el.closest('#topic-video-section') ||
    el.closest('#toggle-topic-completion-btn') ||
    el.closest('#topic-quiz-prompt-card') ||
    el.closest('#topic-bottom-navigation') ||
    el.closest('#curriculum-sidebar-panel')
  ) {
    return false;
  }

  // Must match at least one of the audited educational sections
  return ALLOWED_EDUCATIONAL_SELECTORS.some((sel) => Boolean(el.closest(sel)));
}

export const TopicHighlightNoteTrigger: React.FC<TopicHighlightNoteTriggerProps> = ({
  courseId,
  moduleId,
  topicId,
  courseTitle = '',
  moduleTitle = '',
  topicTitle = '',
  accessToken,
  isStudent,
  contentContainerRef,
}) => {
  // Floating Action Button State
  const [floatingPos, setFloatingPos] = useState<FloatingPosition | null>(null);
  const [pendingText, setPendingText] = useState<string>('');
  const [isTooLong, setIsTooLong] = useState<boolean>(false);

  // Note Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [capturedText, setCapturedText] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteCommentary, setNoteCommentary] = useState<string>('');
  const [noteTags, setNoteTags] = useState<string>('');
  const [noteColor, setNoteColor] = useState<StudentNoteColor>('default');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // References to manage event cleanup and debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const floatingButtonRef = useRef<HTMLDivElement | null>(null);
  const commentaryInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Clear state when switching topics
  useEffect(() => {
    setFloatingPos(null);
    setPendingText('');
    setIsComposerOpen(false);
    setCapturedText('');
    setSaveError(null);
    setSaveSuccess(false);
  }, [topicId]);

  // Evaluate current text selection
  const checkSelection = useCallback(() => {
    if (!isStudent || !accessToken) {
      setFloatingPos(null);
      return;
    }

    if (isComposerOpen) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setFloatingPos(null);
      setPendingText('');
      setIsTooLong(false);
      return;
    }

    const rawText = selection.toString();
    const trimmed = rawText.trim();

    // Minimum meaningful selection length
    if (trimmed.length < 2) {
      setFloatingPos(null);
      setPendingText('');
      setIsTooLong(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const endNode = range.endContainer;

    // Both start and end of selection must originate within educational content
    if (!isNodeInsideEducationalContent(startNode) || !isNodeInsideEducationalContent(endNode)) {
      setFloatingPos(null);
      setPendingText('');
      setIsTooLong(false);
      return;
    }

    // Phase 10A enforces max 5,000 characters
    if (trimmed.length > 5000) {
      setIsTooLong(true);
    } else {
      setIsTooLong(false);
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setFloatingPos(null);
      return;
    }

    // Calculate position relative to document viewport + scroll
    const stickyHeaderOffset = 70; // 64px header + 6px breathing room
    let top = rect.top + window.scrollY - 42;
    let left = rect.left + window.scrollX + rect.width / 2;

    // If selection is too close to top sticky header, flip below selection
    if (rect.top < stickyHeaderOffset + 40) {
      top = rect.bottom + window.scrollY + 8;
    }

    // Constrain horizontal bounds
    const minLeft = 85;
    const maxLeft = window.innerWidth - 85;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    setPendingText(trimmed);
    setFloatingPos({ top, left });
  }, [isStudent, accessToken, isComposerOpen]);

  // Debounced listener on selection changes and pointer releases
  useEffect(() => {
    if (!isStudent || !accessToken) return;

    const handlePointerOrKeyUp = (e: MouseEvent | TouchEvent | KeyboardEvent) => {
      // Do not close trigger if clicking on the floating trigger itself
      if (
        floatingButtonRef.current &&
        e.target instanceof Node &&
        floatingButtonRef.current.contains(e.target)
      ) {
        return;
      }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        checkSelection();
      }, 80);
    };

    const handleSelectionChange = () => {
      if (isComposerOpen) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          setFloatingPos(null);
          setPendingText('');
          setIsTooLong(false);
        }
      }, 150);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFloatingPos(null);
        setPendingText('');
        if (isComposerOpen) {
          setIsComposerOpen(false);
        }
      }
    };

    document.addEventListener('mouseup', handlePointerOrKeyUp);
    document.addEventListener('touchend', handlePointerOrKeyUp);
    document.addEventListener('keyup', handlePointerOrKeyUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      document.removeEventListener('mouseup', handlePointerOrKeyUp);
      document.removeEventListener('touchend', handlePointerOrKeyUp);
      document.removeEventListener('keyup', handlePointerOrKeyUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStudent, accessToken, isComposerOpen, checkSelection]);

  // Handle "Add to Notes" trigger click
  const handleOpenComposer = () => {
    if (isTooLong) return;
    setCapturedText(pendingText);
    setNoteTitle('');
    setNoteCommentary('');
    setNoteTags('');
    setNoteColor('default');
    setSaveError(null);
    setSaveSuccess(false);

    // Close floating trigger and open composer
    setFloatingPos(null);
    setIsComposerOpen(true);

    // Auto-focus commentary textarea after render
    setTimeout(() => {
      commentaryInputRef.current?.focus();
    }, 100);
  };

  // Submit highlight note creation
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !courseId || !topicId || !capturedText) return;

    if (!moduleId) {
      setSaveError('Could not verify course module structure. Please refresh and try again.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const parsedTags = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 10);

    try {
      await studentNoteApi.createNote(
        {
          noteType: 'highlight',
          selectedText: capturedText,
          content: noteCommentary.trim() || undefined,
          title: noteTitle.trim() || undefined,
          courseId,
          moduleId,
          topicId,
          tags: parsedTags,
          color: noteColor,
        },
        accessToken
      );

      setSaveSuccess(true);
      setTimeout(() => {
        setIsComposerOpen(false);
        setSaveSuccess(false);
        setCapturedText('');
      }, 700);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save highlight note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isStudent) return null;

  return (
    <>
      {/* ===================================================================== */}
      {/* Floating "Add to Notes" Contextual Trigger Bubble */}
      {/* ===================================================================== */}
      {floatingPos && (
        <div
          ref={floatingButtonRef}
          data-highlight-trigger="true"
          style={{
            position: 'absolute',
            top: `${floatingPos.top}px`,
            left: `${floatingPos.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-40 animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          {isTooLong ? (
            <div className="bg-slate-900 text-rose-300 text-xs px-3 py-1.5 rounded-lg shadow-lg border border-slate-700 flex items-center gap-1.5 whitespace-nowrap">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Selection exceeds 5,000 characters</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenComposer}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg border border-slate-700/80 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 hover:scale-105"
              aria-label="Add highlighted text to notes"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-400" />
              <span>Add to Notes</span>
            </button>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* Highlight Note Composer Modal Dialog */}
      {/* ===================================================================== */}
      {isComposerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="highlight-composer-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 id="highlight-composer-title" className="text-base font-bold font-display text-slate-900">
                  Save Highlight to Notes
                </h3>
                <nav
                  aria-label="Course hierarchy breadcrumb"
                  className="text-[11px] font-medium text-slate-500 flex flex-wrap items-center gap-1"
                >
                  <span className="text-slate-800 font-semibold">{courseTitle}</span>
                  <span aria-hidden="true" className="text-slate-300">/</span>
                  <span>{moduleTitle}</span>
                  <span aria-hidden="true" className="text-slate-300">/</span>
                  <span className="text-slate-600">{topicTitle}</span>
                </nav>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close composer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Read-Only Selected Text Quote Block (Strict Plain Text) */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Captured Passage (Read-Only)
              </span>
              <blockquote className="max-h-36 overflow-y-auto pl-3 pr-2 py-2 border-l-2 border-amber-500 bg-amber-50/40 rounded-r-md text-xs text-slate-700 italic font-serif leading-relaxed whitespace-pre-wrap select-text">
                &ldquo;{capturedText}&rdquo;
              </blockquote>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              {/* Note Title (Optional) */}
              <div>
                <label htmlFor="highlight-note-title" className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Title <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="highlight-note-title"
                  type="text"
                  maxLength={200}
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={`Takeaway on ${topicTitle || 'Topic'}`}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Personal Commentary / Explanation */}
              <div>
                <label htmlFor="highlight-note-commentary" className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Commentary & Takeaway <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="highlight-note-commentary"
                  ref={commentaryInputRef}
                  rows={3}
                  maxLength={10000}
                  value={noteCommentary}
                  onChange={(e) => setNoteCommentary(e.target.value)}
                  placeholder="Why is this concept important? How will you apply this during revision?"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-y"
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="highlight-note-tags" className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Tags <span className="text-slate-400 font-normal">(comma-separated, optional)</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    id="highlight-note-tags"
                    type="text"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    placeholder="e.g. revision, exam-prep, formulas"
                    className="w-full pl-8.5 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Color Accent Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Color Accent
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNoteColor(c)}
                      className={`w-5 h-5 rounded-full ${
                        COLOR_CONFIG[c].dotClass
                      } transition-transform flex items-center justify-center ${
                        noteColor === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={COLOR_CONFIG[c].label}
                      aria-label={`Select ${COLOR_CONFIG[c].label} accent`}
                    />
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || saveSuccess}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving to Notes...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Saved!</span>
                    </>
                  ) : (
                    <>
                      <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                      <span>Save to My Notes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TopicHighlightNoteTrigger;
