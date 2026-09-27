/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { LogOut, Menu, User as UserIcon, BookOpen, ChevronRight } from 'lucide-react';

interface CreatorHeaderProps {
  onMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export const CreatorHeader: React.FC<CreatorHeaderProps> = ({ onMenuToggle, mobileMenuOpen }) => {
  const { state, logout } = useApp();
  const { user } = state;
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current page context title from route
  const getPageTitle = () => {
    const path = location.pathname.replace(/\/$/, '');
    if (path === '/creator/courses/new') {
      return 'Create Course';
    }
    if (path.startsWith('/creator/courses/')) {
      return 'Course Details';
    }
    if (path === '/creator/courses') {
      return 'My Courses';
    }
    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8">
      <div className="h-full flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Breadcrumbs Context */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={mobileMenuOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand (visible when sidebar is collapsed on small screens) */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-display font-bold text-xs">
              L
            </div>
            <span className="font-display font-bold text-sm text-slate-900">
              Creator Studio
            </span>
          </div>

          {/* Desktop Breadcrumbs & Page Context */}
          <nav className="hidden sm:flex items-center space-x-2 text-xs text-slate-500" aria-label="Breadcrumb">
            <Link to="/creator" className="hover:text-slate-900 transition-colors font-medium">
              Course Creator
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">{getPageTitle()}</span>
          </nav>
        </div>

        {/* Right: Authenticated Creator Info & Logout Action */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Creator User Identity Display */}
          {user && (
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 sm:border-0 sm:pl-0">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-semibold">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                  <BookOpen className="w-2.5 h-2.5 text-indigo-600" />
                  Course Creator
                </span>
              </div>
            </div>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Log out of Course Creator console"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
