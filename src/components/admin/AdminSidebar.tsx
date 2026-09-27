/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, GraduationCap, ShieldCheck, ArrowLeft, FileCheck } from 'lucide-react';

interface AdminSidebarProps {
  onItemClick?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onItemClick }) => {
  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics foundation',
    },
    {
      to: '/admin/users',
      end: false,
      label: 'Users',
      icon: Users,
      description: 'Account directory & roles',
    },
    {
      to: '/admin/courses',
      end: false,
      label: 'Courses',
      icon: BookOpen,
      description: 'Catalog review & status',
    },
    {
      to: '/admin/assessments',
      end: false,
      label: 'Assessments',
      icon: FileCheck,
      description: 'Audit & configure exams',
    },
    {
      to: '/admin/course-creators',
      end: false,
      label: 'Course Creators',
      icon: GraduationCap,
      description: 'Creator management & access',
    },
  ];

  return (
    <aside className="w-64 flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/80">
        <Link 
          to="/admin" 
          className="flex items-center space-x-2.5 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
          onClick={onItemClick}
        >
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-display font-bold text-sm shadow-xs">
            L
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-tight text-slate-900 leading-tight">
              Learn<span className="text-primary-600">Sphere</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              Admin Console
            </span>
          </div>
        </Link>
      </div>

      {/* Admin Role Status Badge */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-slate-700">Privileged Session</span>
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin Navigation">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Management
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
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Return Link */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <Link
          to="/"
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          onClick={onItemClick}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Exit to Main Site</span>
        </Link>
      </div>
    </aside>
  );
};
