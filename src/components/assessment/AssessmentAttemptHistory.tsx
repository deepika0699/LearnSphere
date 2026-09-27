/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
  History,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  studentAssessmentApi,
  SafeStudentAttempt,
} from '../../services/api';
import { LoadingSpinner } from '../LoadingSpinner';
import { EmptyState } from '../EmptyState';
import { FeedbackState } from '../FeedbackState';

interface AssessmentAttemptHistoryProps {
  courseId: string;
  assessmentId: string;
  accessToken: string | null;
  onSelectAttemptReview: (attemptId: string) => void;
  onBackToOverview: () => void;
}

export const AssessmentAttemptHistory: React.FC<AssessmentAttemptHistoryProps> = ({
  courseId,
  assessmentId,
  accessToken,
  onSelectAttemptReview,
  onBackToOverview,
}) => {
  const [attempts, setAttempts] = useState<SafeStudentAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentAssessmentApi.getAttempts(courseId, assessmentId, accessToken);
      setAttempts(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load attempt history.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, assessmentId, accessToken]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back to Assessment Overview Navigation */}
      <div>
        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          id="history-back-to-overview-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Assessment Overview
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
              Attempt History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Review your past submissions and performance records for this assessment.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAttempts}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh attempts"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content based on state */}
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading attempt history..." direction="col" />
          </div>
        ) : error ? (
          <FeedbackState
            title="Unable to load attempts"
            message={error}
            onRetry={fetchAttempts}
            retryLabel="Retry"
          />
        ) : attempts.length === 0 ? (
          <EmptyState
            icon={History}
            title="No past attempts yet"
            description="You have not completed any attempts for this assessment yet. Start an attempt to begin testing your knowledge."
            action={{
              label: 'Return to Overview',
              onClick: onBackToOverview,
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse" id="attempt-history-table">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Attempt</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Result</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((attempt) => {
                  const isFinalized = attempt.status === 'completed' || attempt.status === 'timed_out';
                  const isPassed = attempt.isPassed;

                  return (
                    <tr
                      key={attempt.id}
                      className="hover:bg-slate-50/60 transition-colors font-sans text-slate-700"
                    >
                      {/* Attempt Number */}
                      <td className="py-3.5 px-3 font-semibold text-slate-900 font-mono">
                        Attempt #{attempt.attemptNumber}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-xs">
                        {formatDate(attempt.submittedAt || attempt.startedAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {attempt.status === 'completed' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Completed
                          </span>
                        ) : attempt.status === 'timed_out' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Timed Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            In Progress
                          </span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {isFinalized && attempt.score !== undefined ? `${attempt.score}%` : '—'}
                      </td>

                      {/* Result */}
                      <td className="py-3.5 px-3">
                        {isFinalized && attempt.isPassed !== undefined ? (
                          isPassed ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Passed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-red-600 font-semibold text-xs">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">Pending</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        {isFinalized ? (
                          <button
                            type="button"
                            onClick={() => onSelectAttemptReview(attempt.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>Review</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onBackToOverview}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <span>Resume</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
