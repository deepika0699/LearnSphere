/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Play,
  History,
  AlertCircle,
  HelpCircle,
  Award,
  Layers,
} from 'lucide-react';
import {
  StudentAssessment,
  StudentAssessmentAttemptOverview,
} from '../../services/api';

interface AssessmentOverviewProps {
  assessment: StudentAssessment;
  attemptOverview: StudentAssessmentAttemptOverview;
  onStartAttempt: () => void;
  isStarting: boolean;
  onViewHistory: () => void;
  error?: string | null;
}

export const AssessmentOverview: React.FC<AssessmentOverviewProps> = ({
  assessment,
  attemptOverview,
  onStartAttempt,
  isStarting,
  onViewHistory,
  error,
}) => {
  const isTimed = assessment.timeLimitMinutes > 0;
  const hasActive = attemptOverview.hasActiveAttempt;
  const isMaxReached = attemptOverview.isMaxAttemptsReached;
  const hasHistory = attemptOverview.pastAttemptsCount > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back to Course Link */}
      <div>
        <Link
          to={`/courses/${assessment.courseId}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          id="assessment-back-to-course-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Course Curriculum
        </Link>
      </div>

      {/* Main Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Header & Typography */}
        <div className="space-y-3 border-b border-slate-100 pb-6">
          {/* Metadata Bar - Quiet unboxed text with typographic separators */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span className="text-slate-700 font-semibold">
              {assessment.type === 'topic' ? 'Topic Assessment' : 'Course Final Assessment'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{assessment.totalQuestions} Questions</span>
            <span aria-hidden="true">·</span>
            <span>{assessment.passingScore}% Passing Score</span>
            <span aria-hidden="true">·</span>
            <span>{isTimed ? `${assessment.timeLimitMinutes} min limit` : 'Untimed'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            {assessment.title}
          </h1>

          {assessment.description && (
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
              {assessment.description}
            </p>
          )}
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Questions</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{assessment.totalQuestions}</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>Passing Score</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{assessment.passingScore}%</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time Limit</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {isTimed ? `${assessment.timeLimitMinutes}m` : 'Untimed'}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Attempts</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {assessment.maxAttempts > 0
                ? `${attemptOverview.pastAttemptsCount} / ${assessment.maxAttempts}`
                : `${attemptOverview.pastAttemptsCount} taken`}
            </p>
          </div>
        </div>

        {/* Dynamic Status Notices */}
        {hasActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3 text-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-semibold">In-Progress Attempt Found</p>
              <p className="text-amber-700">
                You have an active assessment attempt already in progress. Resuming will return you to your saved state without counting as a new attempt.
              </p>
            </div>
          </div>
        )}

        {isMaxReached && !hasActive && (
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 flex items-start space-x-3 text-slate-700">
            <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-semibold">Maximum Attempts Reached</p>
              <p className="text-slate-600">
                You have completed the maximum number of attempts allowed for this assessment ({assessment.maxAttempts} of {assessment.maxAttempts}). You can review your previous attempts below.
              </p>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-xs sm:text-sm">
              <p className="font-semibold">Unable to Start Assessment</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-4 sm:p-5 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Assessment Instructions
          </h2>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Answers can be selected and updated freely prior to final submission.</li>
            {isTimed && (
              <li>
                This assessment is strictly timed for <strong>{assessment.timeLimitMinutes} minutes</strong>. The server timer begins when the attempt is started or resumed.
              </li>
            )}
            <li>You will receive your verified score and question-by-question review immediately after submitting.</li>
            <li>Do not close your browser tab during an active timed session.</li>
          </ul>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div>
            {hasHistory && (
              <button
                type="button"
                onClick={onViewHistory}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                id="assessment-view-history-btn"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>View Attempt History ({attemptOverview.pastAttemptsCount})</span>
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center space-x-3">
            {!isMaxReached || hasActive ? (
              <button
                type="button"
                onClick={onStartAttempt}
                disabled={isStarting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                id="assessment-start-btn"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{hasActive ? 'Resuming Attempt...' : 'Starting Attempt...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{hasActive ? 'Resume Active Attempt' : 'Start Assessment'}</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
