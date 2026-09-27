/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ResetFiltersButtonProps {
  onReset: () => void;
  isDisabled?: boolean;
  label?: string;
}

export const ResetFiltersButton: React.FC<ResetFiltersButtonProps> = ({
  onReset,
  isDisabled = false,
  label = 'Reset Filters',
}) => {
  return (
    <button
      type="button"
      onClick={onReset}
      disabled={isDisabled}
      className={`w-full inline-flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg border text-xs font-semibold tracking-wide transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        isDisabled
          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-2xs'
      }`}
    >
      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};
