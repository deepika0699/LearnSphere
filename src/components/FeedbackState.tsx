/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface FeedbackStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const FeedbackState: React.FC<FeedbackStateProps> = ({
  title = 'An unexpected error occurred',
  message,
  onRetry,
  retryLabel = 'Try Again',
}) => {
  return (
    <div 
      className="bg-white border border-red-100 rounded-xl p-10 text-center shadow-2xs space-y-4 max-w-lg mx-auto"
      role="alert"
    >
      {/* Icon Wrapper */}
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100 text-red-500">
        <AlertTriangle className="w-5 h-5" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <h3 className="font-display font-bold text-base text-slate-800">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto font-sans">
          {message}
        </p>
      </div>

      {/* Optional Retry Button */}
      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export const ErrorState = FeedbackState;
