/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, User, BookOpen, ChevronRight } from 'lucide-react';

interface CourseCardProps {
  thumbnail?: string;
  title: string;
  shortDescription: string;
  category: string;
  difficulty: string;
  duration: string;
  courseCreatorName?: string;
  instructorName?: string;
  status?: string;
  viewMode?: 'grid' | 'list';
  onActionClick?: () => void;
  actionLabel?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  thumbnail,
  title,
  shortDescription,
  category,
  difficulty,
  duration,
  courseCreatorName,
  instructorName,
  status,
  viewMode = 'grid',
  onActionClick,
  actionLabel = 'View Details',
}) => {
  const creatorDisplayName = courseCreatorName || instructorName || 'Course Creator';
  const isList = viewMode === 'list';

  // List Layout View
  if (isList) {
    return (
      <article className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start sm:items-stretch">
        {/* Course Thumbnail */}
        {thumbnail ? (
          <div className="w-full sm:w-44 h-28 bg-slate-100 rounded-lg shrink-0 overflow-hidden relative">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {status && (
              <span className="absolute top-2 left-2 text-[8px] font-mono font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs">
                {status}
              </span>
            )}
          </div>
        ) : (
          <div className="w-full sm:w-44 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg shrink-0 flex items-center justify-center text-slate-400 border border-slate-150 relative">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
            {status && (
              <span className="absolute top-2 left-2 text-[8px] font-mono font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs">
                {status}
              </span>
            )}
          </div>
        )}

        {/* Content Column */}
        <div className="flex-1 flex flex-col justify-between space-y-3 py-0.5 w-full">
          <div className="space-y-1.5">
            {/* Meta category/difficulty badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-xs uppercase tracking-wider border border-primary-100">
                {category}
              </span>
              <span className="text-[8px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-xs uppercase tracking-wider">
                {difficulty}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-display font-bold text-slate-800 text-sm leading-snug sm:text-base line-clamp-1">
              {title}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {shortDescription}
            </p>
          </div>

          {/* Info & CTA Footer Section */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-medium">
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="text-slate-500">{creatorDisplayName}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{duration}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-[10px] sm:text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Default Grid Layout View
  return (
    <article className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Banner area / Thumbnail */}
        {thumbnail ? (
          <div className="h-36 bg-slate-100 relative overflow-hidden">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
              <span className="text-[8px] font-mono font-bold bg-white/95 text-slate-900 px-2 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs shadow-3xs">
                {category}
              </span>
              {status && (
                <span className="text-[8px] font-mono font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs">
                  {status}
                </span>
              )}
            </div>
            <span className="absolute bottom-2.5 right-2.5 text-[9px] font-mono font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-sm tracking-wider uppercase backdrop-blur-xs">
              {difficulty}
            </span>
          </div>
        ) : (
          <div className="h-36 bg-gradient-to-br from-slate-900 to-slate-800 p-3.5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary-600/10 rounded-full blur-xl" />
            <div className="flex justify-between items-start z-10">
              <span className="text-[8px] font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs">
                {category}
              </span>
              {status && (
                <span className="text-[8px] font-mono font-bold bg-primary-500 text-white px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  {status}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-semibold z-10">
              {difficulty}
            </span>
          </div>
        )}

        {/* Text Area */}
        <div className="p-4 space-y-2">
          <h3 className="font-display font-bold text-slate-800 text-sm leading-snug line-clamp-1">
            {title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {shortDescription}
          </p>

          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium pt-1">
            <User className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
            <span className="text-slate-500 font-semibold">{creatorDisplayName}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 pb-3.5 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-semibold">
          <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span>{duration}</span>
        </div>

        <button
          type="button"
          onClick={onActionClick}
          className="font-bold text-primary-600 hover:text-primary-700 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 p-1 rounded-sm cursor-pointer"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
};
