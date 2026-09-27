/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onChange }) => {
  return (
    <div
      className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs"
      role="group"
      aria-label="View layout toggle"
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded-md transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 ${
          viewMode === 'grid'
            ? 'bg-white text-slate-800 shadow-3xs'
            : 'text-slate-400 hover:text-slate-600'
        }`}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <Grid className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`p-1.5 rounded-md transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 ${
          viewMode === 'list'
            ? 'bg-white text-slate-800 shadow-3xs'
            : 'text-slate-400 hover:text-slate-600'
        }`}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <List className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};
