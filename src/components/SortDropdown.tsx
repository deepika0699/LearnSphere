/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  options,
  selectedValue,
  onChange,
  id = 'sort-dropdown',
  label = 'Sort by',
}) => {
  return (
    <div className="flex items-center space-x-2">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-500 font-sans whitespace-nowrap"
        >
          {label}:
        </label>
      )}
      <div className="relative rounded-lg shadow-2xs">
        <select
          id={id}
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none block bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3 py-2 pr-8 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
          <ChevronDown className="h-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
