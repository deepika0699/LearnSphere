/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  label = 'Search',
  id = 'search-input',
}) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-widest"
      >
        {label}
      </label>
      <div className="relative rounded-lg shadow-2xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-xs sm:text-sm bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-slate-800 font-medium"
        />
      </div>
    </div>
  );
};
