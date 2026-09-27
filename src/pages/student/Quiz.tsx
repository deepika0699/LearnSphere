/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { MOCK_COURSES, MOCK_QUIZZES } from '../../constants/data';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Award, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const Quiz: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { state, completeQuiz, addCertificate } = useApp();
  const { user } = state;

  const course = MOCK_COURSES.find((c) => c.id === courseId);
  const quiz = courseId ? MOCK_QUIZZES[courseId] : null;
  useDocumentTitle(quiz ? quiz.title : 'Final Exam');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [showFeedback, setShowFeedback] = useState<{ [qId: string]: boolean }>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  if (!course || !quiz) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-slate-800">Assessment not found</h2>
        <p className="text-slate-500">The exam for this course is currently not ready or missing.</p>
        <Link to="/courses" className="mt-4 inline-flex items-center text-primary-600 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const selectedOptionIndex = selectedAnswers[currentQuestion.id];
  const hasAnsweredCurrent = selectedOptionIndex !== undefined;

  const handleSelectOption = (optionIndex: number) => {
    if (hasAnsweredCurrent) return; // Prevent changing after selection to show proper feedback loop
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex,
    });
    setShowFeedback({
      ...showFeedback,
      [currentQuestion.id]: true,
    });
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    // Calculate total correct
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePct >= 66; // 66% threshold (2 out of 3, or all for short ones)

    completeQuiz(course.id, scorePct, passed);

    if (passed) {
      addCertificate(course.id, course.title);
    }

    setIsQuizSubmitted(true);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowFeedback({});
    setIsQuizSubmitted(false);
  };

  // If already submitted, display the summary report
  if (isQuizSubmitted) {
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    const scorePct = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePct >= 66;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6 shadow-sm"
        >
          {passed ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto border border-green-100 shadow-xs">
                <Award className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Congratulations, {user?.name || 'Scholar'}!
                </h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  You successfully cleared the <strong>{course.title}</strong> final exam!
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm mx-auto flex justify-between items-center font-mono text-xs">
                <span className="text-slate-500">YOUR SCORE:</span>
                <span className="text-green-600 font-bold">{scorePct}% PASSED</span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
                <Link
                  to="/certificates"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-colors shadow-xs"
                >
                  <Award className="w-4 h-4 mr-1.5" /> Claim Your Certificate
                </Link>
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-5 py-3 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-xs">
                <XCircle className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                  Keep learning, try again!
                </h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  You scored <strong>{scorePct}%</strong>. A minimum score of 70% is required to secure your professional credential.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm mx-auto flex justify-between items-center font-mono text-xs">
                <span className="text-slate-500">REQUIRED: 70%</span>
                <span className="text-red-500 font-bold">{scorePct}% UNRESOLVED</span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
                <button
                  onClick={handleRetry}
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" /> Retry Assessment
                </button>
                <Link
                  to={`/courses/${course.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-5 py-3 rounded-lg transition-colors"
                >
                  Review Course
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header telemetry info */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5 mb-8">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
            EXAM / {course.category.toUpperCase()}
          </span>
          <h2 className="font-display font-bold text-md text-slate-900">
            {quiz.title}
          </h2>
        </div>
        <Link
          to={`/courses/${course.id}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Exit Exam
        </Link>
      </div>

      {/* Progress metrics */}
      <div className="mb-6 flex justify-between items-center text-xs font-mono font-semibold text-slate-400">
        <span>QUESTION {currentIndex + 1} OF {quiz.questions.length}</span>
        <span>{Math.round(((currentIndex) / quiz.questions.length) * 100)}% COMPLETE</span>
      </div>

      {/* Progress Bar slider */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-8 border border-slate-200">
        <div
          className="bg-primary-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Question Canvas Card */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
          <h3 className="font-display font-semibold text-lg sm:text-xl text-slate-900 leading-snug">
            {currentQuestion.text}
          </h3>
        </div>

        {/* Options box */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const isCorrect = idx === currentQuestion.correctAnswerIndex;
            const hasSelectedThisQuestion = selectedOptionIndex !== undefined;

            let optionStyle = 'border-slate-200 bg-white hover:border-slate-300';
            let checkIcon = null;

            if (hasSelectedThisQuestion) {
              if (isSelected) {
                if (isCorrect) {
                  optionStyle = 'border-green-500 bg-green-50 text-green-900';
                  checkIcon = <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />;
                } else {
                  optionStyle = 'border-red-500 bg-red-50 text-red-900';
                  checkIcon = <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />;
                }
              } else if (isCorrect) {
                // Show where correct answer was to the student for visual educational value
                optionStyle = 'border-green-300 bg-green-50/50 text-green-800';
                checkIcon = <CheckCircle2 className="w-4 h-4 text-green-500/70 flex-shrink-0 mt-0.5" />;
              } else {
                optionStyle = 'border-slate-100 bg-slate-50/20 text-slate-400';
              }
            } else if (isSelected) {
              optionStyle = 'border-primary-600 bg-primary-50 text-primary-900';
            }

            return (
              <button
                key={idx}
                disabled={hasSelectedThisQuestion}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 border rounded-xl text-xs sm:text-sm font-medium transition-all flex items-start justify-between space-x-3 ${optionStyle}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="font-mono text-slate-400 bg-slate-50 border border-slate-200 rounded-sm w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed">{option}</span>
                </div>
                {checkIcon}
              </button>
            );
          })}
        </div>

        {/* Real-time explanations feedback box */}
        <AnimatePresence>
          {showFeedback[currentQuestion.id] && currentQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 bg-slate-100 border border-slate-200 rounded-xl space-y-2 text-xs"
            >
              <div className="font-bold text-slate-800 font-mono">EDUCATIONAL ANALYSIS:</div>
              <p className="text-slate-600 leading-relaxed font-sans">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Footer controls */}
        <div className="pt-4 flex justify-end">
          {hasAnsweredCurrent && (
            currentIndex < quiz.questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors group"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition-colors shadow-xs"
              >
                Submit Assessment
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
