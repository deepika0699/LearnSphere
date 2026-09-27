/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useId } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  adminApi,
  AssessmentAuthorData,
  AssessmentAuthorQuestion,
  AssessmentAuthorOption,
  CreateAssessmentPayload,
  UpdateAssessmentPayload,
  AssessmentType,
  AssessmentStatus,
} from '../../services/api';
import { AssessmentPreviewModal } from './AssessmentPreviewModal';
import { LoadingSpinner } from '../LoadingSpinner';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCheck,
  HelpCircle,
  Code,
  ListOrdered,
  Clock,
  Award,
  Layers,
  Sparkles,
  Info,
  Eye,
} from 'lucide-react';

/**
 * Generates a valid 24-hex-character MongoDB ObjectId for client-side new items.
 * Guaranteed to satisfy MongoDB ObjectId requirements and match correctOptionId validation.
 */
export function generateMongoId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const chars = '0123456789abcdef';
  let random = '';
  for (let i = 0; i < 16; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return timestamp + random;
}

interface AssessmentAuthoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle?: string;
  assessment?: AssessmentAuthorData | null;
  onSaved: (savedAssessment: AssessmentAuthorData) => void;
  mode?: 'creator' | 'admin';
}

interface ModuleOption {
  id: string;
  title: string;
  order: number;
}

interface TopicOption {
  id: string;
  moduleId: string;
  title: string;
  order: number;
}

export const AssessmentAuthoringModal: React.FC<AssessmentAuthoringModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  assessment,
  onSaved,
  mode = 'creator',
}) => {
  const { accessToken } = useApp();
  const isEdit = Boolean(assessment && assessment.id);

  // Hierarchy Options State
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState<boolean>(false);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<AssessmentType>('topic');
  const [moduleId, setModuleId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [passingScore, setPassingScore] = useState<number>(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(0);
  const [maxAttempts, setMaxAttempts] = useState<number>(0);
  const [status, setStatus] = useState<AssessmentStatus>('draft');

  // Questions State
  const [questions, setQuestions] = useState<AssessmentAuthorQuestion[]>([]);

  // Active question being edited or viewed in tabs
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Validation & Submission State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteConfirmQuestionIndex, setDeleteConfirmQuestionIndex] = useState<number | null>(null);
  const [showDraftPreview, setShowDraftPreview] = useState<boolean>(false);

  // Unique accessible IDs
  const titleInputId = useId();
  const descInputId = useId();
  const moduleSelectId = useId();
  const topicSelectId = useId();
  const passingScoreInputId = useId();
  const timeLimitInputId = useId();
  const maxAttemptsInputId = useId();

  // Load modules and topics for hierarchy selection
  const loadHierarchy = useCallback(async () => {
    if (!accessToken || !courseId) return;

    setLoadingHierarchy(true);
    setHierarchyError(null);
    try {
      if (mode === 'admin') {
        const structure = await adminApi.getCourseStructure(accessToken, courseId);
        const loadedModules: ModuleOption[] = (structure.modules || []).map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
        }));
        setModules(loadedModules);

        const loadedTopics: TopicOption[] = [];
        (structure.modules || []).forEach((m) => {
          (m.topics || []).forEach((t) => {
            loadedTopics.push({
              id: t.id,
              moduleId: m.id,
              title: t.title,
              order: t.order,
            });
          });
        });
        setTopics(loadedTopics);
      } else {
        const loadedModules = await courseCreatorApi.getModules(accessToken, courseId);
        const mappedModules: ModuleOption[] = loadedModules.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
        }));
        setModules(mappedModules);

        // Fetch topics for all modules
        const allTopics: TopicOption[] = [];
        for (const mod of loadedModules) {
          try {
            const modTopics = await courseCreatorApi.getTopics(accessToken, courseId, mod.id);
            modTopics.forEach((t) => {
              allTopics.push({
                id: t.id,
                moduleId: mod.id,
                title: t.title,
                order: t.order,
              });
            });
          } catch {
            // Ignore module with empty topics
          }
        }
        setTopics(allTopics);
      }
    } catch (err: any) {
      setHierarchyError(err?.message || 'Failed to load course modules and topics');
    } finally {
      setLoadingHierarchy(false);
    }
  }, [accessToken, courseId, mode]);

  // Initialize or reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      loadHierarchy();

      if (assessment) {
        setTitle(assessment.title || '');
        setDescription(assessment.description || '');
        setType(assessment.type || 'topic');
        setModuleId(assessment.moduleId || '');
        setTopicId(assessment.topicId || '');
        setPassingScore(typeof assessment.passingScore === 'number' ? assessment.passingScore : 70);
        setTimeLimitMinutes(typeof assessment.timeLimitMinutes === 'number' ? assessment.timeLimitMinutes : 0);
        setMaxAttempts(typeof assessment.maxAttempts === 'number' ? assessment.maxAttempts : 0);
        setStatus(assessment.status || 'draft');

        // Questions from backend
        if (Array.isArray(assessment.questions) && assessment.questions.length > 0) {
          setQuestions(
            assessment.questions.map((q, idx) => ({
              id: q.id || q._id || generateMongoId(),
              prompt: q.prompt || '',
              codeSnippet: q.codeSnippet || '',
              explanation: q.explanation || '',
              order: typeof q.order === 'number' ? q.order : idx,
              options: (q.options || []).map((opt, optIdx) => ({
                id: opt.id || opt._id || generateMongoId(),
                text: opt.text || '',
                order: typeof opt.order === 'number' ? opt.order : optIdx,
              })),
              correctOptionId: q.correctOptionId || (q.options?.[0]?.id || ''),
            }))
          );
        } else {
          // Default initial question
          const defaultOpt1 = generateMongoId();
          const defaultOpt2 = generateMongoId();
          setQuestions([
            {
              id: generateMongoId(),
              prompt: '',
              codeSnippet: '',
              explanation: '',
              order: 0,
              options: [
                { id: defaultOpt1, text: '', order: 0 },
                { id: defaultOpt2, text: '', order: 1 },
              ],
              correctOptionId: defaultOpt1,
            },
          ]);
        }
      } else {
        // Brand new assessment
        setTitle('');
        setDescription('');
        setType('topic');
        setModuleId('');
        setTopicId('');
        setPassingScore(70);
        setTimeLimitMinutes(0);
        setMaxAttempts(0);
        setStatus('draft');

        const defaultOpt1 = generateMongoId();
        const defaultOpt2 = generateMongoId();
        setQuestions([
          {
            id: generateMongoId(),
            prompt: '',
            codeSnippet: '',
            explanation: '',
            order: 0,
            options: [
              { id: defaultOpt1, text: '', order: 0 },
              { id: defaultOpt2, text: '', order: 1 },
            ],
            correctOptionId: defaultOpt1,
          },
        ]);
      }

      setActiveQuestionIndex(0);
      setValidationError(null);
      setServerError(null);
      setDeleteConfirmQuestionIndex(null);
    }
  }, [isOpen, assessment, loadHierarchy]);

  // When type changes, adjust defaults
  const handleTypeChange = (newType: AssessmentType) => {
    setType(newType);
    if (newType === 'course') {
      setModuleId('');
      setTopicId('');
      if (!isEdit && maxAttempts === 0) {
        setMaxAttempts(3); // Standard default for course finals
      }
    } else {
      if (!isEdit && maxAttempts === 3) {
        setMaxAttempts(0); // Standard unlimited for topic quizzes
      }
    }
  };

  // Filter topics for the currently selected module
  const availableTopics = topics.filter((t) => t.moduleId === moduleId);

  // Module change handler: resets topicId if current topic is not in the new module
  const handleModuleChange = (newModId: string) => {
    setModuleId(newModId);
    const validTopicInModule = topics.find((t) => t.moduleId === newModId && t.id === topicId);
    if (!validTopicInModule) {
      setTopicId('');
    }
  };

  // ---------------------------------------------------------------------------
  // QUESTION MANAGEMENT ACTIONS
  // ---------------------------------------------------------------------------

  const handleAddQuestion = () => {
    const newOpt1 = generateMongoId();
    const newOpt2 = generateMongoId();
    const newQ: AssessmentAuthorQuestion = {
      id: generateMongoId(),
      prompt: '',
      codeSnippet: '',
      explanation: '',
      order: questions.length,
      options: [
        { id: newOpt1, text: '', order: 0 },
        { id: newOpt2, text: '', order: 1 },
      ],
      correctOptionId: newOpt1,
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  const handleRemoveQuestion = (indexToRemove: number) => {
    if (questions.length <= 1) {
      setValidationError('An assessment must have at least one question.');
      return;
    }

    setQuestions((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      return updated.map((q, idx) => ({ ...q, order: idx }));
    });

    if (activeQuestionIndex >= questions.length - 1) {
      setActiveQuestionIndex(Math.max(0, questions.length - 2));
    }
    setDeleteConfirmQuestionIndex(null);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((q, idx) => ({ ...q, order: idx }));
    });
    setActiveQuestionIndex(targetIndex);
  };

  const handleUpdateQuestion = (index: number, field: keyof AssessmentAuthorQuestion, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // ---------------------------------------------------------------------------
  // OPTION MANAGEMENT ACTIONS
  // ---------------------------------------------------------------------------

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const currentQ = copy[qIndex];
      if (currentQ.options.length >= 8) return prev; // sane cap

      const newOpt: AssessmentAuthorOption = {
        id: generateMongoId(),
        text: '',
        order: currentQ.options.length,
      };

      copy[qIndex] = {
        ...currentQ,
        options: [...currentQ.options, newOpt],
      };
      return copy;
    });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const currentQ = copy[qIndex];
      if (currentQ.options.length <= 2) {
        setValidationError(`Question ${qIndex + 1} must have at least 2 options.`);
        return prev;
      }

      const optToRemove = currentQ.options[optIndex];
      const updatedOptions = currentQ.options
        .filter((_, idx) => idx !== optIndex)
        .map((opt, idx) => ({ ...opt, order: idx }));

      // If removed option was the correctOptionId, default to first remaining
      let newCorrectId = currentQ.correctOptionId;
      if (currentQ.correctOptionId === optToRemove.id) {
        newCorrectId = updatedOptions[0]?.id || '';
      }

      copy[qIndex] = {
        ...currentQ,
        options: updatedOptions,
        correctOptionId: newCorrectId,
      };
      return copy;
    });
  };

  const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const currentQ = copy[qIndex];
      const updatedOptions = [...currentQ.options];
      updatedOptions[optIndex] = {
        ...updatedOptions[optIndex],
        text,
      };
      copy[qIndex] = {
        ...currentQ,
        options: updatedOptions,
      };
      return copy;
    });
  };

  const handleSetCorrectOption = (qIndex: number, optId: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = {
        ...copy[qIndex],
        correctOptionId: optId,
      };
      return copy;
    });
  };

  // ---------------------------------------------------------------------------
  // SUBMISSION & VALIDATION
  // ---------------------------------------------------------------------------

  const validateForm = (): string | null => {
    if (!title.trim() || title.trim().length < 3 || title.trim().length > 200) {
      return 'Title is required and must be between 3 and 200 characters.';
    }

    if (description && description.trim().length > 2000) {
      return 'Description cannot exceed 2000 characters.';
    }

    if (type === 'topic') {
      if (!moduleId) {
        return 'Please select a module for this topic assessment.';
      }
      if (!topicId) {
        return 'Please select a topic for this topic assessment.';
      }
    }

    if (passingScore < 0 || passingScore > 100) {
      return 'Passing score must be between 0% and 100%.';
    }

    if (timeLimitMinutes < 0 || timeLimitMinutes > 300) {
      return 'Time limit must be between 0 (untimed) and 300 minutes.';
    }

    if (maxAttempts < 0 || maxAttempts > 100) {
      return 'Max attempts must be between 0 (unlimited) and 100.';
    }

    if (questions.length === 0) {
      return 'The assessment must contain at least 1 question.';
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim() || q.prompt.trim().length < 3 || q.prompt.trim().length > 5000) {
        return `Question ${i + 1} prompt must be between 3 and 5000 characters.`;
      }
      if (q.codeSnippet && q.codeSnippet.length > 10000) {
        return `Question ${i + 1} code snippet cannot exceed 10000 characters.`;
      }
      if (q.explanation && q.explanation.length > 2000) {
        return `Question ${i + 1} explanation cannot exceed 2000 characters.`;
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return `Question ${i + 1} must have at least 2 options.`;
      }
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (!opt.text.trim() || opt.text.trim().length > 1000) {
          return `Question ${i + 1}, Option ${j + 1} text cannot be empty (max 1000 characters).`;
        }
      }
      if (!q.correctOptionId || !q.options.some((o) => o.id === q.correctOptionId)) {
        return `Question ${i + 1} must have one option designated as the correct answer.`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !courseId) return;

    setValidationError(null);
    setServerError(null);

    const errorMsg = validateForm();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    // Prepare payload
    const normalizedQuestions: AssessmentAuthorQuestion[] = questions.map((q, qIdx) => ({
      id: q.id || generateMongoId(),
      prompt: q.prompt.trim(),
      codeSnippet: q.codeSnippet?.trim() || '',
      explanation: q.explanation?.trim() || '',
      order: qIdx,
      options: q.options.map((opt, optIdx) => ({
        id: opt.id || generateMongoId(),
        text: opt.text.trim(),
        order: optIdx,
      })),
      correctOptionId: q.correctOptionId,
    }));

    const payload: CreateAssessmentPayload | UpdateAssessmentPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      moduleId: type === 'topic' ? moduleId : null,
      topicId: type === 'topic' ? topicId : null,
      status,
      passingScore: Number(passingScore),
      timeLimitMinutes: Number(timeLimitMinutes),
      maxAttempts: Number(maxAttempts),
      questions: normalizedQuestions,
    };

    setIsSubmitting(true);
    try {
      let saved: AssessmentAuthorData;
      if (mode === 'admin') {
        if (isEdit && assessment) {
          saved = await adminApi.updateAssessment(accessToken, assessment.id, payload);
        } else {
          saved = await adminApi.createAssessment(accessToken, courseId, payload as CreateAssessmentPayload);
        }
      } else {
        if (isEdit && assessment) {
          saved = await courseCreatorApi.updateAssessment(
            accessToken,
            courseId,
            assessment.id,
            payload
          );
        } else {
          saved = await courseCreatorApi.createAssessment(
            accessToken,
            courseId,
            payload as CreateAssessmentPayload
          );
        }
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setServerError(err?.message || 'Failed to save assessment. Please check requirements.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[activeQuestionIndex];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="assessment-modal-title" className="text-base font-bold text-slate-900 font-display">
                {isEdit ? 'Edit Assessment' : 'Create New Assessment'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{courseTitle || 'Course Assessment'}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{mode} Mode</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close authoring dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error banners */}
          {validationError && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Validation Note</span>
                <span>{validationError}</span>
              </div>
            </div>
          )}

          {serverError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Save Failed</span>
                <span>{serverError}</span>
              </div>
            </div>
          )}

          {hierarchyError && (
            <div className="p-3 rounded-lg bg-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>{hierarchyError}</span>
              <button
                type="button"
                onClick={loadHierarchy}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Retry loading
              </button>
            </div>
          )}

          {/* SECTION 1: Assessment Metadata & Hierarchy */}
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. General Configuration
              </h3>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => handleTypeChange('topic')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    type === 'topic'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Topic Assessment
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('course')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    type === 'course'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Course Final
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor={titleInputId} className="block text-xs font-semibold text-slate-700">
                  Assessment Title <span className="text-red-500">*</span>
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Asynchronous Programming Mastery Quiz"
                  required
                  maxLength={200}
                  className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <div className="flex justify-end text-[10px] text-slate-400">
                  {title.length}/200
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor={descInputId} className="block text-xs font-semibold text-slate-700">
                  Instructions & Description
                </label>
                <textarea
                  id={descInputId}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain guidelines, covered learning objectives, and rules for test-takers."
                  maxLength={2000}
                  className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              {/* Hierarchy Dropdowns (Shown only for topic assessments) */}
              {type === 'topic' ? (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor={moduleSelectId} className="block text-xs font-semibold text-slate-700">
                      Target Module <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={moduleSelectId}
                      value={moduleId}
                      onChange={(e) => handleModuleChange(e.target.value)}
                      required
                      disabled={loadingHierarchy || modules.length === 0}
                      className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">Select a Module</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={topicSelectId} className="block text-xs font-semibold text-slate-700">
                      Target Topic <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={topicSelectId}
                      value={topicId}
                      onChange={(e) => setTopicId(e.target.value)}
                      required
                      disabled={!moduleId || availableTopics.length === 0}
                      className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">
                        {!moduleId
                          ? 'Select a module first'
                          : availableTopics.length === 0
                          ? 'No topics in this module'
                          : 'Select a Topic'}
                      </option>
                      {availableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-slate-600 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Course-level assessments evaluate overall curriculum mastery and are linked directly to the course root (no topic or module attachment).
                  </span>
                </div>
              )}

              {/* Numerical Rules & Status */}
              <div className="space-y-1.5">
                <label htmlFor={passingScoreInputId} className="block text-xs font-semibold text-slate-700">
                  Passing Score (%)
                </label>
                <div className="relative">
                  <input
                    id={passingScoreInputId}
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-full pl-3 pr-8 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-semibold">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={timeLimitInputId} className="block text-xs font-semibold text-slate-700">
                  Time Limit (Minutes)
                </label>
                <div className="relative">
                  <input
                    id={timeLimitInputId}
                    type="number"
                    min={0}
                    max={300}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Math.max(0, Math.min(300, Number(e.target.value))))}
                    className="w-full pl-3 pr-12 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-400">
                    {timeLimitMinutes === 0 ? 'Untimed' : 'Mins'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={maxAttemptsInputId} className="block text-xs font-semibold text-slate-700">
                  Max Attempts Allowed
                </label>
                <div className="relative">
                  <input
                    id={maxAttemptsInputId}
                    type="number"
                    min={0}
                    max={100}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-full pl-3 pr-14 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-400">
                    {maxAttempts === 0 ? 'Unlimited' : 'Attempts'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Publication Status
                </label>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`flex-1 py-1 font-medium rounded-md transition-colors ${
                      status === 'draft'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`flex-1 py-1 font-medium rounded-md transition-colors ${
                      status === 'published'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('archived')}
                    className={`flex-1 py-1 font-medium rounded-md transition-colors ${
                      status === 'archived'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Archived
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Questions & Options Authoring */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Questions & Answer Keys ({questions.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Design multiple choice questions and designate the server-verified correct option.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {/* Question Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {questions.map((q, idx) => {
                const isComplete =
                  q.prompt.trim().length >= 3 &&
                  q.options.length >= 2 &&
                  q.options.every((o) => o.text.trim().length > 0) &&
                  Boolean(q.correctOptionId);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      activeQuestionIndex === idx
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Q{idx + 1}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isComplete ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      title={isComplete ? 'Complete' : 'Needs attention'}
                    />
                  </button>
                );
              })}
            </div>

            {/* Active Question Editor Card */}
            {currentQ && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                {/* Active Question Toolbar */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {activeQuestionIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Question #{activeQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={activeQuestionIndex === 0}
                      onClick={() => handleMoveQuestion(activeQuestionIndex, 'up')}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-200/60 disabled:opacity-30 transition-colors"
                      title="Move Question Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={activeQuestionIndex === questions.length - 1}
                      onClick={() => handleMoveQuestion(activeQuestionIndex, 'down')}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-200/60 disabled:opacity-30 transition-colors"
                      title="Move Question Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmQuestionIndex === activeQuestionIndex ? (
                      <div className="flex items-center space-x-1 bg-red-50 p-1 rounded-md border border-red-200">
                        <span className="text-[10px] text-red-700 font-semibold px-1">Confirm delete?</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(activeQuestionIndex)}
                          className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmQuestionIndex(null)}
                          className="px-1 text-[10px] text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={questions.length <= 1}
                        onClick={() => setDeleteConfirmQuestionIndex(activeQuestionIndex)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 disabled:opacity-30 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Question Prompt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={currentQ.prompt}
                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'prompt', e.target.value)}
                    placeholder="Enter the question prompt here..."
                    required
                    maxLength={5000}
                    className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                  <div className="flex justify-end text-[10px] text-slate-400">
                    {currentQ.prompt.length}/5000
                  </div>
                </div>

                {/* Code Snippet (Optional) */}
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                    <Code className="w-3.5 h-3.5 text-slate-500" />
                    <span>Code Snippet (Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={currentQ.codeSnippet || ''}
                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'codeSnippet', e.target.value)}
                    placeholder="e.g. const sum = (a, b) => a + b;"
                    maxLength={10000}
                    className="w-full px-3.5 py-2 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Answer Options (Select the radio of the correct answer) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      disabled={currentQ.options.length >= 8}
                      onClick={() => handleAddOption(activeQuestionIndex)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold disabled:opacity-40"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const isCorrect = currentQ.correctOptionId === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg border transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <label
                            className="flex items-center space-x-1.5 cursor-pointer shrink-0"
                            title="Mark as correct answer"
                          >
                            <input
                              type="radio"
                              name={`correct-option-${activeQuestionIndex}`}
                              checked={isCorrect}
                              onChange={() => handleSetCorrectOption(activeQuestionIndex, opt.id || '')}
                              className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-slate-500 uppercase">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              handleUpdateOptionText(activeQuestionIndex, optIdx, e.target.value)
                            }
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)} text...`}
                            required
                            maxLength={1000}
                            className="flex-1 px-3 py-1.5 text-xs text-slate-900 bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-hidden"
                          />

                          {isCorrect && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                              Correct Key
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={currentQ.options.length <= 2}
                            onClick={() => handleRemoveOption(activeQuestionIndex, optIdx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded disabled:opacity-20 shrink-0"
                            title="Remove option"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation (Optional) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Answer Explanation (Revealed only after final submission)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={currentQ.explanation || ''}
                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, 'explanation', e.target.value)}
                    placeholder="Provide detailed reasoning for test-takers after they finalize their attempt."
                    maxLength={2000}
                    className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {questions.length} question{questions.length !== 1 ? 's' : ''} configured
            </span>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowDraftPreview(true)}
                disabled={isSubmitting || questions.length === 0}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
                title="Preview questions in student or answer-key mode"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Assessment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isEdit ? 'Update Assessment' : 'Create Assessment'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Draft Preview Modal */}
      {showDraftPreview && (
        <AssessmentPreviewModal
          isOpen={showDraftPreview}
          onClose={() => setShowDraftPreview(false)}
          assessment={{
            id: assessment?.id || 'draft-preview',
            title: title || 'Untitled Assessment',
            description,
            courseId,
            type,
            moduleId: type === 'topic' ? moduleId : null,
            topicId: type === 'topic' ? topicId : null,
            status,
            passingScore: Number(passingScore),
            timeLimitMinutes: Number(timeLimitMinutes),
            maxAttempts: Number(maxAttempts),
            questionsCount: questions.length,
            questions,
          }}
          mode={mode}
        />
      )}
    </div>
  );
};

export default AssessmentAuthoringModal;
