/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const IconComponent = Icon as React.ComponentType<{ className?: string; 'aria-hidden'?: string }>;
    return <IconComponent className="w-6 h-6 text-slate-400" aria-hidden="true" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-4 max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
        {renderIcon()}
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display font-bold text-base text-slate-800">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <div className="pt-2">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};
