/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  courseCreatorApi,
  CourseCreatorTopicContentData,
  CourseCreatorTopicContentSection,
  CourseCreatorTopicCodeExample,
  CourseCreatorTopicImage,
  CourseCreatorTopicVideos,
  CourseCreatorTopicExternalReference,
  UpdateCourseCreatorTopicContentRequest,
} from '../../services/api';
import { LoadingSpinner } from '../LoadingSpinner';
import { FeedbackState } from '../FeedbackState';
import {
  FileText,
  Code2,
  ListChecks,
  Image as ImageIcon,
  Eye,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Copy,
  Check,
  Video,
  ExternalLink,
  Globe,
  Play,
  Languages,
  Youtube,
} from 'lucide-react';

interface CreatorTopicContentEditorProps {
  courseId: string;
  courseTitle?: string;
  moduleId: string;
  moduleTitle: string;
  topicId: string;
  topicTitle: string;
  onClose: () => void;
  onSaved?: (updatedContent: CourseCreatorTopicContentData) => void;
}

type TabType =
  | 'explanation'
  | 'sections'
  | 'code'
  | 'points'
  | 'images'
  | 'videos'
  | 'references'
  | 'preview';

const COMMON_LANGUAGES = [
  'c',
  'cpp',
  'python',
  'javascript',
  'typescript',
  'java',
  'sql',
  'html',
  'css',
  'bash',
  'json',
  'go',
  'rust',
];

/**
 * Validates whether a URL is a safe HTTP or HTTPS URL, rejecting script protocols.
 */
function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return false;
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !/[<>"'`;{}]/.test(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates whether an input string is a valid YouTube video reference:
 * Either an 11-character video ID or a valid YouTube URL (youtube.com, youtu.be, youtube-nocookie.com).
 * Mirrors backend courseCreatorTopicService.isValidYouTubeReference.
 */
export function isValidYouTubeUrl(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed || trimmed.length > 1000) return false;

  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return false;
  }

  // 11-character video ID (e.g. dQw4w9WgXcQ)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    const isYouTubeHost =
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be' ||
      host.endsWith('.youtu.be') ||
      host === 'youtube-nocookie.com' ||
      host.endsWith('.youtube-nocookie.com');

    if (!isYouTubeHost) return false;

    // Check youtu.be/<id>
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id);
    }

    // Check /watch?v=<id>
    if (parsed.pathname === '/watch') {
      const v = parsed.searchParams.get('v');
      return Boolean(v && /^[a-zA-Z0-9_-]{11}$/.test(v));
    }

    // Check /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const pathMatch = parsed.pathname.match(/^\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})/);
    if (pathMatch) {
      return true;
    }

    // Fallback if 'v' query param exists
    if (parsed.searchParams.has('v')) {
      const v = parsed.searchParams.get('v');
      return Boolean(v && /^[a-zA-Z0-9_-]{11}$/.test(v));
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Extracts 11-character video ID from a valid YouTube reference for safe embedding.
 */
export function extractYouTubeId(str: string): string | null {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    if (parsed.pathname === '/watch' || parsed.searchParams.has('v')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }
    const pathMatch = parsed.pathname.match(/^\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates whether an external reference URL uses http or https protocol and no script injection.
 */
export function isSafeReferenceUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 1000) return false;
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const CreatorTopicContentEditor: React.FC<CreatorTopicContentEditorProps> = ({
  courseId,
  courseTitle,
  moduleId,
  moduleTitle,
  topicId,
  topicTitle,
  onClose,
  onSaved,
}) => {
  const { accessToken } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('explanation');

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Raw Content Loaded from Server
  const [initialContent, setInitialContent] = useState<CourseCreatorTopicContentData | null>(null);

  // Local Form / Content State
  const [explanation, setExplanation] = useState<string>('');
  const [sections, setSections] = useState<CourseCreatorTopicContentSection[]>([]);
  const [codeExamples, setCodeExamples] = useState<CourseCreatorTopicCodeExample[]>([]);
  const [importantPoints, setImportantPoints] = useState<string[]>([]);
  const [images, setImages] = useState<CourseCreatorTopicImage[]>([]);

  // Videos State (English, Telugu, Hindi YouTube URLs or 11-char IDs)
  const [videoEnglish, setVideoEnglish] = useState<string>('');
  const [videoTelugu, setVideoTelugu] = useState<string>('');
  const [videoHindi, setVideoHindi] = useState<string>('');

  // External References State
  const [externalReferences, setExternalReferences] = useState<CourseCreatorTopicExternalReference[]>([]);

  // External Reference Modal States
  const [refModalMode, setRefModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeRefIndex, setActiveRefIndex] = useState<number | null>(null);
  const [refForm, setRefForm] = useState<{
    title: string;
    url: string;
    source: string;
  }>({
    title: '',
    url: '',
    source: '',
  });
  const [refFormError, setRefFormError] = useState<string | null>(null);

  // Student Preview active video language selector
  const [previewVideoLang, setPreviewVideoLang] = useState<'english' | 'telugu' | 'hindi'>('english');

  // Saving States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [clientValidationErrors, setClientValidationErrors] = useState<string[]>([]);

  // Section Modal States
  const [sectionModalMode, setSectionModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  const [sectionForm, setSectionForm] = useState<{ heading: string; body: string }>({
    heading: '',
    body: '',
  });
  const [sectionFormError, setSectionFormError] = useState<string | null>(null);

  // Code Example Modal States
  const [codeModalMode, setCodeModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeCodeIndex, setActiveCodeIndex] = useState<number | null>(null);
  const [codeForm, setCodeForm] = useState<{
    title: string;
    language: string;
    code: string;
    explanation: string;
  }>({
    title: '',
    language: 'c',
    code: '',
    explanation: '',
  });
  const [codeFormError, setCodeFormError] = useState<string | null>(null);

  // Important Point Modal States
  const [pointModalMode, setPointModalMode] = useState<'create' | 'edit' | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [pointText, setPointText] = useState<string>('');
  const [pointFormError, setPointFormError] = useState<string | null>(null);

  // Image Modal States
  const [imageModalMode, setImageModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [imageForm, setImageForm] = useState<{
    url: string;
    caption: string;
    altText: string;
  }>({
    url: '',
    caption: '',
    altText: '',
  });
  const [imageFormError, setImageFormError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'section' | 'code' | 'point' | 'image' | 'reference';
    index: number;
    title: string;
  } | null>(null);

  // Unsaved Changes Confirmation Modal
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState<boolean>(false);

  // Copied code snippet state for preview
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<number | null>(null);

  // Load Content from Backend
  const fetchContent = useCallback(async () => {
    if (!accessToken || !courseId || !moduleId || !topicId) return;

    setLoading(true);
    setLoadError(null);

    try {
      const data = await courseCreatorApi.getTopicContent(accessToken, courseId, moduleId, topicId);
      setInitialContent(data);

      // Populate local editing state
      setExplanation(data.content?.explanation || '');

      const initialSections = (data.content?.sections || []).map((sec, idx) => ({
        id: sec.id,
        heading: sec.heading || '',
        body: sec.body || '',
        order: typeof sec.order === 'number' ? sec.order : idx,
      }));
      setSections(initialSections);

      setCodeExamples(
        (data.codeExamples || []).map((ex) => ({
          id: ex.id,
          title: ex.title || '',
          language: ex.language || 'c',
          code: ex.code || '',
          explanation: ex.explanation || '',
        }))
      );

      setImportantPoints(Array.isArray(data.importantPoints) ? [...data.importantPoints] : []);

      setImages(
        (data.images || []).map((img) => ({
          id: img.id,
          url: img.url || '',
          caption: img.caption || '',
          altText: img.altText || '',
        }))
      );

      // Videos (Phase 5E)
      const loadedVideos = data.videos || {};
      setVideoEnglish(loadedVideos.english || '');
      setVideoTelugu(loadedVideos.telugu || '');
      setVideoHindi(loadedVideos.hindi || '');

      // Automatically select first available video language in preview
      if (loadedVideos.english) {
        setPreviewVideoLang('english');
      } else if (loadedVideos.telugu) {
        setPreviewVideoLang('telugu');
      } else if (loadedVideos.hindi) {
        setPreviewVideoLang('hindi');
      }

      // External References (Phase 5E)
      const loadedRefs = data.externalReferences || data.references || [];
      setExternalReferences(
        loadedRefs.map((ref) => ({
          id: ref.id,
          title: ref.title || '',
          url: ref.url || '',
          source: ref.source || '',
        }))
      );
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load topic educational content');
    } finally {
      setLoading(false);
    }
  }, [accessToken, courseId, moduleId, topicId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Dismiss success message after 4 seconds
  useEffect(() => {
    if (saveSuccessMessage) {
      const timer = setTimeout(() => setSaveSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessMessage]);

  // Compute dirty (unsaved changes) state
  const isDirty = useMemo(() => {
    if (!initialContent) return false;

    const initialExplanation = initialContent.content?.explanation || '';
    if (explanation !== initialExplanation) return true;

    // Compare sections
    const initSections = initialContent.content?.sections || [];
    if (sections.length !== initSections.length) return true;
    for (let i = 0; i < sections.length; i++) {
      if (
        sections[i].heading !== (initSections[i]?.heading || '') ||
        sections[i].body !== (initSections[i]?.body || '') ||
        sections[i].order !== (initSections[i]?.order ?? i)
      ) {
        return true;
      }
    }

    // Compare code examples
    const initCode = initialContent.codeExamples || [];
    if (codeExamples.length !== initCode.length) return true;
    for (let i = 0; i < codeExamples.length; i++) {
      if (
        codeExamples[i].title !== (initCode[i]?.title || '') ||
        codeExamples[i].language !== (initCode[i]?.language || 'c') ||
        codeExamples[i].code !== (initCode[i]?.code || '') ||
        codeExamples[i].explanation !== (initCode[i]?.explanation || '')
      ) {
        return true;
      }
    }

    // Compare important points
    const initPoints = initialContent.importantPoints || [];
    if (importantPoints.length !== initPoints.length) return true;
    for (let i = 0; i < importantPoints.length; i++) {
      if (importantPoints[i] !== initPoints[i]) return true;
    }

    // Compare images
    const initImages = initialContent.images || [];
    if (images.length !== initImages.length) return true;
    for (let i = 0; i < images.length; i++) {
      if (
        images[i].url !== (initImages[i]?.url || '') ||
        images[i].caption !== (initImages[i]?.caption || '') ||
        images[i].altText !== (initImages[i]?.altText || '')
      ) {
        return true;
      }
    }

    // Compare videos
    const initVideos = initialContent.videos || {};
    const normInitEn = (initVideos.english || '').trim();
    const normInitTe = (initVideos.telugu || '').trim();
    const normInitHi = (initVideos.hindi || '').trim();
    if (videoEnglish.trim() !== normInitEn) return true;
    if (videoTelugu.trim() !== normInitTe) return true;
    if (videoHindi.trim() !== normInitHi) return true;

    // Compare external references
    const initRefs = initialContent.externalReferences || initialContent.references || [];
    if (externalReferences.length !== initRefs.length) return true;
    for (let i = 0; i < externalReferences.length; i++) {
      if (
        externalReferences[i].title.trim() !== (initRefs[i]?.title || '').trim() ||
        externalReferences[i].url.trim() !== (initRefs[i]?.url || '').trim() ||
        (externalReferences[i].source || '').trim() !== (initRefs[i]?.source || '').trim()
      ) {
        return true;
      }
    }

    return false;
  }, [
    initialContent,
    explanation,
    sections,
    codeExamples,
    importantPoints,
    images,
    videoEnglish,
    videoTelugu,
    videoHindi,
    externalReferences,
  ]);

  // Discard local changes back to loaded initial state
  const handleDiscardChanges = () => {
    if (!initialContent) return;
    setExplanation(initialContent.content?.explanation || '');
    setSections(
      (initialContent.content?.sections || []).map((sec, idx) => ({
        id: sec.id,
        heading: sec.heading || '',
        body: sec.body || '',
        order: typeof sec.order === 'number' ? sec.order : idx,
      }))
    );
    setCodeExamples(
      (initialContent.codeExamples || []).map((ex) => ({
        id: ex.id,
        title: ex.title || '',
        language: ex.language || 'c',
        code: ex.code || '',
        explanation: ex.explanation || '',
      }))
    );
    setImportantPoints(Array.isArray(initialContent.importantPoints) ? [...initialContent.importantPoints] : []);
    setImages(
      (initialContent.images || []).map((img) => ({
        id: img.id,
        url: img.url || '',
        caption: img.caption || '',
        altText: img.altText || '',
      }))
    );
    const initVideos = initialContent.videos || {};
    setVideoEnglish(initVideos.english || '');
    setVideoTelugu(initVideos.telugu || '');
    setVideoHindi(initVideos.hindi || '');

    const initRefs = initialContent.externalReferences || initialContent.references || [];
    setExternalReferences(
      initRefs.map((ref) => ({
        id: ref.id,
        title: ref.title || '',
        url: ref.url || '',
        source: ref.source || '',
      }))
    );
    setSaveErrorMessage(null);
    setClientValidationErrors([]);
    setShowUnsavedPrompt(false);
  };

  // Safe Close with Unsaved Prompt
  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  // Validate entire content prior to save
  const validateEntireContent = (): boolean => {
    const errors: string[] = [];

    if (explanation.length > 50000) {
      errors.push('Explanation exceeds the maximum limit of 50,000 characters');
    }

    if (sections.length > 50) {
      errors.push('Cannot exceed 50 content sections');
    }
    sections.forEach((sec, idx) => {
      if (sec.heading.length > 200) {
        errors.push(`Section #${idx + 1} heading exceeds 200 characters`);
      }
      if (sec.body.length > 20000) {
        errors.push(`Section #${idx + 1} body exceeds 20,000 characters`);
      }
    });

    if (codeExamples.length > 50) {
      errors.push('Cannot exceed 50 code examples');
    }
    codeExamples.forEach((ex, idx) => {
      if (!ex.code || ex.code.trim().length === 0) {
        errors.push(`Code example #${idx + 1} requires a code snippet`);
      }
      if (ex.code.length > 30000) {
        errors.push(`Code example #${idx + 1} snippet exceeds 30,000 characters`);
      }
      if (ex.title && ex.title.length > 200) {
        errors.push(`Code example #${idx + 1} title exceeds 200 characters`);
      }
      if (ex.language && ex.language.length > 50) {
        errors.push(`Code example #${idx + 1} language identifier exceeds 50 characters`);
      }
      if (ex.explanation && ex.explanation.length > 5000) {
        errors.push(`Code example #${idx + 1} explanation exceeds 5,000 characters`);
      }
    });

    if (importantPoints.length > 100) {
      errors.push('Cannot exceed 100 important points');
    }
    importantPoints.forEach((pt, idx) => {
      if (!pt.trim()) {
        errors.push(`Important point #${idx + 1} cannot be empty`);
      }
      if (pt.length > 1000) {
        errors.push(`Important point #${idx + 1} exceeds 1,000 characters`);
      }
    });

    if (images.length > 50) {
      errors.push('Cannot exceed 50 image references');
    }
    images.forEach((img, idx) => {
      if (!img.url || !img.url.trim()) {
        errors.push(`Image #${idx + 1} requires a valid URL`);
      } else if (!isSafeUrl(img.url)) {
        errors.push(`Image #${idx + 1} has an invalid URL or unsafe protocol (must be http/https)`);
      }
      if (img.url.length > 1000) {
        errors.push(`Image #${idx + 1} URL exceeds 1,000 characters`);
      }
      if (img.caption && img.caption.length > 500) {
        errors.push(`Image #${idx + 1} caption exceeds 500 characters`);
      }
      if (img.altText && img.altText.length > 200) {
        errors.push(`Image #${idx + 1} alt text exceeds 200 characters`);
      }
    });

    // Videos validation (optional, safe YouTube reference check)
    if (videoEnglish.trim()) {
      if (videoEnglish.trim().length > 1000) {
        errors.push('English video reference exceeds 1,000 characters');
      } else if (!isValidYouTubeUrl(videoEnglish.trim())) {
        errors.push('English video must be a valid YouTube URL or an 11-character video ID');
      }
    }
    if (videoTelugu.trim()) {
      if (videoTelugu.trim().length > 1000) {
        errors.push('Telugu video reference exceeds 1,000 characters');
      } else if (!isValidYouTubeUrl(videoTelugu.trim())) {
        errors.push('Telugu video must be a valid YouTube URL or an 11-character video ID');
      }
    }
    if (videoHindi.trim()) {
      if (videoHindi.trim().length > 1000) {
        errors.push('Hindi video reference exceeds 1,000 characters');
      } else if (!isValidYouTubeUrl(videoHindi.trim())) {
        errors.push('Hindi video must be a valid YouTube URL or an 11-character video ID');
      }
    }

    // External references validation
    if (externalReferences.length > 50) {
      errors.push('Cannot exceed 50 external references');
    }
    externalReferences.forEach((ref, idx) => {
      if (!ref.title || !ref.title.trim()) {
        errors.push(`External reference #${idx + 1} requires a title`);
      } else if (ref.title.trim().length > 200) {
        errors.push(`External reference #${idx + 1} title exceeds 200 characters`);
      }

      if (!ref.url || !ref.url.trim()) {
        errors.push(`External reference #${idx + 1} requires a URL`);
      } else if (ref.url.trim().length > 1000) {
        errors.push(`External reference #${idx + 1} URL exceeds 1,000 characters`);
      } else if (!isSafeReferenceUrl(ref.url.trim())) {
        errors.push(`External reference #${idx + 1} URL must use HTTP or HTTPS protocol`);
      }

      if (ref.source && ref.source.trim().length > 100) {
        errors.push(`External reference #${idx + 1} source exceeds 100 characters`);
      }
    });

    setClientValidationErrors(errors);
    return errors.length === 0;
  };

  // Submit Save Workflow
  const handleSaveContent = async () => {
    if (!accessToken || !courseId || !moduleId || !topicId) return;
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    if (!validateEntireContent()) {
      return;
    }

    setIsSaving(true);

    try {
      // Re-index sequential order values for sections
      const sequentialSections = sections.map((sec, index) => ({
        heading: sec.heading.trim(),
        body: sec.body.trim(),
        order: index,
      }));

      const cleanCodeExamples = codeExamples.map((ex) => ({
        title: ex.title?.trim() || '',
        language: ex.language?.trim().toLowerCase() || 'c',
        code: ex.code,
        explanation: ex.explanation?.trim() || '',
      }));

      const cleanPoints = importantPoints.map((pt) => pt.trim()).filter(Boolean);

      const cleanImages = images.map((img) => ({
        url: img.url.trim(),
        caption: img.caption?.trim() || '',
        altText: img.altText?.trim() || '',
      }));

      const cleanVideos: CourseCreatorTopicVideos = {
        english: videoEnglish.trim() ? videoEnglish.trim() : null,
        telugu: videoTelugu.trim() ? videoTelugu.trim() : null,
        hindi: videoHindi.trim() ? videoHindi.trim() : null,
      };

      const cleanReferences: CourseCreatorTopicExternalReference[] = externalReferences.map((ref) => ({
        title: ref.title.trim(),
        url: ref.url.trim(),
        source: ref.source?.trim() || '',
      }));

      const payload: UpdateCourseCreatorTopicContentRequest = {
        content: {
          explanation: explanation.trim(),
          sections: sequentialSections,
        },
        codeExamples: cleanCodeExamples,
        importantPoints: cleanPoints,
        images: cleanImages,
        videos: cleanVideos,
        externalReferences: cleanReferences,
      };

      const updated = await courseCreatorApi.updateTopicContent(
        accessToken,
        courseId,
        moduleId,
        topicId,
        payload
      );

      setInitialContent(updated);
      // Reconcile with updated data
      setExplanation(updated.content?.explanation || '');
      setSections(
        (updated.content?.sections || []).map((sec, idx) => ({
          id: sec.id,
          heading: sec.heading || '',
          body: sec.body || '',
          order: typeof sec.order === 'number' ? sec.order : idx,
        }))
      );
      setCodeExamples(
        (updated.codeExamples || []).map((ex) => ({
          id: ex.id,
          title: ex.title || '',
          language: ex.language || 'c',
          code: ex.code || '',
          explanation: ex.explanation || '',
        }))
      );
      setImportantPoints(Array.isArray(updated.importantPoints) ? [...updated.importantPoints] : []);
      setImages(
        (updated.images || []).map((img) => ({
          id: img.id,
          url: img.url || '',
          caption: img.caption || '',
          altText: img.altText || '',
        }))
      );

      const updatedVideos = updated.videos || {};
      setVideoEnglish(updatedVideos.english || '');
      setVideoTelugu(updatedVideos.telugu || '');
      setVideoHindi(updatedVideos.hindi || '');

      const updatedRefs = updated.externalReferences || updated.references || [];
      setExternalReferences(
        updatedRefs.map((ref) => ({
          id: ref.id,
          title: ref.title || '',
          url: ref.url || '',
          source: ref.source || '',
        }))
      );

      setSaveSuccessMessage('Topic educational content saved successfully');
      if (onSaved) {
        onSaved(updated);
      }
    } catch (err: any) {
      setSaveErrorMessage(err?.message || 'Failed to save topic educational content');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // SECTION OPERATIONS (Ordered 0..N, Add, Edit, Delete, Move Up, Move Down)
  // ---------------------------------------------------------------------------
  const handleOpenAddSection = () => {
    setSectionForm({ heading: '', body: '' });
    setSectionFormError(null);
    setSectionModalMode('create');
  };

  const handleOpenEditSection = (index: number) => {
    const sec = sections[index];
    if (!sec) return;
    setSectionForm({ heading: sec.heading, body: sec.body });
    setActiveSectionIndex(index);
    setSectionFormError(null);
    setSectionModalMode('edit');
  };

  const handleSaveSectionModal = (e: React.FormEvent) => {
    e.preventDefault();
    const heading = sectionForm.heading.trim();
    const body = sectionForm.body.trim();

    if (heading.length > 200) {
      setSectionFormError('Heading cannot exceed 200 characters');
      return;
    }
    if (body.length > 20000) {
      setSectionFormError('Body text cannot exceed 20,000 characters');
      return;
    }

    if (sectionModalMode === 'create') {
      if (sections.length >= 50) {
        setSectionFormError('Maximum limit of 50 sections reached');
        return;
      }
      setSections((prev) => [
        ...prev,
        {
          heading,
          body,
          order: prev.length,
        },
      ]);
    } else if (sectionModalMode === 'edit' && activeSectionIndex !== null) {
      setSections((prev) =>
        prev.map((sec, idx) =>
          idx === activeSectionIndex
            ? { ...sec, heading, body }
            : sec
        )
      );
    }

    setSectionModalMode(null);
    setActiveSectionIndex(null);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    setSections((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      // Reassign order
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  // ---------------------------------------------------------------------------
  // CODE EXAMPLE OPERATIONS (Add, Edit, Delete)
  // ---------------------------------------------------------------------------
  const handleOpenAddCode = () => {
    setCodeForm({ title: '', language: 'c', code: '', explanation: '' });
    setCodeFormError(null);
    setCodeModalMode('create');
  };

  const handleOpenEditCode = (index: number) => {
    const ex = codeExamples[index];
    if (!ex) return;
    setCodeForm({
      title: ex.title || '',
      language: ex.language || 'c',
      code: ex.code || '',
      explanation: ex.explanation || '',
    });
    setActiveCodeIndex(index);
    setCodeFormError(null);
    setCodeModalMode('edit');
  };

  const handleSaveCodeModal = (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeForm.code;
    const title = codeForm.title.trim();
    const language = (codeForm.language.trim().toLowerCase() || 'c').slice(0, 50);
    const explanationText = codeForm.explanation.trim();

    if (!code || code.trim().length === 0) {
      setCodeFormError('Code snippet is required');
      return;
    }
    if (code.length > 30000) {
      setCodeFormError('Code snippet cannot exceed 30,000 characters');
      return;
    }
    if (title.length > 200) {
      setCodeFormError('Title cannot exceed 200 characters');
      return;
    }
    if (explanationText.length > 5000) {
      setCodeFormError('Explanation cannot exceed 5,000 characters');
      return;
    }

    if (codeModalMode === 'create') {
      if (codeExamples.length >= 50) {
        setCodeFormError('Maximum limit of 50 code examples reached');
        return;
      }
      setCodeExamples((prev) => [
        ...prev,
        {
          title,
          language,
          code,
          explanation: explanationText,
        },
      ]);
    } else if (codeModalMode === 'edit' && activeCodeIndex !== null) {
      setCodeExamples((prev) =>
        prev.map((ex, idx) =>
          idx === activeCodeIndex
            ? { ...ex, title, language, code, explanation: explanationText }
            : ex
        )
      );
    }

    setCodeModalMode(null);
    setActiveCodeIndex(null);
  };

  // ---------------------------------------------------------------------------
  // IMPORTANT POINTS OPERATIONS (Add, Edit, Delete, Move)
  // ---------------------------------------------------------------------------
  const handleOpenAddPoint = () => {
    setPointText('');
    setPointFormError(null);
    setPointModalMode('create');
  };

  const handleOpenEditPoint = (index: number) => {
    const pt = importantPoints[index];
    if (pt === undefined) return;
    setPointText(pt);
    setActivePointIndex(index);
    setPointFormError(null);
    setPointModalMode('edit');
  };

  const handleSavePointModal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pointText.trim();
    if (!trimmed) {
      setPointFormError('Important point cannot be empty');
      return;
    }
    if (trimmed.length > 1000) {
      setPointFormError('Important point cannot exceed 1,000 characters');
      return;
    }

    if (pointModalMode === 'create') {
      if (importantPoints.length >= 100) {
        setPointFormError('Maximum limit of 100 important points reached');
        return;
      }
      setImportantPoints((prev) => [...prev, trimmed]);
    } else if (pointModalMode === 'edit' && activePointIndex !== null) {
      setImportantPoints((prev) =>
        prev.map((pt, idx) => (idx === activePointIndex ? trimmed : pt))
      );
    }

    setPointModalMode(null);
    setActivePointIndex(null);
  };

  const handleMovePoint = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= importantPoints.length) return;

    setImportantPoints((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // IMAGE OPERATIONS (URL, Caption, AltText - Add, Edit, Delete)
  // ---------------------------------------------------------------------------
  const handleOpenAddImage = () => {
    setImageForm({ url: '', caption: '', altText: '' });
    setImageFormError(null);
    setImageModalMode('create');
  };

  const handleOpenEditImage = (index: number) => {
    const img = images[index];
    if (!img) return;
    setImageForm({
      url: img.url,
      caption: img.caption || '',
      altText: img.altText || '',
    });
    setActiveImageIndex(index);
    setImageFormError(null);
    setImageModalMode('edit');
  };

  const handleSaveImageModal = (e: React.FormEvent) => {
    e.preventDefault();
    const url = imageForm.url.trim();
    const caption = imageForm.caption.trim();
    const altText = imageForm.altText.trim();

    if (!url) {
      setImageFormError('Image URL is required');
      return;
    }
    if (!isSafeUrl(url)) {
      setImageFormError('Image URL must use http:// or https:// protocol (executable protocols prohibited)');
      return;
    }
    if (url.length > 1000) {
      setImageFormError('Image URL cannot exceed 1,000 characters');
      return;
    }
    if (caption.length > 500) {
      setImageFormError('Caption cannot exceed 500 characters');
      return;
    }
    if (altText.length > 200) {
      setImageFormError('Alt text cannot exceed 200 characters');
      return;
    }

    if (imageModalMode === 'create') {
      if (images.length >= 50) {
        setImageFormError('Maximum limit of 50 images reached');
        return;
      }
      setImages((prev) => [
        ...prev,
        {
          url,
          caption,
          altText,
        },
      ]);
    } else if (imageModalMode === 'edit' && activeImageIndex !== null) {
      setImages((prev) =>
        prev.map((img, idx) =>
          idx === activeImageIndex
            ? { ...img, url, caption, altText }
            : img
        )
      );
    }

    setImageModalMode(null);
    setActiveImageIndex(null);
  };

  // ---------------------------------------------------------------------------
  // EXTERNAL REFERENCES OPERATIONS (Title, URL, Source - Add, Edit, Delete)
  // ---------------------------------------------------------------------------
  const handleOpenAddReference = () => {
    setRefForm({ title: '', url: '', source: '' });
    setRefFormError(null);
    setRefModalMode('create');
  };

  const handleOpenEditReference = (index: number) => {
    const item = externalReferences[index];
    if (!item) return;
    setRefForm({
      title: item.title,
      url: item.url,
      source: item.source || '',
    });
    setActiveRefIndex(index);
    setRefFormError(null);
    setRefModalMode('edit');
  };

  const handleSaveReferenceModal = (e: React.FormEvent) => {
    e.preventDefault();
    const title = refForm.title.trim();
    const url = refForm.url.trim();
    const source = refForm.source.trim();

    if (!title) {
      setRefFormError('Reference title is required');
      return;
    }
    if (title.length > 200) {
      setRefFormError('Reference title cannot exceed 200 characters');
      return;
    }

    if (!url) {
      setRefFormError('Reference URL is required');
      return;
    }
    if (url.length > 1000) {
      setRefFormError('Reference URL cannot exceed 1,000 characters');
      return;
    }
    if (!isSafeReferenceUrl(url)) {
      setRefFormError('Reference URL must use a valid HTTP or HTTPS protocol and not contain script protocols');
      return;
    }

    if (source.length > 100) {
      setRefFormError('Source name cannot exceed 100 characters');
      return;
    }

    if (refModalMode === 'create') {
      if (externalReferences.length >= 50) {
        setRefFormError('Maximum limit of 50 external references reached');
        return;
      }
      setExternalReferences((prev) => [
        ...prev,
        {
          title,
          url,
          source,
        },
      ]);
    } else if (refModalMode === 'edit' && activeRefIndex !== null) {
      setExternalReferences((prev) =>
        prev.map((item, idx) =>
          idx === activeRefIndex
            ? { ...item, title, url, source }
            : item
        )
      );
    }

    setRefModalMode(null);
    setActiveRefIndex(null);
  };

  // ---------------------------------------------------------------------------
  // DELETE TARGET CONFIRMATION
  // ---------------------------------------------------------------------------
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'section') {
      setSections((prev) => {
        const next = prev.filter((_, i) => i !== deleteTarget.index);
        return next.map((s, i) => ({ ...s, order: i }));
      });
    } else if (deleteTarget.type === 'code') {
      setCodeExamples((prev) => prev.filter((_, i) => i !== deleteTarget.index));
    } else if (deleteTarget.type === 'point') {
      setImportantPoints((prev) => prev.filter((_, i) => i !== deleteTarget.index));
    } else if (deleteTarget.type === 'image') {
      setImages((prev) => prev.filter((_, i) => i !== deleteTarget.index));
    } else if (deleteTarget.type === 'reference') {
      setExternalReferences((prev) => prev.filter((_, i) => i !== deleteTarget.index));
    }

    setDeleteTarget(null);
  };

  // Copy code helper for preview
  const handleCopyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetIndex(index);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150 my-auto">
        {/* ========================================================= */}
        {/* HEADER BAR & BREADCRUMB HIERARCHY */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white shrink-0 space-y-2">
          {/* Breadcrumb Hierarchy */}
          <nav aria-label="Curriculum Hierarchy" className="flex items-center space-x-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-0.5">
            <span className="font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-[200px]" title={courseTitle || courseId}>
              {courseTitle || 'Course'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-[200px]" title={moduleTitle}>
              {moduleTitle}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-indigo-700 truncate max-w-[140px] sm:max-w-[200px]" title={topicTitle}>
              {topicTitle}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-100 shrink-0">
              Content Editor
            </span>
          </nav>

          {/* Title & Top Action Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 id="content-editor-title" className="font-display font-bold text-base sm:text-lg text-slate-900 truncate">
                  {topicTitle}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                  <span>Topic ID: <span className="font-mono text-slate-700 font-semibold">{topicId}</span></span>
                  {isDirty && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Unsaved Changes
                    </span>
                  )}
                  {!isDirty && initialContent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                      Synced
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Save, Discard, Close Actions */}
            <div className="flex items-center space-x-2 ml-auto">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                  title="Discard local edits and reload server content"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Discard</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveContent}
                disabled={isSaving || !isDirty}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save content changes to the server"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Content</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRequestClose}
                aria-label="Close content editor"
                title="Close editor"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 overflow-x-auto pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('explanation')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'explanation'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Explanation</span>
              {explanation.trim() && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'sections'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sections</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-mono">
                {sections.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'code'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Examples</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-mono">
                {codeExamples.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('points')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'points'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Important Points</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-mono">
                {importantPoints.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('images')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'images'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Images</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-mono">
                {images.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'videos'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Videos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-mono">
                {[videoEnglish, videoTelugu, videoHindi].filter((v) => v.trim()).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('references')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeTab === 'references'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>References</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-mono">
                {externalReferences.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ml-auto ${
                activeTab === 'preview'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Student Preview</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FEEDBACK BANNERS */}
        {/* ========================================================= */}
        {saveSuccessMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800 rounded"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {saveErrorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between text-xs text-red-800">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveErrorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveErrorMessage(null)}
              className="p-1 text-red-600 hover:text-red-800 rounded"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {clientValidationErrors.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Please address the following validation issues:
              </span>
              <button
                type="button"
                onClick={() => setClientValidationErrors([])}
                className="p-1 text-amber-700 hover:text-amber-900 rounded"
                aria-label="Dismiss validation warnings"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 pl-1">
              {clientValidationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ========================================================= */}
        {/* MAIN CONTENT AREA */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {loading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <LoadingSpinner size="lg" label="Loading topic content..." direction="col" />
            </div>
          ) : loadError ? (
            <div className="max-w-lg mx-auto py-12">
              <FeedbackState
                type="error"
                title="Failed to Load Content"
                message={loadError}
                actionLabel="Retry Loading Content"
                onAction={fetchContent}
              />
            </div>
          ) : (
            <>
              {/* ===================================================== */}
              {/* TAB 1: EXPLANATION */}
              {/* ===================================================== */}
              {activeTab === 'explanation' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display font-bold text-sm text-slate-900">
                          Topic Explanation
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          The comprehensive theoretical overview of the topic concepts that students read first.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-mono font-medium ${
                            explanation.length > 50000
                              ? 'text-red-600'
                              : explanation.length > 45000
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {explanation.length.toLocaleString()} / 50,000 chars
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="topic-explanation-input" className="sr-only">
                        Topic Explanation
                      </label>
                      <textarea
                        id="topic-explanation-input"
                        rows={14}
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Write clear, comprehensive educational explanation for this topic. Line breaks will be preserved."
                        className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50/50 border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-sans leading-relaxed transition-colors resize-y"
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Preserves line breaks and paragraphs. Untrusted script code is never executed.</span>
                      {explanation.length > 50000 && (
                        <span className="text-red-600 font-semibold">
                          Exceeds character limit by {(explanation.length - 50000).toLocaleString()} chars
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================== */}
              {/* TAB 2: CONTENT SECTIONS */}
              {/* ===================================================== */}
              {activeTab === 'sections' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900">
                        Structured Content Sections
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sub-headings and formatted reading sections in sequential order ({sections.length} of 50 max).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddSection}
                      disabled={sections.length >= 50}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Section</span>
                    </button>
                  </div>

                  {sections.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700">No content sections yet</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Break the lesson into focused reading sections (e.g. Syntax Breakdown, Best Practices, Edge Cases).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddSection}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Section</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sections.map((sec, index) => {
                        const isFirst = index === 0;
                        const isLast = index === sections.length - 1;

                        return (
                          <div
                            key={sec.id || index}
                            className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xs font-bold shrink-0">
                                  {index + 1}
                                </span>
                                <h4 className="font-semibold text-sm text-slate-900 truncate">
                                  {sec.heading || <span className="text-slate-400 italic">Untitled Section</span>}
                                </h4>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                                  Order: {index}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(index, 'up')}
                                  disabled={isFirst}
                                  aria-label={`Move section ${index + 1} up`}
                                  title="Move up"
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSection(index, 'down')}
                                  disabled={isLast}
                                  aria-label={`Move section ${index + 1} down`}
                                  title="Move down"
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSection(index)}
                                  aria-label={`Edit section ${index + 1}`}
                                  title="Edit section"
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'section',
                                      index,
                                      title: sec.heading || `Section #${index + 1}`,
                                    })
                                  }
                                  aria-label={`Delete section ${index + 1}`}
                                  title="Delete section"
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {sec.body && (
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                                {sec.body}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================== */}
              {/* TAB 3: CODE EXAMPLES */}
              {/* ===================================================== */}
              {activeTab === 'code' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900">
                        Code Examples
                      </h3>
                      <p className="text-xs text-slate-500">
                        Syntax snippets and executable demonstrations stored strictly as data ({codeExamples.length} of 50 max).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddCode}
                      disabled={codeExamples.length >= 50}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Code Example</span>
                    </button>
                  </div>

                  {codeExamples.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700">No code examples yet</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Add code snippets with language syntax annotations and contextual explanations.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddCode}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Code Example</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {codeExamples.map((ex, index) => (
                        <div
                          key={ex.id || index}
                          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                                {index + 1}
                              </span>
                              <h4 className="font-semibold text-sm text-slate-900 truncate">
                                {ex.title || `Code Snippet #${index + 1}`}
                              </h4>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0 font-bold">
                                {ex.language || 'c'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCode(index)}
                                aria-label={`Edit code example ${index + 1}`}
                                title="Edit code example"
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'code',
                                    index,
                                    title: ex.title || `Code Example #${index + 1}`,
                                  })
                                }
                                aria-label={`Delete code example ${index + 1}`}
                                title="Delete code example"
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Preformatted Code Block Display - Code is DATA ONLY */}
                          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg overflow-x-auto border border-slate-800 font-mono text-xs leading-relaxed max-h-60">
                            <pre className="whitespace-pre">{ex.code}</pre>
                          </div>

                          {ex.explanation && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                              <span className="font-semibold text-slate-700 block mb-0.5">Explanation:</span>
                              {ex.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================== */}
              {/* TAB 4: IMPORTANT POINTS */}
              {/* ===================================================== */}
              {activeTab === 'points' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900">
                        Important / Revision Points
                      </h3>
                      <p className="text-xs text-slate-500">
                        Key takeaways, rules, and exam revision highlights ({importantPoints.length} of 100 max).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddPoint}
                      disabled={importantPoints.length >= 100}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Point</span>
                    </button>
                  </div>

                  {importantPoints.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                        <ListChecks className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700">No important points yet</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Add concise bullet points that help students summarize key conceptual takeaways.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddPoint}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Point</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
                      {importantPoints.map((pt, index) => {
                        const isFirst = index === 0;
                        const isLast = index === importantPoints.length - 1;

                        return (
                          <div
                            key={index}
                            className="p-3 sm:p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                          >
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                {pt}
                              </p>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => handleMovePoint(index, 'up')}
                                disabled={isFirst}
                                aria-label={`Move point ${index + 1} up`}
                                title="Move up"
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMovePoint(index, 'down')}
                                disabled={isLast}
                                aria-label={`Move point ${index + 1} down`}
                                title="Move down"
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditPoint(index)}
                                aria-label={`Edit point ${index + 1}`}
                                title="Edit point"
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'point',
                                    index,
                                    title: `Important Point #${index + 1}`,
                                  })
                                }
                                aria-label={`Delete point ${index + 1}`}
                                title="Delete point"
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================== */}
              {/* TAB 5: IMAGES */}
              {/* ===================================================== */}
              {activeTab === 'images' && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900">
                        Image References & Diagrams
                      </h3>
                      <p className="text-xs text-slate-500">
                        Direct HTTP/HTTPS image references with accessible alt text ({images.length} of 50 max).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddImage}
                      disabled={images.length >= 50}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Image</span>
                    </button>
                  </div>

                  {images.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700">No image references yet</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Add architectural diagrams, memory layout graphs, or flowchart references by secure URL.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddImage}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 text-xs font-semibold rounded-md shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Image</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {images.map((img, index) => (
                        <div
                          key={img.id || index}
                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            {/* Safe Image Preview */}
                            <div className="w-full h-36 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center relative">
                              <img
                                src={img.url}
                                alt={img.altText || `Topic illustration ${index + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-mono text-slate-500 truncate" title={img.url}>
                                {img.url}
                              </p>
                              {img.caption && (
                                <p className="text-xs font-medium text-slate-800">
                                  {img.caption}
                                </p>
                              )}
                              {img.altText && (
                                <p className="text-[11px] text-slate-400 italic">
                                  Alt: {img.altText}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400">Image #{index + 1}</span>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditImage(index)}
                                aria-label={`Edit image ${index + 1}`}
                                title="Edit image"
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'image',
                                    index,
                                    title: img.caption || `Image #${index + 1}`,
                                  })
                                }
                                aria-label={`Delete image ${index + 1}`}
                                title="Delete image"
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================== */}
              {/* TAB 6: MULTILINGUAL VIDEOS (Phase 5E) */}
              {/* ===================================================== */}
              {activeTab === 'videos' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {/* Tab Header Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
                    <div className="flex items-center space-x-2 text-indigo-700">
                      <Video className="w-5 h-5 shrink-0" />
                      <h3 className="font-display font-bold text-sm text-slate-900">
                        Multilingual Educational Video Lectures
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Optionally associate educational YouTube video lectures in English, Telugu, and Hindi to support students with diverse language preferences.
                    </p>
                  </div>

                  {/* 1. English Video Lecture */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <label htmlFor="video-english-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>English Video Lecture</span>
                          <span className="text-[10px] font-normal text-slate-400 font-sans">(Optional)</span>
                        </label>
                      </div>
                      {videoEnglish.trim() && (
                        <button
                          type="button"
                          onClick={() => setVideoEnglish('')}
                          className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <input
                        id="video-english-input"
                        type="text"
                        maxLength={1000}
                        value={videoEnglish}
                        onChange={(e) => setVideoEnglish(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or 11-char ID"
                        className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-mono"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-slate-400">
                          Supports full YouTube URLs, short links (youtu.be), or 11-char video IDs.
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {videoEnglish.length} / 1000
                        </span>
                      </div>
                    </div>

                    {/* Inline Validation & Live Preview for English */}
                    {videoEnglish.trim() && (
                      <div>
                        {isValidYouTubeUrl(videoEnglish.trim()) ? (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Valid YouTube Reference</span>
                              </span>
                              {extractYouTubeId(videoEnglish.trim()) && (
                                <a
                                  href={`https://www.youtube.com/watch?v=${extractYouTubeId(videoEnglish.trim())}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                  <span>Test in YouTube</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {extractYouTubeId(videoEnglish.trim()) && (
                              <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-emerald-200 bg-black">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(videoEnglish.trim())}`}
                                  title="English Lecture Preview"
                                  className="w-full h-full"
                                  sandbox="allow-scripts allow-same-origin allow-presentation"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Must be a valid YouTube URL (youtube.com, youtu.be) or an 11-character video ID.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Telugu Video Lecture */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <label htmlFor="video-telugu-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Telugu Video Lecture (తెలుగు)</span>
                          <span className="text-[10px] font-normal text-slate-400 font-sans">(Optional)</span>
                        </label>
                      </div>
                      {videoTelugu.trim() && (
                        <button
                          type="button"
                          onClick={() => setVideoTelugu('')}
                          className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <input
                        id="video-telugu-input"
                        type="text"
                        maxLength={1000}
                        value={videoTelugu}
                        onChange={(e) => setVideoTelugu(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=... or 11-char ID"
                        className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-mono"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-slate-400">
                          Supports full YouTube URLs, short links (youtu.be), or 11-char video IDs.
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {videoTelugu.length} / 1000
                        </span>
                      </div>
                    </div>

                    {/* Inline Validation & Live Preview for Telugu */}
                    {videoTelugu.trim() && (
                      <div>
                        {isValidYouTubeUrl(videoTelugu.trim()) ? (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Valid YouTube Reference</span>
                              </span>
                              {extractYouTubeId(videoTelugu.trim()) && (
                                <a
                                  href={`https://www.youtube.com/watch?v=${extractYouTubeId(videoTelugu.trim())}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                  <span>Test in YouTube</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {extractYouTubeId(videoTelugu.trim()) && (
                              <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-emerald-200 bg-black">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(videoTelugu.trim())}`}
                                  title="Telugu Lecture Preview"
                                  className="w-full h-full"
                                  sandbox="allow-scripts allow-same-origin allow-presentation"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Must be a valid YouTube URL (youtube.com, youtu.be) or an 11-character video ID.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Hindi Video Lecture */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <label htmlFor="video-hindi-input" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Hindi Video Lecture (हिन्दी)</span>
                          <span className="text-[10px] font-normal text-slate-400 font-sans">(Optional)</span>
                        </label>
                      </div>
                      {videoHindi.trim() && (
                        <button
                          type="button"
                          onClick={() => setVideoHindi('')}
                          className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <input
                        id="video-hindi-input"
                        type="text"
                        maxLength={1000}
                        value={videoHindi}
                        onChange={(e) => setVideoHindi(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=... or 11-char ID"
                        className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-mono"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-slate-400">
                          Supports full YouTube URLs, short links (youtu.be), or 11-char video IDs.
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {videoHindi.length} / 1000
                        </span>
                      </div>
                    </div>

                    {/* Inline Validation & Live Preview for Hindi */}
                    {videoHindi.trim() && (
                      <div>
                        {isValidYouTubeUrl(videoHindi.trim()) ? (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Valid YouTube Reference</span>
                              </span>
                              {extractYouTubeId(videoHindi.trim()) && (
                                <a
                                  href={`https://www.youtube.com/watch?v=${extractYouTubeId(videoHindi.trim())}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                  <span>Test in YouTube</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {extractYouTubeId(videoHindi.trim()) && (
                              <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-emerald-200 bg-black">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(videoHindi.trim())}`}
                                  title="Hindi Lecture Preview"
                                  className="w-full h-full"
                                  sandbox="allow-scripts allow-same-origin allow-presentation"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Must be a valid YouTube URL (youtube.com, youtu.be) or an 11-character video ID.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===================================================== */}
              {/* TAB 7: EXTERNAL REFERENCES (Phase 5E) */}
              {/* ===================================================== */}
              {activeTab === 'references' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {/* Header with Add Button */}
                  <div className="flex items-center justify-between gap-3 flex-wrap bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        <span>External Educational References</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Curated links to official documentation, specifications, and articles ({externalReferences.length} of 50 max).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddReference}
                      disabled={externalReferences.length >= 50}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Reference</span>
                    </button>
                  </div>

                  {/* Empty State */}
                  {externalReferences.length === 0 && (
                    <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-white">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-sm text-slate-900">
                          No external references added yet
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Add links to official documentation (e.g., cppreference.com, MDN, standard specs) to provide students with authoritative reference material.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddReference}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Reference</span>
                      </button>
                    </div>
                  )}

                  {/* References List */}
                  {externalReferences.length > 0 && (
                    <div className="space-y-3">
                      {externalReferences.map((ref, idx) => (
                        <div
                          key={ref.id || idx}
                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-start justify-between gap-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-semibold text-xs text-slate-900">
                                {ref.title}
                              </span>
                              {ref.source && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  {ref.source}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-[11px] font-mono text-indigo-600 hover:text-indigo-800 truncate max-w-md"
                                title="Open reference in new tab"
                              >
                                <span className="truncate">{ref.url}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditReference(idx)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit reference"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'reference',
                                  index: idx,
                                  title: ref.title,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete reference"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================== */}
              {/* TAB 8: STUDENT PREVIEW */}
              {/* ===================================================== */}
              {activeTab === 'preview' && (
                <div className="space-y-6 max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs">
                  {/* Topic Title & Meta */}
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {moduleTitle}
                    </span>
                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                      {topicTitle}
                    </h1>
                  </div>

                  {/* Explanation */}
                  {explanation ? (
                    <div className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                      {explanation}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic text-center">
                      No topic explanation entered yet.
                    </div>
                  )}

                  {/* Important Points Callout */}
                  {importantPoints.length > 0 && (
                    <div className="p-4 sm:p-5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
                      <h3 className="font-display font-bold text-xs text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <ListChecks className="w-4 h-4 text-amber-700" />
                        Important Revision Points
                      </h3>
                      <ul className="space-y-1.5 text-xs text-amber-900 pl-1">
                        {importantPoints.map((pt, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Structured Sections */}
                  {sections.length > 0 && (
                    <div className="space-y-6 pt-2">
                      {sections.map((sec, i) => (
                        <div key={i} className="space-y-2">
                          <h3 className="font-display font-bold text-base text-slate-900 border-b border-slate-100 pb-1">
                            {sec.heading}
                          </h3>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                            {sec.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Code Examples */}
                  {codeExamples.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        Code Implementations
                      </h3>
                      <div className="space-y-4">
                        {codeExamples.map((ex, i) => (
                          <div key={i} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                            <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-800">
                                {ex.title || `Example ${i + 1}`}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                                  {ex.language}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(ex.code, i)}
                                  className="text-slate-500 hover:text-slate-900 p-1 rounded"
                                  title="Copy code snippet"
                                >
                                  {copiedSnippetIndex === i ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="bg-slate-900 p-4 text-slate-100 font-mono text-xs overflow-x-auto">
                              <pre className="whitespace-pre">{ex.code}</pre>
                            </div>
                            {ex.explanation && (
                              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
                                {ex.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {images.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        Visual References
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {images.map((img, i) => (
                          <figure key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                            <img
                              src={img.url}
                              alt={img.altText || `Diagram ${i + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-44 object-contain bg-white p-2"
                            />
                            {img.caption && (
                              <figcaption className="p-2.5 text-center text-xs text-slate-600 italic border-t border-slate-200">
                                {img.caption}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Lectures Preview (Phase 5E) */}
                  {(videoEnglish.trim() || videoTelugu.trim() || videoHindi.trim()) && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Video className="w-4 h-4 text-indigo-600" />
                          <span>Educational Video Lectures</span>
                        </h3>

                        {/* Language Selection Pills */}
                        <div className="flex items-center space-x-1">
                          {videoEnglish.trim() && (
                            <button
                              type="button"
                              onClick={() => setPreviewVideoLang('english')}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                previewVideoLang === 'english'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              English
                            </button>
                          )}
                          {videoTelugu.trim() && (
                            <button
                              type="button"
                              onClick={() => setPreviewVideoLang('telugu')}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                previewVideoLang === 'telugu'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Telugu (తెలుగు)
                            </button>
                          )}
                          {videoHindi.trim() && (
                            <button
                              type="button"
                              onClick={() => setPreviewVideoLang('hindi')}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                previewVideoLang === 'hindi'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Hindi (हिन्दी)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Video Player Display */}
                      {(() => {
                        const activeVideo =
                          previewVideoLang === 'english'
                            ? videoEnglish.trim()
                            : previewVideoLang === 'telugu'
                            ? videoTelugu.trim()
                            : videoHindi.trim();

                        const videoId = extractYouTubeId(activeVideo);

                        if (!activeVideo) {
                          return (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic text-center">
                              No lecture video is available for {previewVideoLang}.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {videoId ? (
                              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xs border border-slate-200">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                                  title={`${previewVideoLang} Video Lecture`}
                                  className="w-full h-full"
                                  sandbox="allow-scripts allow-same-origin allow-presentation"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                                <span className="font-mono text-[11px] truncate max-w-sm">{activeVideo}</span>
                                {isSafeReferenceUrl(activeVideo) ? (
                                  <a
                                    href={activeVideo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold"
                                  >
                                    <span>Watch on YouTube</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="text-red-500 font-medium">Invalid URL protocol</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* External References Preview (Phase 5E) */}
                  {externalReferences.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        <span>External References & Recommended Reading</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {externalReferences.map((ref, idx) => (
                          <a
                            key={ref.id || idx}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3.5 bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all group flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                                  {ref.title}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                              </div>
                              {ref.source && (
                                <span className="inline-block text-[10px] text-slate-500 font-medium">
                                  {ref.source}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono truncate mt-2">
                              {ref.url}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ========================================================= */}
        {/* FOOTER BAR */}
        {/* ========================================================= */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>
              Last updated: {initialContent?.updatedAt ? new Date(initialContent.updatedAt).toLocaleString() : 'Not yet saved'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveContent}
              disabled={isSaving || !isDirty}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION MODAL (ADD / EDIT) */}
      {/* ========================================================= */}
      {sectionModalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="section-modal-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xl max-w-lg w-full space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 id="section-modal-title" className="font-display font-bold text-sm text-slate-900">
                {sectionModalMode === 'create' ? 'Add Content Section' : 'Edit Content Section'}
              </h4>
              <button
                type="button"
                onClick={() => setSectionModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sectionFormError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sectionFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSectionModal} className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="sec-heading" className="text-xs font-semibold text-slate-700">
                    Heading
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sectionForm.heading.length} / 200
                  </span>
                </div>
                <input
                  id="sec-heading"
                  type="text"
                  maxLength={200}
                  value={sectionForm.heading}
                  onChange={(e) => setSectionForm((prev) => ({ ...prev, heading: e.target.value }))}
                  placeholder="e.g. Memory Layout & Pointers"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="sec-body" className="text-xs font-semibold text-slate-700">
                    Body Content
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sectionForm.body.length} / 20,000
                  </span>
                </div>
                <textarea
                  id="sec-body"
                  rows={8}
                  maxLength={20000}
                  value={sectionForm.body}
                  onChange={(e) => setSectionForm((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder="Enter detailed section explanations. Line breaks will be preserved."
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-sans leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSectionModalMode(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  {sectionModalMode === 'create' ? 'Add Section' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CODE EXAMPLE MODAL (ADD / EDIT) */}
      {/* ========================================================= */}
      {codeModalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="code-modal-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xl max-w-lg w-full space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 id="code-modal-title" className="font-display font-bold text-sm text-slate-900">
                {codeModalMode === 'create' ? 'Add Code Example' : 'Edit Code Example'}
              </h4>
              <button
                type="button"
                onClick={() => setCodeModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {codeFormError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{codeFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCodeModal} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="code-title" className="text-xs font-semibold text-slate-700">
                    Title (optional)
                  </label>
                  <input
                    id="code-title"
                    type="text"
                    maxLength={200}
                    value={codeForm.title}
                    onChange={(e) => setCodeForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Pointer Dereferencing"
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="code-language" className="text-xs font-semibold text-slate-700">
                    Language
                  </label>
                  <select
                    id="code-language"
                    value={codeForm.language}
                    onChange={(e) => setCodeForm((prev) => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {COMMON_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="code-snippet" className="text-xs font-semibold text-slate-700">
                    Code Snippet <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {codeForm.code.length} / 30,000
                  </span>
                </div>
                <textarea
                  id="code-snippet"
                  rows={8}
                  maxLength={30000}
                  required
                  value={codeForm.code}
                  onChange={(e) => setCodeForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder={`int main() {\n    printf("Hello LearnSphere\\n");\n    return 0;\n}`}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-mono leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="code-explanation" className="text-xs font-semibold text-slate-700">
                    Explanation (optional)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {codeForm.explanation.length} / 5,000
                  </span>
                </div>
                <textarea
                  id="code-explanation"
                  rows={3}
                  maxLength={5000}
                  value={codeForm.explanation}
                  onChange={(e) => setCodeForm((prev) => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Explain what happens when this snippet runs..."
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-sans"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCodeModalMode(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  {codeModalMode === 'create' ? 'Add Code Example' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* IMPORTANT POINT MODAL (ADD / EDIT) */}
      {/* ========================================================= */}
      {pointModalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="point-modal-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xl max-w-md w-full space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 id="point-modal-title" className="font-display font-bold text-sm text-slate-900">
                {pointModalMode === 'create' ? 'Add Important Point' : 'Edit Important Point'}
              </h4>
              <button
                type="button"
                onClick={() => setPointModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pointFormError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pointFormError}</span>
              </div>
            )}

            <form onSubmit={handleSavePointModal} className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="point-text" className="text-xs font-semibold text-slate-700">
                    Point Text <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pointText.length} / 1,000
                  </span>
                </div>
                <textarea
                  id="point-text"
                  rows={4}
                  maxLength={1000}
                  required
                  value={pointText}
                  onChange={(e) => setPointText(e.target.value)}
                  placeholder="e.g. In C, arrays are passed by reference to functions automatically as pointers."
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-sans leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPointModalMode(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  {pointModalMode === 'create' ? 'Add Point' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* IMAGE MODAL (ADD / EDIT) */}
      {/* ========================================================= */}
      {imageModalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xl max-w-lg w-full space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 id="image-modal-title" className="font-display font-bold text-sm text-slate-900">
                {imageModalMode === 'create' ? 'Add Image Reference' : 'Edit Image Reference'}
              </h4>
              <button
                type="button"
                onClick={() => setImageModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {imageFormError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveImageModal} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="img-url" className="text-xs font-semibold text-slate-700">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="img-url"
                  type="url"
                  maxLength={1000}
                  required
                  value={imageForm.url}
                  onChange={(e) => setImageForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/diagram.png"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400">
                  Must use http:// or https:// URL. File uploads are not implemented for this phase.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="img-altText" className="text-xs font-semibold text-slate-700">
                    Alt Text (Accessibility)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {imageForm.altText.length} / 200
                  </span>
                </div>
                <input
                  id="img-altText"
                  type="text"
                  maxLength={200}
                  value={imageForm.altText}
                  onChange={(e) => setImageForm((prev) => ({ ...prev, altText: e.target.value }))}
                  placeholder="e.g. Diagram of stack memory allocation"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="img-caption" className="text-xs font-semibold text-slate-700">
                    Caption (optional)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {imageForm.caption.length} / 500
                  </span>
                </div>
                <input
                  id="img-caption"
                  type="text"
                  maxLength={500}
                  value={imageForm.caption}
                  onChange={(e) => setImageForm((prev) => ({ ...prev, caption: e.target.value }))}
                  placeholder="e.g. Figure 1: Memory stack frames during recursive call"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setImageModalMode(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  {imageModalMode === 'create' ? 'Add Image' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EXTERNAL REFERENCE MODAL (ADD / EDIT) (Phase 5E) */}
      {/* ========================================================= */}
      {refModalMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ref-modal-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xl max-w-lg w-full space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 id="ref-modal-title" className="font-display font-bold text-sm text-slate-900">
                {refModalMode === 'create' ? 'Add External Reference' : 'Edit External Reference'}
              </h4>
              <button
                type="button"
                onClick={() => setRefModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {refFormError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{refFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveReferenceModal} className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="ref-title" className="text-xs font-semibold text-slate-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {refForm.title.length} / 200
                  </span>
                </div>
                <input
                  id="ref-title"
                  type="text"
                  maxLength={200}
                  required
                  value={refForm.title}
                  onChange={(e) => setRefForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. C Standard Library Reference (cppreference.com)"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="ref-url" className="text-xs font-semibold text-slate-700">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {refForm.url.length} / 1,000
                  </span>
                </div>
                <input
                  id="ref-url"
                  type="url"
                  maxLength={1000}
                  required
                  value={refForm.url}
                  onChange={(e) => setRefForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://en.cppreference.com/w/c"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Must be an absolute HTTP or HTTPS URL.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="ref-source" className="text-xs font-semibold text-slate-700">
                    Source / Organization <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {refForm.source.length} / 100
                  </span>
                </div>
                <input
                  id="ref-source"
                  type="text"
                  maxLength={100}
                  value={refForm.source}
                  onChange={(e) => setRefForm((prev) => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g. cppreference, MDN, ISO / IEC"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRefModalMode(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  {refModalMode === 'create' ? 'Add Reference' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xl max-w-sm w-full space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 id="delete-dialog-title" className="font-display font-bold text-sm text-slate-900">
                  Delete {deleteTarget.type === 'section' ? 'Section' : deleteTarget.type === 'code' ? 'Code Example' : deleteTarget.type === 'point' ? 'Point' : deleteTarget.type === 'image' ? 'Image' : 'Reference'}?
                </h4>
                <p className="text-xs text-slate-500">This item will be removed from your local draft.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 truncate font-semibold">
              {deleteTarget.title}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* UNSAVED CHANGES CONFIRMATION PROMPT */}
      {/* ========================================================= */}
      {showUnsavedPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-prompt-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xl max-w-sm w-full space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 id="unsaved-prompt-title" className="font-display font-bold text-sm text-slate-900">
                  Unsaved Changes
                </h4>
                <p className="text-xs text-slate-500">You have unsaved edits in this topic.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Closing now will discard any unsaved modifications made during this session.
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorTopicContentEditor;
