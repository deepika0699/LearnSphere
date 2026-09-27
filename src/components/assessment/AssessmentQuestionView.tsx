/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  X,
  Code,
  CheckCircle2,
} from 'lucide-react';
import {
  StudentAssessment,
  SafeStudentAttempt,
} from '../../services/api';

interface AssessmentQuestionViewProps {
  assessment: StudentAssessment;
  attempt: SafeStudentAttempt;
  answers: Record<string, string>; // questionId -> selectedOptionId
  onSelectAnswer: (questionId: string, optionId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onTimeExpired: () => void;
  onCancelAttempt?: () => void;
  error?: string | null;
}

export const AssessmentQuestionView: React.FC<AssessmentQuestionViewProps> = ({
  assessment,
  attempt,
  answers,
  onSelectAnswer,
  onSubmit,
  isSubmitting,
  onTimeExpired,
  onCancelAttempt,
  error,
}) => {
  const questions = useMemo(() => assessment.questions || [], [assessment.questions]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Server-Authoritative Timer Enforcement
  // ---------------------------------------------------------------------------
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(() => {
    if (!attempt.expiresAt) return null;
    const deadline = new Date(attempt.expiresAt).getTime();
    return Math.max(0, deadline - Date.now());
  });

  const hasExpiredRef = useRef<boolean>(false);
  const onTimeExpiredRef = useRef(onTimeExpired);
  onTimeExpiredRef.current = onTimeExpired;

  useEffect(() => {
    if (!attempt.expiresAt) {
      return;
    }

    const calculateRemaining = () => {
      const deadline = new Date(attempt.expiresAt!).getTime();
      const remaining = Math.max(0, deadline - Date.now());
      setTimeRemainingMs(remaining);

      if (remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        setShowConfirmModal(false);
        onTimeExpiredRef.current();
      }
    };

    calculateRemaining();
    const intervalId = setInterval(calculateRemaining, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [attempt.expiresAt]);

  // Format time remaining MM:SS or HH:MM:SS
  const formattedTime = useMemo(() => {
    if (timeRemainingMs === null) return null;
    const totalSeconds = Math.floor(timeRemainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, [timeRemainingMs]);

  // Warning thresholds
  const isNearlyFinished = timeRemainingMs !== null && timeRemainingMs <= 300000; // 5 mins
  const isCriticalTime = timeRemainingMs !== null && timeRemainingMs <= 60000; // 1 min

  // Metrics on questions
  const totalQuestions = questions.length;
  const answeredCount = useMemo(() => {
    return questions.filter((q) => Boolean(answers[q.id])).length;
  }, [questions, answers]);
  const unansweredCount = totalQuestions - answeredCount;

  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  };

  // Keyboard navigation for previous/next questions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showConfirmModal) return;
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === 'ArrowRight') {
        if (currentIndex < totalQuestions - 1) {
          e.preventDefault();
          setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          e.preventDefault();
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions, showConfirmModal]);

  // Dismiss modal if an error occurs so error message is immediately visible
  useEffect(() => {
    if (error) {
      setShowConfirmModal(false);
    }
  }, [error]);

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">No Questions Available</h2>
        <p className="text-xs text-slate-500">This assessment does not contain any published questions yet.</p>
      </div>
    );
  }

  const selectedOptionId = answers[currentQuestion.id] || null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Header & Sticky Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Title & Progress Metadata */}
        <div className="space-y-1 w-full sm:w-auto text-left">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <span>Attempt #{attempt.attemptNumber}</span>
            <span aria-hidden="true">·</span>
            <span>
              {answeredCount} of {totalQuestions} Answered
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-md">
            {assessment.title}
          </h1>
        </div>

        {/* Timer & Submit Action */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          {formattedTime !== null ? (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors ${
                isCriticalTime
                  ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                  : isNearlyFinished
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              id="assessment-timer-display"
              title="Authoritative server timer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedTime}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Untimed</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            id="assessment-review-submit-top-btn"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Finish & Submit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Submission Error</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Question Palette / Navigator Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>Question Navigation</span>
          <span className="font-mono">
            {answeredCount}/{totalQuestions} Complete
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(answers[q.id]);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleJumpToQuestion(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900 ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-2xs ring-2 ring-slate-900 ring-offset-2'
                    : isAnswered
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={`Question ${idx + 1}${isAnswered ? ' (Answered)' : ' (Unanswered)'}`}
                id={`question-palette-btn-${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Question Counter & Prompt */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            {selectedOptionId ? (
              <span className="text-emerald-600 flex items-center gap-1 font-sans capitalize">
                <CheckCircle2 className="w-3.5 h-3.5" /> Answered
              </span>
            ) : (
              <span className="text-slate-400 font-sans capitalize">Unanswered</span>
            )}
          </div>

          <h2 id="question-prompt" className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-sans">
            {currentQuestion.prompt}
          </h2>

          {/* Optional Code Snippet (Safely rendered as text in monospace block) */}
          {currentQuestion.codeSnippet && currentQuestion.codeSnippet.trim() !== '' && (
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Code className="w-3 h-3" /> Code Reference
                </span>
              </div>
              <pre className="p-4 text-xs sm:text-sm font-mono text-slate-100 overflow-x-auto select-text leading-relaxed">
                <code>{currentQuestion.codeSnippet}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Options Selection (Accessible Radio Group) */}
        <div className="space-y-3 pt-2" role="radiogroup" aria-labelledby="question-prompt">
          {(currentQuestion.options || []).map((option, optIdx) => {
            const isSelected = selectedOptionId === option.id;
            const letter = String.fromCharCode(65 + optIdx); // A, B, C, D...

            return (
              <label
                key={option.id}
                htmlFor={`option-${currentQuestion.id}-${option.id}`}
                className={`flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50/80 shadow-2xs ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                {/* Radio Input */}
                <input
                  type="radio"
                  id={`option-${currentQuestion.id}-${option.id}`}
                  name={`question-${currentQuestion.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onSelectAnswer(currentQuestion.id, option.id)}
                  className="mt-0.5 w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                />

                {/* Option Letter Indicator */}
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                    isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {letter}
                </span>

                {/* Option Text */}
                <span className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans pt-0.5">
                  {option.text}
                </span>
              </label>
            );
          })}
        </div>

        {/* Navigation Actions Bottom Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            id="question-prev-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                id="question-next-btn"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                id="question-finish-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Review & Submit</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation & Submission Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 id="confirm-modal-title" className="text-base font-bold text-slate-900">
                Confirm Submission
              </h2>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <p>
                Are you ready to submit your assessment? Once submitted, your answers cannot be edited and your final score will be calculated by the server.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Questions:</span>
                  <span className="font-bold text-slate-800">{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Questions Answered:</span>
                  <span className="font-bold text-emerald-700">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unanswered Questions:</span>
                  <span className={`font-bold ${unansweredCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {unansweredCount}
                  </span>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    You have <strong>{unansweredCount}</strong> unanswered question(s). Unanswered questions will be scored as 0.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Return to Questions
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                id="confirm-submit-action-btn"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Grading Assessment...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Now</span>
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
