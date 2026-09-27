/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  FileCheck,
} from 'lucide-react';

interface CreatorSidebarProps {
  onItemClick?: () => void;
}

export const CreatorSidebar: React.FC<CreatorSidebarProps> = ({ onItemClick }) => {
  const navItems = [
    {
      to: '/creator',
      end: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & course shortcuts',
    },
    {
      to: '/creator/courses',
      end: true,
      label: 'My Courses',
      icon: BookOpen,
      description: 'Manage creator catalog',
    },
    {
      to: '/creator/assessments',
      end: false,
      label: 'Assessments',
      icon: FileCheck,
      description: 'Quizzes & final exams',
    },
    {
      to: '/creator/courses/new',
      end: true,
      label: 'Create Course',
      icon: PlusCircle,
      description: 'New course draft',
    },
  ];

  return (
    <aside className="w-64 flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/80">
        <Link 
          to="/creator" 
          className="flex items-center space-x-2.5 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          onClick={onItemClick}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-display font-bold text-sm shadow-xs">
            L
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-tight text-slate-900 leading-tight">
              Learn<span className="text-indigo-600">Sphere</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              Creator Studio
            </span>
          </div>
        </Link>
      </div>

      {/* Course Creator Role Status Badge */}
      <div className="px-5 py-3 border-b border-slate-100 bg-indigo-50/50">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-medium text-slate-700">Authoring Session</span>
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
            Creator
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Course Creator Navigation">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Content Authoring
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onItemClick}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                  aria-hidden="true"
                />
                <div className="flex flex-col text-left">
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] line-clamp-1 ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Switcher: Return to Main Portal */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60">
        <Link
          to="/courses"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
          onClick={onItemClick}
        >
          <span className="flex items-center space-x-2">
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Public Catalog</span>
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>
      </div>
    </aside>
  );
};
