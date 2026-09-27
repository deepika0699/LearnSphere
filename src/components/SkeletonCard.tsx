/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SkeletonCardProps {
  viewMode?: 'grid' | 'list';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-stretch gap-4 animate-pulse"
        aria-hidden="true"
      >
        {/* Left Column: Course Thumbnail placeholder */}
        <div className="w-full sm:w-36 h-24 bg-slate-100 rounded-lg shrink-0" />

        {/* Right Column: Text & Meta Content */}
        <div className="flex-1 flex flex-col justify-between space-y-3 py-1">
          <div className="space-y-2">
            {/* Tag/Category & Duration Row */}
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-100 rounded-sm w-16" />
              <div className="h-3.5 bg-slate-100 rounded-sm w-12" />
            </div>

            {/* Course Title */}
            <div className="h-5 bg-slate-100 rounded-md w-3/4" />

            {/* Short Description */}
            <div className="space-y-1.5 pt-0.5">
              <div className="h-3.5 bg-slate-100 rounded-xs w-full" />
              <div className="h-3.5 bg-slate-100 rounded-xs w-5/6" />
            </div>
          </div>

          {/* Tags & Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1.5">
              <div className="h-4 bg-slate-100 rounded-xs w-10" />
              <div className="h-4 bg-slate-100 rounded-xs w-12" />
              <div className="h-4 bg-slate-100 rounded-xs w-8" />
            </div>
            <div className="h-6 bg-slate-100 rounded-md w-14" />
          </div>
        </div>
      </div>
    );
  }

  // Default Grid Mode
  return (
    <div 
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between animate-pulse"
      aria-hidden="true"
    >
      {/* Top Banner area */}
      <div className="h-32 bg-slate-100 p-3.5 flex flex-col justify-between relative">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-slate-200 rounded-sm w-16" />
          <div className="h-4 bg-slate-200 rounded-sm w-8" />
        </div>
        <div className="h-3 bg-slate-200 rounded-sm w-24" />
      </div>

      {/* Main text area */}
      <div className="p-4 space-y-3 flex-1">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-4.5 bg-slate-100 rounded-md w-11/12" />
          <div className="h-4.5 bg-slate-100 rounded-md w-3/4" />
        </div>

        {/* Short Description */}
        <div className="space-y-1.5 pt-1">
          <div className="h-3 bg-slate-100 rounded-xs w-full" />
          <div className="h-3 bg-slate-100 rounded-xs w-5/6" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          <div className="h-4 bg-slate-100 rounded-xs w-10" />
          <div className="h-4 bg-slate-100 rounded-xs w-14" />
          <div className="h-4 bg-slate-100 rounded-xs w-12" />
        </div>
      </div>

      {/* Footer Area */}
      <div className="px-4 pb-3.5 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="h-3 bg-slate-100 rounded-sm w-16" />
        <div className="h-4 bg-slate-100 rounded-sm w-10" />
      </div>
    </div>
  );
};
