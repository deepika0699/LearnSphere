/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  studentAssessmentApi,
  StudentAssessment,
  StudentAssessmentAttemptOverview,
  SafeStudentAttempt,
  StudentAssessmentResults,
  StudentSubmitAttemptPayload,
} from '../../services/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AssessmentOverview } from '../../components/assessment/AssessmentOverview';
import { AssessmentQuestionView } from '../../components/assessment/AssessmentQuestionView';
import { AssessmentResultView } from '../../components/assessment/AssessmentResultView';
import { AssessmentAttemptHistory } from '../../components/assessment/AssessmentAttemptHistory';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FeedbackState } from '../../components/FeedbackState';

type AssessmentViewMode = 'loading' | 'overview' | 'taking' | 'result' | 'history';

export const StudentAssessmentPage: React.FC = () => {
  const { courseId, assessmentId, attemptId: paramAttemptId } = useParams<{
    courseId: string;
    assessmentId: string;
    attemptId?: string;
  }>();

  const navigate = useNavigate();
  const { accessToken } = useApp();

  // Primary data states
  const [assessment, setAssessment] = useState<StudentAssessment | null>(null);
  const [attemptOverview, setAttemptOverview] = useState<StudentAssessmentAttemptOverview | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<SafeStudentAttempt | null>(null);
  const [results, setResults] = useState<StudentAssessmentResults | null>(null);

  // Flow and UI states
  const [viewMode, setViewMode] = useState<AssessmentViewMode>('loading');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // In-memory student answers: questionId -> selectedOptionId
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Document Title
  useDocumentTitle(assessment ? `${assessment.title} | LearnSphere Assessment` : 'Assessment | LearnSphere');

  // Guard against asynchronous state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Load Assessment Details & Student Attempt Overview
   */
  const loadAssessment = useCallback(async () => {
    if (!courseId || !assessmentId) return;

    setIsLoading(true);
    setError(null);

    try {
      // If a specific attemptId was passed in route (direct review link), load review directly
      if (paramAttemptId) {
        const reviewData = await studentAssessmentApi.getAttemptReview(
          courseId,
          assessmentId,
          paramAttemptId,
          accessToken
        );
        if (isMountedRef.current) {
          setActiveAttempt(reviewData.attempt);
          setResults(reviewData.results);
          // Also fetch base assessment for navigation and titles
          try {
            const baseData = await studentAssessmentApi.getAssessment(courseId, assessmentId, accessToken);
            setAssessment(baseData.assessment);
            setAttemptOverview(baseData.attemptOverview);
          } catch {
            // Keep minimal state if base fails
          }
          setViewMode('result');
          setIsLoading(false);
          return;
        }
      }

      const data = await studentAssessmentApi.getAssessment(courseId, assessmentId, accessToken);
      if (isMountedRef.current) {
        setAssessment(data.assessment);
        setAttemptOverview(data.attemptOverview);

        // If student already has an active attempt in progress, prompt or preserve
        if (data.attemptOverview.hasActiveAttempt && data.attemptOverview.activeAttempt) {
          setActiveAttempt(data.attemptOverview.activeAttempt);
        }

        setViewMode('overview');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to load assessment details.');
        setViewMode('loading');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [courseId, assessmentId, paramAttemptId, accessToken]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  /**
   * Start or Resume Attempt Handler
   */
  const handleStartAttempt = async () => {
    if (!courseId || !assessmentId || isStarting) return;

    setIsStarting(true);
    setError(null);

    try {
      const res = await studentAssessmentApi.startAttempt(courseId, assessmentId, accessToken);
      if (isMountedRef.current) {
        setActiveAttempt(res.attempt);
        // Clear previous in-memory answers for fresh attempt, but preserve if resumed
        if (!res.isResumed) {
          setAnswers({});
        }
        setViewMode('taking');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to start or resume assessment attempt.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsStarting(false);
      }
    }
  };

  /**
   * Handle Answer Selection (stored in component state only)
   */
  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  /**
   * Submit Attempt Handler (Final submission)
   */
  const handleSubmitAttempt = async () => {
    if (!courseId || !assessmentId || !assessment || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    // Build strictly sanitized answer items (no score, no client timer, no isCorrect)
    const questions = assessment.questions || [];
    const submissionPayload: StudentSubmitAttemptPayload = {
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] || null,
      })),
    };

    try {
      const res = await studentAssessmentApi.submitAttempt(
        courseId,
        assessmentId,
        submissionPayload,
        accessToken
      );

      if (isMountedRef.current) {
        setActiveAttempt(res.attempt);
        setResults(res.results);
        setAttemptOverview((prev) => {
          if (!prev) return prev;
          const newPastCount = prev.pastAttemptsCount + 1;
          return {
            ...prev,
            hasActiveAttempt: false,
            activeAttempt: null,
            pastAttemptsCount: newPastCount,
            isMaxAttemptsReached: prev.maxAttempts > 0 && newPastCount >= prev.maxAttempts,
          };
        });
        setViewMode('result');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to submit assessment attempt. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  /**
   * Server Timer Expiration Handler
   */
  const handleTimeExpired = useCallback(() => {
    // Automatically submit attempt when server-allocated time expires
    if (!isSubmitting && viewMode === 'taking') {
      handleSubmitAttempt();
    }
  }, [isSubmitting, viewMode, handleSubmitAttempt]);

  /**
   * Select a specific historical attempt to view review
   */
  const handleSelectAttemptReview = async (targetAttemptId: string) => {
    if (!courseId || !assessmentId) return;

    setIsLoading(true);
    try {
      const reviewData = await studentAssessmentApi.getAttemptReview(
        courseId,
        assessmentId,
        targetAttemptId,
        accessToken
      );
      if (isMountedRef.current) {
        setActiveAttempt(reviewData.attempt);
        setResults(reviewData.results);
        setViewMode('result');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to retrieve attempt review.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Retake assessment action
   */
  const handleRetake = () => {
    if (paramAttemptId && courseId && assessmentId) {
      navigate(`/courses/${courseId}/assessments/${assessmentId}`, { replace: true });
    }
    setAnswers({});
    setResults(null);
    setActiveAttempt(null);
    handleStartAttempt();
  };

  /**
   * Navigation Back to Overview
   */
  const handleBackToOverview = () => {
    if (paramAttemptId && courseId && assessmentId) {
      navigate(`/courses/${courseId}/assessments/${assessmentId}`, { replace: true });
    }
    setViewMode('overview');
  };

  /**
   * Navigation Back to Course Curriculum
   */
  const handleBackToCourse = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`);
    }
  };

  // Determine if student can retake:
  const canRetake = Boolean(
    assessment &&
      attemptOverview &&
      (assessment.maxAttempts === 0 ||
        (attemptOverview.pastAttemptsCount < assessment.maxAttempts && !attemptOverview.isMaxAttemptsReached))
  );

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Loading View */}
      {isLoading && viewMode === 'loading' && (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" label="Loading assessment..." direction="col" />
        </div>
      )}

      {/* Error View */}
      {!isLoading && error && viewMode === 'loading' && (
        <div className="py-16">
          <FeedbackState
            title="Assessment Unavailable"
            message={error}
            onRetry={loadAssessment}
            retryLabel="Try Again"
          />
        </div>
      )}

      {/* 1. Assessment Overview View */}
      {!isLoading && viewMode === 'overview' && assessment && attemptOverview && (
        <AssessmentOverview
          assessment={assessment}
          attemptOverview={attemptOverview}
          onStartAttempt={handleStartAttempt}
          isStarting={isStarting}
          onViewHistory={() => setViewMode('history')}
          error={error}
        />
      )}

      {/* 2. Active Attempt Taking View */}
      {!isLoading && viewMode === 'taking' && assessment && activeAttempt && (
        <AssessmentQuestionView
          assessment={assessment}
          attempt={activeAttempt}
          answers={answers}
          onSelectAnswer={handleSelectAnswer}
          onSubmit={handleSubmitAttempt}
          isSubmitting={isSubmitting}
          onTimeExpired={handleTimeExpired}
          error={error}
        />
      )}

      {/* 3. Finalized Result & Review View */}
      {!isLoading && viewMode === 'result' && assessment && activeAttempt && results && (
        <AssessmentResultView
          assessment={assessment}
          attempt={activeAttempt}
          results={results}
          onRetake={handleRetake}
          canRetake={canRetake}
          onViewHistory={() => setViewMode('history')}
          onBackToCourse={handleBackToCourse}
        />
      )}

      {/* 4. Past Attempts History View */}
      {!isLoading && viewMode === 'history' && courseId && assessmentId && (
        <AssessmentAttemptHistory
          courseId={courseId}
          assessmentId={assessmentId}
          accessToken={accessToken}
          onSelectAttemptReview={handleSelectAttemptReview}
          onBackToOverview={handleBackToOverview}
        />
      )}
    </div>
  );
};

export default StudentAssessmentPage;
