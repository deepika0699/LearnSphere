/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { User, Sparkles, Trophy, Flame, Save } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const Profile: React.FC = () => {
  useDocumentTitle('Settings & Identity');
  const { state, updateProfile } = useApp();
  const { user } = state;

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTitle(user.title || '');
      setBio(user.bio || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-slate-800 font-display">Access Denied</h2>
        <p className="text-slate-500">Please sign in to view your professional developer profile.</p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, title, bio);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header section */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          Settings & Identity
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Manage your student credentials, bios, and review historical performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs text-center space-y-4">
            <div className="relative inline-block">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-primary-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1.5 -right-1.5 bg-primary-600 text-white rounded-full p-1 border border-white" title="Active Scholar">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h2 className="font-display font-bold text-md text-slate-900 leading-snug">{user.name}</h2>
              {user.title && <p className="text-xs text-slate-500 font-mono font-medium pt-1">{user.title.toUpperCase()}</p>}
            </div>

            <p className="text-xs text-slate-500 font-sans italic leading-relaxed">
              "{user.bio || 'Student seeking complete frontend mastery.'}"
            </p>

            <div className="pt-4 border-t border-slate-100 flex justify-around text-center text-xs">
              <div>
                <div className="font-bold text-slate-800 flex items-center justify-center space-x-1">
                  <Trophy className="w-3.5 h-3.5 text-primary-500" />
                  <span>{user.xp}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">TOTAL XP</span>
              </div>
              <div className="border-r border-slate-200" />
              <div>
                <div className="font-bold text-slate-800 flex items-center justify-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{user.streak}d</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">STREAK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Edit forms */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <h3 className="font-display font-semibold text-sm text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
              Edit Account Bio
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {saveSuccess && (
                <div className="p-3.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 font-semibold flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label htmlFor="title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Junior Developer"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Short Biography
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your learning goals..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-slate-50/50"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Updates</span>
                </button>
              </div>
            </form>
          </div>

          {/* User History Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
              Account Registration Metadata
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 border border-slate-100 bg-slate-50/40 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                <span className="text-slate-800 font-semibold">{user.email}</span>
              </div>
              <div className="p-3 border border-slate-100 bg-slate-50/40 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Role</span>
                <span className="text-slate-800 font-semibold">Student</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
