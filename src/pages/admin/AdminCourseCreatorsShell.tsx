/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GraduationCap } from 'lucide-react';

export const AdminCourseCreatorsShell: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Area Heading */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
          Course Creator Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Creator access applications and profile governance foundation.
        </p>
      </div>

      {/* Structural Foundation Placeholder Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 mx-auto flex items-center justify-center mb-4">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">
          Creator Governance Shell Initialized
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
          Route and navigation verified. Application review queues and creator permission controls will be integrated in future tasks.
        </p>
      </div>
    </div>
  );
};
