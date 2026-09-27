/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { X } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile navigation drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to dismiss mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* 1. Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen z-20">
        <AdminSidebar />
      </div>

      {/* 2. Mobile Navigation Drawer (Modal Sheet with Backdrop) */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Admin Navigation Menu"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute top-2 right-2 z-20">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminSidebar onItemClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-50">
        {/* Admin Header */}
        <AdminHeader
          onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          mobileMenuOpen={mobileMenuOpen}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
