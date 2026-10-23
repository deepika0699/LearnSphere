/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, ShieldCheck, Zap, Sparkles, Star, ChevronRight, Flame, Trophy, Play, Award, BarChart3, ClipboardList } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { courseApi, PublicCourse } from '../../services/api';
import { CourseCard } from '../../components/CourseCard';

export const Home: React.FC = () => {
  useDocumentTitle('Self-Learning & Skills Validation');
  const { state } = useApp();
  const { user } = state;

  const [courses, setCourses] = useState<PublicCourse[]>([]);

  useEffect(() => {
    let isMounted = true;
    courseApi
      .getCourses({ limit: 3, page: 1 })
      .then((res) => {
        if (isMounted) {
          setCourses(res.courses || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCourses([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-white to-white opacity-70 z-0" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Education-focused Headline, Paragraph and CTAs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 text-left space-y-6"
            >
              <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-primary-100">
                <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                <span>Modern Self-Learning Platform</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.15]">
                Learn developer skills with structured paths &amp; <span className="text-primary-600">verifiable assessments.</span>
              </h1>

              <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-sans">
                Explore courses tailored to your professional interests, learn through structured lessons, and complete quizzes to evaluate your understanding. Easily track learning progress over time and earn certificates of achievement to showcase your expertise.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  to="/courses"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3.5 rounded-lg text-xs transition-all shadow-2xs group"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                
                {!user ? (
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-6 py-3.5 rounded-lg text-xs transition-colors shadow-2xs"
                  >
                    Get Started
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-6 py-3.5 rounded-lg text-xs transition-colors shadow-2xs"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Right Column: Realistic Dashboard Preview using purely React/Tailwind elements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-7"
            >
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm relative overflow-hidden">
                {/* Window top toolbar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-mono text-slate-400 font-bold tracking-wider pl-2 uppercase">LEARNSPHERE_PORTAL_PREVIEW</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-mono font-semibold text-green-600">LIVE STUDENT METRICS</span>
                  </div>
                </div>

                {/* Grid layout within mockup dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: Courses */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <BookOpen className="w-4 h-4 text-primary-500" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Courses</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800">
                          Program Catalog
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">
                          No courses available
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Lessons and study resources will appear here upon publication.
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/courses"
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] py-2 rounded-md block text-center transition-colors mt-2"
                    >
                      Browse Catalog
                    </Link>
                  </div>

                  {/* Card 2: Learning Progress */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <BarChart3 className="w-4 h-4 text-primary-500" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Learning Progress</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800">
                          Active Status
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">
                          Progress will appear after enrolling.
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Enrolling in active courses enables structured progress tracking and lesson completion.
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 text-slate-400 font-medium text-[10px] py-2 rounded-md text-center">
                      No Active Enrollment
                    </div>
                  </div>

                  {/* Card 3: Upcoming Assessments */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <ClipboardList className="w-4 h-4 text-primary-500" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Upcoming Assessments</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800">
                          Evaluations
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">
                          No assessments scheduled.
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Quizzes and assessments unlock as you complete the corresponding course lessons.
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 text-slate-400 font-medium text-[10px] py-2 rounded-md text-center">
                      Locked State
                    </div>
                  </div>

                  {/* Card 4: Certificates */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Award className="w-4 h-4 text-primary-500" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Certificates</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800">
                          Achievements
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-normal">
                          No certificates earned.
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Pass evaluations with a qualifying score to earn secure certificates of achievement.
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 text-slate-400 font-medium text-[10px] py-2 rounded-md text-center">
                      Not Earned Yet
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Philosophy Pillars Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
              Why LearnSphere is Different
            </h2>
            <p className="mt-4 text-slate-500 font-sans text-base leading-relaxed">
              We skip the superficial tutorials and focus on complete design integrity, rigorous technical logic, and immediate real-world validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-6 border border-primary-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">
                  SaaS & UI Aesthetics
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Understand spatial grids, type scales, and interaction physics. We build interfaces inspired directly by Notion, Linear, and Stripe.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-6 border border-primary-100">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">
                  Production-Ready Architecture
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  No toy applications. Master scalable structures, custom hook safety layers, precise re-render control, and enterprise routing.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-6 border border-primary-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">
                  Continuous Assessment
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Each course culminates in an interactive final examination. Test your logic, receive constructive explanations, and secure official LearnSphere credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Catalog Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
                Featured Courses
              </h2>
              <p className="mt-3 text-slate-500 text-sm">
                Acquire masterclass-level experience with expert-led courses.
              </p>
            </div>
            <Link
              to="/courses"
              className="mt-4 md:mt-0 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors group"
            >
              <span>View Full Catalog</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-2xs max-w-2xl mx-auto space-y-4">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-display font-bold text-lg text-slate-800">No courses have been published yet.</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Content will appear here once course creators begin publishing courses.
              </p>
              {!user && (
                <div className="pt-2">
                  <Link
                    to="/signup"
                    className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-2xs"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SaaS Style CTA Panel */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-xl p-8 md:p-12 text-center text-white relative overflow-hidden border border-slate-800">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Ready to transition from tutorial loops to real mastery?
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Unlock our curated paths, track your experience metrics, pass final course reviews, and generate permanent professional certificates.
              </p>
              <div className="pt-4">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-900 font-semibold px-6 py-3.5 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Explore Premium Classes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
