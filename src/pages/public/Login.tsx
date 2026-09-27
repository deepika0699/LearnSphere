/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

/**
 * Safely resolves the post-login destination path based on the authoritative user role
 * and any validated internal return path passed in location state.
 * Strictly prevents open-redirects, protocol injection, and cross-role routing mismatches.
 */
function getSafeRedirectPath(userRole: string, fromPath?: string): string {
  const isValidInternalPath =
    typeof fromPath === 'string' &&
    fromPath.startsWith('/') &&
    !fromPath.startsWith('//') &&
    !fromPath.startsWith('/\\') &&
    !fromPath.includes(':');

  if (userRole === 'admin') {
    if (isValidInternalPath && fromPath.startsWith('/admin')) {
      return fromPath;
    }
    return '/admin/dashboard';
  }

  if (userRole === 'courseCreator') {
    if (isValidInternalPath && fromPath.startsWith('/creator')) {
      return fromPath;
    }
    return '/creator/dashboard';
  }

  // Student role
  if (
    isValidInternalPath &&
    !fromPath.startsWith('/admin') &&
    !fromPath.startsWith('/creator') &&
    fromPath !== '/login' &&
    fromPath !== '/signup'
  ) {
    return fromPath;
  }

  return '/dashboard';
}

export const Login: React.FC = () => {
  useDocumentTitle('Log In');
  const { state, login, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated with authoritative role, navigate to appropriate area
  useEffect(() => {
    if (isAuthenticated && state.user) {
      const fromPath = (location.state as any)?.from?.pathname;
      const targetPath = getSafeRedirectPath(state.user.role, fromPath);
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, state.user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success && result.user) {
      const fromPath = (location.state as any)?.from?.pathname;
      const targetPath = getSafeRedirectPath(result.user.role, fromPath);
      navigate(targetPath, { replace: true });
    } else {
      setError(result.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white font-display font-bold text-2xl shadow-sm mb-4">
            L
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Welcome to LearnSphere
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue your professional development
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 shadow-sm sm:rounded-xl sm:px-10 space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  placeholder="name@domain.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Name (Optional)
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-slate-50/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Forgot?
                </a>
              </div>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Continue with Email'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
