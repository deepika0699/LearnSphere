/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Layers,
  Sparkles,
  User as UserIcon,
  AlertCircle,
  PlayCircle,
  Calendar,
  Clock,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  courseApi,
  PublicCourse,
  PublicModuleStructure,
  studentEnrollmentApi,
  studentProgressApi,
  studentAssessmentApi,
  StudentEnrollment,
  StudentCourseProgressSummary,
  StudentAssessmentProgressItem,
} from '../../services/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { FeedbackState } from '../../components/FeedbackState';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const CourseDetails: React.FC = () => {
  const { id, courseId: paramCourseId } = useParams<{ id?: string; courseId?: string }>();
  const courseId = paramCourseId || id;
  const navigate = useNavigate();
  const { accessToken, state } = useApp();
  const { isAuthenticated, user } = state;
  const isStudent = isAuthenticated && user?.role === 'student';

  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [modules, setModules] = useState<PublicModuleStructure[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'creator'>('overview');
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Student Enrollment & Progress State
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [progressSummary, setProgressSummary] = useState<StudentCourseProgressSummary | null>(null);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
  const [assessments, setAssessments] = useState<StudentAssessmentProgressItem[]>([]);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState<boolean>(false);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);

  useDocumentTitle(course ? course.title : isNotFound ? 'Course Not Found' : 'Course Details');

  const fetchCourseData = useCallback(async () => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  // Fetch course details and curriculum structure
  useEffect(() => {
    let isSubscribed = true;

    const executeFetch = async () => {
      if (!courseId) {
        if (isSubscribed) {
          setIsNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setIsNotFound(false);
        setCourse(null);
        setModules([]);

        const [courseData, structureData] = await Promise.all([
          courseApi.getCourseById(courseId),
          courseApi.getCourseStructure(courseId),
        ]);

        if (!isSubscribed) return;

        setCourse(courseData);
        const orderedModules = structureData.modules || [];
        setModules(orderedModules);

        // By default, expand all modules if 4 or fewer, or expand the first module
        const initialExpanded: Record<string, boolean> = {};
        orderedModules.forEach((m, idx) => {
          initialExpanded[m.id] = idx === 0 || orderedModules.length <= 4;
        });
        setExpandedModuleIds(initialExpanded);
      } catch (err: any) {
        if (!isSubscribed) return;
        if (
          err.status === 404 ||
          err.statusCode === 404 ||
          err.message?.toLowerCase().includes('not found') ||
          err.message?.includes('404')
        ) {
          setIsNotFound(true);
        } else {
          setError(err.message || 'Unable to load course details. Please verify your connection.');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    executeFetch();

    return () => {
      isSubscribed = false;
    };
  }, [courseId, retryTrigger]);

  // Fetch real student enrollment status and progress summary from backend
  useEffect(() => {
    let isSubscribed = true;

    const checkEnrollmentAndProgress = async () => {
      if (!courseId || !isStudent || !accessToken) {
        setEnrollment(null);
        setProgressSummary(null);
        return;
      }

      setIsCheckingEnrollment(true);
      try {
        const enrollData = await studentEnrollmentApi.getEnrollmentByCourseId(courseId, accessToken);
        if (!isSubscribed) return;
        setEnrollment(enrollData);

        if (enrollData && (enrollData.status === 'active' || enrollData.status === 'completed')) {
          try {
            const [summary, assessData, progressData] = await Promise.all([
              studentProgressApi.getCourseProgressSummary(courseId, accessToken),
              studentAssessmentApi.getCourseAssessments(courseId, accessToken),
              studentProgressApi.getCourseProgress(courseId, accessToken),
            ]);
            if (isSubscribed) {
              setProgressSummary(summary);
              setAssessments(assessData || []);
              setCompletedTopicIds(new Set(progressData.completedTopicIds || []));
            }
          } catch {
            // Non-blocking progress summary error
          }
        } else {
          setProgressSummary(null);
          setAssessments([]);
          setCompletedTopicIds(new Set());
        }
      } catch {
        // Non-blocking enrollment check
      } finally {
        if (isSubscribed) {
          setIsCheckingEnrollment(false);
        }
      }
    };

    checkEnrollmentAndProgress();

    return () => {
      isSubscribed = false;
    };
  }, [courseId, isStudent, accessToken]);

  // Handle Enrollment Action
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate(`/login?returnUrl=/courses/${courseId}`);
      return;
    }

    if (!isStudent) {
      setEnrollError('Course enrollment is only available for student accounts.');
      return;
    }

    if (!courseId || isEnrolling) return;

    setIsEnrolling(true);
    setEnrollError(null);
    setEnrollSuccessMessage(null);

    try {
      const newEnrollment = await studentEnrollmentApi.enrollInCourse(courseId, accessToken);
      setEnrollment(newEnrollment);
      setEnrollSuccessMessage('Successfully enrolled in course! You can now start learning.');

      try {
        const [summary, progressData] = await Promise.all([
          studentProgressApi.getCourseProgressSummary(courseId, accessToken),
          studentProgressApi.getCourseProgress(courseId, accessToken),
        ]);
        setProgressSummary(summary);
        setCompletedTopicIds(new Set(progressData.completedTopicIds || []));
      } catch {
        // Safe fallback
      }
    } catch (err: any) {
      if (
        err?.status === 409 ||
        err?.statusCode === 409 ||
        err?.message?.toLowerCase().includes('already enrolled')
      ) {
        setEnrollSuccessMessage('You are already enrolled in this course.');
        try {
          const syncEnrollment = await studentEnrollmentApi.getEnrollmentByCourseId(courseId, accessToken);
          setEnrollment(syncEnrollment);
        } catch {
          // ignore
        }
      } else {
        setEnrollError(err?.message || 'Failed to enroll in course. Please try again.');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const toggleModule = (modId: string) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    modules.forEach((m) => {
      next[m.id] = true;
    });
    setExpandedModuleIds(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    modules.forEach((m) => {
      next[m.id] = false;
    });
    setExpandedModuleIds(next);
  };

  // Find first available topic for Quick Start
  const firstTopic = modules.flatMap((m) => m.topics || [])[0];

  // 1. Missing / Not Found Course State (404, Draft, Archived, Invalid ID)
  if (isNotFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center" id="course-not-found-state">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-500" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Course Not Available
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed">
          The requested course does not exist, is in draft mode, or has been archived from public delivery.
        </p>
        <div className="mt-8">
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-2xs transition-colors"
            id="back-to-catalog-button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Available Courses</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="course-details-loading">
        <div className="flex flex-col items-center justify-center min-h-[360px] space-y-4">
          <LoadingSpinner size="lg" label="Loading curriculum details..." direction="col" />
        </div>
      </div>
    );
  }

  // 3. Network / Server Error State
  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16" id="course-details-error-state">
        <FeedbackState
          title="Error Loading Course"
          message={error || 'Failed to retrieve course data.'}
          onRetry={fetchCourseData}
          retryLabel="Retry Connection"
        />
        <div className="text-center mt-6">
          <Link
            to="/courses"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const creatorName = course.courseCreator?.name || 'Academic Faculty';
  const totalModules = course.moduleCount ?? modules.length;
  const totalTopics =
    course.topicCount ?? modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="course-details-page">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          id="course-catalog-breadcrumb"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Course Catalog
        </Link>
      </div>

      {/* Header Hero Banner */}
      <div
        className="bg-slate-900 rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden border border-slate-800 shadow-sm"
        id="course-hero-banner"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-sm uppercase font-bold tracking-wider border border-slate-700"
              id="course-category-badge"
            >
              {course.category}
            </span>
            <span className="bg-emerald-950/80 text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded-sm uppercase font-bold tracking-wider border border-emerald-800">
              Published Curriculum
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white" id="course-title">
            {course.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-sans" id="course-description">
            {course.description}
          </p>

          {/* Authoritative Metadata Strip */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 pt-3 font-mono border-t border-slate-800/80">
            <div className="flex items-center space-x-1.5" id="meta-modules-count">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <span>
                MODULES: <strong className="text-white">{totalModules}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-1.5" id="meta-topics-count">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>
                TOPICS: <strong className="text-white">{totalTopics}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-1.5" id="meta-creator-name">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>
                INSTRUCTOR: <strong className="text-white">{creatorName.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Navigation */}
          <div className="border-b border-slate-200 flex space-x-6" id="course-details-tabs">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'curriculum', label: `Curriculum (${totalTopics} Topics)` },
                { id: 'creator', label: 'Course Creator' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6" id="tab-content-overview">
              {/* Description Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h2 className="font-display font-semibold text-lg text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  <span>About This Course</span>
                </h2>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-sans">
                  {course.description}
                </div>
              </div>

              {/* Course Structure Highlights Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-lg text-slate-900">Curriculum Outline</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('curriculum')}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center"
                  >
                    <span>View All Modules</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>

                {modules.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono py-2">
                    No curriculum modules published yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {modules.slice(0, 5).map((mod, idx) => (
                      <div key={mod.id} className="py-3 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-mono text-slate-400">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-slate-800 font-medium">{mod.title}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {mod.topics?.length || 0} topics
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CURRICULUM (REAL ORDERED MODULES & TOPICS) */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6" id="tab-content-curriculum">
              {/* Controls bar */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex items-center space-x-2 text-xs text-slate-600 font-mono">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>
                    {totalModules} Modules • {totalTopics} Topics
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-medium bg-white rounded border border-slate-200 hover:border-slate-300 transition-colors"
                    id="expand-all-modules-btn"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-medium bg-white rounded border border-slate-200 hover:border-slate-300 transition-colors"
                    id="collapse-all-modules-btn"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Empty Curriculum State */}
              {modules.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No Curriculum Modules Published"
                  description="The course creator has not published structured modules for this course yet. Please check back later."
                />
              ) : (
                /* Ordered Modules Accordion */
                <div className="space-y-4" id="curriculum-modules-accordion">
                  {modules.map((mod, modIdx) => {
                    const isExpanded = !!expandedModuleIds[mod.id];
                    const topicList = mod.topics || [];

                    return (
                      <div
                        key={mod.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                        id={`module-card-${mod.id}`}
                      >
                        {/* Module Header Button */}
                        <button
                          type="button"
                          onClick={() => toggleModule(mod.id)}
                          aria-expanded={isExpanded}
                          className="w-full text-left p-5 flex items-start justify-between bg-white hover:bg-slate-50/60 transition-colors cursor-pointer"
                          id={`module-toggle-${mod.id}`}
                        >
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] font-mono font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-sm">
                                MODULE {String(modIdx + 1).padStart(2, '0')}
                              </span>
                              <span className="text-xs font-mono text-slate-400">
                                {topicList.length} {topicList.length === 1 ? 'topic' : 'topics'}
                              </span>
                            </div>
                            <h3 className="font-display font-semibold text-base text-slate-900 pt-1">
                              {mod.title}
                            </h3>
                            {mod.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
                                {mod.description}
                              </p>
                            )}
                          </div>

                          <div className="flex-shrink-0 text-slate-400 pt-1">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Collapsible Topics Container */}
                        {isExpanded && (
                          <div
                            className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2.5"
                            id={`module-topics-container-${mod.id}`}
                          >
                            {topicList.length === 0 ? (
                              <div className="text-center py-4 text-xs text-slate-400 font-mono">
                                No topics published in this module yet.
                              </div>
                            ) : (
                              topicList.map((topic, topicIdx) => (
                                <div
                                  key={topic.id}
                                  className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                                  id={`topic-item-${topic.id}`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                                        TOPIC {String(modIdx + 1)}.{String(topicIdx + 1)}
                                      </span>
                                      {completedTopicIds.has(topic.id) && (
                                        <span
                                          className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm"
                                          id={`topic-completed-badge-${topic.id}`}
                                        >
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Completed</span>
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="font-display font-medium text-sm text-slate-900">
                                      {topic.title}
                                    </h4>
                                    {topic.description && (
                                      <p className="text-xs text-slate-500 font-sans line-clamp-1">
                                        {topic.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Topic Actions */}
                                  <div className="flex-shrink-0 pt-1 sm:pt-0 flex flex-wrap items-center gap-2">
                                    {(() => {
                                      const topicAssessment = assessments.find((a) => a.type === 'topic' && a.topicId === topic.id);
                                      if (!topicAssessment || !isStudent || !(enrollment?.status === 'active' || enrollment?.status === 'completed')) return null;
                                      return (
                                        <Link
                                          to={`/courses/${course.id}/assessments/${topicAssessment.id}`}
                                          className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                            topicAssessment.isPassed
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                              : topicAssessment.attemptsCount > 0
                                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                              : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                                          }`}
                                          id={`topic-quiz-link-${topic.id}`}
                                        >
                                          <HelpCircle className="w-3.5 h-3.5" />
                                          <span>
                                            {topicAssessment.isPassed
                                              ? `Quiz Passed (${topicAssessment.bestScore}%)`
                                              : topicAssessment.attemptsCount > 0
                                              ? `Retake Quiz (${topicAssessment.bestScore}%)`
                                              : 'Topic Quiz'}
                                          </span>
                                        </Link>
                                      );
                                    })()}
                                    <Link
                                      to={`/courses/${course.id}/learn/${topic.id}`}
                                      className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors"
                                      id={`navigate-topic-${topic.id}`}
                                    >
                                      <PlayCircle className="w-3.5 h-3.5" />
                                      <span>{completedTopicIds.has(topic.id) ? 'Review Topic' : 'Start Topic'}</span>
                                      <ArrowRight className="w-3 h-3 ml-0.5" />
                                    </Link>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Course-Level Final Assessments */}
              {isStudent && (enrollment?.status === 'active' || enrollment?.status === 'completed') && assessments.filter((a) => a.type === 'course').length > 0 && (
                <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4" id="course-final-assessments-section">
                  <div className="flex items-center space-x-2 text-slate-900">
                    <GraduationCap className="w-5 h-5 text-primary-600" />
                    <h3 className="font-display font-bold text-base">Course Final Assessments</h3>
                  </div>
                  <div className="space-y-3">
                    {assessments.filter((a) => a.type === 'course').map((courseAss) => (
                      <div
                        key={courseAss.id}
                        className="bg-slate-50 rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        id={`course-assessment-${courseAss.id}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-primary-100 text-primary-800">
                              FINAL EXAM
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              Passing: {courseAss.passingScore}%
                            </span>
                            {courseAss.timeLimitMinutes > 0 && (
                              <span className="text-xs font-mono text-slate-500">
                                {courseAss.timeLimitMinutes} min limit
                              </span>
                            )}
                          </div>
                          <h4 className="font-display font-semibold text-sm text-slate-900">{courseAss.title}</h4>
                          {courseAss.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{courseAss.description}</p>
                          )}
                          {courseAss.attemptsCount > 0 && (
                            <p className="text-xs font-mono text-slate-600 pt-0.5">
                              Attempts: {courseAss.attemptsCount} | Best Score: {courseAss.bestScore}%
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <Link
                            to={`/courses/${course.id}/assessments/${courseAss.id}`}
                            className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-lg shadow-2xs transition-colors ${
                              courseAss.isPassed
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-primary-600 hover:bg-primary-700 text-white'
                            }`}
                            id={`start-course-assessment-${courseAss.id}`}
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>{courseAss.isPassed ? 'Review Assessment' : 'Take Final Assessment'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COURSE CREATOR */}
          {activeTab === 'creator' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4" id="tab-content-creator">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center font-display font-bold text-lg border border-slate-800">
                  {creatorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900" id="creator-name-title">
                    {creatorName}
                  </h3>
                  <p className="text-xs text-primary-600 font-medium font-mono uppercase tracking-wider">
                    Verified Course Instructor
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-slate-600 text-sm leading-relaxed font-sans">
                <p>
                  Curated and structured by verified academic faculty on LearnSphere. Content adheres strictly to published institutional curriculum guidelines.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Action & Enrollment Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5" id="course-action-card">
            {/* Course Thumbnail */}
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-44 object-cover rounded-lg border border-slate-200 mb-2"
                referrerPolicy="no-referrer"
                id="course-thumbnail-image"
              />
            ) : (
              <div className="w-full h-36 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-400 mb-2">
                <BookOpen className="w-8 h-8 mb-1" />
                <span className="text-xs font-mono">Academic Course</span>
              </div>
            )}

            {/* Quick Metadata Points */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{course.category}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Curriculum Modules:</span>
                <span className="font-mono font-bold text-slate-800">{totalModules}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Topics:</span>
                <span className="font-mono font-bold text-slate-800">{totalTopics}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Enrollment:</span>
                {isCheckingEnrollment && isStudent ? (
                  <span className="font-medium text-slate-400 font-mono text-[11px] inline-flex items-center space-x-1" id="enrolled-status-checking">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                    <span>Checking...</span>
                  </span>
                ) : enrollment && enrollment.status === 'completed' ? (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm inline-flex items-center space-x-1" id="enrolled-status-badge">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Completed</span>
                  </span>
                ) : enrollment && enrollment.status === 'withdrawn' ? (
                  <span className="font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm inline-flex items-center space-x-1" id="enrolled-status-badge">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Withdrawn</span>
                  </span>
                ) : enrollment && enrollment.status === 'active' ? (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm inline-flex items-center space-x-1" id="enrolled-status-badge">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Enrolled</span>
                  </span>
                ) : (
                  <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm">
                    Open for Students
                  </span>
                )}
              </div>
            </div>

            {/* Course Completed State Card (Server-Authoritative) */}
            {enrollment && enrollment.status === 'completed' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5" id="course-completed-card">
                <div className="flex items-center space-x-2 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <h4 className="font-display font-bold text-sm">Course Completed</h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-sans">
                  You have successfully fulfilled all required published topics and passed all course assessments.
                </p>
                {enrollment.completedAt && (
                  <div className="text-[11px] font-mono text-emerald-700 flex items-center space-x-1 pt-0.5 border-t border-emerald-200/60">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    <span>Completed on {new Date(enrollment.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Verified Progress Summary (If Enrolled) */}
            {enrollment && (enrollment.status === 'active' || enrollment.status === 'completed') && progressSummary && (
              <div className="space-y-2 pt-3 border-t border-slate-100" id="enrolled-progress-summary">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Your Course Progress:</span>
                  <span className="font-mono font-bold text-slate-900">{progressSummary.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressSummary.isCompleted ? 'bg-emerald-600' : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, progressSummary.completionPercentage))}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-mono text-right">
                  {progressSummary.completedTopics} of {progressSummary.totalTopics} topics completed
                </div>
                {progressSummary.totalAssessments !== undefined && progressSummary.totalAssessments > 0 && (
                  <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span>Assessments:</span>
                    <span className="font-semibold text-slate-700">
                      {progressSummary.passedAssessments || 0} of {progressSummary.totalAssessments} passed
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Notifications */}
            {enrollSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-start space-x-2" id="enroll-success-banner">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{enrollSuccessMessage}</span>
              </div>
            )}

            {enrollError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg flex items-start space-x-2" id="enroll-error-banner">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1 leading-tight">{enrollError}</span>
                <button
                  type="button"
                  onClick={() => setEnrollError(null)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Context-Aware Primary Action Button */}
            {isCheckingEnrollment && isStudent ? (
              <div className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center space-x-2 text-slate-500 text-xs font-medium" id="checking-enrollment-placeholder">
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Checking enrollment status...</span>
              </div>
            ) : enrollment && enrollment.status === 'withdrawn' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2" id="withdrawn-enrollment-panel">
                <div className="flex items-center justify-center space-x-1.5 text-rose-700 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Enrollment Withdrawn</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your enrollment in this course has been withdrawn. Topics and assessments cannot be completed while withdrawn.
                </p>
                {firstTopic && (
                  <Link
                    to={`/courses/${course.id}/learn/${firstTopic.id}`}
                    className="inline-flex items-center justify-center space-x-1.5 text-xs text-slate-700 hover:text-slate-900 font-medium underline pt-1"
                  >
                    <span>Preview Topics</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ) : enrollment && (enrollment.status === 'active' || enrollment.status === 'completed') ? (
              firstTopic ? (
                <Link
                  to={`/courses/${course.id}/learn/${firstTopic.id}`}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors shadow-xs"
                  id="resume-learning-cta-button"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>
                    {enrollment.status === 'completed' || progressSummary?.isCompleted
                      ? 'Review Completed Course'
                      : progressSummary && progressSummary.completedTopics > 0
                      ? 'Resume Learning'
                      : 'Start Learning'}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('curriculum')}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Explore Curriculum</span>
                </button>
              )
            ) : isAuthenticated && isStudent ? (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={isEnrolling || isCheckingEnrollment}
                className="w-full inline-flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-lg transition-colors shadow-xs cursor-pointer"
                id="enroll-course-cta-button"
              >
                {isEnrolling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enroll in Course</span>
                  </>
                )}
              </button>
            ) : !isAuthenticated ? (
              <Link
                to={`/login?returnUrl=/courses/${course.id}`}
                className="w-full inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 rounded-lg transition-colors shadow-xs"
                id="signin-to-enroll-cta-button"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In to Enroll</span>
              </Link>
            ) : (
              // Authenticated as Admin or Course Creator
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs p-2.5 rounded-lg text-center">
                  Logged in as <strong className="capitalize">{user?.role}</strong> (Instructor Preview)
                </div>
                {firstTopic && (
                  <Link
                    to={`/courses/${course.id}/learn/${firstTopic.id}`}
                    className="w-full inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-xs"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Preview Topics</span>
                  </Link>
                )}
              </div>
            )}

            <div className="text-center pt-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Official Institutional Curriculum
              </span>
            </div>
          </div>

          {/* Quick Curriculum Jump Card */}
          {modules.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3" id="sidebar-curriculum-index">
              <h4 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-widest">
                Module Breakdown
              </h4>
              <div className="space-y-2">
                {modules.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveTab('curriculum');
                      setExpandedModuleIds((prev) => ({ ...prev, [m.id]: true }));
                    }}
                    className="w-full text-left p-2 rounded hover:bg-slate-50 transition-colors flex items-center justify-between text-xs text-slate-700"
                  >
                    <span className="truncate pr-2 font-medium">
                      {idx + 1}. {m.title}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] flex-shrink-0">
                      {m.topics?.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CourseDetails;
