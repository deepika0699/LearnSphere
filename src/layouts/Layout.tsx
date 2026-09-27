/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from '../components/Navbar';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCreatorRoute = location.pathname.startsWith('/creator');

  if (isAdminRoute || isCreatorRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Dynamic Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Minimalist, Clean SaaS Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-display font-bold text-sm">
                  L
                </div>
                <span className="font-display font-bold text-lg tracking-tight text-slate-900">
                  Learn<span className="text-primary-600">Sphere</span>
                </span>
              </div>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                LearnSphere is a professional SaaS learning platform engineered for students. Elevate your skills, frontend architecture, and business intuition through standard courses.
              </p>
            </div>
            
            <div>
              <h3 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-widest mb-4">
                Platform
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/courses" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    All Courses
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/certificates" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    Verify Certificate
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-widest mb-4">
                Legal
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    Terms of Use
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    Code of Conduct
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} LearnSphere Inc. All rights reserved. Designed with visual precision.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Twitter</a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">GitHub</a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
