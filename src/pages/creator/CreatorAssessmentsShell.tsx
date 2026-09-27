/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useId } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  CourseCreatorCourse,
} from '../../services/api';
import { CreatorAssessmentsManager } from '../../components/creator/CreatorAssessmentsManager';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FeedbackState } from '../../components/FeedbackState';
import { EmptyState } from '../../components/EmptyState';
import {
  FileCheck,
  BookOpen,
  PlusCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CreatorAssessmentsShell: React.FC = () => {
  const { accessToken, isLoading: authLoading } = useApp();
  const courseSelectId = useId();

  const [courses, setCourses] = useState<CourseCreatorCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!accessToken) return;

    setError(null);
    try {
      const data = await courseCreatorApi.getCourses(accessToken, { limit: 100 });
      const loadedCourses = data.courses || [];
      setCourses(loadedCourses);

      if (loadedCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(loadedCourses[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve creator courses');
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedCourseId]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchCourses();
    }
  }, [authLoading, accessToken, fetchCourses]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading assessment studio..." direction="col" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <FeedbackState
          title="Could Not Load Courses"
          message={error}
          onRetry={fetchCourses}
          retryLabel="Retry"
        />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          icon={BookOpen}
          title="Create a Course First"
          description="Assessments must be associated with an active or draft course. Start by drafting your first curriculum."
          actionLabel="Create Course"
          actionHref="/creator/courses/new"
        />
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Studio Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-indigo-600 font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Assessment Authoring Studio</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
              Assessments & Examinations
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Configure quizzes, modular knowledge evaluations, and final exams with server-authoritative grading, timers, and attempt limits.
            </p>
          </div>

          {/* Course Selector Dropdown */}
          <div className="min-w-[240px] space-y-1.5 self-start sm:self-auto">
            <label htmlFor={courseSelectId} className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Selected Course
            </label>
            <div className="relative">
              <select
                id={courseSelectId}
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full appearance-none px-3.5 py-2 pr-9 text-xs font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer transition-colors"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Course Assessment Manager Card */}
      {selectedCourse && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs">
          <CreatorAssessmentsManager
            courseId={selectedCourse.id}
            courseTitle={selectedCourse.title}
          />
        </div>
      )}
    </div>
  );
};

export default CreatorAssessmentsShell;
