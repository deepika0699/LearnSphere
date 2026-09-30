/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Code,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Menu,
  PlayCircle,
  Sparkles,
  Video,
  X,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  courseApi,
  PublicCourse,
  PublicModuleStructure,
  PublicTopicContent,
  PublicTopicSummary,
  studentEnrollmentApi,
  studentProgressApi,
  StudentEnrollment,
  StudentAssessmentProgressItem,
} from '../../services/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { FeedbackState } from '../../components/FeedbackState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { TopicHighlightNoteTrigger } from '../../components/notes/TopicHighlightNoteTrigger';

/**
 * Validates that an input URL string is strictly HTTP or HTTPS.
 * Rejects javascript:, data:, vbscript:, and relative paths.
 */
function isValidHttpUrl(urlStr?: string | null): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts 11-character YouTube video ID safely from full URL or direct ID.
 */
function extractYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const isYouTubeHost =
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be' ||
      host.endsWith('.youtu.be') ||
      host === 'youtube-nocookie.com' ||
      host.endsWith('.youtube-nocookie.com');

    if (!isYouTubeHost) return null;

    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (parsed.pathname === '/watch' || parsed.searchParams.has('v')) {
      const v = parsed.searchParams.get('v');
      return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
    }

    const pathMatch = parsed.pathname.match(/^\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

type VideoLang = 'english' | 'telugu' | 'hindi';

export const TopicReader: React.FC = () => {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const navigate = useNavigate();
  const { accessToken, state } = useApp();
  const { isAuthenticated, user } = state;
  const isStudent = isAuthenticated && user?.role === 'student';

  // Course & Topic Content State
  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [modules, setModules] = useState<PublicModuleStructure[]>([]);
  const [topicContent, setTopicContent] = useState<PublicTopicContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Student Enrollment & Progress State
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState<boolean>(true);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
  const [courseAssessments, setCourseAssessments] = useState<StudentAssessmentProgressItem[]>([]);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isEnrollingDirectly, setIsEnrollingDirectly] = useState<boolean>(false);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});
  const [selectedVideoLang, setSelectedVideoLang] = useState<VideoLang>('english');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // In-memory cache for course structure to eliminate duplicate API requests during sequential topic reading
  const cachedCourseRef = useRef<{
    courseId: string;
    course: PublicCourse;
    modules: PublicModuleStructure[];
  } | null>(null);

  // Ref for the main educational content container to anchor highlight note selections
  const contentContainerRef = useRef<HTMLElement | null>(null);

  // Document Title
  useDocumentTitle(
    topicContent
      ? `${topicContent.title} | ${course?.title || 'Course'}`
      : isNotFound
      ? 'Topic Not Found'
      : 'Learning Topic'
  );

  // Flattened topic list in strict sequential order
  const flattenedTopics = useMemo(() => {
    const list: Array<{ topic: PublicTopicSummary; module: PublicModuleStructure; modIndex: number; topicIndex: number }> = [];
    modules.forEach((mod, modIndex) => {
      (mod.topics || []).forEach((t, topicIndex) => {
        list.push({ topic: t, module: mod, modIndex, topicIndex });
      });
    });
    return list;
  }, [modules]);

  // Current topic index & navigation bounds
  const currentTopicIndex = useMemo(() => {
    if (!topicId) return -1;
    return flattenedTopics.findIndex((item) => item.topic.id === topicId);
  }, [flattenedTopics, topicId]);

  const currentTopicItem = currentTopicIndex >= 0 ? flattenedTopics[currentTopicIndex] : null;
  const prevTopicItem = currentTopicIndex > 0 ? flattenedTopics[currentTopicIndex - 1] : null;
  const nextTopicItem =
    currentTopicIndex >= 0 && currentTopicIndex < flattenedTopics.length - 1
      ? flattenedTopics[currentTopicIndex + 1]
      : null;

  // Load Curriculum and Topic Content with race-condition & unmount protection
  useEffect(() => {
    let isSubscribed = true;

    const executeLoad = async () => {
      if (!courseId || !topicId) {
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
        setTopicContent(null);

        // Clear course state if navigating to a different course
        if (cachedCourseRef.current && cachedCourseRef.current.courseId !== courseId) {
          setCourse(null);
          setModules([]);
        }

        // 1. Fetch or reuse cached Course Structure and Course Details
        let currentCourse: PublicCourse | null = null;
        let orderedModules: PublicModuleStructure[] = [];

        if (cachedCourseRef.current && cachedCourseRef.current.courseId === courseId) {
          currentCourse = cachedCourseRef.current.course;
          orderedModules = cachedCourseRef.current.modules;
          if (isSubscribed) {
            setCourse(currentCourse);
            setModules(orderedModules);
          }
        } else {
          const [courseData, structureData] = await Promise.all([
            courseApi.getCourseById(courseId),
            courseApi.getCourseStructure(courseId),
          ]);
          if (!isSubscribed) return;
          currentCourse = courseData;
          orderedModules = structureData.modules || [];
          cachedCourseRef.current = {
            courseId,
            course: currentCourse,
            modules: orderedModules,
          };
          setCourse(currentCourse);
          setModules(orderedModules);
        }

        // 2. Identify the module containing this topic to satisfy backend hierarchy enforcement
        let targetModuleId: string | null = null;
        for (const mod of orderedModules) {
          if (mod.topics?.some((t) => t.id === topicId)) {
            targetModuleId = mod.id;
            break;
          }
        }

        if (!targetModuleId) {
          if (isSubscribed) {
            setIsNotFound(true);
            setIsLoading(false);
          }
          return;
        }

        // Auto-expand the module containing the active topic
        if (isSubscribed) {
          setExpandedModuleIds((prev) => ({
            ...prev,
            [targetModuleId!]: true,
          }));
        }

        // 3. Fetch full educational content using validated courseId, moduleId, and topicId
        const content = await courseApi.getTopicContent(courseId, targetModuleId, topicId);
        if (!isSubscribed) return;

        setTopicContent(content);

        // Auto-select preferred available video language (English -> Telugu -> Hindi)
        const v = content.videos;
        if (v?.english) {
          setSelectedVideoLang('english');
        } else if (v?.telugu) {
          setSelectedVideoLang('telugu');
        } else if (v?.hindi) {
          setSelectedVideoLang('hindi');
        }
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
          setError(err.message || 'Unable to load topic content. Please check your connection.');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    executeLoad();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isSubscribed = false;
    };
  }, [courseId, topicId, retryTrigger]);

  // Fetch real student enrollment status and completed topics from backend
  useEffect(() => {
    let isSubscribed = true;

    const fetchEnrollmentAndProgress = async () => {
      if (!courseId || !isStudent || !accessToken) {
        setIsEnrolled(false);
        setEnrollment(null);
        setCompletedTopicIds(new Set());
        setIsCheckingEnrollment(false);
        return;
      }

      setIsCheckingEnrollment(true);
      try {
        const enrollData = await studentEnrollmentApi.getEnrollmentByCourseId(courseId, accessToken);
        if (!isSubscribed) return;

        if (enrollData && (enrollData.status === 'active' || enrollData.status === 'completed')) {
          setIsEnrolled(true);
          setEnrollment(enrollData);

          try {
            const progressData = await studentProgressApi.getCourseProgress(courseId, accessToken);
            if (isSubscribed) {
              setCompletedTopicIds(new Set(progressData.completedTopicIds || []));
              if (progressData.assessments) {
                setCourseAssessments(progressData.assessments);
              }
            }
          } catch {
            // Non-blocking progress load
          }
        } else if (enrollData && enrollData.status === 'withdrawn') {
          setIsEnrolled(false);
          setEnrollment(enrollData);
          setCompletedTopicIds(new Set());
        } else {
          setIsEnrolled(false);
          setEnrollment(null);
          setCompletedTopicIds(new Set());
        }
      } catch {
        if (isSubscribed) {
          setIsEnrolled(false);
          setEnrollment(null);
        }
      } finally {
        if (isSubscribed) {
          setIsCheckingEnrollment(false);
        }
      }
    };

    fetchEnrollmentAndProgress();

    return () => {
      isSubscribed = false;
    };
  }, [courseId, isStudent, accessToken]);

  // Toggle individual topic completion status (Idempotent PUT / DELETE)
  const handleToggleProgress = async () => {
    if (!topicId || !courseId || isUpdatingProgress) return;

    if (!isAuthenticated) {
      setProgressError('Please sign in as a student to save course progress.');
      return;
    }

    if (!isStudent) {
      setProgressError('Topic progress tracking is only available for student accounts.');
      return;
    }

    if (enrollment?.status === 'withdrawn') {
      setProgressError('Cannot update topic progress for a withdrawn enrollment.');
      return;
    }

    if (!isEnrolled) {
      setProgressError('You must be enrolled in this course to save topic progress.');
      return;
    }

    setIsUpdatingProgress(true);
    setProgressError(null);

    const isCurrentlyCompleted = completedTopicIds.has(topicId);

    try {
      if (isCurrentlyCompleted) {
        await studentProgressApi.markTopicIncomplete(courseId, topicId, accessToken);
        setCompletedTopicIds((prev) => {
          const next = new Set(prev);
          next.delete(topicId);
          return next;
        });
        // Uncompleting a topic reverts completed course back to active in backend
        setEnrollment((prev) =>
          prev && prev.status === 'completed'
            ? { ...prev, status: 'active', completedAt: null }
            : prev
        );
      } else {
        const res = await studentProgressApi.markTopicCompleted(courseId, topicId, accessToken);
        setCompletedTopicIds((prev) => {
          const next = new Set(prev);
          next.add(topicId);
          return next;
        });
        // Immediately synchronize enrollment status and completion timestamp from server response
        if (res.enrollmentStatus) {
          setEnrollment((prev) =>
            prev
              ? {
                  ...prev,
                  status: res.enrollmentStatus,
                  completedAt:
                    res.enrollmentStatus === 'completed'
                      ? prev.completedAt || new Date().toISOString()
                      : null,
                }
              : prev
          );
        }
      }
    } catch (err: any) {
      setProgressError(err?.message || 'Failed to update topic progress. Please try again.');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Direct Enroll action from topic reader for unenrolled students
  const handleEnrollFromReader = async () => {
    if (!courseId || isEnrollingDirectly) return;
    setIsEnrollingDirectly(true);
    setProgressError(null);

    try {
      const newEnrollment = await studentEnrollmentApi.enrollInCourse(courseId, accessToken);
      setIsEnrolled(true);
      setEnrollment(newEnrollment);

      try {
        const progressData = await studentProgressApi.getCourseProgress(courseId, accessToken);
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
        setIsEnrolled(true);
        try {
          const progressData = await studentProgressApi.getCourseProgress(courseId, accessToken);
          setCompletedTopicIds(new Set(progressData.completedTopicIds || []));
        } catch {
          // ignore
        }
      } else {
        setProgressError(err?.message || 'Failed to enroll in course. Please try again.');
      }
    } finally {
      setIsEnrollingDirectly(false);
    }
  };

  // Toggle module collapse in curriculum sidebar
  const toggleModule = (modId: string) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Safe clipboard helper
  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch {
      // Graceful fallback if clipboard permission is restricted
    }
  };

  // 1. Not Found / Inaccessible State
  if (isNotFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center" id="topic-not-found-state">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-500" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          Topic Not Available
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed">
          The requested educational topic does not exist, belongs to an unpublished draft course, or has been relocated.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          {courseId && (
            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-2xs transition-colors"
              id="return-to-course-curriculum-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Curriculum</span>
            </Link>
          )}
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-lg border border-slate-200 transition-colors"
          >
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="topic-reader-loading">
        <div className="flex flex-col items-center justify-center min-h-[420px] space-y-4">
          <LoadingSpinner size="lg" label="Loading topic content & curriculum..." direction="col" />
        </div>
      </div>
    );
  }

  // 3. Error State with Retry
  if (error || !topicContent || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16" id="topic-reader-error-state">
        <FeedbackState
          title="Error Loading Topic"
          message={error || 'Unable to retrieve educational topic content.'}
          onRetry={() => {
            cachedCourseRef.current = null;
            setRetryTrigger((c) => c + 1);
          }}
          retryLabel="Retry Connection"
        />
        <div className="text-center mt-6">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Course
          </Link>
        </div>
      </div>
    );
  }

  // Video resolution
  const activeVideoUrl = topicContent.videos ? topicContent.videos[selectedVideoLang] : null;
  const activeVideoEmbedId = extractYouTubeId(activeVideoUrl);
  const availableVideoLangs: VideoLang[] = (['english', 'telugu', 'hindi'] as VideoLang[]).filter(
    (lang) => Boolean(topicContent.videos && topicContent.videos[lang])
  );

  const sections = topicContent.content?.sections || [];
  const codeExamples = topicContent.codeExamples || [];
  const importantPoints = topicContent.importantPoints || topicContent.revisionPoints || [];
  const images = topicContent.images || [];
  const externalRefs = topicContent.externalReferences || [];

  const hasAnyContent =
    Boolean(topicContent.content?.explanation) ||
    sections.length > 0 ||
    codeExamples.length > 0 ||
    importantPoints.length > 0 ||
    images.length > 0 ||
    availableVideoLangs.length > 0 ||
    externalRefs.length > 0;

  return (
    <div className="min-h-screen bg-slate-50/50" id="topic-learning-reader">
      {/* Top Learning Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Breadcrumb path */}
          <nav aria-label="Breadcrumbs" className="flex items-center space-x-2 text-xs truncate max-w-xl">
            <Link
              to="/courses"
              className="text-slate-400 hover:text-slate-700 transition-colors hidden sm:inline"
            >
              Courses
            </Link>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <Link
              to={`/courses/${course.id}`}
              className="font-medium text-slate-600 hover:text-slate-900 transition-colors truncate max-w-[180px]"
              title={course.title}
              id="breadcrumb-course-link"
            >
              {course.title}
            </Link>
            <span className="text-slate-300">/</span>
            {currentTopicItem && (
              <span className="text-slate-400 font-mono hidden md:inline truncate max-w-[140px]">
                {currentTopicItem.module.title}
              </span>
            )}
            <span className="text-slate-300 hidden md:inline">/</span>
            <span className="font-semibold text-slate-900 truncate" id="breadcrumb-topic-title">
              {topicContent.title}
            </span>
          </nav>

          {/* Curriculum Sidebar Toggle (Mobile & Desktop) */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              id="toggle-curriculum-sidebar-btn"
              aria-expanded={sidebarOpen}
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Curriculum</span>
              <span className="font-mono text-[11px] text-slate-500">
                ({currentTopicIndex + 1}/{flattenedTopics.length})
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Learning Workspace Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Reading Column (Content) */}
          <main ref={contentContainerRef} className="w-full lg:flex-1 space-y-8 min-w-0" id="topic-content-main">
            {/* Contextual Highlight-to-Notes Trigger & Composer (Authenticated Students) */}
            <TopicHighlightNoteTrigger
              courseId={course.id}
              moduleId={currentTopicItem?.module.id || null}
              topicId={topicContent.id || topicId || ''}
              courseTitle={course.title}
              moduleTitle={currentTopicItem?.module.title}
              topicTitle={topicContent.title}
              accessToken={accessToken}
              isStudent={Boolean(isStudent)}
              contentContainerRef={contentContainerRef}
            />

            {/* Topic Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {currentTopicItem && (
                    <span className="bg-primary-50 text-primary-700 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-primary-100">
                      MODULE {String(currentTopicItem.modIndex + 1).padStart(2, '0')} • TOPIC{' '}
                      {String(currentTopicItem.modIndex + 1)}.{String(currentTopicItem.topicIndex + 1)}
                    </span>
                  )}
                  <span className="bg-slate-100 text-slate-600 text-[11px] font-mono px-2 py-0.5 rounded-md">
                    {course.category}
                  </span>
                </div>

                {/* Topic Completion Action Button (Visible for Enrolled Students) */}
                {isEnrolled && (
                  <div>
                    {topicId && completedTopicIds.has(topicId) ? (
                      <button
                        type="button"
                        onClick={handleToggleProgress}
                        disabled={isUpdatingProgress}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                        id="toggle-topic-completion-btn"
                        title="Click to mark topic as incomplete"
                      >
                        {isUpdatingProgress ? (
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>Completed</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleToggleProgress}
                        disabled={isUpdatingProgress}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        id="toggle-topic-completion-btn"
                        title="Mark topic as completed"
                      >
                        {isUpdatingProgress ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                        )}
                        <span>Mark as Completed</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight" id="topic-title">
                {topicContent.title}
              </h1>

              {topicContent.description && (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans" id="topic-description">
                  {topicContent.description}
                </p>
              )}
            </div>

            {/* Course Completion Banner */}
            {enrollment?.status === 'completed' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900" id="topic-reader-course-completed-banner">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-semibold">Course Completed</strong>
                    <span className="text-emerald-700">You have completed all required topics and assessments in this course.</span>
                  </div>
                </div>
                <Link
                  to={`/courses/${course.id}`}
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors shadow-2xs flex-shrink-0"
                >
                  <span>Review Curriculum</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Withdrawn Enrollment Alert Banner */}
            {isStudent && enrollment?.status === 'withdrawn' && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-rose-900" id="withdrawn-mode-banner">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Enrollment Withdrawn</strong>
                  <span className="text-rose-800">
                    Your enrollment in this course has been withdrawn. Topics and quizzes cannot be marked as completed while withdrawn.
                  </span>
                </div>
              </div>
            )}

            {/* Unenrolled Preview Mode Alert Banner */}
            {isStudent && !isCheckingEnrollment && !isEnrolled && enrollment?.status !== 'withdrawn' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900" id="preview-mode-enrollment-banner">
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Preview Mode</strong>
                    <span className="text-amber-800">Enroll in this course to save your learning progress and mark topics as completed.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleEnrollFromReader}
                  disabled={isEnrollingDirectly}
                  className="inline-flex items-center space-x-1.5 bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
                  id="reader-enroll-btn"
                >
                  {isEnrollingDirectly ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Enroll in Course</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Progress Error Notification Banner */}
            {progressError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs flex items-center justify-between" id="progress-error-banner">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{progressError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProgressError(null)}
                  className="text-red-600 hover:text-red-800 text-xs font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Empty Topic Content Guard */}
            {!hasAnyContent ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-2xs space-y-3" id="empty-topic-content">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-display font-semibold text-slate-800 text-base">
                  Content Coming Soon
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                  The instructor has created this topic outline and is currently finalizing the educational reading sections and media materials.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Multi-Lingual Video Lesson Section (English / Telugu / Hindi) */}
                {availableVideoLangs.length > 0 && (
                  <section
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
                    id="topic-video-section"
                    aria-label="Video Explanation"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Video className="w-5 h-5 text-primary-600" />
                        <h2 className="font-display font-bold text-base text-slate-900">
                          Video Lecture
                        </h2>
                      </div>

                      {/* Language Selection Tabs */}
                      <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {(['english', 'telugu', 'hindi'] as VideoLang[]).map((lang) => {
                          const hasLang = Boolean(topicContent.videos && topicContent.videos[lang]);
                          if (!hasLang) return null;
                          const isSelected = selectedVideoLang === lang;
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setSelectedVideoLang(lang)}
                              id={`video-lang-tab-${lang}`}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                                isSelected
                                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {lang}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Safe Sandboxed Video Player Embed */}
                    {activeVideoEmbedId ? (
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${activeVideoEmbedId}?rel=0&modestbranding=1`}
                          title={`${topicContent.title} - ${selectedVideoLang} explanation`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          sandbox="allow-scripts allow-same-origin allow-presentation"
                          referrerPolicy="strict-origin-when-cross-origin"
                          loading="lazy"
                          id="topic-youtube-iframe"
                        />
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 font-mono bg-slate-50 rounded-lg">
                        No video available for the selected language.
                      </div>
                    )}
                  </section>
                )}

                {/* 2. Topic Overview / Explanation */}
                {topicContent.content?.explanation && (
                  <section
                    className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-3"
                    id="topic-explanation-section"
                    aria-label="Topic Explanation"
                  >
                    <div className="flex items-center space-x-2 text-primary-700">
                      <FileText className="w-5 h-5" />
                      <h2 className="font-display font-bold text-base text-slate-900">
                        Overview & Concept
                      </h2>
                    </div>
                    <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans pt-1">
                      {topicContent.content.explanation}
                    </div>
                  </section>
                )}

                {/* 3. Ordered Content Sections */}
                {sections.length > 0 && (
                  <div className="space-y-6" id="topic-ordered-sections">
                    {sections.map((sec, idx) => (
                      <section
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-3"
                        id={`topic-section-${idx}`}
                      >
                        <h3 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {idx + 1}
                          </span>
                          <span>{sec.heading}</span>
                        </h3>
                        <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans pt-1">
                          {sec.body}
                        </div>
                      </section>
                    ))}
                  </div>
                )}

                {/* 4. Important Points / Key Revision Takeaways */}
                {importantPoints.length > 0 && (
                  <section
                    className="bg-amber-50/50 rounded-2xl border border-amber-200/80 p-6 sm:p-8 shadow-2xs space-y-4"
                    id="topic-important-points-section"
                    aria-label="Important Takeaways"
                  >
                    <div className="flex items-center space-x-2 text-amber-900">
                      <ListChecks className="w-5 h-5 text-amber-700" />
                      <h2 className="font-display font-bold text-base text-amber-950">
                        Key Takeaways & Revision Points
                      </h2>
                    </div>
                    <ul className="space-y-2.5 pt-1">
                      {importantPoints.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start space-x-3 text-sm text-amber-950">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center text-xs font-mono font-bold mt-0.5">
                            {pIdx + 1}
                          </span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* 5. Code Examples (Formatted Safely, Non-Executable) */}
                {codeExamples.length > 0 && (
                  <section
                    className="space-y-4"
                    id="topic-code-examples-section"
                    aria-label="Code Examples"
                  >
                    <div className="flex items-center space-x-2 text-slate-900 px-1">
                      <Code className="w-5 h-5 text-primary-600" />
                      <h2 className="font-display font-bold text-lg">
                        Code Examples & Implementations
                      </h2>
                    </div>

                    <div className="space-y-5">
                      {codeExamples.map((ex, exIdx) => (
                        <div
                          key={ex.id || exIdx}
                          className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm"
                          id={`code-example-card-${exIdx}`}
                        >
                          {/* Code Header Bar */}
                          <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono font-bold bg-primary-950 text-primary-400 border border-primary-800/80 px-2 py-0.5 rounded uppercase">
                                {ex.language || 'Code'}
                              </span>
                              <span className="text-xs font-semibold text-slate-200">
                                {ex.title || `Example ${exIdx + 1}`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyCode(ex.code, String(ex.id || exIdx))}
                              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700/80 transition-colors cursor-pointer"
                              title="Copy code snippet"
                            >
                              {copiedCodeId === String(ex.id || exIdx) ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Preformatted Safe Code Body */}
                          <div className="p-5 overflow-x-auto">
                            <pre className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                              <code>{ex.code}</code>
                            </pre>
                          </div>

                          {/* Code Explanation Footer */}
                          {ex.explanation && (
                            <div className="px-5 py-3 bg-slate-900/40 border-t border-slate-800 text-xs text-slate-400 leading-relaxed font-sans">
                              <span className="text-slate-300 font-semibold mr-1">Explanation:</span>
                              {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 6. Educational Illustrations & Diagrams */}
                {images.length > 0 && (
                  <section
                    className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4"
                    id="topic-images-section"
                    aria-label="Diagrams and Illustrations"
                  >
                    <div className="flex items-center space-x-2 text-slate-900">
                      <ImageIcon className="w-5 h-5 text-primary-600" />
                      <h2 className="font-display font-bold text-base">
                        Illustrations & Diagrams
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {images.map((img, imgIdx) => {
                        const isSafeImg = isValidHttpUrl(img.url);
                        if (!isSafeImg) return null;
                        return (
                          <figure
                            key={img.id || imgIdx}
                            className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col"
                            id={`topic-image-${imgIdx}`}
                          >
                            <img
                              src={img.url}
                              alt={img.altText || img.caption || 'Educational diagram'}
                              referrerPolicy="no-referrer"
                              className="w-full h-52 object-contain bg-white border-b border-slate-200"
                              loading="lazy"
                            />
                            {(img.caption || img.altText) && (
                              <figcaption className="p-3 text-xs text-slate-600 font-sans italic bg-slate-50">
                                {img.caption || img.altText}
                              </figcaption>
                            )}
                          </figure>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 7. External Academic References */}
                {externalRefs.length > 0 && (
                  <section
                    className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4"
                    id="topic-references-section"
                    aria-label="External References"
                  >
                    <div className="flex items-center space-x-2 text-slate-900">
                      <Globe className="w-5 h-5 text-primary-600" />
                      <h2 className="font-display font-bold text-base">
                        External References & Further Reading
                      </h2>
                    </div>

                    <div className="divide-y divide-slate-100 pt-1">
                      {externalRefs.map((ref, rIdx) => {
                        const isSafeUrl = isValidHttpUrl(ref.url);
                        if (!isSafeUrl) return null;
                        return (
                          <div key={ref.id || rIdx} className="py-3 flex items-start justify-between gap-3">
                            <div>
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-sm text-primary-700 hover:text-primary-800 inline-flex items-center gap-1.5 transition-colors"
                              >
                                <span>{ref.title || ref.url}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              {ref.source && (
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                  Source: {ref.source}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Topic Quiz Assessment Callout */}
            {(() => {
              const currentTopicAssessment = courseAssessments.find(
                (a) => a.type === 'topic' && a.topicId === topicId
              );
              if (!currentTopicAssessment || !isEnrolled) return null;
              return (
                <section
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  id="topic-quiz-prompt-card"
                  aria-label="Topic Quiz Assessment"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-primary-50 text-primary-700 border border-primary-100">
                        TOPIC ASSESSMENT
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Passing Score: {currentTopicAssessment.passingScore}%
                      </span>
                      {currentTopicAssessment.totalQuestions > 0 && (
                        <span className="text-xs font-mono text-slate-400">
                          ({currentTopicAssessment.totalQuestions} questions)
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-base text-slate-900">
                      {currentTopicAssessment.title}
                    </h3>
                    {currentTopicAssessment.isPassed ? (
                      <p className="text-xs text-emerald-700 font-medium">
                        ✓ Passed with best score: {currentTopicAssessment.bestScore}% ({currentTopicAssessment.attemptsCount} {currentTopicAssessment.attemptsCount === 1 ? 'attempt' : 'attempts'})
                      </p>
                    ) : currentTopicAssessment.attemptsCount > 0 ? (
                      <p className="text-xs text-amber-700 font-medium">
                        Previous score: {currentTopicAssessment.latestScore ?? currentTopicAssessment.bestScore}% (Passing: {currentTopicAssessment.passingScore}%)
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Test your understanding of this topic with this practice quiz.
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <Link
                      to={`/courses/${course.id}/assessments/${currentTopicAssessment.id}`}
                      className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
                        currentTopicAssessment.isPassed
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                      id="start-topic-quiz-btn"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        {currentTopicAssessment.isPassed
                          ? 'Review / Retake Quiz'
                          : currentTopicAssessment.attemptsCount > 0
                          ? 'Retake Topic Quiz'
                          : 'Take Topic Quiz'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </section>
              );
            })()}

            {/* Bottom Sequential Topic Navigation */}
            <nav
              aria-label="Sequential Topic Navigation"
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4"
              id="topic-bottom-navigation"
            >
              {/* Previous Topic Button */}
              {prevTopicItem ? (
                <Link
                  to={`/courses/${course.id}/learn/${prevTopicItem.topic.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                  id="prev-topic-btn"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <div className="text-left">
                    <span className="block text-[10px] uppercase font-mono text-slate-400">
                      Previous Topic
                    </span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px] block">
                      {prevTopicItem.topic.title}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link
                  to={`/courses/${course.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-xs font-medium transition-colors"
                  id="back-to-course-overview-start-btn"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Course Curriculum</span>
                </Link>
              )}

              {/* Course Progress Index Tag & Complete Action */}
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center">
                <span className="text-xs font-mono text-slate-500">
                  Topic {currentTopicIndex + 1} of {flattenedTopics.length}
                </span>

                {isEnrolled && topicId && (
                  completedTopicIds.has(topicId) ? (
                    <button
                      type="button"
                      onClick={handleToggleProgress}
                      disabled={isUpdatingProgress}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                      title="Click to mark topic as incomplete"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Completed</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleProgress}
                      disabled={isUpdatingProgress}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      title="Mark topic as completed"
                    >
                      {isUpdatingProgress ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                      )}
                      <span>Mark Complete</span>
                    </button>
                  )
                )}
              </div>

              {/* Next Topic Button */}
              {nextTopicItem ? (
                <Link
                  to={`/courses/${course.id}/learn/${nextTopicItem.topic.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                  id="next-topic-btn"
                >
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-mono text-slate-300">
                      Next Topic
                    </span>
                    <span className="font-bold text-white truncate max-w-[200px] block">
                      {nextTopicItem.topic.title}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to={`/courses/${course.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                  id="complete-curriculum-overview-btn"
                >
                  <span>Curriculum Complete</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </nav>
          </main>

          {/* Curriculum Sidebar (Sticky Desktop, Drawer Mobile) */}
          <aside
            aria-label="Course Curriculum Panel"
            className={`
              fixed lg:static top-0 right-0 h-full lg:h-auto z-40 w-80 sm:w-96 lg:w-80 flex-shrink-0
              bg-white lg:rounded-2xl border-l lg:border border-slate-200 p-5 shadow-lg lg:shadow-2xs
              transition-transform duration-200 ease-in-out overflow-y-auto max-h-screen lg:max-h-[calc(100vh-6rem)] lg:sticky lg:top-20
              ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}
            id="curriculum-sidebar-panel"
          >
            {/* Sidebar Header */}
            <div className="pb-4 border-b border-slate-100 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    Curriculum Outline
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {modules.length} Modules • {flattenedTopics.length} Topics
                  </p>
                </div>

                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  aria-label="Close curriculum sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Verified Course Progress (If Enrolled) */}
              {isEnrolled && flattenedTopics.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 mb-1">
                    <span>Progress:</span>
                    <span className="font-bold text-slate-900">
                      {Math.min(100, Math.max(0, Math.round((completedTopicIds.size / flattenedTopics.length) * 100)))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, Math.round((completedTopicIds.size / flattenedTopics.length) * 100)))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                    {enrollment?.status === 'completed' ? (
                      <span className="text-emerald-700 font-semibold flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" /> Course Completed
                      </span>
                    ) : enrollment?.status === 'withdrawn' ? (
                      <span className="text-rose-700 font-semibold flex items-center">
                        <AlertCircle className="w-3 h-3 mr-0.5 text-rose-600" /> Withdrawn
                      </span>
                    ) : (
                      <span>In Progress</span>
                    )}
                    <span>
                      {completedTopicIds.size} of {flattenedTopics.length} topics
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modules Accordion */}
            <div className="space-y-3" id="sidebar-modules-list">
              {modules.map((mod, modIdx) => {
                const isExpanded = !!expandedModuleIds[mod.id];
                const modTopics = mod.topics || [];
                const containsActiveTopic = modTopics.some((t) => t.id === topicId);

                return (
                  <div
                    key={mod.id}
                    className={`rounded-xl border transition-all ${
                      containsActiveTopic
                        ? 'border-primary-200 bg-primary-50/20'
                        : 'border-slate-200 bg-white'
                    }`}
                    id={`sidebar-module-${mod.id}`}
                  >
                    {/* Module Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="w-full text-left p-3 flex items-center justify-between text-xs font-semibold cursor-pointer"
                      aria-expanded={isExpanded}
                      id={`sidebar-mod-toggle-${mod.id}`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          M{modIdx + 1}
                        </span>
                        <span className="truncate text-slate-800">{mod.title}</span>
                      </div>
                      <div className="text-slate-400 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Module Topic Links */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-2 space-y-1">
                        {modTopics.map((t, tIdx) => {
                          const isActive = t.id === topicId;
                          const isTopicCompleted = completedTopicIds.has(t.id);

                          return (
                            <Link
                              key={t.id}
                              to={`/courses/${course.id}/learn/${t.id}`}
                              onClick={() => setSidebarOpen(false)}
                              id={`sidebar-topic-link-${t.id}`}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                                isActive
                                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate pr-2">
                                <span
                                  className={`font-mono text-[10px] ${
                                    isActive ? 'text-slate-300' : 'text-slate-400'
                                  }`}
                                >
                                  {modIdx + 1}.{tIdx + 1}
                                </span>
                                <span className="truncate">{t.title}</span>
                              </div>

                              <div className="flex items-center space-x-1 flex-shrink-0">
                                {isTopicCompleted && (
                                  <CheckCircle2
                                    className={`w-3.5 h-3.5 ${
                                      isActive ? 'text-emerald-400' : 'text-emerald-600'
                                    }`}
                                    aria-label="Completed topic"
                                  />
                                )}
                                {isActive && !isTopicCompleted && (
                                  <PlayCircle className="w-3.5 h-3.5 text-primary-400" />
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Backdrop for mobile drawer */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicReader;
