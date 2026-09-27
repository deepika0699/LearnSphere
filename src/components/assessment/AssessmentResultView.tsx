/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  History,
  Code,
  Info,
} from 'lucide-react';
import {
  StudentAssessment,
  SafeStudentAttempt,
  StudentAssessmentResults,
} from '../../services/api';

interface AssessmentResultViewProps {
  assessment: StudentAssessment;
  attempt: SafeStudentAttempt;
  results: StudentAssessmentResults;
  onRetake?: () => void;
  canRetake: boolean;
  onViewHistory: () => void;
  onBackToCourse: () => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  assessment,
  attempt,
  results,
  onRetake,
  canRetake,
  onViewHistory,
  onBackToCourse,
}) => {
  const [showDetailedReview, setShowDetailedReview] = useState<boolean>(true);

  const isPassed = results.isPassed;
  const isTimedOut = results.status === 'timed_out';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back to Course Navigation */}
      <div>
        <button
          type="button"
          onClick={onBackToCourse}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          id="result-back-to-course-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Course Curriculum
        </button>
      </div>

      {/* Main Result Banner Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Banner Header */}
        <div
          className={`rounded-xl p-6 sm:p-8 text-center space-y-3 border ${
            isPassed
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto border shadow-2xs">
            {isPassed ? (
              <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : isTimedOut ? (
              <div className="w-full h-full rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-300">
                <Clock className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-red-100 flex items-center justify-center text-red-600 border border-red-300">
                <XCircle className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              {isPassed
                ? 'Assessment Passed!'
                : isTimedOut
                ? 'Time Expired — Final Score Recorded'
                : 'Assessment Not Passed'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              {isPassed
                ? `Congratulations! You scored ${results.score}%, exceeding the required passing score of ${results.passingScore}%.`
                : `You scored ${results.score}%. The required passing score is ${results.passingScore}%.`}
            </p>
          </div>

          {/* Quick Score Highlight */}
          <div className="pt-2">
            <span
              className={`inline-flex items-center px-4 py-1.5 rounded-lg text-lg font-mono font-bold border ${
                isPassed
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {results.score}% Final Score
            </span>
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Score Achieved</span>
            <p className="text-lg font-bold text-slate-900 font-mono">{results.score}%</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Passing Threshold</span>
            <p className="text-lg font-bold text-slate-900 font-mono">{results.passingScore}%</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Correct Answers</span>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {results.correctAnswersCount} / {results.totalQuestions}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Attempt Status</span>
            <p className="text-lg font-bold text-slate-900 capitalize font-mono">
              {results.status === 'completed' ? 'Completed' : 'Timed Out'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onViewHistory}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              id="result-view-history-btn"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Attempt History</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDetailedReview((prev) => !prev)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              id="result-toggle-review-btn"
            >
              <span>{showDetailedReview ? 'Hide Question Breakdown' : 'Show Question Breakdown'}</span>
              {showDetailedReview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {canRetake && onRetake && (
              <button
                type="button"
                onClick={onRetake}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                id="result-retake-btn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Assessment</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToCourse}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              id="result-return-btn"
            >
              <span>Continue Curriculum</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Finalized Review Breakdown */}
      {showDetailedReview && results.review && results.review.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
              Question-by-Question Review
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {results.correctAnswersCount} correct of {results.totalQuestions}
            </span>
          </div>

          <div className="space-y-4">
            {results.review.map((q, idx) => {
              const isCorrect = q.isCorrect;
              const hasAnswered = Boolean(q.selectedOptionId);

              return (
                <div
                  key={q.id || idx}
                  className={`bg-white border rounded-xl p-5 sm:p-6 shadow-2xs space-y-4 transition-all ${
                    isCorrect ? 'border-emerald-200' : 'border-slate-200'
                  }`}
                >
                  {/* Question Header & Correctness Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-slate-500">
                      <span>Question {idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>Order #{q.order + 1}</span>
                    </div>

                    <div className="shrink-0">
                      {isCorrect ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Correct</span>
                        </span>
                      ) : hasAnswered ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>Incorrect</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Unanswered</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed font-sans">
                    {q.prompt}
                  </p>

                  {/* Optional Monospace Code Snippet */}
                  {q.codeSnippet && q.codeSnippet.trim() !== '' && (
                    <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
                      <div className="flex items-center space-x-1 px-3 py-1 bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                        <Code className="w-3 h-3" />
                        <span>Code Reference</span>
                      </div>
                      <pre className="p-3 text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed select-text">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Answer Options List */}
                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isStudentSelected = q.selectedOptionId === opt.id;
                      const isCorrectOption = q.correctOptionId === opt.id;

                      let rowStyle = 'border-slate-200 bg-white text-slate-700';
                      let badgeText: string | null = null;
                      let badgeStyle = '';

                      if (isCorrectOption) {
                        rowStyle = 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-medium';
                        if (isStudentSelected) {
                          badgeText = 'Your Answer (Correct)';
                          badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        } else {
                          badgeText = 'Correct Answer';
                          badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        }
                      } else if (isStudentSelected && !isCorrectOption) {
                        rowStyle = 'border-red-300 bg-red-50/50 text-red-950 font-medium';
                        badgeText = 'Your Answer (Incorrect)';
                        badgeStyle = 'bg-red-100 text-red-800 border-red-300';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-start justify-between space-x-3 p-3 rounded-lg border text-xs sm:text-sm transition-colors ${rowStyle}`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold bg-white border border-slate-200 shrink-0 mt-0.5">
                              {letter}
                            </span>
                            <span className="leading-relaxed font-sans">{opt.text}</span>
                          </div>

                          {badgeText && (
                            <span
                              className={`shrink-0 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${badgeStyle}`}
                            >
                              {badgeText}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Callout */}
                  {q.explanation && q.explanation.trim() !== '' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1 text-xs sm:text-sm text-slate-700">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs">
                        <Info className="w-3.5 h-3.5 text-primary-600" />
                        <span>Explanation</span>
                      </div>
                      <p className="leading-relaxed font-sans text-slate-600 pl-5">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
