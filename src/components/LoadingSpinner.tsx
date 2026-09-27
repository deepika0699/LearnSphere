/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  direction?: 'row' | 'col';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  direction = 'row',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-[2px]',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-[4px]',
  };

  const containerClasses = direction === 'col' 
    ? 'flex flex-col items-center justify-center space-y-3' 
    : 'flex items-center justify-center space-x-2.5';

  return (
    <div className={containerClasses} role="status" aria-label={label || 'Loading'}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-slate-100 border-t-primary-600`}
        aria-hidden="true"
      />
      {label && (
        <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};
