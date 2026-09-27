/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { LogOut, Menu, User as UserIcon, Shield, ChevronRight } from 'lucide-react';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuToggle, mobileMenuOpen }) => {
  const { state, logout } = useApp();
  const { user } = state;
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current page context title from route
  const getPageTitle = () => {
    const path = location.pathname.replace(/\/$/, '');
    switch (path) {
      case '/admin/users':
        return 'Users';
      case '/admin/courses':
        return 'Courses';
      case '/admin/course-creators':
        return 'Course Creators';
      case '/admin':
      default:
        return 'Dashboard';
    }
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
            <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center text-white font-display font-bold text-xs">
              L
            </div>
            <span className="font-display font-bold text-sm text-slate-900">
              Admin
            </span>
          </div>

          {/* Desktop Breadcrumbs & Page Context */}
          <nav className="hidden sm:flex items-center space-x-2 text-xs text-slate-500" aria-label="Breadcrumb">
            <Link to="/admin" className="hover:text-slate-900 transition-colors font-medium">
              Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">{getPageTitle()}</span>
          </nav>
        </div>

        {/* Right: Authenticated Admin Info & Logout Action */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Admin User Identity Display */}
          {user && (
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 sm:border-0 sm:pl-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-emerald-600" />
                  Administrator
                </span>
              </div>
            </div>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
            title="Log out of administrator session"
            aria-label="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
