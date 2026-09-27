/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, ArrowLeft } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const NotFound: React.FC = () => {
  useDocumentTitle('Page Not Found');
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Compass Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-400 mx-auto"
        >
          <Compass className="w-8 h-8 text-slate-500 animate-pulse" aria-hidden="true" />
        </motion.div>

        {/* Text Section */}
        <div className="space-y-2">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[11px] font-mono font-bold text-primary-600 uppercase tracking-widest"
          >
            404 Error
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-display text-3xl font-bold text-slate-900 tracking-tight"
          >
            Page Not Found
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-sans leading-relaxed"
          >
            The page you are looking for doesn't exist, has been moved, or is temporarily unavailable. Let's get you back on track.
          </motion.p>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-2"
        >
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Return to Home</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
