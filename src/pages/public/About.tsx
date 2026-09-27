/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Award, CheckCircle, Users } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const About: React.FC = () => {
  useDocumentTitle('About Us');
  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-primary-100"
          >
            <Users className="w-3.5 h-3.5 text-primary-600" />
            <span>Our Mission</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl font-bold text-slate-900 tracking-tight"
          >
            Empowering Your Professional Journey
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 text-md sm:text-lg max-w-2xl mx-auto font-sans leading-relaxed"
          >
            LearnSphere is a modern self-learning and assessment platform built for developers, designers, and tech professionals to master real-world skills.
          </motion.p>
        </div>

        {/* Pillars section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-slate-900 text-base">Structured Curricula</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our educational tracks are designed from the ground up to follow modern standards and solid technical foundations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-slate-900 text-base">Rigorous Evaluations</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify your learning progress with comprehensive quiz assessments built specifically for each technical topic.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-slate-900 text-base">Verifiable Certificates</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pass qualifying assessments to earn custom certificates of achievement to showcase your validated skill sets.
            </p>
          </div>
        </div>

        {/* Story section */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">Why LearnSphere?</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            We believe that educational access should be universal, structured, and focused. Rather than overwhelming learners with endless unconnected video tutorials, LearnSphere targets core conceptual mastery through deliberate practice, immediate assessment feedback, and measurable progress tracking.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            Whether you are starting from zero or sharpening advanced engineering patterns, our modern self-paced environment helps you build a solid foundation of expertise.
          </p>
        </div>
      </div>
    </div>
  );
};
