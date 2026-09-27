/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AssessmentAuthorData,
  AssessmentAuthorQuestion,
} from '../../services/api';
import {
  X,
  Eye,
  CheckCircle2,
  HelpCircle,
  Code,
  Clock,
  Award,
  Layers,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface AssessmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentAuthorData | null;
  mode?: 'creator' | 'admin';
}

export const AssessmentPreviewModal: React.FC<AssessmentPreviewModalProps> = ({
  isOpen,
  onClose,
  assessment,
  mode = 'creator',
}) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<'student' | 'instructor'>('student');
  const [simulatedAnswers, setSimulatedAnswers] = useState<Record<string, string>>({});

  if (!isOpen || !assessment) return null;

  const questions: AssessmentAuthorQuestion[] = assessment.questions || [];
  const currentQ = questions[activeQuestionIndex];

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSimulatedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="preview-modal-title" className="text-base font-bold text-slate-900 font-display">
                  Assessment Preview: {assessment.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="capitalize">{assessment.type} Assessment</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{assessment.status}</span>
                <span aria-hidden="true">·</span>
                <span>{questions.length} Question{questions.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('student')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  previewMode === 'student'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student View
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('instructor')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  previewMode === 'instructor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Answer Key View
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close preview modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informational Sub-header */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Passing: {assessment.passingScore}%
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              {assessment.timeLimitMinutes === 0 ? 'Untimed' : `${assessment.timeLimitMinutes} Mins`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              {assessment.maxAttempts === 0 ? 'Unlimited Attempts' : `Max ${assessment.maxAttempts} Attempts`}
            </span>
          </div>

          <div>
            {previewMode === 'student' ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Safe Student Simulation (Zero Keys Exposed)
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Author Master Key & Explanations Visible
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {questions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No questions have been configured for this assessment yet.
            </div>
          ) : (
            <>
              {/* Question Navigation Bar */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                  {questions.map((q, idx) => {
                    const qId = q.id || String(idx);
                    const isAnswered = Boolean(simulatedAnswers[qId]);
                    return (
                      <button
                        key={qId}
                        type="button"
                        onClick={() => setActiveQuestionIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                          activeQuestionIndex === idx
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : isAnswered
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Q{idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    disabled={activeQuestionIndex === 0}
                    onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 disabled:opacity-30"
                    title="Previous Question"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={activeQuestionIndex === questions.length - 1}
                    onClick={() => setActiveQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 disabled:opacity-30"
                    title="Next Question"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Question Display Card */}
              {currentQ && (
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        Question {activeQuestionIndex + 1} of {questions.length}
                      </span>
                      <h3 className="text-base font-semibold text-slate-900 leading-snug">
                        {currentQ.prompt}
                      </h3>
                    </div>
                  </div>

                  {/* Code Snippet Box */}
                  {currentQ.codeSnippet && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre">{currentQ.codeSnippet}</pre>
                    </div>
                  )}

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Answer Choices:
                    </label>
                    <div className="space-y-2">
                      {(currentQ.options || []).map((opt, optIdx) => {
                        const qId = currentQ.id || String(activeQuestionIndex);
                        const optId = opt.id || opt._id || String(optIdx);
                        const isSelected = simulatedAnswers[qId] === optId;
                        const isCorrectKey =
                          previewMode === 'instructor' && currentQ.correctOptionId === optId;

                        return (
                          <div
                            key={optId}
                            onClick={() => handleSelectOption(qId, optId)}
                            className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isCorrectKey
                                ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                                : isSelected
                                ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                                  isCorrectKey
                                    ? 'bg-emerald-600 text-white'
                                    : isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="text-xs text-slate-800 leading-relaxed">
                                {opt.text}
                              </span>
                            </div>

                            {/* Badges */}
                            {isCorrectKey && (
                              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Post-submission Explanation (Instructor View Only) */}
                  {previewMode === 'instructor' && currentQ.explanation && (
                    <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-1.5 animate-in fade-in-50 duration-150">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                        <HelpCircle className="w-4 h-4 text-indigo-600" />
                        <span>Explanation (Revealed to students after final submission)</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pl-5.5">
                        {currentQ.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {previewMode === 'student'
              ? 'Previewing as an enrolled student taking the assessment'
              : 'Auditing as author with verified master answer key'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPreviewModal;
