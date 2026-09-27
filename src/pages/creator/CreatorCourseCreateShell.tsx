/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  CreateCourseCreatorCourseRequest,
} from '../../services/api';
import {
  PlusCircle,
  ArrowLeft,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const CreatorCourseCreateShell: React.FC = () => {
  const { accessToken } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateCourseCreatorCourseRequest>({
    title: '',
    category: 'Development',
    description: '',
    thumbnail: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    'Development',
    'Design',
    'Business',
    'Marketing',
    'Data Science',
    'Security',
    'Cloud Computing',
  ];

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    } else if (formData.title.trim().length < 3 || formData.title.trim().length > 150) {
      errs.title = 'Title must be between 3 and 150 characters';
    }

    if (!formData.category.trim()) {
      errs.category = 'Category is required';
    } else if (formData.category.trim().length < 2 || formData.category.trim().length > 50) {
      errs.category = 'Category must be between 2 and 50 characters';
    }

    if (!formData.description.trim()) {
      errs.description = 'Description is required';
    } else if (formData.description.trim().length < 10 || formData.description.trim().length > 5000) {
      errs.description = 'Description must be between 10 and 5000 characters';
    }

    if (formData.thumbnail && formData.thumbnail.length > 500) {
      errs.thumbnail = 'Thumbnail URL cannot exceed 500 characters';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!accessToken) {
      setError('You must be signed in to create a course');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const created = await courseCreatorApi.createCourse(accessToken, {
        title: formData.title.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        thumbnail: formData.thumbnail?.trim() || undefined,
      });

      // Redirect to course management view
      navigate(`/creator/courses/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create course');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center space-x-3 text-xs text-slate-500">
        <Link
          to="/creator/courses"
          className="inline-flex items-center space-x-1.5 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Courses</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
            Create New Course
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Provide standard course catalog information. All newly created courses are initialized in Draft lifecycle status.
          </p>
        </div>

        {/* Server Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Error creating course</span>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Draft Notice Banner */}
        <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start space-x-3 text-xs text-amber-900">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Draft Lifecycle Status</span>
            <p className="text-amber-800/90 mt-0.5 leading-relaxed">
              Course creation defaults to Draft. You can construct modules and topics before submitting for administrative review.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title Field */}
          <div className="space-y-1.5">
            <label htmlFor="course-title" className="block text-xs font-semibold text-slate-700">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              id="course-title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
                if (validationErrors.title) {
                  setValidationErrors((prev) => ({ ...prev, title: '' }));
                }
              }}
              placeholder="e.g., Advanced Distributed Systems Architecture"
              className={`w-full px-3.5 py-2 text-xs text-slate-900 bg-white border rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors ${
                validationErrors.title ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
              }`}
            />
            {validationErrors.title ? (
              <p className="text-[11px] text-red-600 font-medium">{validationErrors.title}</p>
            ) : (
              <p className="text-[11px] text-slate-400">Between 3 and 150 characters.</p>
            )}
          </div>

          {/* Category Field */}
          <div className="space-y-1.5">
            <label htmlFor="course-category" className="block text-xs font-semibold text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="course-category"
              value={formData.category}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, category: e.target.value }));
                if (validationErrors.category) {
                  setValidationErrors((prev) => ({ ...prev, category: '' }));
                }
              }}
              className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="text-[11px] text-red-600 font-medium">{validationErrors.category}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label htmlFor="course-description" className="block text-xs font-semibold text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="course-description"
              rows={4}
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, description: e.target.value }));
                if (validationErrors.description) {
                  setValidationErrors((prev) => ({ ...prev, description: '' }));
                }
              }}
              placeholder="Provide an overview of the curriculum, prerequisites, and learning objectives..."
              className={`w-full px-3.5 py-2 text-xs text-slate-900 bg-white border rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors ${
                validationErrors.description ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
              }`}
            />
            {validationErrors.description ? (
              <p className="text-[11px] text-red-600 font-medium">{validationErrors.description}</p>
            ) : (
              <p className="text-[11px] text-slate-400">Between 10 and 5000 characters.</p>
            )}
          </div>

          {/* Thumbnail URL Field (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="course-thumbnail" className="block text-xs font-semibold text-slate-700">
              Thumbnail Image URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="course-thumbnail"
              type="url"
              value={formData.thumbnail}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, thumbnail: e.target.value }));
                if (validationErrors.thumbnail) {
                  setValidationErrors((prev) => ({ ...prev, thumbnail: '' }));
                }
              }}
              placeholder="https://images.unsplash.com/..."
              className={`w-full px-3.5 py-2 text-xs text-slate-900 bg-white border rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors ${
                validationErrors.thumbnail ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
              }`}
            />
            {validationErrors.thumbnail ? (
              <p className="text-[11px] text-red-600 font-medium">{validationErrors.thumbnail}</p>
            ) : (
              <p className="text-[11px] text-slate-400">Direct image link (max 500 characters).</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <Link
              to="/creator/courses"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Course...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Draft Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatorCourseCreateShell;
