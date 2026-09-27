/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { BookOpen, Trophy, Award, User as UserIcon, LogOut, Menu, X, Flame, Home as HomeIcon, Info, Mail, Shield, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { state, logout } = useApp();
  const { user } = state;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const primaryLinks = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/about', label: 'About', icon: Info },
    { path: '/contact', label: 'Contact', icon: Mail },
    ...(user
      ? [
          { path: '/dashboard', label: 'Dashboard', icon: Trophy },
          { path: '/certificates', label: 'Certificates', icon: Award },
          ...(user.role === 'admin'
            ? [{ path: '/admin', label: 'Admin Console', icon: Shield }]
            : []),
          ...(user.role === 'courseCreator'
            ? [{ path: '/creator', label: 'Creator Studio', icon: Sparkles }]
            : []),
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Close mobile menu when shifting viewport or routes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile menu
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo Section & Desktop Navigation */}
          <div className="flex items-center flex-1">
            <Link 
              to="/" 
              className="flex items-center space-x-2.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg p-1 transition-all"
              aria-label="LearnSphere Home"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
                L
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-900">
                Learn<span className="text-primary-600">Sphere</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:block ml-8 flex-1" aria-label="Primary Navigation">
              <ul className="flex items-center space-x-1">
                {primaryLinks.map((link) => {
                  const active = isActive(link.path);
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        aria-current={active ? 'page' : undefined}
                        className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                          active
                            ? 'text-primary-700 bg-primary-50/80'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <link.icon className="w-3.5 h-3.5" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Streak Counter */}
                <div 
                  className="flex items-center space-x-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-100" 
                  title="Daily Learning Streak"
                >
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{user.streak} day streak</span>
                </div>

                {/* XP Indicator */}
                <div 
                  className="flex items-center space-x-1 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-primary-100" 
                  title="Experience Points"
                >
                  <Trophy className="w-3.5 h-3.5 text-primary-500" />
                  <span>{user.xp} XP</span>
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  aria-current={isActive('/profile') ? 'page' : undefined}
                  className={`flex items-center space-x-2 p-1 rounded-full hover:bg-slate-50 transition-colors border focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isActive('/profile') ? 'border-primary-500 bg-primary-50/50' : 'border-slate-200'
                  }`}
                  aria-label="View profile settings"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80'}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-medium text-slate-700 pr-1 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="Log out"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger & Stats */}
          <div className="flex md:hidden items-center">
            {user && (
              <div className="flex items-center space-x-2 mr-3">
                <div className="flex items-center space-x-0.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-100">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{user.streak}d</span>
                </div>
                <div className="flex items-center space-x-0.5 bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-primary-100">
                  <Trophy className="w-3 h-3 text-primary-500" />
                  <span>{user.xp} XP</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div 
        id="mobile-menu"
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:hidden border-t border-slate-200/80 bg-white/98 backdrop-blur-md px-4 pt-2 pb-6 space-y-1 shadow-lg`}
      >
        <nav aria-label="Mobile Navigation">
          <ul className="space-y-1">
            {primaryLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      active
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user ? (
          <div className="pt-4 mt-4 border-t border-slate-200 space-y-2">
            <Link
              to="/profile"
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isActive('/profile') ? 'text-primary-700 bg-primary-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="w-4 h-4 text-slate-500" />
              <span>My Profile ({user.name})</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col space-y-2">
            <Link
              to="/login"
              className="w-full text-center py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="w-full text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
