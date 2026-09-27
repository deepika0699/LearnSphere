/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selectedValue,
  onChange,
  id,
  placeholder = 'All',
}) => {
  const componentId = id || `filter-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={componentId}
        className="block text-xs font-semibold text-slate-700 font-sans"
      >
        {label}
      </label>
      <div className="relative rounded-lg shadow-2xs">
        <select
          id={componentId}
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none block w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-xs sm:text-sm bg-slate-50/50 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-slate-700 font-medium cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
