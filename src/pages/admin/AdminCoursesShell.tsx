/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useId, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  adminApi,
  AdminCourse,
  AdminCoursePagination,
  GetAdminCoursesParams,
  CourseStatus,
  AdminCourseStructureResponse,
  AdminCourseStructureModule,
  AdminCourseStructureTopic,
  CreateAdminCourseRequest,
  UpdateAdminCourseRequest,
  AdminUser,
  AdminModule,
  CreateAdminModuleRequest,
  UpdateAdminModuleRequest,
  AdminTopic,
  CreateAdminTopicRequest,
  UpdateAdminTopicRequest,
  AdminTopicCodeExample,
  AdminTopicImage,
} from '../../services/api';
import { FeedbackState } from '../../components/FeedbackState';
import { EmptyState } from '../../components/EmptyState';
import {
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Layers,
  X,
  FileText,
  Tag,
  Video,
  Code,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ListOrdered,
  Info,
  Folder,
  FolderOpen,
  MoreVertical,
  Archive,
  Globe,
  RotateCcw,
  Plus,
  Trash2,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const AdminCoursesShell: React.FC = () => {
  const { accessToken, isLoading: authLoading } = useApp();
  const searchFilterId = useId();
  const statusFilterId = useId();
  const categoryFilterId = useId();

  // Data state
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [pagination, setPagination] = useState<AdminCoursePagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Query filter state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | ''>('');
  const [categoryInput, setCategoryInput] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Request sequencing ref to prevent race conditions from stale requests
  const requestIdRef = useRef<number>(0);

  // Detail & Structure Modal State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'modules' | 'structure'>('overview');

  // Course Details State
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<AdminCourse | null>(null);

  // Course Structure State
  const [structureLoading, setStructureLoading] = useState<boolean>(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [courseStructure, setCourseStructure] = useState<AdminCourseStructureResponse | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [selectedTopic, setSelectedTopic] = useState<AdminCourseStructureTopic | null>(null);

  // Course Modules State (CRUD)
  const [courseModules, setCourseModules] = useState<AdminModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState<boolean>(false);
  const [modulesError, setModulesError] = useState<string | null>(null);

  // Module Create / Edit Modal State
  const [moduleModal, setModuleModal] = useState<{
    mode: 'create' | 'edit';
    module?: AdminModule;
  } | null>(null);
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [moduleDescription, setModuleDescription] = useState<string>('');
  const [moduleOrder, setModuleOrder] = useState<number>(0);
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});
  const [isSubmittingModule, setIsSubmittingModule] = useState<boolean>(false);
  const [moduleSubmitError, setModuleSubmitError] = useState<string | null>(null);

  // Module Delete Confirmation Modal State
  const [deleteModuleModal, setDeleteModuleModal] = useState<AdminModule | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState<boolean>(false);
  const [deleteModuleError, setDeleteModuleError] = useState<string | null>(null);

  // Module Reordering State
  const [isReorderingModules, setIsReorderingModules] = useState<boolean>(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  // Topic Management State (CRUD under Module hierarchy)
  const [moduleTopics, setModuleTopics] = useState<Record<string, AdminTopic[]>>({});
  const [topicsLoading, setTopicsLoading] = useState<Record<string, boolean>>({});
  const [topicsError, setTopicsError] = useState<Record<string, string | null>>({});
  const [expandedTopicsModules, setExpandedTopicsModules] = useState<Record<string, boolean>>({});

  // Topic Create / Edit Modal State
  const [topicModal, setTopicModal] = useState<{
    mode: 'create' | 'edit';
    moduleId: string;
    topic?: AdminTopic;
  } | null>(null);
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [topicDescription, setTopicDescription] = useState<string>('');
  const [topicOrder, setTopicOrder] = useState<number>(0);
  const [topicErrors, setTopicErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmittingTopic, setIsSubmittingTopic] = useState<boolean>(false);
  const [topicSubmitError, setTopicSubmitError] = useState<string | null>(null);

  // Topic Deletion Confirmation Modal State
  const [deleteTopicModal, setDeleteTopicModal] = useState<{
    moduleId: string;
    topic: AdminTopic;
  } | null>(null);
  const [isDeletingTopic, setIsDeletingTopic] = useState<boolean>(false);
  const [deleteTopicError, setDeleteTopicError] = useState<string | null>(null);

  // Topic Reordering State
  const [reorderingTopicModuleId, setReorderingTopicModuleId] = useState<string | null>(null);
  const [topicReorderError, setTopicReorderError] = useState<{ moduleId: string; error: string } | null>(null);

  // Step 6E: Admin Topic Content Management State
  const [topicContentModal, setTopicContentModal] = useState<{
    moduleId: string;
    topicId: string;
    topicTitle: string;
  } | null>(null);
  const [isTopicContentLoading, setIsTopicContentLoading] = useState<boolean>(false);
  const [topicContentLoadError, setTopicContentLoadError] = useState<string | null>(null);
  const [isSubmittingTopicContent, setIsSubmittingTopicContent] = useState<boolean>(false);
  const [topicContentSubmitError, setTopicContentSubmitError] = useState<string | null>(null);

  const [tcTitle, setTcTitle] = useState<string>('');
  const [tcDescription, setTcDescription] = useState<string>('');
  const [tcContent, setTcContent] = useState<string>('');
  const [tcImportantPoints, setTcImportantPoints] = useState<string[]>([]);
  const [tcNewPointInput, setTcNewPointInput] = useState<string>('');
  const [tcValidationErrors, setTcValidationErrors] = useState<Record<string, string>>({});
  const [showTcDiscardConfirm, setShowTcDiscardConfirm] = useState<boolean>(false);

  const tcInitialValuesRef = useRef<{
    title: string;
    description: string;
    content: string;
    importantPoints: string[];
  }>({
    title: '',
    description: '',
    content: '',
    importantPoints: [],
  });

  // Step 6F: Admin Topic Video References Management State
  const [topicVideosModal, setTopicVideosModal] = useState<{
    moduleId: string;
    topicId: string;
    topicTitle: string;
  } | null>(null);
  const [isTopicVideosLoading, setIsTopicVideosLoading] = useState<boolean>(false);
  const [topicVideosLoadError, setTopicVideosLoadError] = useState<string | null>(null);
  const [isSubmittingTopicVideos, setIsSubmittingTopicVideos] = useState<boolean>(false);
  const [topicVideosSubmitError, setTopicVideosSubmitError] = useState<string | null>(null);

  const [tvEnglish, setTvEnglish] = useState<string>('');
  const [tvTelugu, setTvTelugu] = useState<string>('');
  const [tvHindi, setTvHindi] = useState<string>('');
  const [tvValidationErrors, setTvValidationErrors] = useState<Record<string, string>>({});
  const [showTvDiscardConfirm, setShowTvDiscardConfirm] = useState<boolean>(false);

  const tvInitialValuesRef = useRef<{
    english: string;
    telugu: string;
    hindi: string;
  }>({
    english: '',
    telugu: '',
    hindi: '',
  });

  // Step 6G: Admin Topic Code Examples & Images Management State
  const [topicCodeImagesModal, setTopicCodeImagesModal] = useState<{
    moduleId: string;
    topicId: string;
    topicTitle: string;
  } | null>(null);
  const [tciActiveTab, setTciActiveTab] = useState<'code' | 'images'>('code');
  const [isTopicCodeImagesLoading, setIsTopicCodeImagesLoading] = useState<boolean>(false);
  const [topicCodeImagesLoadError, setTopicCodeImagesLoadError] = useState<string | null>(null);
  const [isSubmittingTopicCodeImages, setIsSubmittingTopicCodeImages] = useState<boolean>(false);
  const [topicCodeImagesSubmitError, setTopicCodeImagesSubmitError] = useState<string | null>(null);

  const [tciCodeExamples, setTciCodeExamples] = useState<AdminTopicCodeExample[]>([]);
  const [tciImages, setTciImages] = useState<AdminTopicImage[]>([]);
  const [tciValidationErrors, setTciValidationErrors] = useState<{
    codeExamples?: Record<number, { title?: string; language?: string; code?: string; explanation?: string }>;
    images?: Record<number, { url?: string; caption?: string; altText?: string }>;
    general?: string;
  }>({});
  const [showTciDiscardConfirm, setShowTciDiscardConfirm] = useState<boolean>(false);

  const tciInitialValuesRef = useRef<{
    codeExamples: AdminTopicCodeExample[];
    images: AdminTopicImage[];
  }>({
    codeExamples: [],
    images: [],
  });

  // Modal Request sequencing ref to prevent race conditions
  const modalRequestIdRef = useRef<number>(0);

  // Status mutation modal state
  const [statusModal, setStatusModal] = useState<{
    course: AdminCourse;
    targetStatus: CourseStatus;
  } | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);
  const [statusMutationError, setStatusMutationError] = useState<string | null>(null);

  // Row dropdown actions menu state
  const [openMenuCourseId, setOpenMenuCourseId] = useState<string | null>(null);

  // Feedback notification banner state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Course Creation Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Create Course Form Data
  const [createTitle, setCreateTitle] = useState<string>('');
  const [createDescription, setCreateDescription] = useState<string>('');
  const [createCategory, setCreateCategory] = useState<string>('');
  const [createCreatorId, setCreateCreatorId] = useState<string>('');
  const [createThumbnail, setCreateThumbnail] = useState<string>('');
  const [createSyllabus, setCreateSyllabus] = useState<
    Array<{ id: string; title: string; description: string }>
  >([]);

  // Field validation errors
  const [createValidationErrors, setCreateValidationErrors] = useState<Record<string, string>>({});

  // Active course creators list for selector
  const [courseCreators, setCourseCreators] = useState<AdminUser[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState<boolean>(false);
  const [creatorsError, setCreatorsError] = useState<string | null>(null);

  // Fetch active course creators for the creator selector
  const fetchCourseCreators = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingCreators(true);
    setCreatorsError(null);
    try {
      const res = await adminApi.getUsers(accessToken, {
        role: 'courseCreator',
        status: 'active',
        limit: 100,
      });
      setCourseCreators(res.users || []);
    } catch (err: any) {
      setCreatorsError(err?.message || 'Failed to load course creators.');
    } finally {
      setIsLoadingCreators(false);
    }
  }, [accessToken]);

  // Open Create Course modal and reset all fields
  const handleOpenCreateModal = () => {
    setCreateTitle('');
    setCreateDescription('');
    setCreateCategory('');
    setCreateCreatorId('');
    setCreateThumbnail('');
    setCreateSyllabus([]);
    setCreateValidationErrors({});
    setCreateError(null);
    setIsCreateModalOpen(true);
    fetchCourseCreators();
  };

  // Close Create Course modal
  const handleCloseCreateModal = () => {
    if (isSubmittingCreate) return;
    setIsCreateModalOpen(false);
    setCreateError(null);
    setCreateValidationErrors({});
  };

  // Syllabus management handlers
  const handleAddSyllabusItem = () => {
    setCreateSyllabus((prev) => [
      ...prev,
      {
        id: `syl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: '',
        description: '',
      },
    ]);
  };

  const handleUpdateSyllabusItem = (
    id: string,
    field: 'title' | 'description',
    val: string
  ) => {
    setCreateSyllabus((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveSyllabusItem = (id: string) => {
    setCreateSyllabus((prev) => prev.filter((item) => item.id !== id));
  };

  // Form submission handler
  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || isSubmittingCreate) return;

    const trimmedTitle = createTitle.trim();
    const trimmedDescription = createDescription.trim();
    const trimmedCategory = createCategory.trim();
    const trimmedThumbnail = createThumbnail.trim();

    const errors: Record<string, string> = {};

    // Validate title (3-150 chars)
    if (!trimmedTitle) {
      errors.title = 'Course title is required.';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Course title must be at least 3 characters.';
    } else if (trimmedTitle.length > 150) {
      errors.title = 'Course title cannot exceed 150 characters.';
    }

    // Validate description (10-5000 chars)
    if (!trimmedDescription) {
      errors.description = 'Description is required.';
    } else if (trimmedDescription.length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    } else if (trimmedDescription.length > 5000) {
      errors.description = 'Description cannot exceed 5000 characters.';
    }

    // Validate category (2-50 chars)
    if (!trimmedCategory) {
      errors.category = 'Category is required.';
    } else if (trimmedCategory.length < 2) {
      errors.category = 'Category must be at least 2 characters.';
    } else if (trimmedCategory.length > 50) {
      errors.category = 'Category cannot exceed 50 characters.';
    }

    // Validate courseCreator
    if (!createCreatorId) {
      errors.courseCreator = 'Please select a course creator.';
    }

    // Validate thumbnail if provided (max 500 chars, valid HTTP/HTTPS URL)
    if (trimmedThumbnail) {
      if (trimmedThumbnail.length > 500) {
        errors.thumbnail = 'Thumbnail URL cannot exceed 500 characters.';
      } else {
        try {
          const parsed = new URL(trimmedThumbnail);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            errors.thumbnail = 'Thumbnail URL must start with http:// or https://';
          }
        } catch {
          errors.thumbnail = 'Please enter a valid URL (e.g., https://example.com/image.jpg).';
        }
      }
    }

    // Validate syllabus items if any
    createSyllabus.forEach((item, index) => {
      const sTitle = item.title.trim();
      const sDesc = item.description.trim();
      if (!sTitle) {
        errors[`syllabus_${item.id}_title`] = `Syllabus item #${index + 1} requires a title.`;
      } else if (sTitle.length > 200) {
        errors[`syllabus_${item.id}_title`] = `Syllabus item #${index + 1} title cannot exceed 200 characters.`;
      }
      if (sDesc.length > 1000) {
        errors[`syllabus_${item.id}_desc`] = `Syllabus item #${index + 1} description cannot exceed 1000 characters.`;
      }
    });

    setCreateValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setCreateError('Please resolve the highlighted validation errors.');
      return;
    }

    setIsSubmittingCreate(true);
    setCreateError(null);

    const payload: CreateAdminCourseRequest = {
      title: trimmedTitle,
      description: trimmedDescription,
      category: trimmedCategory,
      courseCreator: createCreatorId,
      status: 'draft',
    };

    if (trimmedThumbnail) {
      payload.thumbnail = trimmedThumbnail;
    }

    if (createSyllabus.length > 0) {
      payload.syllabus = createSyllabus.map((item, index) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        order: index,
      }));
    }

    try {
      const newCourse = await adminApi.createCourse(accessToken, payload);

      // Close modal and reset
      setIsCreateModalOpen(false);
      setFeedback({
        type: 'success',
        message: 'Course created successfully.',
      });

      // Refresh list to preserve pagination / filter integrity
      fetchCourses(true);
    } catch (err: any) {
      setCreateError(err?.message || 'Unable to create course. Please try again.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Course Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isLoadingEditCourse, setIsLoadingEditCourse] = useState<boolean>(false);
  const [editCourseLoadError, setEditCourseLoadError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  // Edit Course Form Data
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editCreatorId, setEditCreatorId] = useState<string>('');
  const [editThumbnail, setEditThumbnail] = useState<string>('');
  const [editStatus, setEditStatus] = useState<CourseStatus>('draft');
  const [editSyllabus, setEditSyllabus] = useState<
    Array<{ id: string; title: string; description: string }>
  >([]);

  // Baseline Form Snapshot for dirty check
  const [editInitialData, setEditInitialData] = useState<{
    title: string;
    description: string;
    category: string;
    creatorId: string;
    thumbnail: string;
    syllabus: Array<{ id: string; title: string; description: string }>;
  } | null>(null);

  // Field validation errors for Edit form
  const [editValidationErrors, setEditValidationErrors] = useState<Record<string, string>>({});

  // Determine if Edit form has unsaved modifications
  const isEditFormDirty = (): boolean => {
    if (!editInitialData) return false;
    if (editTitle !== editInitialData.title) return true;
    if (editDescription !== editInitialData.description) return true;
    if (editCategory !== editInitialData.category) return true;
    if (editCreatorId !== editInitialData.creatorId) return true;
    if (editThumbnail !== editInitialData.thumbnail) return true;

    if (editSyllabus.length !== editInitialData.syllabus.length) return true;
    for (let i = 0; i < editSyllabus.length; i++) {
      const curr = editSyllabus[i];
      const init = editInitialData.syllabus[i];
      if (curr.title !== init.title || curr.description !== init.description) {
        return true;
      }
    }
    return false;
  };

  // Open Edit Course modal and fetch authoritative course data
  const handleOpenEditModal = async (courseId: string) => {
    if (!accessToken) return;
    setEditingCourseId(courseId);
    setIsEditModalOpen(true);
    setIsLoadingEditCourse(true);
    setEditCourseLoadError(null);
    setEditError(null);
    setEditValidationErrors({});
    setShowDiscardConfirm(false);

    // Fetch active course creators list to ensure populated options
    fetchCourseCreators();

    try {
      const authoritativeCourse = await adminApi.getCourseById(accessToken, courseId);

      const creatorIdVal =
        authoritativeCourse.courseCreator && typeof authoritativeCourse.courseCreator === 'object'
          ? authoritativeCourse.courseCreator.id
          : typeof authoritativeCourse.courseCreator === 'string'
          ? (authoritativeCourse.courseCreator as string)
          : '';

      const syllabusItems = (authoritativeCourse.syllabus || []).map((s, idx) => ({
        id: (s as any).id || (s as any)._id || `syl-edit-${idx}-${Date.now()}`,
        title: s.title || '',
        description: s.description || '',
      }));

      const loadedTitle = authoritativeCourse.title || '';
      const loadedDescription = authoritativeCourse.description || '';
      const loadedCategory = authoritativeCourse.category || '';
      const loadedThumbnail = authoritativeCourse.thumbnail || '';
      const loadedStatus = authoritativeCourse.status || 'draft';

      setEditTitle(loadedTitle);
      setEditDescription(loadedDescription);
      setEditCategory(loadedCategory);
      setEditCreatorId(creatorIdVal);
      setEditThumbnail(loadedThumbnail);
      setEditStatus(loadedStatus);
      setEditSyllabus(syllabusItems);

      // Save initial baseline snapshot
      setEditInitialData({
        title: loadedTitle,
        description: loadedDescription,
        category: loadedCategory,
        creatorId: creatorIdVal,
        thumbnail: loadedThumbnail,
        syllabus: syllabusItems.map((item) => ({ ...item })),
      });
    } catch (err: any) {
      setEditCourseLoadError(err?.message || 'Failed to load authoritative course details.');
    } finally {
      setIsLoadingEditCourse(false);
    }
  };

  // Close Edit Course modal with dirty confirmation check
  const handleCloseEditModal = (force = false) => {
    if (isSubmittingEdit) return;
    if (!force && isEditFormDirty()) {
      setShowDiscardConfirm(true);
      return;
    }
    setIsEditModalOpen(false);
    setEditingCourseId(null);
    setEditError(null);
    setEditValidationErrors({});
    setShowDiscardConfirm(false);
    setEditInitialData(null);
  };

  // Syllabus management handlers for Edit modal
  const handleAddEditSyllabusItem = () => {
    setEditSyllabus((prev) => [
      ...prev,
      {
        id: `syl-edit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: '',
        description: '',
      },
    ]);
  };

  const handleUpdateEditSyllabusItem = (
    id: string,
    field: 'title' | 'description',
    val: string
  ) => {
    setEditSyllabus((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveEditSyllabusItem = (id: string) => {
    setEditSyllabus((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveEditSyllabusItem = (index: number, direction: 'up' | 'down') => {
    setEditSyllabus((prev) => {
      const newItems = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newItems.length) return prev;
      const temp = newItems[index];
      newItems[index] = newItems[targetIndex];
      newItems[targetIndex] = temp;
      return newItems;
    });
  };

  // Edit form submission handler
  const handleEditCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !editingCourseId || isSubmittingEdit) return;

    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();
    const trimmedCategory = editCategory.trim();
    const trimmedThumbnail = editThumbnail.trim();

    const errors: Record<string, string> = {};

    // Validate title (3-150 chars)
    if (!trimmedTitle) {
      errors.title = 'Course title is required.';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Course title must be at least 3 characters.';
    } else if (trimmedTitle.length > 150) {
      errors.title = 'Course title cannot exceed 150 characters.';
    }

    // Validate description (10-5000 chars)
    if (!trimmedDescription) {
      errors.description = 'Description is required.';
    } else if (trimmedDescription.length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    } else if (trimmedDescription.length > 5000) {
      errors.description = 'Description cannot exceed 5000 characters.';
    }

    // Validate category (2-50 chars)
    if (!trimmedCategory) {
      errors.category = 'Category is required.';
    } else if (trimmedCategory.length < 2) {
      errors.category = 'Category must be at least 2 characters.';
    } else if (trimmedCategory.length > 50) {
      errors.category = 'Category cannot exceed 50 characters.';
    }

    // Validate courseCreator
    if (!editCreatorId) {
      errors.courseCreator = 'Please select a course creator.';
    }

    // Validate thumbnail if provided (max 500 chars, valid HTTP/HTTPS URL)
    if (trimmedThumbnail) {
      if (trimmedThumbnail.length > 500) {
        errors.thumbnail = 'Thumbnail URL cannot exceed 500 characters.';
      } else {
        try {
          const parsed = new URL(trimmedThumbnail);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            errors.thumbnail = 'Thumbnail URL must start with http:// or https://';
          }
        } catch {
          errors.thumbnail = 'Please enter a valid URL (e.g., https://example.com/image.jpg).';
        }
      }
    }

    // Validate syllabus items if any
    editSyllabus.forEach((item, index) => {
      const sTitle = item.title.trim();
      const sDesc = item.description.trim();
      if (!sTitle) {
        errors[`syllabus_${item.id}_title`] = `Syllabus milestone #${index + 1} requires a title.`;
      } else if (sTitle.length > 200) {
        errors[`syllabus_${item.id}_title`] = `Syllabus milestone #${index + 1} title cannot exceed 200 characters.`;
      }
      if (sDesc.length > 1000) {
        errors[`syllabus_${item.id}_desc`] = `Syllabus milestone #${index + 1} description cannot exceed 1000 characters.`;
      }
    });

    setEditValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setEditError('Please resolve the highlighted validation errors.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    const payload: UpdateAdminCourseRequest = {
      title: trimmedTitle,
      description: trimmedDescription,
      category: trimmedCategory,
      courseCreator: editCreatorId,
      thumbnail: trimmedThumbnail,
      syllabus: editSyllabus.map((item, index) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        order: index,
      })),
    };

    try {
      const updatedCourse = await adminApi.updateCourse(accessToken, editingCourseId, payload);

      // 1. Update courses list state with server-authoritative response
      setCourses((prev) =>
        prev.map((c) => (c.id === updatedCourse.id ? { ...c, ...updatedCourse } : c))
      );

      // 2. Update active view modal if open
      if (courseDetails && courseDetails.id === updatedCourse.id) {
        setCourseDetails((prev) =>
          prev ? { ...prev, ...updatedCourse } : null
        );
      }

      // Close modal and set success banner
      setIsEditModalOpen(false);
      setEditingCourseId(null);
      setEditInitialData(null);
      setShowDiscardConfirm(false);

      setFeedback({
        type: 'success',
        message: 'Course updated successfully.',
      });

      // Refresh list to preserve pagination / filter integrity
      fetchCourses(true);
    } catch (err: any) {
      setEditError(err?.message || 'Unable to update course. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Clear feedback notification automatically after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Debounce search input to prevent excessive API hits
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== searchFilter) {
        setSearchFilter(trimmed);
        setPage(1); // Reset page on search filter change
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, searchFilter]);

  // Debounce category input to prevent excessive API hits
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = categoryInput.trim();
      if (trimmed !== categoryFilter) {
        setCategoryFilter(trimmed);
        setPage(1); // Reset page on category filter change
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [categoryInput, categoryFilter]);

  // Fetch real courses from backend API
  const fetchCourses = useCallback(
    async (isSilent = false) => {
      if (!accessToken) return;

      const currentRequestId = ++requestIdRef.current;

      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const queryParams: GetAdminCoursesParams = {
          page,
          limit,
          search: searchFilter || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        };

        const res = await adminApi.getCourses(accessToken, queryParams);

        // Discard result if a newer request has already been issued
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setCourses(res.courses);
        setPagination(res.pagination);
      } catch (err: any) {
        if (currentRequestId === requestIdRef.current) {
          setError(
            err?.message || 'Failed to retrieve course catalog. Please try again.'
          );
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [accessToken, page, limit, searchFilter, statusFilter, categoryFilter]
  );

  // Load on mount and when query parameters change
  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchCourses(false);
    }
  }, [authLoading, accessToken, fetchCourses]);

  // Fetch Course Details by ID
  const fetchCourseDetails = useCallback(
    async (courseId: string) => {
      if (!accessToken) return;
      const currentModalId = modalRequestIdRef.current;
      setDetailsLoading(true);
      setDetailsError(null);

      try {
        const details = await adminApi.getCourseById(accessToken, courseId);
        if (currentModalId !== modalRequestIdRef.current) return;
        setCourseDetails(details);
      } catch (err: any) {
        if (currentModalId !== modalRequestIdRef.current) return;
        setDetailsError('Unable to load course details.');
      } finally {
        if (currentModalId === modalRequestIdRef.current) {
          setDetailsLoading(false);
        }
      }
    },
    [accessToken]
  );

  // Fetch Course Structure (Modules -> Topics)
  const fetchCourseStructure = useCallback(
    async (courseId: string) => {
      if (!accessToken) return;
      const currentModalId = modalRequestIdRef.current;
      setStructureLoading(true);
      setStructureError(null);

      try {
        const structure = await adminApi.getCourseStructure(accessToken, courseId);
        if (currentModalId !== modalRequestIdRef.current) return;
        setCourseStructure(structure);
        // Expand all modules by default so structure is immediately visible
        const expanded: Record<string, boolean> = {};
        structure.modules?.forEach((m) => {
          expanded[m.id] = true;
        });
        setExpandedModules(expanded);
      } catch (err: any) {
        if (currentModalId !== modalRequestIdRef.current) return;
        setStructureError('Unable to load course structure.');
      } finally {
        if (currentModalId === modalRequestIdRef.current) {
          setStructureLoading(false);
        }
      }
    },
    [accessToken]
  );

  // Fetch Topics for a specific Module
  const fetchModuleTopics = useCallback(
    async (courseId: string, moduleId: string) => {
      if (!accessToken) return;
      setTopicsLoading((prev) => ({ ...prev, [moduleId]: true }));
      setTopicsError((prev) => ({ ...prev, [moduleId]: null }));

      try {
        const topics = await adminApi.getModuleTopics(accessToken, courseId, moduleId);
        setModuleTopics((prev) => ({ ...prev, [moduleId]: topics }));
      } catch (err: any) {
        setTopicsError((prev) => ({
          ...prev,
          [moduleId]: err?.message || 'Failed to load module topics.',
        }));
      } finally {
        setTopicsLoading((prev) => ({ ...prev, [moduleId]: false }));
      }
    },
    [accessToken]
  );

  // Fetch Course Modules (CRUD List)
  const fetchCourseModules = useCallback(
    async (courseId: string) => {
      if (!accessToken) return;
      const currentModalId = modalRequestIdRef.current;
      setModulesLoading(true);
      setModulesError(null);

      try {
        const modules = await adminApi.getCourseModules(accessToken, courseId);
        if (currentModalId !== modalRequestIdRef.current) return;
        setCourseModules(modules);
        // Pre-fetch topics and expand topics list for each module
        const expandedMap: Record<string, boolean> = {};
        modules.forEach((mod) => {
          expandedMap[mod.id] = true;
          fetchModuleTopics(courseId, mod.id);
        });
        setExpandedTopicsModules((prev) => ({ ...expandedMap, ...prev }));
      } catch (err: any) {
        if (currentModalId !== modalRequestIdRef.current) return;
        setModulesError(err?.message || 'Unable to load course modules.');
      } finally {
        if (currentModalId === modalRequestIdRef.current) {
          setModulesLoading(false);
        }
      }
    },
    [accessToken, fetchModuleTopics]
  );

  // Open Course Details & Structure modal
  const handleOpenCourse = (
    courseId: string,
    initialTab: 'overview' | 'modules' | 'structure' = 'overview'
  ) => {
    modalRequestIdRef.current++;
    setSelectedCourseId(courseId);
    setActiveModalTab(initialTab);
    setSelectedTopic(null);
    setCourseDetails(null);
    setCourseStructure(null);
    setCourseModules([]);
    setModuleTopics({});
    setTopicsLoading({});
    setTopicsError({});
    fetchCourseDetails(courseId);
    fetchCourseStructure(courseId);
    fetchCourseModules(courseId);
  };

  // Close Modal
  const handleCloseModal = () => {
    modalRequestIdRef.current++;
    setSelectedCourseId(null);
    setSelectedTopic(null);
    setCourseDetails(null);
    setCourseStructure(null);
    setCourseModules([]);
    setDetailsError(null);
    setStructureError(null);
    setModulesError(null);
    setModuleModal(null);
    setDeleteModuleModal(null);
    setReorderError(null);
    setIsReorderingModules(false);
    setModuleTopics({});
    setTopicsLoading({});
    setTopicsError({});
    setExpandedTopicsModules({});
    setTopicModal(null);
    setDeleteTopicModal(null);
  };

  // Module CRUD handlers
  const handleOpenCreateModule = () => {
    const nextOrder =
      courseModules.length > 0
        ? Math.max(...courseModules.map((m) => (typeof m.order === 'number' ? m.order : 0))) + 1
        : 0;
    setModuleTitle('');
    setModuleDescription('');
    setModuleOrder(nextOrder);
    setModuleErrors({});
    setModuleSubmitError(null);
    setModuleModal({ mode: 'create' });
  };

  const handleOpenEditModule = (mod: AdminModule) => {
    setModuleTitle(mod.title);
    setModuleDescription(mod.description || '');
    setModuleOrder(typeof mod.order === 'number' ? mod.order : 0);
    setModuleErrors({});
    setModuleSubmitError(null);
    setModuleModal({ mode: 'edit', module: mod });
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCourseId || isSubmittingModule) return;

    const trimmedTitle = moduleTitle.trim();
    const trimmedDesc = moduleDescription.trim();

    const errors: Record<string, string> = {};
    if (!trimmedTitle) {
      errors.title = 'Module title is required.';
    } else if (trimmedTitle.length < 2) {
      errors.title = 'Module title must be at least 2 characters.';
    } else if (trimmedTitle.length > 150) {
      errors.title = 'Module title cannot exceed 150 characters.';
    }

    if (trimmedDesc.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters.';
    }

    if (
      moduleOrder === undefined ||
      moduleOrder === null ||
      isNaN(Number(moduleOrder)) ||
      Number(moduleOrder) < 0 ||
      !Number.isInteger(Number(moduleOrder))
    ) {
      errors.order = 'Order must be a non-negative integer.';
    }

    setModuleErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingModule(true);
    setModuleSubmitError(null);

    try {
      if (moduleModal?.mode === 'create') {
        const payload: CreateAdminModuleRequest = {
          title: trimmedTitle,
          description: trimmedDesc || undefined,
          order: Number(moduleOrder),
        };
        await adminApi.createModule(accessToken, selectedCourseId, payload);
        setFeedback({
          type: 'success',
          message: `Module "${trimmedTitle}" created successfully.`,
        });
      } else if (moduleModal?.mode === 'edit' && moduleModal.module) {
        const payload: UpdateAdminModuleRequest = {
          title: trimmedTitle,
          description: trimmedDesc,
          order: Number(moduleOrder),
        };
        await adminApi.updateModule(
          accessToken,
          selectedCourseId,
          moduleModal.module.id,
          payload
        );
        setFeedback({
          type: 'success',
          message: `Module "${trimmedTitle}" updated successfully.`,
        });
      }

      setModuleModal(null);
      await Promise.all([
        fetchCourseModules(selectedCourseId),
        fetchCourseStructure(selectedCourseId),
      ]);
    } catch (err: any) {
      setModuleSubmitError(err?.message || 'Failed to save module.');
    } finally {
      setIsSubmittingModule(false);
    }
  };

  const handleDeleteModuleConfirm = async () => {
    if (!accessToken || !selectedCourseId || !deleteModuleModal || isDeletingModule) return;

    setIsDeletingModule(true);
    setDeleteModuleError(null);

    try {
      await adminApi.deleteModule(
        accessToken,
        selectedCourseId,
        deleteModuleModal.id
      );
      setFeedback({
        type: 'success',
        message: `Module "${deleteModuleModal.title}" deleted successfully.`,
      });
      setDeleteModuleModal(null);
      await Promise.all([
        fetchCourseModules(selectedCourseId),
        fetchCourseStructure(selectedCourseId),
      ]);
    } catch (err: any) {
      setDeleteModuleError(err?.message || 'Failed to delete module.');
    } finally {
      setIsDeletingModule(false);
    }
  };

  // Move Module Up / Down (Reorder)
  const handleMoveModule = async (moduleId: string, direction: 'up' | 'down') => {
    if (!accessToken || !selectedCourseId || isReorderingModules || courseModules.length <= 1) return;

    const currentIndex = courseModules.findIndex((m) => m.id === moduleId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === courseModules.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Build the newly ordered array of module objects
    const reordered = [...courseModules];
    const [targetModule] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, targetModule);

    const orderedIds = reordered.map((m) => m.id);

    setIsReorderingModules(true);
    setReorderError(null);

    try {
      const updatedModules = await adminApi.reorderModules(
        accessToken,
        selectedCourseId,
        orderedIds
      );

      // Refresh with authoritative server response
      setCourseModules(updatedModules);
      fetchCourseStructure(selectedCourseId);
      setFeedback({
        type: 'success',
        message: `Module "${targetModule.title}" moved ${direction}. New order saved.`,
      });
    } catch (err: any) {
      setReorderError(err?.message || 'Failed to reorder modules. Please try again.');
    } finally {
      setIsReorderingModules(false);
    }
  };

  // Toggle Topics Section Expand/Collapse for a specific module
  const toggleTopicsExpand = (moduleId: string) => {
    setExpandedTopicsModules((prev) => {
      const nextState = !prev[moduleId];
      if (nextState && selectedCourseId && !moduleTopics[moduleId]) {
        fetchModuleTopics(selectedCourseId, moduleId);
      }
      return { ...prev, [moduleId]: nextState };
    });
  };

  // Topic CRUD Handlers
  const handleOpenCreateTopic = (mod: AdminModule) => {
    const currentTopics = moduleTopics[mod.id] || [];
    const nextOrder =
      currentTopics.length > 0
        ? Math.max(...currentTopics.map((t) => (typeof t.order === 'number' ? t.order : 0))) + 1
        : 0;

    setTopicTitle('');
    setTopicDescription('');
    setTopicOrder(nextOrder);
    setTopicErrors({});
    setTopicSubmitError(null);
    setTopicModal({ mode: 'create', moduleId: mod.id });
    setExpandedTopicsModules((prev) => ({ ...prev, [mod.id]: true }));
  };

  const handleOpenEditTopic = (moduleId: string, topic: AdminTopic) => {
    setTopicTitle(topic.title);
    setTopicDescription(topic.description || '');
    setTopicOrder(typeof topic.order === 'number' ? topic.order : 0);
    setTopicErrors({});
    setTopicSubmitError(null);
    setTopicModal({ mode: 'edit', moduleId, topic });
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCourseId || !topicModal || isSubmittingTopic) return;

    const trimmedTitle = topicTitle.trim();
    const trimmedDesc = topicDescription.trim();

    const errors: Record<string, string> = {};
    if (!trimmedTitle) {
      errors.title = 'Topic title is required.';
    } else if (trimmedTitle.length < 2) {
      errors.title = 'Topic title must be at least 2 characters.';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Topic title cannot exceed 200 characters.';
    }

    if (trimmedDesc.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters.';
    }

    if (
      topicOrder === undefined ||
      topicOrder === null ||
      isNaN(Number(topicOrder)) ||
      Number(topicOrder) < 0 ||
      !Number.isInteger(Number(topicOrder))
    ) {
      errors.order = 'Order must be a non-negative integer.';
    }

    setTopicErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingTopic(true);
    setTopicSubmitError(null);

    try {
      if (topicModal.mode === 'create') {
        const payload: CreateAdminTopicRequest = {
          title: trimmedTitle,
          description: trimmedDesc || undefined,
          order: Number(topicOrder),
        };
        await adminApi.createTopic(accessToken, selectedCourseId, topicModal.moduleId, payload);
        setFeedback({
          type: 'success',
          message: `Topic "${trimmedTitle}" created successfully.`,
        });
      } else if (topicModal.mode === 'edit' && topicModal.topic) {
        const payload: UpdateAdminTopicRequest = {
          title: trimmedTitle,
          description: trimmedDesc,
          order: Number(topicOrder),
        };
        await adminApi.updateTopic(
          accessToken,
          selectedCourseId,
          topicModal.moduleId,
          topicModal.topic.id,
          payload
        );
        setFeedback({
          type: 'success',
          message: `Topic "${trimmedTitle}" updated successfully.`,
        });
      }

      const modId = topicModal.moduleId;
      setTopicModal(null);
      await Promise.all([
        fetchModuleTopics(selectedCourseId, modId),
        fetchCourseStructure(selectedCourseId),
      ]);
    } catch (err: any) {
      setTopicSubmitError(err?.message || 'Failed to save topic.');
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  const handleDeleteTopicConfirm = async () => {
    if (!accessToken || !selectedCourseId || !deleteTopicModal || isDeletingTopic) return;

    setIsDeletingTopic(true);
    setDeleteTopicError(null);

    try {
      await adminApi.deleteTopic(
        accessToken,
        selectedCourseId,
        deleteTopicModal.moduleId,
        deleteTopicModal.topic.id
      );
      setFeedback({
        type: 'success',
        message: `Topic "${deleteTopicModal.topic.title}" deleted successfully.`,
      });
      const modId = deleteTopicModal.moduleId;
      setDeleteTopicModal(null);
      await Promise.all([
        fetchModuleTopics(selectedCourseId, modId),
        fetchCourseStructure(selectedCourseId),
      ]);
    } catch (err: any) {
      setDeleteTopicError(err?.message || 'Failed to delete topic.');
    } finally {
      setIsDeletingTopic(false);
    }
  };

  // Topic Reordering Handler
  const handleMoveTopic = async (moduleId: string, topicId: string, direction: 'up' | 'down') => {
    if (!accessToken || !selectedCourseId || reorderingTopicModuleId) return;

    const topics = moduleTopics[moduleId] || [];
    const currentIndex = topics.findIndex((t) => t.id === topicId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === topics.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reordered = [...topics];
    const [movedTopic] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedTopic);

    const orderedIds = reordered.map((t) => t.id);

    setReorderingTopicModuleId(moduleId);
    setTopicReorderError(null);

    try {
      const updatedTopics = await adminApi.reorderTopics(
        accessToken,
        selectedCourseId,
        moduleId,
        orderedIds
      );
      setModuleTopics((prev) => ({
        ...prev,
        [moduleId]: updatedTopics,
      }));
      setFeedback({
        type: 'success',
        message: `Topic "${movedTopic.title}" moved ${direction}. New order saved.`,
      });
      fetchCourseStructure(selectedCourseId);
    } catch (err: any) {
      setTopicReorderError({
        moduleId,
        error: err?.message || 'Failed to reorder topics. Please try again.',
      });
    } finally {
      setReorderingTopicModuleId(null);
    }
  };

  // Step 6E: Topic Content Management Handlers
  const handleOpenTopicContent = async (moduleId: string, topic: AdminTopic) => {
    if (!accessToken || !selectedCourseId) return;

    setTopicContentModal({
      moduleId,
      topicId: topic.id,
      topicTitle: topic.title,
    });
    setIsTopicContentLoading(true);
    setTopicContentLoadError(null);
    setTopicContentSubmitError(null);
    setTcValidationErrors({});
    setShowTcDiscardConfirm(false);
    setTcNewPointInput('');

    // Pre-populate with existing state immediately
    const initialTitle = topic.title || '';
    const initialDesc = topic.description || '';
    const initialContent =
      typeof topic.content === 'string'
        ? topic.content
        : topic.content?.explanation || '';
    const initialPoints = Array.isArray(topic.importantPoints) ? [...topic.importantPoints] : [];

    setTcTitle(initialTitle);
    setTcDescription(initialDesc);
    setTcContent(initialContent);
    setTcImportantPoints(initialPoints);

    tcInitialValuesRef.current = {
      title: initialTitle,
      description: initialDesc,
      content: initialContent,
      importantPoints: initialPoints,
    };

    try {
      // Authoritatively fetch fresh topic from server to ensure accurate content
      const freshTopic = await adminApi.getTopic(
        accessToken,
        selectedCourseId,
        moduleId,
        topic.id
      );

      const freshTitle = freshTopic.title || '';
      const freshDesc = freshTopic.description || '';
      const freshContent =
        typeof freshTopic.content === 'string'
          ? freshTopic.content
          : freshTopic.content?.explanation || '';
      const freshPoints = Array.isArray(freshTopic.importantPoints)
        ? [...freshTopic.importantPoints]
        : [];

      setTcTitle(freshTitle);
      setTcDescription(freshDesc);
      setTcContent(freshContent);
      setTcImportantPoints(freshPoints);

      tcInitialValuesRef.current = {
        title: freshTitle,
        description: freshDesc,
        content: freshContent,
        importantPoints: freshPoints,
      };
    } catch (err: any) {
      setTopicContentLoadError(
        err?.message || 'Failed to fetch latest topic content from server. You may still edit or retry.'
      );
    } finally {
      setIsTopicContentLoading(false);
    }
  };

  const isTopicContentDirty = () => {
    const init = tcInitialValuesRef.current;
    if (tcTitle.trim() !== init.title.trim()) return true;
    if (tcDescription.trim() !== init.description.trim()) return true;
    if (tcContent.trim() !== init.content.trim()) return true;
    if (tcImportantPoints.length !== init.importantPoints.length) return true;
    for (let i = 0; i < tcImportantPoints.length; i++) {
      if (tcImportantPoints[i].trim() !== (init.importantPoints[i] || '').trim()) return true;
    }
    return false;
  };

  const handleCloseTopicContentModal = (force: boolean = false) => {
    if (!force && isTopicContentDirty() && !isSubmittingTopicContent) {
      setShowTcDiscardConfirm(true);
      return;
    }
    setTopicContentModal(null);
    setShowTcDiscardConfirm(false);
    setTopicContentSubmitError(null);
    setTopicContentLoadError(null);
    setTcValidationErrors({});
  };

  const handleAddImportantPoint = () => {
    const trimmed = tcNewPointInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      setTcValidationErrors((prev) => ({
        ...prev,
        newPoint: 'Point cannot exceed 1000 characters.',
      }));
      return;
    }
    if (tcImportantPoints.length >= 50) {
      setTcValidationErrors((prev) => ({
        ...prev,
        points: 'Maximum limit of 50 important points reached.',
      }));
      return;
    }
    setTcImportantPoints((prev) => [...prev, trimmed]);
    setTcNewPointInput('');
    setTcValidationErrors((prev) => {
      const next = { ...prev };
      delete next.newPoint;
      delete next.points;
      return next;
    });
  };

  const handleUpdateImportantPoint = (index: number, value: string) => {
    setTcImportantPoints((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (tcValidationErrors[`point_${index}`]) {
      setTcValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`point_${index}`];
        return next;
      });
    }
  };

  const handleRemoveImportantPoint = (index: number) => {
    setTcImportantPoints((prev) => prev.filter((_, i) => i !== index));
    setTcValidationErrors((prev) => {
      const next = { ...prev };
      delete next[`point_${index}`];
      delete next.points;
      return next;
    });
  };

  const handleSaveTopicContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCourseId || !topicContentModal || isSubmittingTopicContent) return;

    const trimmedTitle = tcTitle.trim();
    const trimmedDesc = tcDescription.trim();
    const trimmedContent = tcContent.trim();
    const cleanedPoints = tcImportantPoints.map((p) => p.trim()).filter((p) => p.length > 0);

    // If user typed into the input without clicking Add, include it if valid
    if (tcNewPointInput.trim()) {
      if (tcNewPointInput.trim().length <= 1000 && cleanedPoints.length < 50) {
        cleanedPoints.push(tcNewPointInput.trim());
      }
    }

    const errors: Record<string, string> = {};
    if (!trimmedTitle) {
      errors.title = 'Topic title is required.';
    } else if (trimmedTitle.length < 2) {
      errors.title = 'Topic title must be at least 2 characters.';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Topic title cannot exceed 200 characters.';
    }

    if (trimmedDesc.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters.';
    }

    if (trimmedContent.length > 50000) {
      errors.content = 'Content cannot exceed 50,000 characters.';
    }

    if (cleanedPoints.length > 50) {
      errors.points = 'Cannot exceed 50 important points.';
    }

    cleanedPoints.forEach((pt, i) => {
      if (pt.length > 1000) {
        errors[`point_${i}`] = `Point ${i + 1} cannot exceed 1000 characters.`;
      }
    });

    setTcValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingTopicContent(true);
    setTopicContentSubmitError(null);

    try {
      const updatedTopic = await adminApi.updateTopic(
        accessToken,
        selectedCourseId,
        topicContentModal.moduleId,
        topicContentModal.topicId,
        {
          title: trimmedTitle,
          description: trimmedDesc,
          content: trimmedContent,
          importantPoints: cleanedPoints,
        }
      );

      // Update in local state for this module immediately
      setModuleTopics((prev) => ({
        ...prev,
        [topicContentModal.moduleId]: (prev[topicContentModal.moduleId] || []).map((t) =>
          t.id === updatedTopic.id ? { ...t, ...updatedTopic } : t
        ),
      }));

      setFeedback({
        type: 'success',
        message: `Topic content updated successfully for "${updatedTopic.title}".`,
      });

      const modId = topicContentModal.moduleId;
      setTopicContentModal(null);

      // Keep current course structure synchronized without resetting UI context
      fetchCourseStructure(selectedCourseId);
    } catch (err: any) {
      setTopicContentSubmitError(err?.message || 'Failed to update topic content.');
    } finally {
      setIsSubmittingTopicContent(false);
    }
  };

  // Step 6F: Validate YouTube URL input (empty/null is allowed, but if present must be YouTube reference)
  const validateYouTubeInput = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.length > 1000) {
      return 'Video reference cannot exceed 1000 characters.';
    }
    // Direct 11-character YouTube video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return null;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'URL must start with http:// or https://';
      }
      const host = parsed.hostname.toLowerCase();
      const isYouTube =
        host === 'youtube.com' ||
        host.endsWith('.youtube.com') ||
        host === 'youtu.be' ||
        host === 'youtube-nocookie.com' ||
        host.endsWith('.youtube-nocookie.com');
      if (!isYouTube) {
        return 'Must be a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...).';
      }
      if (host === 'youtu.be') {
        const id = parsed.pathname.slice(1).split('/')[0];
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? null : 'Invalid youtu.be video ID.';
      }
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v');
        return Boolean(v && /^[a-zA-Z0-9_-]{11}$/.test(v))
          ? null
          : 'Missing or invalid "v" video parameter in watch URL.';
      }
      if (/^\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})/.test(parsed.pathname)) {
        return null;
      }
      if (parsed.searchParams.has('v')) {
        const v = parsed.searchParams.get('v');
        return Boolean(v && /^[a-zA-Z0-9_-]{11}$/.test(v)) ? null : 'Invalid video ID parameter.';
      }
      return 'Could not identify a valid YouTube video ID from this URL.';
    } catch {
      return 'Please enter a valid YouTube URL or 11-character video ID.';
    }
  };

  // Helper to format a safe preview link for valid YouTube references
  const getYouTubePreviewUrl = (val: string): string | null => {
    if (!val) return null;
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return `https://www.youtube.com/watch?v=${trimmed}`;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return null;
  };

  const isTopicVideosDirty = () => {
    const init = tvInitialValuesRef.current;
    return (
      tvEnglish.trim() !== init.english.trim() ||
      tvTelugu.trim() !== init.telugu.trim() ||
      tvHindi.trim() !== init.hindi.trim()
    );
  };

  const handleCloseTopicVideosModal = (force: boolean = false) => {
    if (!force && isTopicVideosDirty() && !isSubmittingTopicVideos) {
      setShowTvDiscardConfirm(true);
      return;
    }
    setTopicVideosModal(null);
    setShowTvDiscardConfirm(false);
    setTopicVideosSubmitError(null);
    setTopicVideosLoadError(null);
    setTvValidationErrors({});
  };

  const handleOpenTopicVideos = async (moduleId: string, topic: AdminTopic) => {
    if (!accessToken || !selectedCourseId) return;

    setTopicVideosModal({
      moduleId,
      topicId: topic.id,
      topicTitle: topic.title,
    });

    const initEn = topic.videos?.english || '';
    const initTe = topic.videos?.telugu || '';
    const initHi = topic.videos?.hindi || '';

    setTvEnglish(initEn);
    setTvTelugu(initTe);
    setTvHindi(initHi);
    tvInitialValuesRef.current = { english: initEn, telugu: initTe, hindi: initHi };

    setTopicVideosSubmitError(null);
    setTopicVideosLoadError(null);
    setTvValidationErrors({});
    setShowTvDiscardConfirm(false);
    setIsTopicVideosLoading(true);

    try {
      const freshTopic = await adminApi.getTopic(
        accessToken,
        selectedCourseId,
        moduleId,
        topic.id
      );

      const freshEn = freshTopic.videos?.english || '';
      const freshTe = freshTopic.videos?.telugu || '';
      const freshHi = freshTopic.videos?.hindi || '';

      setTvEnglish(freshEn);
      setTvTelugu(freshTe);
      setTvHindi(freshHi);
      tvInitialValuesRef.current = { english: freshEn, telugu: freshTe, hindi: freshHi };
    } catch (err: any) {
      setTopicVideosLoadError(
        err?.message || 'Failed to fetch latest topic video references from server. You may still edit or retry.'
      );
    } finally {
      setIsTopicVideosLoading(false);
    }
  };

  const handleClearVideoLanguage = (lang: 'english' | 'telugu' | 'hindi') => {
    if (lang === 'english') setTvEnglish('');
    if (lang === 'telugu') setTvTelugu('');
    if (lang === 'hindi') setTvHindi('');
    setTvValidationErrors((prev) => {
      const next = { ...prev };
      delete next[lang];
      return next;
    });
  };

  const handleSaveTopicVideos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCourseId || !topicVideosModal || isSubmittingTopicVideos) return;

    const errors: Record<string, string> = {};

    const enErr = validateYouTubeInput(tvEnglish);
    if (enErr) errors.english = enErr;

    const teErr = validateYouTubeInput(tvTelugu);
    if (teErr) errors.telugu = teErr;

    const hiErr = validateYouTubeInput(tvHindi);
    if (hiErr) errors.hindi = hiErr;

    setTvValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingTopicVideos(true);
    setTopicVideosSubmitError(null);

    try {
      const updatedTopic = await adminApi.updateTopic(
        accessToken,
        selectedCourseId,
        topicVideosModal.moduleId,
        topicVideosModal.topicId,
        {
          videos: {
            english: tvEnglish.trim() || null,
            telugu: tvTelugu.trim() || null,
            hindi: tvHindi.trim() || null,
          },
        }
      );

      // Update in local state for this module immediately
      setModuleTopics((prev) => ({
        ...prev,
        [topicVideosModal.moduleId]: (prev[topicVideosModal.moduleId] || []).map((t) =>
          t.id === updatedTopic.id ? { ...t, ...updatedTopic } : t
        ),
      }));

      // Update topic inspector if currently inspecting this topic
      if (selectedTopic && selectedTopic.id === updatedTopic.id) {
        setSelectedTopic((prev: any) => (prev ? { ...prev, ...updatedTopic } : null));
      }

      setFeedback({
        type: 'success',
        message: `Video references updated successfully for "${updatedTopic.title}".`,
      });

      setTopicVideosModal(null);

      // Keep current course structure synchronized without resetting UI context
      fetchCourseStructure(selectedCourseId);
    } catch (err: any) {
      setTopicVideosSubmitError(err?.message || 'Failed to update video references.');
    } finally {
      setIsSubmittingTopicVideos(false);
    }
  };

  // Step 6G: Admin Topic Code Examples & Images Handlers
  const isTopicCodeImagesDirty = (): boolean => {
    const init = tciInitialValuesRef.current;
    if (init.codeExamples.length !== tciCodeExamples.length) return true;
    for (let i = 0; i < tciCodeExamples.length; i++) {
      const cur = tciCodeExamples[i];
      const prev = init.codeExamples[i];
      if (!prev) return true;
      if (
        (cur.title || '').trim() !== (prev.title || '').trim() ||
        (cur.language || 'c').trim().toLowerCase() !== (prev.language || 'c').trim().toLowerCase() ||
        (cur.code || '') !== (prev.code || '') ||
        (cur.explanation || '').trim() !== (prev.explanation || '').trim()
      ) {
        return true;
      }
    }
    if (init.images.length !== tciImages.length) return true;
    for (let i = 0; i < tciImages.length; i++) {
      const cur = tciImages[i];
      const prev = init.images[i];
      if (!prev) return true;
      if (
        (cur.url || '').trim() !== (prev.url || '').trim() ||
        (cur.caption || '').trim() !== (prev.caption || '').trim() ||
        (cur.altText || '').trim() !== (prev.altText || '').trim()
      ) {
        return true;
      }
    }
    return false;
  };

  const handleCloseTopicCodeImagesModal = (force: boolean = false) => {
    if (!force && isTopicCodeImagesDirty() && !isSubmittingTopicCodeImages) {
      setShowTciDiscardConfirm(true);
      return;
    }
    setTopicCodeImagesModal(null);
    setShowTciDiscardConfirm(false);
    setTopicCodeImagesSubmitError(null);
    setTopicCodeImagesLoadError(null);
    setTciValidationErrors({});
  };

  const handleOpenTopicCodeImages = async (moduleId: string, topic: AdminTopic) => {
    if (!accessToken || !selectedCourseId) return;

    setTopicCodeImagesModal({
      moduleId,
      topicId: topic.id,
      topicTitle: topic.title,
    });
    setTciActiveTab('code');

    const initCode: AdminTopicCodeExample[] = (topic.codeExamples || []).map((ex) => ({
      id: ex.id,
      title: ex.title || '',
      language: ex.language || 'c',
      code: ex.code || '',
      explanation: ex.explanation || '',
    }));

    const initImages: AdminTopicImage[] = (topic.images || []).map((img) => ({
      id: img.id,
      url: img.url || '',
      caption: img.caption || '',
      altText: img.altText || '',
    }));

    setTciCodeExamples(initCode);
    setTciImages(initImages);
    tciInitialValuesRef.current = {
      codeExamples: JSON.parse(JSON.stringify(initCode)),
      images: JSON.parse(JSON.stringify(initImages)),
    };

    setTopicCodeImagesSubmitError(null);
    setTopicCodeImagesLoadError(null);
    setTciValidationErrors({});
    setShowTciDiscardConfirm(false);
    setIsTopicCodeImagesLoading(true);

    try {
      const freshTopic = await adminApi.getTopic(
        accessToken,
        selectedCourseId,
        moduleId,
        topic.id
      );

      const freshCode: AdminTopicCodeExample[] = (freshTopic.codeExamples || []).map((ex) => ({
        id: ex.id,
        title: ex.title || '',
        language: ex.language || 'c',
        code: ex.code || '',
        explanation: ex.explanation || '',
      }));

      const freshImages: AdminTopicImage[] = (freshTopic.images || []).map((img) => ({
        id: img.id,
        url: img.url || '',
        caption: img.caption || '',
        altText: img.altText || '',
      }));

      setTciCodeExamples(freshCode);
      setTciImages(freshImages);
      tciInitialValuesRef.current = {
        codeExamples: JSON.parse(JSON.stringify(freshCode)),
        images: JSON.parse(JSON.stringify(freshImages)),
      };
    } catch (err: any) {
      setTopicCodeImagesLoadError(
        err?.message || 'Failed to fetch latest code examples & images from server. You may still edit or retry.'
      );
    } finally {
      setIsTopicCodeImagesLoading(false);
    }
  };

  const handleAddCodeExample = () => {
    if (tciCodeExamples.length >= 50) return;
    setTciCodeExamples((prev) => [
      ...prev,
      { title: '', language: 'c', code: '', explanation: '' },
    ]);
  };

  const handleUpdateCodeExample = (
    index: number,
    field: keyof AdminTopicCodeExample,
    value: string
  ) => {
    setTciCodeExamples((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setTciValidationErrors((prev) => {
      if (!prev.codeExamples || !prev.codeExamples[index]) return prev;
      const nextEx = { ...prev.codeExamples };
      delete nextEx[index]?.[field as keyof { title?: string; language?: string; code?: string; explanation?: string }];
      return { ...prev, codeExamples: nextEx };
    });
  };

  const handleRemoveCodeExample = (index: number) => {
    setTciCodeExamples((prev) => prev.filter((_, i) => i !== index));
    setTciValidationErrors((prev) => {
      if (!prev.codeExamples) return prev;
      const next = { ...prev };
      delete next.codeExamples;
      return next;
    });
  };

  const handleAddImage = () => {
    if (tciImages.length >= 50) return;
    setTciImages((prev) => [
      ...prev,
      { url: '', caption: '', altText: '' },
    ]);
  };

  const handleUpdateImage = (
    index: number,
    field: keyof AdminTopicImage,
    value: string
  ) => {
    setTciImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setTciValidationErrors((prev) => {
      if (!prev.images || !prev.images[index]) return prev;
      const nextIm = { ...prev.images };
      delete nextIm[index]?.[field as keyof { url?: string; caption?: string; altText?: string }];
      return { ...prev, images: nextIm };
    });
  };

  const handleRemoveImage = (index: number) => {
    setTciImages((prev) => prev.filter((_, i) => i !== index));
    setTciValidationErrors((prev) => {
      if (!prev.images) return prev;
      const next = { ...prev };
      delete next.images;
      return next;
    });
  };

  const validateTopicCodeImages = (): {
    hasErrors: boolean;
    errors: {
      codeExamples?: Record<number, { title?: string; language?: string; code?: string; explanation?: string }>;
      images?: Record<number, { url?: string; caption?: string; altText?: string }>;
      general?: string;
    };
  } => {
    const codeErrors: Record<number, { title?: string; language?: string; code?: string; explanation?: string }> = {};
    const imageErrors: Record<number, { url?: string; caption?: string; altText?: string }> = {};
    let hasErrors = false;

    if (tciCodeExamples.length > 50) {
      return { hasErrors: true, errors: { general: 'Maximum 50 code examples allowed per topic.' } };
    }
    if (tciImages.length > 50) {
      return { hasErrors: true, errors: { general: 'Maximum 50 images allowed per topic.' } };
    }

    tciCodeExamples.forEach((ex, idx) => {
      const errObj: { title?: string; language?: string; code?: string; explanation?: string } = {};
      if (!ex.code || ex.code.trim().length === 0) {
        errObj.code = 'Code snippet is required.';
        hasErrors = true;
      } else if (ex.code.length > 30000) {
        errObj.code = 'Code snippet cannot exceed 30,000 characters.';
        hasErrors = true;
      }
      if (ex.title && ex.title.trim().length > 200) {
        errObj.title = 'Title cannot exceed 200 characters.';
        hasErrors = true;
      }
      if (ex.language && ex.language.trim().length > 50) {
        errObj.language = 'Language cannot exceed 50 characters.';
        hasErrors = true;
      }
      if (ex.explanation && ex.explanation.trim().length > 5000) {
        errObj.explanation = 'Explanation cannot exceed 5,000 characters.';
        hasErrors = true;
      }
      if (Object.keys(errObj).length > 0) {
        codeErrors[idx] = errObj;
      }
    });

    tciImages.forEach((img, idx) => {
      const errObj: { url?: string; caption?: string; altText?: string } = {};
      const trimmedUrl = (img.url || '').trim();
      if (!trimmedUrl) {
        errObj.url = 'Image URL or reference is required.';
        hasErrors = true;
      } else if (trimmedUrl.length > 1000) {
        errObj.url = 'Image URL cannot exceed 1,000 characters.';
        hasErrors = true;
      } else if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('/')) {
        errObj.url = 'Image URL must start with https://, http://, or /';
        hasErrors = true;
      }
      if (img.caption && img.caption.trim().length > 500) {
        errObj.caption = 'Caption cannot exceed 500 characters.';
        hasErrors = true;
      }
      if (img.altText && img.altText.trim().length > 200) {
        errObj.altText = 'Alt text cannot exceed 200 characters.';
        hasErrors = true;
      }
      if (Object.keys(errObj).length > 0) {
        imageErrors[idx] = errObj;
      }
    });

    return {
      hasErrors,
      errors: {
        codeExamples: Object.keys(codeErrors).length > 0 ? codeErrors : undefined,
        images: Object.keys(imageErrors).length > 0 ? imageErrors : undefined,
      },
    };
  };

  const handleSaveTopicCodeImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCourseId || !topicCodeImagesModal || isSubmittingTopicCodeImages) return;

    const { hasErrors, errors } = validateTopicCodeImages();
    setTciValidationErrors(errors);
    if (hasErrors) {
      if (errors.codeExamples && !errors.images) {
        setTciActiveTab('code');
      } else if (errors.images && !errors.codeExamples) {
        setTciActiveTab('images');
      }
      return;
    }

    setIsSubmittingTopicCodeImages(true);
    setTopicCodeImagesSubmitError(null);

    try {
      const payload = {
        codeExamples: tciCodeExamples.map((ex) => ({
          title: (ex.title || '').trim(),
          language: (ex.language || 'c').trim().toLowerCase(),
          code: ex.code,
          explanation: (ex.explanation || '').trim(),
        })),
        images: tciImages.map((img) => ({
          url: (img.url || '').trim(),
          caption: (img.caption || '').trim(),
          altText: (img.altText || '').trim(),
        })),
      };

      const updatedTopic = await adminApi.updateTopic(
        accessToken,
        selectedCourseId,
        topicCodeImagesModal.moduleId,
        topicCodeImagesModal.topicId,
        payload
      );

      // Update in local state for this module immediately
      setModuleTopics((prev) => ({
        ...prev,
        [topicCodeImagesModal.moduleId]: (prev[topicCodeImagesModal.moduleId] || []).map((t) =>
          t.id === updatedTopic.id ? { ...t, ...updatedTopic } : t
        ),
      }));

      // Update topic inspector if currently inspecting this topic
      if (selectedTopic && selectedTopic.id === updatedTopic.id) {
        setSelectedTopic((prev: any) => (prev ? { ...prev, ...updatedTopic } : null));
      }

      setFeedback({
        type: 'success',
        message: `Code examples and images updated successfully for "${updatedTopic.title}".`,
      });

      setTopicCodeImagesModal(null);

      // Keep current course structure synchronized without resetting UI context
      fetchCourseStructure(selectedCourseId);
    } catch (err: any) {
      setTopicCodeImagesSubmitError(err?.message || 'Failed to update code examples and images.');
    } finally {
      setIsSubmittingTopicCodeImages(false);
    }
  };

  // Toggle Module Expand/Collapse
  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Expand / Collapse All Modules
  const handleExpandAll = (expand: boolean) => {
    if (!courseStructure?.modules) return;
    const next: Record<string, boolean> = {};
    courseStructure.modules.forEach((m) => {
      next[m.id] = expand;
    });
    setExpandedModules(next);
  };

  // Allowed status transitions mapping per lifecycle rules
  const getAvailableStatusActions = (currentStatus: CourseStatus) => {
    switch (currentStatus) {
      case 'draft':
        return [
          { status: 'published' as CourseStatus, label: 'Publish', icon: Globe },
          { status: 'archived' as CourseStatus, label: 'Archive', icon: Archive },
        ];
      case 'published':
        return [
          { status: 'archived' as CourseStatus, label: 'Archive', icon: Archive },
          { status: 'draft' as CourseStatus, label: 'Move to Draft', icon: RotateCcw },
        ];
      case 'archived':
        return [
          { status: 'draft' as CourseStatus, label: 'Move to Draft', icon: RotateCcw },
        ];
      default:
        return [];
    }
  };

  // Close status confirmation dialog
  const handleCloseStatusModal = () => {
    if (isSubmittingStatus) return;
    setStatusModal(null);
    setStatusMutationError(null);
  };

  // Confirm status change (server-authoritative)
  const handleConfirmStatusChange = async () => {
    if (!accessToken || !statusModal || isSubmittingStatus) return;

    setIsSubmittingStatus(true);
    setStatusMutationError(null);

    const { course, targetStatus } = statusModal;

    try {
      const updatedCourse = await adminApi.updateCourseStatus(
        accessToken,
        course.id,
        targetStatus
      );

      // 1. Update the matching course row with the authoritative server return
      setCourses((prev) =>
        prev.map((c) => (c.id === updatedCourse.id ? { ...c, ...updatedCourse } : c))
      );

      // 2. Update the active view modal if it displays this course
      if (courseDetails && courseDetails.id === updatedCourse.id) {
        setCourseDetails((prev) =>
          prev
            ? {
                ...prev,
                status: updatedCourse.status,
                updatedAt: updatedCourse.updatedAt,
              }
            : null
        );
      }

      // 3. User feedback message
      let successMsg = 'Course status updated successfully.';
      if (targetStatus === 'published') {
        successMsg = 'Course published successfully.';
      } else if (targetStatus === 'archived') {
        successMsg = 'Course archived successfully.';
      } else if (targetStatus === 'draft') {
        successMsg = 'Course moved to draft.';
      }

      setFeedback({
        type: 'success',
        message: successMsg,
      });

      // 4. Close dialog
      setStatusModal(null);

      // 5. If filtered by a status and the course transitioned out of it, safely refresh
      if (statusFilter && statusFilter !== targetStatus) {
        fetchCourses(true);
      }
    } catch (err: any) {
      setStatusMutationError(
        err?.message || 'Unable to update course status. Please try again.'
      );
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Keyboard Escape listener & body scroll lock for modal
  useEffect(() => {
    if (!selectedCourseId && !statusModal && !openMenuCourseId && !isCreateModalOpen && !isEditModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditModalOpen) {
          if (!isSubmittingEdit) {
            handleCloseEditModal();
          }
          return;
        }
        if (isCreateModalOpen) {
          if (!isSubmittingCreate) {
            handleCloseCreateModal();
          }
          return;
        }
        if (topicCodeImagesModal) {
          if (!isSubmittingTopicCodeImages) {
            handleCloseTopicCodeImagesModal(false);
          }
          return;
        }
        if (topicVideosModal) {
          if (!isSubmittingTopicVideos) {
            handleCloseTopicVideosModal(false);
          }
          return;
        }
        if (statusModal) {
          if (!isSubmittingStatus) {
            handleCloseStatusModal();
          }
          return;
        }
        if (openMenuCourseId) {
          setOpenMenuCourseId(null);
          return;
        }
        if (selectedTopic) {
          setSelectedTopic(null);
        } else {
          handleCloseModal();
        }
      }
    };

    const hasOpenDialog = Boolean(
      selectedCourseId ||
      statusModal ||
      isCreateModalOpen ||
      isEditModalOpen ||
      topicVideosModal ||
      topicCodeImagesModal
    );
    const originalOverflow = document.body.style.overflow;
    if (hasOpenDialog) {
      document.body.style.overflow = 'hidden';
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (hasOpenDialog) {
        document.body.style.overflow = originalOverflow;
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedCourseId,
    selectedTopic,
    statusModal,
    isSubmittingStatus,
    openMenuCourseId,
    isCreateModalOpen,
    isSubmittingCreate,
    isEditModalOpen,
    isSubmittingEdit,
    topicVideosModal,
    isSubmittingTopicVideos,
    topicCodeImagesModal,
    isSubmittingTopicCodeImages,
  ]);

  // Format Date Helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return '—';
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Published
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
            Archived
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Draft
          </span>
        );
    }
  };

  const hasActiveFilters = Boolean(searchFilter || statusFilter || categoryFilter);

  // Total topics count across all modules in structure
  const totalTopicsCount =
    courseStructure?.modules?.reduce(
      (sum, m) => sum + (m.topics?.length || 0),
      0
    ) || 0;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
              Course Management
            </h1>
            {!loading && (
              <span
                id="courses-total-badge"
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {pagination.total} {pagination.total === 1 ? 'course' : 'courses'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, audit, and oversee all courses across the platform catalog.
          </p>
        </div>

        {/* Header Actions: Create Course and Refresh Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-create-course"
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-primary-600 border border-primary-600 rounded-lg text-xs font-semibold text-white hover:bg-primary-700 hover:border-primary-700 transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
            title="Create a new course"
            aria-label="Create a new course"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Course</span>
          </button>

          <button
            id="btn-refresh-courses"
            type="button"
            onClick={() => fetchCourses(true)}
            disabled={loading || isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
            title="Refresh course list"
            aria-label="Refresh course list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary-600' : 'text-slate-500'}`}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner (Success / Error Notification) */}
      {feedback && (
        <div
          id="admin-courses-feedback"
          className={`flex items-start justify-between p-3.5 rounded-lg border text-xs sm:text-sm transition-all shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
          role="alert"
        >
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-black/5 transition-colors ml-2"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Filter Bar */}
      <div
        id="admin-courses-filter-bar"
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4"
      >
        {/* Search Query Input (title, description, category) */}
        <div className="relative flex-1">
          <label htmlFor={searchFilterId} className="sr-only">
            Search courses by title, description, or category
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id={searchFilterId}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, description, or category..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchFilter('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Input */}
        <div className="relative w-full sm:w-60">
          <label htmlFor={categoryFilterId} className="sr-only">
            Filter by category
          </label>
          <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id={categoryFilterId}
            type="text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            placeholder="Filter by category..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          />
          {categoryInput && (
            <button
              type="button"
              onClick={() => {
                setCategoryInput('');
                setCategoryFilter('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear category filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <div className="w-full sm:w-44">
          <label htmlFor={statusFilterId} className="sr-only">
            Filter by course status
          </label>
          <div className="relative">
            <select
              id={statusFilterId}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CourseStatus | '');
                setPage(1);
              }}
              className="w-full py-2 pl-3 pr-8 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Reset Filters action */}
        {hasActiveFilters && (
          <button
            id="btn-reset-course-filters"
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearchFilter('');
              setCategoryInput('');
              setCategoryFilter('');
              setStatusFilter('');
              setPage(1);
            }}
            className="text-xs text-slate-500 hover:text-slate-900 whitespace-nowrap px-2 py-1 underline font-medium self-end sm:self-center"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 3. Main Content: Loading, Error, Empty, or Table */}

      {/* Loading Skeleton (Initial Load) */}
      {loading && (
        <div
          id="admin-courses-skeleton"
          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs animate-pulse p-6 space-y-4"
        >
          <div className="h-5 bg-slate-100 rounded w-48" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100/80 rounded-lg w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div id="admin-courses-error" className="py-6">
          <FeedbackState
            title="Failed to Load Course Catalog"
            message={error}
            onRetry={() => fetchCourses(false)}
            retryLabel="Try Again"
          />
        </div>
      )}

      {/* Empty State: Zero Results */}
      {!loading && !error && courses.length === 0 && (
        <div id="admin-courses-empty" className="py-4">
          <EmptyState
            icon={BookOpen}
            title={
              hasActiveFilters
                ? 'No courses match your filter criteria'
                : 'No courses in database'
            }
            description={
              hasActiveFilters
                ? 'Try adjusting your search terms, category, or status filter to locate courses.'
                : 'The platform currently contains zero course records. Courses created by course creators will appear here.'
            }
            action={
              hasActiveFilters
                ? {
                    label: 'Clear All Filters',
                    onClick: () => {
                      setSearchInput('');
                      setSearchFilter('');
                      setCategoryInput('');
                      setCategoryFilter('');
                      setStatusFilter('');
                      setPage(1);
                    },
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* Real Course Data Table */}
      {!loading && !error && courses.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table
                id="admin-courses-table"
                className="w-full text-left border-collapse text-xs sm:text-sm"
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Course</th>
                    <th className="py-3 px-4 sm:px-6">Category</th>
                    <th className="py-3 px-4 sm:px-6">Course Creator</th>
                    <th className="py-3 px-4 sm:px-6">Status</th>
                    <th className="py-3 px-4 sm:px-6">Created</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      id={`course-row-${course.id}`}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Course Title & Description */}
                      <td className="py-3.5 px-4 sm:px-6 max-w-xs sm:max-w-sm">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">
                              {course.title}
                            </span>
                            {course.description && (
                              <span className="text-xs text-slate-500 line-clamp-1 block mt-0.5">
                                {course.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {course.category || 'General'}
                        </span>
                      </td>

                      {/* Course Creator */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        {course.courseCreator ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                              {course.courseCreator.name
                                ? course.courseCreator.name.charAt(0)
                                : 'C'}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-slate-900 block truncate">
                                {course.courseCreator.name || 'Unnamed Creator'}
                              </span>
                              {course.courseCreator.email && (
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {course.courseCreator.email}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        {renderStatusBadge(course.status)}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-500 text-xs">
                        {formatDate(course.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            id={`btn-view-course-${course.id}`}
                            type="button"
                            onClick={() => handleOpenCourse(course.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                            title="View course details and curriculum structure"
                            aria-label={`View details and structure for ${course.title}`}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>View</span>
                          </button>

                          <button
                            id={`btn-modules-course-${course.id}`}
                            type="button"
                            onClick={() => handleOpenCourse(course.id, 'modules')}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                            title="Manage course modules"
                            aria-label={`Manage modules for ${course.title}`}
                          >
                            <Folder className="w-3.5 h-3.5 mr-1 text-primary-600" />
                            <span>Modules</span>
                          </button>

                          <button
                            id={`btn-edit-course-${course.id}`}
                            type="button"
                            onClick={() => handleOpenEditModal(course.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                            title="Edit course details"
                            aria-label={`Edit ${course.title}`}
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            <span>Edit</span>
                          </button>

                          {/* Actions Menu Dropdown */}
                          <div className="relative inline-block text-left">
                            <button
                              id={`btn-course-menu-${course.id}`}
                              type="button"
                              onClick={() =>
                                setOpenMenuCourseId((prev) =>
                                  prev === course.id ? null : course.id
                                )
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                              aria-haspopup="true"
                              aria-expanded={openMenuCourseId === course.id}
                              aria-label={`Status actions for ${course.title}`}
                              title="Course status actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuCourseId === course.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20 cursor-default"
                                  onClick={() => setOpenMenuCourseId(null)}
                                  aria-hidden="true"
                                />

                                <div
                                  id={`course-dropdown-${course.id}`}
                                  className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-30 focus:outline-hidden text-left"
                                  role="menu"
                                  aria-orientation="vertical"
                                  aria-labelledby={`btn-course-menu-${course.id}`}
                                >
                                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                    Change Status
                                  </div>
                                  <div className="py-1">
                                    {getAvailableStatusActions(course.status).map((action) => {
                                      const ActionIcon = action.icon;
                                      return (
                                        <button
                                          key={action.status}
                                          id={`btn-action-${action.status}-${course.id}`}
                                          type="button"
                                          onClick={() => {
                                            setOpenMenuCourseId(null);
                                            setStatusModal({
                                              course,
                                              targetStatus: action.status,
                                            });
                                          }}
                                          className={`w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50 text-slate-700 ${
                                            action.status === 'published'
                                              ? 'hover:text-emerald-700'
                                              : action.status === 'archived'
                                              ? 'hover:text-slate-900'
                                              : 'hover:text-amber-700'
                                          }`}
                                          role="menuitem"
                                        >
                                          <ActionIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <span>{action.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Pagination Controls */}
            <div
              id="admin-courses-pagination"
              className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500"
            >
              <div>
                <span>
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {pagination.total === 0
                      ? 0
                      : (pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-700">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-700">
                    {pagination.total}
                  </span>{' '}
                  {pagination.total === 1 ? 'course' : 'courses'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-courses-prev-page"
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPreviousPage || loading}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </button>

                <span className="px-2 font-medium text-slate-700">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>

                <button
                  id="btn-courses-next-page"
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Complete Course Details & Structure Viewer Modal */}
      {selectedCourseId && (
        <div
          id="view-course-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-course-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-4xl lg:max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3
                      id="view-course-modal-title"
                      className="font-display font-bold text-base sm:text-lg text-slate-900 truncate"
                    >
                      {courseDetails?.title || 'Course Details'}
                    </h3>
                    {courseDetails && (
                      <div className="flex items-center space-x-2">
                        {renderStatusBadge(courseDetails.status)}

                        <button
                          id="btn-modal-edit-course"
                          type="button"
                          onClick={() => handleOpenEditModal(courseDetails.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors border border-slate-200"
                          title="Edit course metadata"
                        >
                          <Edit2 className="w-3 h-3 mr-0.5" />
                          <span>Edit</span>
                        </button>

                        <div className="relative inline-block text-left">
                          <button
                            id="btn-modal-change-status"
                            type="button"
                            onClick={() =>
                              setOpenMenuCourseId((prev) =>
                                prev === `modal-${courseDetails.id}`
                                  ? null
                                  : `modal-${courseDetails.id}`
                              )
                            }
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors border border-slate-200"
                            aria-haspopup="true"
                            aria-expanded={openMenuCourseId === `modal-${courseDetails.id}`}
                            aria-label="Change course status"
                          >
                            <span>Status Actions</span>
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          </button>

                          {openMenuCourseId === `modal-${courseDetails.id}` && (
                            <>
                              <div
                                className="fixed inset-0 z-30 cursor-default"
                                onClick={() => setOpenMenuCourseId(null)}
                                aria-hidden="true"
                              />
                              <div
                                className="absolute left-0 mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-40 focus:outline-hidden text-left"
                                role="menu"
                              >
                                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                  Change Status
                                </div>
                                <div className="py-1">
                                  {getAvailableStatusActions(courseDetails.status).map(
                                    (action) => {
                                      const ActionIcon = action.icon;
                                      return (
                                        <button
                                          key={action.status}
                                          id={`btn-modal-action-${action.status}`}
                                          type="button"
                                          onClick={() => {
                                            setOpenMenuCourseId(null);
                                            setStatusModal({
                                              course: courseDetails,
                                              targetStatus: action.status,
                                            });
                                          }}
                                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                          role="menuitem"
                                        >
                                          <ActionIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <span>{action.label}</span>
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    ID: {selectedCourseId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Header */}
            <div className="px-6 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between shrink-0">
              <div className="flex space-x-1">
                <button
                  id="tab-course-overview"
                  type="button"
                  onClick={() => setActiveModalTab('overview')}
                  className={`inline-flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeModalTab === 'overview'
                      ? 'border-primary-600 text-primary-700 bg-white shadow-2xs font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Course Overview</span>
                </button>

                <button
                  id="tab-course-modules"
                  type="button"
                  onClick={() => setActiveModalTab('modules')}
                  className={`inline-flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeModalTab === 'modules'
                      ? 'border-primary-600 text-primary-700 bg-white shadow-2xs font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  <span>Modules</span>
                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {courseModules.length}
                  </span>
                </button>

                <button
                  id="tab-course-structure"
                  type="button"
                  onClick={() => setActiveModalTab('structure')}
                  className={`inline-flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeModalTab === 'structure'
                      ? 'border-primary-600 text-primary-700 bg-white shadow-2xs font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Curriculum Structure</span>
                  {courseStructure && (
                    <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {courseStructure.modules?.length || 0}
                    </span>
                  )}
                </button>
              </div>

              {/* Structure expand controls in tab bar when active */}
              {activeModalTab === 'structure' &&
                !structureLoading &&
                !structureError &&
                courseStructure &&
                courseStructure.modules.length > 0 && (
                  <div className="hidden sm:flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleExpandAll(true)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Expand All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleExpandAll(false)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Collapse All
                    </button>
                  </div>
                )}
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {/* TAB 1: COURSE OVERVIEW */}
              {activeModalTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overview Loading */}
                  {detailsLoading && (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-6 bg-slate-200 rounded w-1/3" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-24 bg-slate-200/80 rounded-xl" />
                        <div className="h-24 bg-slate-200/80 rounded-xl" />
                        <div className="h-24 bg-slate-200/80 rounded-xl" />
                      </div>
                      <div className="h-32 bg-slate-200/60 rounded-xl" />
                      <div className="h-40 bg-slate-200/50 rounded-xl" />
                    </div>
                  )}

                  {/* Overview Error */}
                  {!detailsLoading && detailsError && (
                    <div className="bg-white p-6 rounded-xl border border-red-200 shadow-2xs text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {detailsError}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Could not fetch full course metadata from the server.
                      </p>
                      <div className="flex justify-center space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            selectedCourseId &&
                            fetchCourseDetails(selectedCourseId)
                          }
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Overview Content */}
                  {!detailsLoading && !detailsError && courseDetails && (
                    <div className="space-y-6">
                      {/* Course Core Details Grid */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 mb-1">
                              <Tag className="w-3 h-3 mr-1 text-slate-400" />
                              {courseDetails.category || 'General'}
                            </span>
                            <h4 className="text-lg font-bold font-display text-slate-900">
                              {courseDetails.title}
                            </h4>
                          </div>

                          {/* Thumbnail preview if present */}
                          {courseDetails.thumbnail && (
                            <div className="w-full md:w-48 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                              <img
                                src={courseDetails.thumbnail}
                                alt={`${courseDetails.title} thumbnail`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback for broken image URLs
                                  (e.currentTarget as HTMLElement).style.display =
                                    'none';
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Description
                          </span>
                          <p className="text-xs sm:text-sm text-slate-600 bg-slate-50/75 p-3.5 rounded-lg border border-slate-200/80 leading-relaxed">
                            {courseDetails.description ||
                              'No detailed description has been registered for this course.'}
                          </p>
                        </div>
                      </div>

                      {/* Course Metadata Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Lifecycle Status
                          </span>
                          <div className="pt-1">
                            {renderStatusBadge(courseDetails.status)}
                          </div>
                        </div>

                        {/* Category Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Category
                          </span>
                          <div className="flex items-center space-x-1.5 pt-1 text-slate-800 text-xs font-semibold">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            <span>{courseDetails.category || 'General'}</span>
                          </div>
                        </div>

                        {/* Created Date Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Created Date
                          </span>
                          <div className="flex items-center space-x-1.5 pt-1 text-slate-800 text-xs font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(courseDetails.createdAt)}</span>
                          </div>
                        </div>

                        {/* Updated Date Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Last Modified
                          </span>
                          <div className="flex items-center space-x-1.5 pt-1 text-slate-800 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(courseDetails.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Course Creator Card */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Assigned Course Creator
                        </span>
                        <div className="flex items-center space-x-3 pt-0.5">
                          <div className="w-9 h-9 rounded-full bg-primary-50 border border-primary-200 text-primary-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {courseDetails.courseCreator?.name
                              ? courseDetails.courseCreator.name.charAt(0)
                              : 'C'}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-900">
                              {courseDetails.courseCreator?.name ||
                                'Unassigned'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {courseDetails.courseCreator?.email ||
                                'No email provided'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Syllabus Units Section */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <ListOrdered className="w-4 h-4 text-primary-600" />
                            <h5 className="font-semibold text-slate-900 text-xs sm:text-sm">
                              Syllabus Units
                            </h5>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {courseDetails.syllabus?.length || 0}{' '}
                            {courseDetails.syllabus?.length === 1
                              ? 'unit'
                              : 'units'}
                          </span>
                        </div>

                        {courseDetails.syllabus &&
                        courseDetails.syllabus.length > 0 ? (
                          <div className="space-y-2.5 pt-1">
                            {courseDetails.syllabus.map((unit, index) => (
                              <div
                                key={unit.id || index}
                                className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-start space-x-3 text-xs"
                              >
                                <span className="w-6 h-6 rounded-md bg-white border border-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0 text-[11px]">
                                  {unit.order || index + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900">
                                    {unit.title}
                                  </div>
                                  {unit.description && (
                                    <div className="text-slate-500 text-[11px] mt-0.5">
                                      {unit.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">
                            No syllabus units listed in this course document.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COURSE MODULES MANAGEMENT (CRUD) */}
              {activeModalTab === 'modules' && (
                <div className="space-y-6">
                  {/* Modules Header */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-bold font-display text-slate-900 flex items-center space-x-2">
                          <Folder className="w-4 h-4 text-primary-600" />
                          <span>Curriculum Modules</span>
                        </h4>
                        {isReorderingModules && (
                          <span className="inline-flex items-center space-x-1 text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving order...</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage high-level learning units, sequence order, and course structure.
                      </p>
                    </div>
                    <button
                      id="btn-create-module"
                      type="button"
                      disabled={isReorderingModules}
                      onClick={handleOpenCreateModule}
                      className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Module</span>
                    </button>
                  </div>

                  {/* Reorder Error Banner */}
                  {reorderError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{reorderError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReorderError(null)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Loading State */}
                  {modulesLoading && (
                    <div className="space-y-3 animate-pulse">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="h-4 bg-slate-200 rounded w-1/3" />
                            <div className="h-4 bg-slate-200 rounded w-16" />
                          </div>
                          <div className="h-8 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error State */}
                  {!modulesLoading && modulesError && (
                    <div className="bg-white p-6 rounded-xl border border-red-200 shadow-2xs text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                      <h4 className="font-semibold text-slate-900 text-sm">Failed to load modules</h4>
                      <p className="text-xs text-slate-500">{modulesError}</p>
                      <div className="flex justify-center space-x-2 pt-2">
                        <button
                          id="btn-retry-modules"
                          type="button"
                          onClick={() => selectedCourseId && fetchCourseModules(selectedCourseId)}
                          className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Retry Modules
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!modulesLoading && !modulesError && courseModules.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-slate-900 text-sm">No modules registered yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          This course currently has no curriculum modules. Create the first module to start organizing units and topics.
                        </p>
                      </div>
                      <button
                        id="btn-empty-create-module"
                        type="button"
                        onClick={handleOpenCreateModule}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Module</span>
                      </button>
                    </div>
                  )}

                  {/* Modules List */}
                  {!modulesLoading && !modulesError && courseModules.length > 0 && (
                    <div className="space-y-4">
                      {courseModules.map((mod, index) => (
                        <div
                          key={mod.id}
                          id={`module-item-${mod.id}`}
                          className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                        >
                          {/* Module Header Bar & Details */}
                          <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-white">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-100">
                                  Order #{mod.order}
                                </span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="text-[11px] text-slate-400">Position: {index + 1}</span>
                                {mod.createdAt && (
                                  <>
                                    <span className="text-slate-300">&bull;</span>
                                    <span className="text-[11px] text-slate-400">
                                      Added {formatDate(mod.createdAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                              <h5 className="font-semibold text-slate-900 text-sm break-words">{mod.title}</h5>
                              {mod.description ? (
                                <p className="text-xs text-slate-600 leading-relaxed break-words whitespace-pre-line">
                                  {mod.description}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No description provided for this module.</p>
                              )}
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0 sm:self-center">
                              {/* Reorder Buttons (Move Up / Down) */}
                              <div className="flex items-center space-x-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                                <button
                                  id={`btn-move-module-up-${mod.id}`}
                                  type="button"
                                  disabled={index === 0 || isReorderingModules}
                                  onClick={() => handleMoveModule(mod.id, 'up')}
                                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                  title="Move module up"
                                  aria-label={`Move module ${mod.title} up`}
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`btn-move-module-down-${mod.id}`}
                                  type="button"
                                  disabled={index === courseModules.length - 1 || isReorderingModules}
                                  onClick={() => handleMoveModule(mod.id, 'down')}
                                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                  title="Move module down"
                                  aria-label={`Move module ${mod.title} down`}
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                id={`btn-edit-module-${mod.id}`}
                                type="button"
                                disabled={isReorderingModules}
                                onClick={() => handleOpenEditModule(mod)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50 transition-colors border border-slate-200"
                                title="Edit module details"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit</span>
                              </button>
                              <button
                                id={`btn-delete-module-${mod.id}`}
                                type="button"
                                disabled={isReorderingModules}
                                onClick={() => {
                                  setDeleteModuleError(null);
                                  setDeleteModuleModal(mod);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-900 disabled:opacity-50 transition-colors border border-red-200"
                                title="Delete module"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Topics Section under Module */}
                          <div className="border-t border-slate-100 bg-slate-50/70 p-3 sm:p-4">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <button
                                type="button"
                                onClick={() => toggleTopicsExpand(mod.id)}
                                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                                aria-expanded={expandedTopicsModules[mod.id] ?? true}
                              >
                                {expandedTopicsModules[mod.id] ?? true ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <span>Topics</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                                  {moduleTopics[mod.id]?.length || 0}
                                </span>
                              </button>

                              <button
                                id={`btn-add-topic-${mod.id}`}
                                type="button"
                                onClick={() => handleOpenCreateTopic(mod)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                              >
                                <Plus className="w-3 h-3 text-slate-500" />
                                <span>Add Topic</span>
                              </button>
                            </div>

                            {/* Topics Body when expanded */}
                            {(expandedTopicsModules[mod.id] ?? true) && (
                              <div className="space-y-2">
                                {/* Loading State for Module Topics */}
                                {topicsLoading[mod.id] && (
                                  <div className="p-3 space-y-2 animate-pulse bg-white rounded-lg border border-slate-200">
                                    <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                  </div>
                                )}

                                {/* Error State for Module Topics */}
                                {!topicsLoading[mod.id] && topicsError[mod.id] && (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700">
                                    <div className="flex items-center space-x-2">
                                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                      <span>{topicsError[mod.id]}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => selectedCourseId && fetchModuleTopics(selectedCourseId, mod.id)}
                                      className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-medium hover:bg-red-700"
                                    >
                                      Retry
                                    </button>
                                  </div>
                                )}

                                {/* Empty State for Module Topics */}
                                {!topicsLoading[mod.id] &&
                                  !topicsError[mod.id] &&
                                  (!moduleTopics[mod.id] || moduleTopics[mod.id].length === 0) && (
                                    <div className="p-4 bg-white rounded-lg border border-dashed border-slate-200 text-center space-y-2">
                                      <p className="text-xs text-slate-500">No topics added to this module yet.</p>
                                      <button
                                        id={`btn-empty-add-topic-${mod.id}`}
                                        type="button"
                                        onClick={() => handleOpenCreateTopic(mod)}
                                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add First Topic</span>
                                      </button>
                                    </div>
                                  )}

                                {/* Topics List */}
                                {!topicsLoading[mod.id] &&
                                  !topicsError[mod.id] &&
                                  moduleTopics[mod.id]?.length > 0 && (
                                    <div className="space-y-2">
                                      {/* Topic Reorder Error State */}
                                      {topicReorderError && topicReorderError.moduleId === mod.id && (
                                        <div
                                          id={`topic-reorder-error-${mod.id}`}
                                          className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700"
                                        >
                                          <div className="flex items-center space-x-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                            <span>{topicReorderError.error}</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setTopicReorderError(null)}
                                            className="text-[11px] text-red-600 hover:text-red-800 font-medium ml-2 shrink-0"
                                          >
                                            Dismiss
                                          </button>
                                        </div>
                                      )}

                                      {/* Reordering saving indicator */}
                                      {reorderingTopicModuleId === mod.id && (
                                        <div
                                          id={`topic-reordering-indicator-${mod.id}`}
                                          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs"
                                        >
                                          <RefreshCw className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
                                          <span>Saving updated topic order...</span>
                                        </div>
                                      )}

                                      {moduleTopics[mod.id].map((topic, index) => (
                                        <div
                                          key={topic.id}
                                          id={`topic-item-${topic.id}`}
                                          className="p-3 bg-white rounded-lg border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-2.5"
                                        >
                                          <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                Order #{topic.order}
                                              </span>
                                              {Boolean(
                                                (topic.content?.explanation && topic.content.explanation.trim().length > 0) ||
                                                (topic.importantPoints && topic.importantPoints.length > 0)
                                              ) && (
                                                <span
                                                  id={`badge-topic-content-${topic.id}`}
                                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                >
                                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                                  <span>Content ({topic.importantPoints?.length || 0} pts)</span>
                                                </span>
                                              )}
                                              {/* Multilingual Videos Badge */}
                                              {(() => {
                                                const configuredLangs: string[] = [];
                                                if (topic.videos?.english) configuredLangs.push('EN');
                                                if (topic.videos?.telugu) configuredLangs.push('TE');
                                                if (topic.videos?.hindi) configuredLangs.push('HI');

                                                if (configuredLangs.length > 0) {
                                                  return (
                                                    <span
                                                      id={`badge-topic-videos-${topic.id}`}
                                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                                      title={`Configured video references: ${configuredLangs.join(', ')}`}
                                                    >
                                                      <Video className="w-2.5 h-2.5 text-blue-600" />
                                                      <span>Videos ({configuredLangs.join('/')})</span>
                                                    </span>
                                                  );
                                                }
                                                return null;
                                              })()}
                                              {/* Step 6G: Code Examples Badge */}
                                              {topic.codeExamples && topic.codeExamples.length > 0 && (
                                                <span
                                                  id={`badge-topic-code-${topic.id}`}
                                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                  title={`${topic.codeExamples.length} code example(s) configured`}
                                                >
                                                  <Code className="w-2.5 h-2.5 text-emerald-600" />
                                                  <span>{topic.codeExamples.length} Code</span>
                                                </span>
                                              )}
                                              {/* Step 6G: Images Badge */}
                                              {topic.images && topic.images.length > 0 && (
                                                <span
                                                  id={`badge-topic-images-${topic.id}`}
                                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200"
                                                  title={`${topic.images.length} image reference(s) configured`}
                                                >
                                                  <ImageIcon className="w-2.5 h-2.5 text-purple-600" />
                                                  <span>{topic.images.length} Img</span>
                                                </span>
                                              )}
                                              <span className="font-semibold text-slate-900 text-xs truncate">
                                                {topic.title}
                                              </span>
                                            </div>
                                            {topic.description ? (
                                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line break-words pl-0.5">
                                                {topic.description}
                                              </p>
                                            ) : (
                                              <p className="text-[11px] text-slate-400 italic pl-0.5">
                                                No description provided.
                                              </p>
                                            )}
                                          </div>

                                          <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                                            {/* Topic Reorder Controls: Move Up & Move Down */}
                                            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
                                              <button
                                                id={`btn-move-topic-up-${topic.id}`}
                                                type="button"
                                                disabled={reorderingTopicModuleId === mod.id || index === 0}
                                                onClick={() => handleMoveTopic(mod.id, topic.id, 'up')}
                                                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                                title="Move topic up"
                                                aria-label={`Move topic ${topic.title} up`}
                                              >
                                                <ChevronUp className="w-3 h-3" />
                                              </button>
                                              <button
                                                id={`btn-move-topic-down-${topic.id}`}
                                                type="button"
                                                disabled={
                                                  reorderingTopicModuleId === mod.id ||
                                                  index === moduleTopics[mod.id].length - 1
                                                }
                                                onClick={() => handleMoveTopic(mod.id, topic.id, 'down')}
                                                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                                title="Move topic down"
                                                aria-label={`Move topic ${topic.title} down`}
                                              >
                                                <ChevronDown className="w-3 h-3" />
                                              </button>
                                            </div>

                                            {/* Step 6E: Manage Learning Content Action */}
                                            <button
                                              id={`btn-manage-topic-content-${topic.id}`}
                                              type="button"
                                              disabled={reorderingTopicModuleId === mod.id}
                                              onClick={() => handleOpenTopicContent(mod.id, topic)}
                                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 hover:text-primary-800 transition-colors border border-primary-200 disabled:opacity-50"
                                              title="Manage learning content & points"
                                            >
                                              <FileText className="w-3 h-3 text-primary-600" />
                                              <span>Content</span>
                                            </button>

                                            {/* Step 6F: Manage Multilingual Video References Action */}
                                            <button
                                              id={`btn-manage-topic-videos-${topic.id}`}
                                              type="button"
                                              disabled={reorderingTopicModuleId === mod.id}
                                              onClick={() => handleOpenTopicVideos(mod.id, topic)}
                                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors border border-blue-200 disabled:opacity-50"
                                              title="Manage multilingual video references"
                                            >
                                              <Video className="w-3 h-3 text-blue-600" />
                                              <span>Videos</span>
                                            </button>

                                            {/* Step 6G: Manage Code & Images Action */}
                                            <button
                                              id={`btn-manage-topic-code-images-${topic.id}`}
                                              type="button"
                                              disabled={reorderingTopicModuleId === mod.id}
                                              onClick={() => handleOpenTopicCodeImages(mod.id, topic)}
                                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 transition-colors border border-emerald-200 disabled:opacity-50"
                                              title="Manage code examples & diagrams"
                                            >
                                              <Code className="w-3 h-3 text-emerald-600" />
                                              <span>Code & Images</span>
                                            </button>

                                            <button
                                              id={`btn-edit-topic-${topic.id}`}
                                              type="button"
                                              disabled={reorderingTopicModuleId === mod.id}
                                              onClick={() => handleOpenEditTopic(mod.id, topic)}
                                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200 disabled:opacity-50"
                                              title="Edit topic"
                                            >
                                              <Edit2 className="w-3 h-3 text-slate-500" />
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              id={`btn-delete-topic-${topic.id}`}
                                              type="button"
                                              disabled={reorderingTopicModuleId === mod.id}
                                              onClick={() => {
                                                setDeleteTopicError(null);
                                                setDeleteTopicModal({ moduleId: mod.id, topic });
                                              }}
                                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-800 transition-colors border border-red-200 disabled:opacity-50"
                                              title="Delete topic"
                                            >
                                              <Trash2 className="w-3 h-3 text-red-500" />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CURRICULUM STRUCTURE & TOPIC SUMMARY */}
              {activeModalTab === 'structure' && (
                <div className="space-y-6">
                  {/* Structure Loading */}
                  {structureLoading && (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-6 bg-slate-200 rounded w-1/4" />
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="bg-white p-4 rounded-xl border border-slate-200 space-y-3"
                          >
                            <div className="h-4 bg-slate-200 rounded w-1/3" />
                            <div className="h-10 bg-slate-100 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structure Error */}
                  {!structureLoading && structureError && (
                    <div className="bg-white p-6 rounded-xl border border-red-200 shadow-2xs text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {structureError}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Could not retrieve the complete module and topic hierarchy.
                      </p>
                      <div className="flex justify-center space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            selectedCourseId &&
                            fetchCourseStructure(selectedCourseId)
                          }
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Retry Structure
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Structure Content */}
                  {!structureLoading && !structureError && courseStructure && (
                    <div>
                      {courseStructure.modules.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
                          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <h4 className="font-semibold text-slate-800 text-sm">
                            No modules have been added to this course yet.
                          </h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            The course creator has not published any curriculum
                            modules for this course.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Left Column: Curriculum Tree Hierarchy */}
                          <div className="lg:col-span-7 space-y-4">
                            {/* Stats Banner */}
                            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                              <span className="font-medium">
                                Structure:{' '}
                                <strong className="text-slate-900 font-semibold">
                                  {courseStructure.modules.length}{' '}
                                  {courseStructure.modules.length === 1
                                    ? 'Module'
                                    : 'Modules'}
                                </strong>{' '}
                                &bull;{' '}
                                <strong className="text-slate-900 font-semibold">
                                  {totalTopicsCount}{' '}
                                  {totalTopicsCount === 1 ? 'Topic' : 'Topics'}
                                </strong>
                              </span>
                            </div>

                            {/* Modules List */}
                            <div className="space-y-3">
                              {courseStructure.modules.map((module) => {
                                const isExpanded =
                                  expandedModules[module.id] ?? true;

                                return (
                                  <div
                                    key={module.id}
                                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
                                  >
                                    {/* Module Header Bar */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleModuleExpand(module.id)
                                      }
                                      className="w-full px-4 py-3 bg-slate-50/75 hover:bg-slate-100/60 border-b border-slate-200/80 flex items-center justify-between text-left transition-colors"
                                      aria-expanded={isExpanded}
                                    >
                                      <div className="flex items-start space-x-3 min-w-0">
                                        <div className="mt-0.5 text-slate-400">
                                          {isExpanded ? (
                                            <FolderOpen className="w-4 h-4 text-primary-600" />
                                          ) : (
                                            <Folder className="w-4 h-4" />
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center space-x-2">
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                                              Module {module.order}
                                            </span>
                                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                              {module.title}
                                            </span>
                                          </div>
                                          {module.description && (
                                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                              {module.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2 shrink-0 ml-3">
                                        <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                          {module.topics?.length || 0}{' '}
                                          {module.topics?.length === 1
                                            ? 'topic'
                                            : 'topics'}
                                        </span>
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4 text-slate-400" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-slate-400" />
                                        )}
                                      </div>
                                    </button>

                                    {/* Module Body: Topics */}
                                    {isExpanded && (
                                      <div className="p-3 bg-white space-y-2">
                                        {(!module.topics ||
                                          module.topics.length === 0) && (
                                          <div className="p-3 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-lg">
                                            No topics in this module yet.
                                          </div>
                                        )}

                                        {module.topics &&
                                          module.topics.length > 0 &&
                                          module.topics.map((topic) => {
                                            const isSelected =
                                              selectedTopic?.id === topic.id;

                                            // Check video availability count
                                            const videoLanguages = [
                                              topic.videos?.english && 'EN',
                                              topic.videos?.telugu && 'TE',
                                              topic.videos?.hindi && 'HI',
                                            ].filter(Boolean);

                                            return (
                                              <button
                                                key={topic.id}
                                                type="button"
                                                onClick={() =>
                                                  setSelectedTopic(topic)
                                                }
                                                className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-start justify-between gap-3 ${
                                                  isSelected
                                                    ? 'border-primary-500 bg-primary-50/40 ring-1 ring-primary-500 shadow-2xs'
                                                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300'
                                                }`}
                                              >
                                                <div className="flex items-start space-x-2.5 min-w-0">
                                                  <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                                                    {topic.order}
                                                  </span>
                                                  <div className="min-w-0">
                                                    <span className="font-semibold text-slate-900 block truncate">
                                                      {topic.title}
                                                    </span>
                                                    {topic.description && (
                                                      <span className="text-[11px] text-slate-500 line-clamp-1 block mt-0.5">
                                                        {topic.description}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Topic Feature Badges */}
                                                <div className="flex items-center space-x-1.5 shrink-0 text-[10px]">
                                                  {videoLanguages.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                                      <Video className="w-3 h-3" />
                                                      {videoLanguages.join('/')}
                                                    </span>
                                                  ) : (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                                      No video
                                                    </span>
                                                  )}

                                                  {(topic.codeExamples
                                                    ?.length || 0) > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                      <Code className="w-3 h-3" />
                                                      {topic.codeExamples?.length}
                                                    </span>
                                                  )}

                                                  {(topic.importantPoints
                                                    ?.length || 0) > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                      <CheckCircle2 className="w-3 h-3" />
                                                      {topic.importantPoints?.length}
                                                    </span>
                                                  )}
                                                </div>
                                              </button>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Column: Topic Content Summary Inspector */}
                          <div className="lg:col-span-5">
                            {selectedTopic ? (
                              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden sticky top-0 space-y-4 p-5">
                                {/* Topic Inspector Header */}
                                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800">
                                        Topic {selectedTopic.order}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        Read-Only Summary
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                      {selectedTopic.title}
                                    </h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTopic(null)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                    aria-label="Close topic summary"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Topic Description */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Description
                                  </span>
                                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                                    {selectedTopic.description ||
                                      'No description provided for this topic.'}
                                  </p>
                                </div>

                                {/* Video Availability Summary */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                      Multilingual Video Availability
                                    </span>
                                    <button
                                      id="btn-inspector-manage-videos"
                                      type="button"
                                      onClick={() => handleOpenTopicVideos(selectedTopic.moduleId, selectedTopic as any)}
                                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 hover:underline"
                                    >
                                      <Video className="w-3 h-3 text-blue-600" />
                                      <span>Manage Videos</span>
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div
                                      className={`p-2 rounded-lg border text-center ${
                                        selectedTopic.videos?.english
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                                          : 'bg-slate-50 text-slate-400 border-slate-200'
                                      }`}
                                    >
                                      <div className="text-[11px] uppercase">
                                        English
                                      </div>
                                      <div className="text-[10px] mt-0.5">
                                        {selectedTopic.videos?.english
                                          ? 'Available'
                                          : 'Not Available'}
                                      </div>
                                    </div>

                                    <div
                                      className={`p-2 rounded-lg border text-center ${
                                        selectedTopic.videos?.telugu
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                                          : 'bg-slate-50 text-slate-400 border-slate-200'
                                      }`}
                                    >
                                      <div className="text-[11px] uppercase">
                                        Telugu
                                      </div>
                                      <div className="text-[10px] mt-0.5">
                                        {selectedTopic.videos?.telugu
                                          ? 'Available'
                                          : 'Not Available'}
                                      </div>
                                    </div>

                                    <div
                                      className={`p-2 rounded-lg border text-center ${
                                        selectedTopic.videos?.hindi
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                                          : 'bg-slate-50 text-slate-400 border-slate-200'
                                      }`}
                                    >
                                      <div className="text-[11px] uppercase">
                                        Hindi
                                      </div>
                                      <div className="text-[10px] mt-0.5">
                                        {selectedTopic.videos?.hindi
                                          ? 'Available'
                                          : 'Not Available'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Educational Assets Count */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                      Educational Assets
                                    </span>
                                    <button
                                      id="btn-inspector-manage-code-images"
                                      type="button"
                                      onClick={() => handleOpenTopicCodeImages(selectedTopic.moduleId, selectedTopic as any)}
                                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                                    >
                                      <Code className="w-3 h-3 text-emerald-600" />
                                      <span>Manage Code & Images</span>
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 pt-0.5 text-xs">
                                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-2">
                                    <Code className="w-4 h-4 text-slate-500" />
                                    <div>
                                      <span className="text-[10px] uppercase text-slate-400 block font-bold">
                                        Code Examples
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {selectedTopic.codeExamples?.length || 0}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-2">
                                    <ImageIcon className="w-4 h-4 text-slate-500" />
                                    <div>
                                      <span className="text-[10px] uppercase text-slate-400 block font-bold">
                                        Diagrams & Images
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {selectedTopic.images?.length || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                </div>

                                {/* Important Points */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Important Points (
                                    {selectedTopic.importantPoints?.length || 0}
                                    )
                                  </span>
                                  {selectedTopic.importantPoints &&
                                  selectedTopic.importantPoints.length > 0 ? (
                                    <ul className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 list-disc list-inside">
                                      {selectedTopic.importantPoints.map(
                                        (pt, idx) => (
                                          <li
                                            key={idx}
                                            className="leading-relaxed"
                                          >
                                            {pt}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                      No specific key points recorded.
                                    </p>
                                  )}
                                </div>

                                {/* Explanation text (Safely rendered as plain text) */}
                                {selectedTopic.content?.explanation && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                      Explanation Overview
                                    </span>
                                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                                      {selectedTopic.content.explanation}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <h5 className="font-semibold text-slate-800 text-xs sm:text-sm">
                                  Topic Content Summary
                                </h5>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                  Select any topic from the curriculum hierarchy
                                  on the left to inspect educational assets,
                                  multilingual video status, and learning points.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Course ID:{' '}
                <code className="text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded font-mono text-[11px]">
                  {selectedCourseId}
                </code>
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Create / Edit Modal */}
      {moduleModal && (
        <div
          id="module-form-modal"
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="module-form-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <h3 id="module-form-modal-title" className="font-display font-bold text-base text-slate-900 flex items-center space-x-2">
                <Folder className="w-4 h-4 text-primary-600" />
                <span>{moduleModal.mode === 'create' ? 'Add New Module' : 'Edit Module'}</span>
              </h3>
              <button
                type="button"
                onClick={() => !isSubmittingModule && setModuleModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModuleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {moduleSubmitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{moduleSubmitError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label htmlFor="module-title-input" className="block text-xs font-semibold text-slate-700">
                  Module Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="module-title-input"
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => {
                    setModuleTitle(e.target.value);
                    if (moduleErrors.title) {
                      setModuleErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  placeholder="e.g. Module 1: Introduction to Web Development"
                  maxLength={150}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 ${
                    moduleErrors.title ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                  }`}
                />
                {moduleErrors.title && <p className="text-[11px] text-red-600">{moduleErrors.title}</p>}
              </div>

              {/* Order */}
              <div className="space-y-1">
                <label htmlFor="module-order-input" className="block text-xs font-semibold text-slate-700">
                  Sequence Order <span className="text-red-500">*</span>
                </label>
                <input
                  id="module-order-input"
                  type="number"
                  min={0}
                  value={moduleOrder}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setModuleOrder(isNaN(parsed) ? 0 : parsed);
                    if (moduleErrors.order) {
                      setModuleErrors((prev) => ({ ...prev, order: undefined }));
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 ${
                    moduleErrors.order ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                  }`}
                />
                <p className="text-[10px] text-slate-400">Non-negative integer determining ordering within course curriculum.</p>
                {moduleErrors.order && <p className="text-[11px] text-red-600">{moduleErrors.order}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="module-description-input" className="block text-xs font-semibold text-slate-700">
                    Description (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400">{moduleDescription.length} / 2000</span>
                </div>
                <textarea
                  id="module-description-input"
                  rows={4}
                  value={moduleDescription}
                  onChange={(e) => {
                    setModuleDescription(e.target.value);
                    if (moduleErrors.description) {
                      setModuleErrors((prev) => ({ ...prev, description: undefined }));
                    }
                  }}
                  placeholder="Brief overview of the curriculum units and concepts covered in this module..."
                  maxLength={2000}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 ${
                    moduleErrors.description ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                  }`}
                />
                {moduleErrors.description && <p className="text-[11px] text-red-600">{moduleErrors.description}</p>}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModuleModal(null)}
                  disabled={isSubmittingModule}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-module-submit"
                  type="submit"
                  disabled={isSubmittingModule}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingModule ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{moduleModal.mode === 'create' ? 'Create Module' : 'Save Changes'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Deletion Confirmation Dialog */}
      {deleteModuleModal && (
        <div
          id="delete-module-modal"
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-module-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 id="delete-module-modal-title" className="text-base font-bold text-slate-900">
                  Delete Module
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete module{' '}
                  <strong className="text-slate-900 font-semibold">"{deleteModuleModal.title}"</strong>?
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  Deleting this module will automatically clean up and remove any child topics belonging to it. This operation cannot be reversed.
                </p>
              </div>

              {deleteModuleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{deleteModuleError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => !isDeletingModule && setDeleteModuleModal(null)}
                  disabled={isDeletingModule}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete-module"
                  type="button"
                  onClick={handleDeleteModuleConfirm}
                  disabled={isDeletingModule}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isDeletingModule ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Module</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topic Create / Edit Modal */}
      {topicModal && (
        <div
          id="topic-form-modal"
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topic-form-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-primary-600" />
                <h3 id="topic-form-modal-title" className="text-sm font-bold text-slate-900">
                  {topicModal.mode === 'create' ? 'Create New Topic' : 'Edit Topic'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTopicModal(null)}
                disabled={isSubmittingTopic}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopicSubmit} className="p-5 space-y-4 overflow-y-auto">
              {topicSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{topicSubmitError}</span>
                </div>
              )}

              {/* Title Field */}
              <div className="space-y-1">
                <label htmlFor="topic-input-title" className="block text-xs font-semibold text-slate-700">
                  Topic Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="topic-input-title"
                  type="text"
                  value={topicTitle}
                  onChange={(e) => {
                    setTopicTitle(e.target.value);
                    if (topicErrors.title) setTopicErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder="e.g. Introduction to Syntax and Variables"
                  maxLength={200}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 ${
                    topicErrors.title ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                  }`}
                />
                {topicErrors.title && <p className="text-[11px] text-red-600">{topicErrors.title}</p>}
              </div>

              {/* Order Field */}
              <div className="space-y-1">
                <label htmlFor="topic-input-order" className="block text-xs font-semibold text-slate-700">
                  Display Order
                </label>
                <input
                  id="topic-input-order"
                  type="number"
                  min={0}
                  step={1}
                  value={topicOrder}
                  onChange={(e) => {
                    setTopicOrder(parseInt(e.target.value, 10) || 0);
                    if (topicErrors.order) setTopicErrors((prev) => ({ ...prev, order: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 ${
                    topicErrors.order ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                  }`}
                />
                <p className="text-[11px] text-slate-400">Non-negative integer determining topic sequence within this module.</p>
                {topicErrors.order && <p className="text-[11px] text-red-600">{topicErrors.order}</p>}
              </div>

              {/* Description Field */}
              <div className="space-y-1">
                <label htmlFor="topic-input-desc" className="block text-xs font-semibold text-slate-700">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="topic-input-desc"
                  rows={3}
                  value={topicDescription}
                  onChange={(e) => {
                    setTopicDescription(e.target.value);
                    if (topicErrors.description) setTopicErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  placeholder="Summary of learning objectives and key concepts in this topic..."
                  maxLength={2000}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 ${
                    topicErrors.description ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                  }`}
                />
                {topicErrors.description && <p className="text-[11px] text-red-600">{topicErrors.description}</p>}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTopicModal(null)}
                  disabled={isSubmittingTopic}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-topic-submit"
                  type="submit"
                  disabled={isSubmittingTopic}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingTopic ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{topicModal.mode === 'create' ? 'Create Topic' : 'Save Changes'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 6E: Topic Content Management Modal */}
      {topicContentModal && (
        <div
          id="topic-content-modal"
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topic-content-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-4 sm:my-8 max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary-100 border border-primary-200 text-primary-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 id="topic-content-modal-title" className="text-sm font-bold text-slate-900 truncate">
                    Topic Content Management
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {topicContentModal.topicTitle}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-topic-content-modal"
                type="button"
                onClick={() => handleCloseTopicContentModal(false)}
                disabled={isSubmittingTopicContent}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Discard Confirmation Overlay */}
            {showTcDiscardConfirm && (
              <div className="bg-amber-50 border-b border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs font-medium text-amber-900">
                    You have unsaved changes. Discard all edits and close?
                  </p>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowTcDiscardConfirm(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-2xs transition-colors"
                  >
                    Keep Editing
                  </button>
                  <button
                    id="btn-confirm-discard-topic-content"
                    type="button"
                    onClick={() => handleCloseTopicContentModal(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-2xs transition-colors"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            )}

            {/* Loading topic content */}
            {isTopicContentLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="text-xs font-medium text-slate-600">Loading topic details and learning content...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveTopicContent} className="flex flex-col flex-1 min-h-0">
                <div className="overflow-y-auto p-6 space-y-5 flex-1">
                  {/* Load error banner with retry option */}
                  {topicContentLoadError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{topicContentLoadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenTopicContent(topicContentModal.moduleId, {
                            id: topicContentModal.topicId,
                            title: topicContentModal.topicTitle,
                          } as any)
                        }
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded text-amber-900 font-semibold text-[11px] shrink-0"
                      >
                        Retry Fetch
                      </button>
                    </div>
                  )}

                  {/* Submit error banner */}
                  {topicContentSubmitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{topicContentSubmitError}</span>
                    </div>
                  )}

                  {/* Title Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="tc-input-title" className="block text-xs font-bold text-slate-800">
                        Topic Title <span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`text-[11px] font-mono ${
                          tcTitle.length > 200 ? 'text-red-600 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {tcTitle.length}/200
                      </span>
                    </div>
                    <input
                      id="tc-input-title"
                      type="text"
                      value={tcTitle}
                      onChange={(e) => {
                        setTcTitle(e.target.value);
                        if (tcValidationErrors.title) {
                          setTcValidationErrors((prev) => ({ ...prev, title: undefined }));
                        }
                      }}
                      placeholder="e.g. Pointers and Memory Allocation in C"
                      maxLength={200}
                      className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-colors ${
                        tcValidationErrors.title
                          ? 'border-red-300 bg-red-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    />
                    {tcValidationErrors.title && (
                      <p className="text-[11px] text-red-600">{tcValidationErrors.title}</p>
                    )}
                  </div>

                  {/* Description Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="tc-input-desc" className="block text-xs font-bold text-slate-800">
                        Description <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <span
                        className={`text-[11px] font-mono ${
                          tcDescription.length > 2000 ? 'text-red-600 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {tcDescription.length}/2000
                      </span>
                    </div>
                    <textarea
                      id="tc-input-desc"
                      rows={2}
                      value={tcDescription}
                      onChange={(e) => {
                        setTcDescription(e.target.value);
                        if (tcValidationErrors.description) {
                          setTcValidationErrors((prev) => ({ ...prev, description: undefined }));
                        }
                      }}
                      placeholder="Brief summary or introductory premise for this topic..."
                      maxLength={2000}
                      className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-colors ${
                        tcValidationErrors.description
                          ? 'border-red-300 bg-red-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    />
                    {tcValidationErrors.description && (
                      <p className="text-[11px] text-red-600">{tcValidationErrors.description}</p>
                    )}
                  </div>

                  {/* Main Content Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="tc-input-content" className="block text-xs font-bold text-slate-800">
                          Main Learning Content
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Comprehensive textual explanation, concept breakdown, and learning materials presented to learners.
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-mono shrink-0 ml-2 ${
                          tcContent.length > 50000 ? 'text-red-600 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {tcContent.length.toLocaleString()}/50,000
                      </span>
                    </div>
                    <textarea
                      id="tc-input-content"
                      rows={10}
                      value={tcContent}
                      onChange={(e) => {
                        setTcContent(e.target.value);
                        if (tcValidationErrors.content) {
                          setTcValidationErrors((prev) => ({ ...prev, content: undefined }));
                        }
                      }}
                      placeholder="Enter detailed learning content, tutorials, explanations, and core concepts for this topic..."
                      maxLength={50000}
                      className={`w-full px-3.5 py-2.5 text-xs font-sans rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 leading-relaxed transition-colors ${
                        tcValidationErrors.content
                          ? 'border-red-300 bg-red-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    />
                    {tcValidationErrors.content && (
                      <p className="text-[11px] text-red-600">{tcValidationErrors.content}</p>
                    )}
                  </div>

                  {/* Important Points Section */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Important Revision Points / Takeaways
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Key bullet points, revision takeaways, and exam highlights for this topic.
                        </p>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {tcImportantPoints.length}/50 points
                      </span>
                    </div>

                    {tcValidationErrors.points && (
                      <p className="text-[11px] text-red-600 font-medium">{tcValidationErrors.points}</p>
                    )}

                    {/* Points list */}
                    {tcImportantPoints.length > 0 ? (
                      <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                        {tcImportantPoints.map((point, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>
                              <input
                                id={`tc-point-input-${idx}`}
                                type="text"
                                value={point}
                                onChange={(e) => handleUpdateImportantPoint(idx, e.target.value)}
                                placeholder="Enter point takeaway..."
                                maxLength={1000}
                                className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-colors bg-white ${
                                  tcValidationErrors[`point_${idx}`]
                                    ? 'border-red-300 bg-red-50/50'
                                    : 'border-slate-200'
                                }`}
                              />
                              <button
                                id={`btn-remove-point-${idx}`}
                                type="button"
                                onClick={() => handleRemoveImportantPoint(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                                title="Remove point"
                                aria-label={`Remove point ${idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {tcValidationErrors[`point_${idx}`] && (
                              <p className="text-[10px] text-red-600 pl-8">
                                {tcValidationErrors[`point_${idx}`]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/40">
                        <p className="text-xs text-slate-500">
                          No important points added yet. Use the field below to add key revision points.
                        </p>
                      </div>
                    )}

                    {/* Add point input & button */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <input
                          id="tc-new-point-input"
                          type="text"
                          value={tcNewPointInput}
                          onChange={(e) => {
                            setTcNewPointInput(e.target.value);
                            if (tcValidationErrors.newPoint) {
                              setTcValidationErrors((prev) => ({ ...prev, newPoint: undefined }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImportantPoint();
                            }
                          }}
                          placeholder="Type a new revision point and click 'Add Point' (or press Enter)..."
                          maxLength={1000}
                          disabled={tcImportantPoints.length >= 50}
                          className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        />
                        <button
                          id="btn-add-important-point"
                          type="button"
                          onClick={handleAddImportantPoint}
                          disabled={!tcNewPointInput.trim() || tcImportantPoints.length >= 50}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Point</span>
                        </button>
                      </div>
                      {tcValidationErrors.newPoint && (
                        <p className="text-[11px] text-red-600">{tcValidationErrors.newPoint}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    {isTopicContentDirty() && (
                      <span className="text-amber-600 font-medium">Unsaved changes</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCloseTopicContentModal(false)}
                      disabled={isSubmittingTopicContent}
                      className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-save-topic-content-submit"
                      type="submit"
                      disabled={isSubmittingTopicContent || isTopicContentLoading}
                      className="inline-flex items-center space-x-1.5 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                    >
                      {isSubmittingTopicContent ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Content...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save Content</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Step 6F: Topic Multilingual Video References Modal */}
      {topicVideosModal && (
        <div
          id="topic-videos-modal"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topic-videos-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="topic-videos-modal-title" className="text-sm font-bold text-slate-900 truncate">
                    Manage Video References
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {topicVideosModal.topicTitle}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-topic-videos-modal"
                type="button"
                onClick={() => handleCloseTopicVideosModal(false)}
                disabled={isSubmittingTopicVideos}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                aria-label="Close video modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Discard Confirmation Overlay */}
            {showTvDiscardConfirm && (
              <div className="bg-amber-50 border-b border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs font-medium text-amber-900">
                    You have unsaved changes to video references. Discard all edits and close?
                  </p>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowTvDiscardConfirm(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-2xs transition-colors"
                  >
                    Keep Editing
                  </button>
                  <button
                    id="btn-confirm-discard-topic-videos"
                    type="button"
                    onClick={() => handleCloseTopicVideosModal(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-2xs transition-colors"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            )}

            {/* Loading topic video references */}
            {isTopicVideosLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-medium text-slate-600">Loading topic video references...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveTopicVideos} className="flex flex-col flex-1 min-h-0">
                <div className="overflow-y-auto p-6 space-y-6 flex-1">
                  {/* Load error banner with retry option */}
                  {topicVideosLoadError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{topicVideosLoadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenTopicVideos(topicVideosModal.moduleId, {
                            id: topicVideosModal.topicId,
                            title: topicVideosModal.topicTitle,
                          } as any)
                        }
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded text-amber-900 font-semibold text-[11px] shrink-0"
                      >
                        Retry Fetch
                      </button>
                    </div>
                  )}

                  {/* Submit error banner */}
                  {topicVideosSubmitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{topicVideosSubmitError}</span>
                    </div>
                  )}

                  {/* Overview guide banner */}
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      Multilingual Video Lessons Support
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Configure YouTube references for English, Telugu, and Hindi explanations. You can provide full YouTube URLs (e.g., <code className="text-[10px] bg-slate-200/70 px-1 py-0.5 rounded font-mono">https://www.youtube.com/watch?v=...</code>, <code className="text-[10px] bg-slate-200/70 px-1 py-0.5 rounded font-mono">https://youtu.be/...</code>) or direct 11-character video IDs. Leaving a field empty removes that video reference.
                    </p>
                  </div>

                  {/* Language Section 1: English */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center">
                          EN
                        </span>
                        <label htmlFor="tv-input-english" className="text-xs font-bold text-slate-800">
                          English Video Reference
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tvEnglish.trim() ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Configured</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Not Configured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input
                          id="tv-input-english"
                          type="text"
                          value={tvEnglish}
                          onChange={(e) => {
                            setTvEnglish(e.target.value);
                            if (tvValidationErrors.english) {
                              setTvValidationErrors((prev) => {
                                const next = { ...prev };
                                delete next.english;
                                return next;
                              });
                            }
                          }}
                          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                          maxLength={1000}
                          className={`flex-1 px-3.5 py-2 text-xs rounded-lg border font-mono transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                            tvValidationErrors.english
                              ? 'border-red-300 bg-red-50/50'
                              : 'border-slate-200 bg-white'
                          }`}
                        />
                        {tvEnglish.trim() && (
                          <>
                            {getYouTubePreviewUrl(tvEnglish) && !tvValidationErrors.english && (
                              <a
                                id="tv-preview-english"
                                href={getYouTubePreviewUrl(tvEnglish)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                                title="Open video in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Preview</span>
                              </a>
                            )}
                            <button
                              id="btn-clear-video-english"
                              type="button"
                              onClick={() => handleClearVideoLanguage('english')}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
                              title="Clear English video reference"
                              aria-label="Clear English video reference"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      {tvValidationErrors.english && (
                        <p className="text-[11px] text-red-600">{tvValidationErrors.english}</p>
                      )}
                    </div>
                  </div>

                  {/* Language Section 2: Telugu */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px] flex items-center justify-center">
                          TE
                        </span>
                        <label htmlFor="tv-input-telugu" className="text-xs font-bold text-slate-800">
                          Telugu Video Reference
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tvTelugu.trim() ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Configured</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Not Configured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input
                          id="tv-input-telugu"
                          type="text"
                          value={tvTelugu}
                          onChange={(e) => {
                            setTvTelugu(e.target.value);
                            if (tvValidationErrors.telugu) {
                              setTvValidationErrors((prev) => {
                                const next = { ...prev };
                                delete next.telugu;
                                return next;
                              });
                            }
                          }}
                          placeholder="e.g. https://www.youtube.com/watch?v=... or Telugu lesson video ID"
                          maxLength={1000}
                          className={`flex-1 px-3.5 py-2 text-xs rounded-lg border font-mono transition-colors focus:outline-hidden focus:ring-2 focus:ring-purple-500 ${
                            tvValidationErrors.telugu
                              ? 'border-red-300 bg-red-50/50'
                              : 'border-slate-200 bg-white'
                          }`}
                        />
                        {tvTelugu.trim() && (
                          <>
                            {getYouTubePreviewUrl(tvTelugu) && !tvValidationErrors.telugu && (
                              <a
                                id="tv-preview-telugu"
                                href={getYouTubePreviewUrl(tvTelugu)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                                title="Open video in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Preview</span>
                              </a>
                            )}
                            <button
                              id="btn-clear-video-telugu"
                              type="button"
                              onClick={() => handleClearVideoLanguage('telugu')}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
                              title="Clear Telugu video reference"
                              aria-label="Clear Telugu video reference"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      {tvValidationErrors.telugu && (
                        <p className="text-[11px] text-red-600">{tvValidationErrors.telugu}</p>
                      )}
                    </div>
                  </div>

                  {/* Language Section 3: Hindi */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center">
                          HI
                        </span>
                        <label htmlFor="tv-input-hindi" className="text-xs font-bold text-slate-800">
                          Hindi Video Reference
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tvHindi.trim() ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Configured</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Not Configured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input
                          id="tv-input-hindi"
                          type="text"
                          value={tvHindi}
                          onChange={(e) => {
                            setTvHindi(e.target.value);
                            if (tvValidationErrors.hindi) {
                              setTvValidationErrors((prev) => {
                                const next = { ...prev };
                                delete next.hindi;
                                return next;
                              });
                            }
                          }}
                          placeholder="e.g. https://www.youtube.com/watch?v=... or Hindi lesson video ID"
                          maxLength={1000}
                          className={`flex-1 px-3.5 py-2 text-xs rounded-lg border font-mono transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                            tvValidationErrors.hindi
                              ? 'border-red-300 bg-red-50/50'
                              : 'border-slate-200 bg-white'
                          }`}
                        />
                        {tvHindi.trim() && (
                          <>
                            {getYouTubePreviewUrl(tvHindi) && !tvValidationErrors.hindi && (
                              <a
                                id="tv-preview-hindi"
                                href={getYouTubePreviewUrl(tvHindi)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                                title="Open video in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Preview</span>
                              </a>
                            )}
                            <button
                              id="btn-clear-video-hindi"
                              type="button"
                              onClick={() => handleClearVideoLanguage('hindi')}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
                              title="Clear Hindi video reference"
                              aria-label="Clear Hindi video reference"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      {tvValidationErrors.hindi && (
                        <p className="text-[11px] text-red-600">{tvValidationErrors.hindi}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    {isTopicVideosDirty() && (
                      <span className="text-amber-600 font-medium">Unsaved changes</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCloseTopicVideosModal(false)}
                      disabled={isSubmittingTopicVideos}
                      className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-save-topic-videos-submit"
                      type="submit"
                      disabled={isSubmittingTopicVideos || isTopicVideosLoading}
                      className="inline-flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                    >
                      {isSubmittingTopicVideos ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Videos...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save Video References</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Step 6G: Topic Code Examples & Images Management Modal */}
      {topicCodeImagesModal && (
        <div
          id="topic-code-images-modal"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topic-code-images-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Code className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="topic-code-images-modal-title" className="text-sm font-bold text-slate-900 truncate">
                    Manage Code Examples & Images
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {topicCodeImagesModal.topicTitle}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-topic-code-images-modal"
                type="button"
                onClick={() => handleCloseTopicCodeImagesModal(false)}
                disabled={isSubmittingTopicCodeImages}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                aria-label="Close code and images modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Discard Confirmation Banner */}
            {showTciDiscardConfirm && (
              <div className="bg-amber-50 border-b border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs font-medium text-amber-900">
                    You have unsaved changes to code examples or images. Discard all edits and close?
                  </p>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowTciDiscardConfirm(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-2xs transition-colors"
                  >
                    Keep Editing
                  </button>
                  <button
                    id="btn-confirm-discard-topic-code-images"
                    type="button"
                    onClick={() => handleCloseTopicCodeImagesModal(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-2xs transition-colors"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="px-6 border-b border-slate-200 bg-slate-50/40 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-4">
                <button
                  id="tab-btn-code-examples"
                  type="button"
                  onClick={() => setTciActiveTab('code')}
                  className={`py-3 text-xs font-semibold inline-flex items-center space-x-2 border-b-2 transition-colors ${
                    tciActiveTab === 'code'
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Code Examples</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tciActiveTab === 'code'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tciCodeExamples.length}
                  </span>
                </button>

                <button
                  id="tab-btn-topic-images"
                  type="button"
                  onClick={() => setTciActiveTab('images')}
                  className={`py-3 text-xs font-semibold inline-flex items-center space-x-2 border-b-2 transition-colors ${
                    tciActiveTab === 'images'
                      ? 'border-emerald-600 text-emerald-800'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Images & Diagrams</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tciActiveTab === 'images'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tciImages.length}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 hidden sm:block">
                Max 50 items per section
              </div>
            </div>

            {/* Loading state */}
            {isTopicCodeImagesLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-xs font-medium text-slate-600">Loading code examples and images...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveTopicCodeImages} className="flex flex-col flex-1 min-h-0">
                <div className="overflow-y-auto p-6 space-y-6 flex-1">
                  {/* Load error banner with retry option */}
                  {topicCodeImagesLoadError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{topicCodeImagesLoadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenTopicCodeImages(topicCodeImagesModal.moduleId, {
                            id: topicCodeImagesModal.topicId,
                            title: topicCodeImagesModal.topicTitle,
                          } as any)
                        }
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded text-amber-900 font-semibold text-[11px] shrink-0"
                      >
                        Retry Fetch
                      </button>
                    </div>
                  )}

                  {/* Submission Error Banner */}
                  {topicCodeImagesSubmitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{topicCodeImagesSubmitError}</span>
                    </div>
                  )}

                  {/* General validation error */}
                  {tciValidationErrors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{tciValidationErrors.general}</span>
                    </div>
                  )}

                  {/* TAB 1: CODE EXAMPLES */}
                  {tciActiveTab === 'code' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Code Examples ({tciCodeExamples.length}/50)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Add programming snippets with syntax specifications and optional explanations.
                          </p>
                        </div>
                        <button
                          id="btn-add-code-example"
                          type="button"
                          onClick={handleAddCodeExample}
                          disabled={tciCodeExamples.length >= 50}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Code Example</span>
                        </button>
                      </div>

                      {tciCodeExamples.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <Code className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700">No code examples added yet</p>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Provide runnable code snippets in C, C++, Python, Java, or other languages to accompany this topic.
                          </p>
                          <button
                            type="button"
                            onClick={handleAddCodeExample}
                            className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add First Code Example</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tciCodeExamples.map((ex, idx) => {
                            const errors = tciValidationErrors.codeExamples?.[idx];
                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-xl border transition-all ${
                                  errors
                                    ? 'border-red-300 bg-red-50/20 shadow-xs'
                                    : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
                                } space-y-3.5`}
                              >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">
                                      Code Example #{idx + 1}
                                    </span>
                                  </div>
                                  <button
                                    id={`btn-remove-code-example-${idx}`}
                                    type="button"
                                    onClick={() => handleRemoveCodeExample(idx)}
                                    className="inline-flex items-center space-x-1 px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 text-[11px] font-medium transition-colors"
                                    title="Remove this code example"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="sm:col-span-2 space-y-1">
                                    <label
                                      htmlFor={`tci-code-title-${idx}`}
                                      className="text-[11px] font-semibold text-slate-700 block"
                                    >
                                      Title (optional)
                                    </label>
                                    <input
                                      id={`tci-code-title-${idx}`}
                                      type="text"
                                      value={ex.title || ''}
                                      onChange={(e) => handleUpdateCodeExample(idx, 'title', e.target.value)}
                                      placeholder="e.g. Memory allocation with malloc()"
                                      maxLength={200}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                                        errors?.title ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                                      }`}
                                    />
                                    {errors?.title && <p className="text-[10px] text-red-600">{errors.title}</p>}
                                  </div>

                                  <div className="space-y-1">
                                    <label
                                      htmlFor={`tci-code-language-${idx}`}
                                      className="text-[11px] font-semibold text-slate-700 block"
                                    >
                                      Language
                                    </label>
                                    <input
                                      id={`tci-code-language-${idx}`}
                                      list="common-programming-languages"
                                      type="text"
                                      value={ex.language || 'c'}
                                      onChange={(e) => handleUpdateCodeExample(idx, 'language', e.target.value)}
                                      placeholder="e.g. c, python, java"
                                      maxLength={50}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg border font-mono transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                                        errors?.language ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                                      }`}
                                    />
                                    {errors?.language && <p className="text-[10px] text-red-600">{errors.language}</p>}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label
                                      htmlFor={`tci-code-snippet-${idx}`}
                                      className="text-[11px] font-semibold text-slate-700 block"
                                    >
                                      Code Snippet <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {(ex.code || '').length}/30,000
                                    </span>
                                  </div>
                                  <textarea
                                    id={`tci-code-snippet-${idx}`}
                                    rows={6}
                                    spellCheck={false}
                                    value={ex.code || ''}
                                    onChange={(e) => handleUpdateCodeExample(idx, 'code', e.target.value)}
                                    placeholder="// Enter code snippet here...&#10;#include <stdio.h>&#10;int main() {&#10;    printf(&quot;Hello, World!\n&quot;);&#10;    return 0;&#10;}"
                                    maxLength={30000}
                                    className={`w-full px-3.5 py-2 text-xs rounded-lg border font-mono leading-relaxed transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                                      errors?.code ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-slate-900 text-emerald-300'
                                    }`}
                                  />
                                  {errors?.code && <p className="text-[10px] text-red-600 font-medium">{errors.code}</p>}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label
                                      htmlFor={`tci-code-explanation-${idx}`}
                                      className="text-[11px] font-semibold text-slate-700 block"
                                    >
                                      Explanation / Key Takeaway (optional)
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {(ex.explanation || '').length}/5,000
                                    </span>
                                  </div>
                                  <textarea
                                    id={`tci-code-explanation-${idx}`}
                                    rows={2}
                                    value={ex.explanation || ''}
                                    onChange={(e) => handleUpdateCodeExample(idx, 'explanation', e.target.value)}
                                    placeholder="Explain how this implementation works or outline expected console output..."
                                    maxLength={5000}
                                    className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                                      errors?.explanation ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                                    }`}
                                  />
                                  {errors?.explanation && (
                                    <p className="text-[10px] text-red-600">{errors.explanation}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: IMAGES & DIAGRAMS */}
                  {tciActiveTab === 'images' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Images & Diagrams ({tciImages.length}/50)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Add URL references to architecture diagrams, flowcharts, and technical illustrations.
                          </p>
                        </div>
                        <button
                          id="btn-add-image-reference"
                          type="button"
                          onClick={handleAddImage}
                          disabled={tciImages.length >= 50}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Image Reference</span>
                        </button>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] flex items-center space-x-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          Provide valid absolute image URLs (starting with <strong>https://</strong> or <strong>http://</strong>) or relative paths (starting with <strong>/</strong>). Direct file uploads are not supported yet.
                        </span>
                      </div>

                      {tciImages.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700">No image references added yet</p>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Visual diagrams make complex CS concepts easy to learn. Add an image reference URL to illustrate this topic.
                          </p>
                          <button
                            type="button"
                            onClick={handleAddImage}
                            className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add First Image Reference</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tciImages.map((img, idx) => {
                            const errors = tciValidationErrors.images?.[idx];
                            const isValidHttpUrl = img.url && (img.url.startsWith('http://') || img.url.startsWith('https://'));
                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-xl border transition-all ${
                                  errors
                                    ? 'border-red-300 bg-red-50/20 shadow-xs'
                                    : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
                                } space-y-3.5`}
                              >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">
                                      Image Reference #{idx + 1}
                                    </span>
                                  </div>
                                  <button
                                    id={`btn-remove-image-${idx}`}
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="inline-flex items-center space-x-1 px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 text-[11px] font-medium transition-colors"
                                    title="Remove this image reference"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label
                                      htmlFor={`tci-image-url-${idx}`}
                                      className="text-[11px] font-semibold text-slate-700 block"
                                    >
                                      Image URL / Path <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {(img.url || '').length}/1,000
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      id={`tci-image-url-${idx}`}
                                      type="text"
                                      value={img.url || ''}
                                      onChange={(e) => handleUpdateImage(idx, 'url', e.target.value)}
                                      placeholder="https://example.com/images/diagram.png or /assets/images/..."
                                      maxLength={1000}
                                      className={`flex-1 px-3 py-1.5 text-xs rounded-lg border font-mono transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                                        errors?.url ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                                      }`}
                                    />
                                    {isValidHttpUrl && (
                                      <a
                                        id={`tci-preview-link-${idx}`}
                                        href={img.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                                        title="Open image in new tab"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Preview</span>
                                      </a>
                                    )}
                                  </div>
                                  {errors?.url && <p className="text-[10px] text-red-600 font-medium">{errors.url}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label
                                      htmlFor={`tci-image-caption-${idx}`}
                                      className="text-[11px] font-semibold text-slate-700 block"
                                    >
                                      Caption (optional)
                                    </label>
                                    <input
                                      id={`tci-image-caption-${idx}`}
                                      type="text"
                                      value={img.caption || ''}
                                      onChange={(e) => handleUpdateImage(idx, 'caption', e.target.value)}
                                      placeholder="e.g. Figure 1: Memory Layout diagram"
                                      maxLength={500}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                                        errors?.caption ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                                      }`}
                                    />
                                    {errors?.caption && <p className="text-[10px] text-red-600">{errors.caption}</p>}
                                  </div>

                                  <div className="space-y-1">
                                    <label
                                      htmlFor={`tci-image-alt-${idx}`}
                                      className="text-[11px] font-semibold text-slate-700 block"
                                    >
                                      Alt Text for Accessibility (optional)
                                    </label>
                                    <input
                                      id={`tci-image-alt-${idx}`}
                                      type="text"
                                      value={img.altText || ''}
                                      onChange={(e) => handleUpdateImage(idx, 'altText', e.target.value)}
                                      placeholder="e.g. Flowchart showing if-else conditions"
                                      maxLength={200}
                                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                                        errors?.altText ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white'
                                      }`}
                                    />
                                    {errors?.altText && <p className="text-[10px] text-red-600">{errors.altText}</p>}
                                  </div>
                                </div>

                                {img.url && (img.url.startsWith('http://') || img.url.startsWith('https://') || img.url.startsWith('/')) && (
                                  <div className="pt-1">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                      Thumbnail Preview
                                    </span>
                                    <div className="inline-block p-1.5 bg-slate-50 border border-slate-200 rounded-lg max-w-xs">
                                      <img
                                        src={img.url}
                                        alt={img.altText || img.caption || 'Topic illustration'}
                                        className="h-24 max-w-full object-contain rounded bg-white"
                                        onError={(e) => {
                                          (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
                  <div className="text-[11px] text-slate-400">
                    {isTopicCodeImagesDirty() && (
                      <span className="text-amber-600 font-medium">Unsaved changes</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCloseTopicCodeImagesModal(false)}
                      disabled={isSubmittingTopicCodeImages}
                      className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-save-topic-code-images"
                      type="submit"
                      disabled={isSubmittingTopicCodeImages || isTopicCodeImagesLoading}
                      className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                    >
                      {isSubmittingTopicCodeImages ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save Code & Images</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Datalist for common programming languages */}
      <datalist id="common-programming-languages">
        <option value="c" />
        <option value="cpp" />
        <option value="java" />
        <option value="python" />
        <option value="javascript" />
        <option value="typescript" />
        <option value="sql" />
        <option value="html" />
        <option value="css" />
        <option value="go" />
        <option value="rust" />
        <option value="csharp" />
        <option value="php" />
      </datalist>

      {/* Topic Deletion Confirmation Dialog */}
      {deleteTopicModal && (
        <div
          id="delete-topic-modal"
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-topic-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 id="delete-topic-modal-title" className="text-base font-bold text-slate-900">
                  Delete Topic
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete topic{' '}
                  <strong className="text-slate-900 font-semibold font-mono">
                    "{deleteTopicModal.topic.title}"
                  </strong>{' '}
                  (Order #{deleteTopicModal.topic.order})? This action cannot be undone.
                </p>
              </div>

              {deleteTopicError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{deleteTopicError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => !isDeletingTopic && setDeleteTopicModal(null)}
                  disabled={isDeletingTopic}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete-topic"
                  type="button"
                  onClick={handleDeleteTopicConfirm}
                  disabled={isDeletingTopic}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isDeletingTopic ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Topic</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Course Status Change Confirmation Dialog */}
      {statusModal && (
        <div
          id="confirm-status-modal"
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-status-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    statusModal.targetStatus === 'published'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : statusModal.targetStatus === 'archived'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {statusModal.targetStatus === 'published' ? (
                    <Globe className="w-5 h-5" />
                  ) : statusModal.targetStatus === 'archived' ? (
                    <Archive className="w-5 h-5" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3
                    id="confirm-status-modal-title"
                    className="font-display font-bold text-base text-slate-900 truncate"
                  >
                    {statusModal.targetStatus === 'published'
                      ? 'Publish Course'
                      : statusModal.targetStatus === 'archived'
                      ? 'Archive Course'
                      : 'Move Course to Draft'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    Confirm course lifecycle transition
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseStatusModal}
                disabled={isSubmittingStatus}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Close confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                Are you sure you want to{' '}
                <span className="font-semibold text-slate-900">
                  {statusModal.targetStatus === 'published'
                    ? 'publish'
                    : statusModal.targetStatus === 'archived'
                    ? 'archive'
                    : 'move to draft'}
                </span>{' '}
                the following course?
              </p>

              {/* Course Title and Status Transition Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Course Title
                  </span>
                  <p className="font-semibold text-slate-900 text-sm break-words">
                    {statusModal.course.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">
                      Current Status:
                    </span>
                    {renderStatusBadge(statusModal.course.status)}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">
                      New Status:
                    </span>
                    {renderStatusBadge(statusModal.targetStatus)}
                  </div>
                </div>
              </div>

              {/* Consequence of the Action */}
              <div className="text-xs text-slate-600 bg-slate-50/75 p-3 rounded-lg border border-slate-200/70 leading-relaxed">
                <span className="font-semibold text-slate-700 block mb-1">
                  Consequence:
                </span>
                {statusModal.targetStatus === 'published' && (
                  <span>
                    This course will become visible and accessible to students across
                    the platform catalog.
                  </span>
                )}
                {statusModal.targetStatus === 'archived' && (
                  <span>
                    This course will be archived and hidden from student catalog browsing
                    and new enrollments.
                  </span>
                )}
                {statusModal.targetStatus === 'draft' && (
                  <span>
                    This course will be returned to draft state and unpublished from
                    student catalog visibility.
                  </span>
                )}
              </div>

              {/* Non-blocking Publishing Warning (Required) */}
              {statusModal.targetStatus === 'published' && (
                <div
                  id="publishing-lifecycle-warning"
                  className="flex items-start space-x-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs leading-relaxed"
                >
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Publishing makes this course available according to the current course
                    lifecycle rules.
                  </span>
                </div>
              )}

              {/* Status Mutation Error Callout */}
              {statusMutationError && (
                <div
                  id="status-mutation-error"
                  className="flex items-start space-x-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{statusMutationError}</span>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
              <button
                id="btn-cancel-status-mutation"
                type="button"
                onClick={handleCloseStatusModal}
                disabled={isSubmittingStatus}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-status-mutation"
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isSubmittingStatus}
                className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  statusModal.targetStatus === 'published'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : statusModal.targetStatus === 'archived'
                    ? 'bg-slate-700 hover:bg-slate-800'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isSubmittingStatus && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                )}
                <span>
                  {isSubmittingStatus
                    ? 'Updating Status...'
                    : statusModal.targetStatus === 'published'
                    ? 'Publish Course'
                    : statusModal.targetStatus === 'archived'
                    ? 'Archive Course'
                    : 'Move to Draft'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Admin Course Creation Modal */}
      {isCreateModalOpen && (
        <div
          id="create-course-modal"
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-course-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-200 text-primary-700 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="create-course-modal-title"
                    className="font-display font-bold text-base sm:text-lg text-slate-900 truncate"
                  >
                    Create New Course
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    Initialize a course record under administrative control
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-create-course-modal"
                onClick={handleCloseCreateModal}
                disabled={isSubmittingCreate}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Close create course modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              id="form-create-course"
              onSubmit={handleCreateCourseSubmit}
              noValidate
              className="flex flex-col"
            >
              <div className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-130px)] overflow-y-auto text-xs sm:text-sm">
                {/* Global Error Banner */}
                {createError && (
                  <div
                    id="create-course-error-banner"
                    className="flex items-start space-x-2.5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{createError}</span>
                  </div>
                )}

                {/* 1. Course Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="create-course-title"
                      className="text-xs font-semibold text-slate-700 flex items-center"
                    >
                      <span>Course Title</span>
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {createTitle.trim().length} / 150
                    </span>
                  </div>
                  <input
                    id="create-course-title"
                    type="text"
                    value={createTitle}
                    onChange={(e) => {
                      setCreateTitle(e.target.value);
                      if (createValidationErrors.title) {
                        setCreateValidationErrors((prev) => ({ ...prev, title: '' }));
                      }
                    }}
                    placeholder="e.g., Complete Python Bootcamp"
                    disabled={isSubmittingCreate}
                    maxLength={150}
                    className={`w-full px-3 py-2 rounded-lg border text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-colors ${
                      createValidationErrors.title
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                    }`}
                  />
                  {createValidationErrors.title && (
                    <p
                      id="error-create-title"
                      className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{createValidationErrors.title}</span>
                    </p>
                  )}
                </div>

                {/* 2. Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="create-course-description"
                      className="text-xs font-semibold text-slate-700 flex items-center"
                    >
                      <span>Description</span>
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {createDescription.trim().length} / 5000 (min 10)
                    </span>
                  </div>
                  <textarea
                    id="create-course-description"
                    rows={4}
                    value={createDescription}
                    onChange={(e) => {
                      setCreateDescription(e.target.value);
                      if (createValidationErrors.description) {
                        setCreateValidationErrors((prev) => ({ ...prev, description: '' }));
                      }
                    }}
                    placeholder="Provide a comprehensive summary of what students will learn in this course..."
                    disabled={isSubmittingCreate}
                    maxLength={5000}
                    className={`w-full px-3 py-2 rounded-lg border text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-colors ${
                      createValidationErrors.description
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                    }`}
                  />
                  {createValidationErrors.description && (
                    <p
                      id="error-create-description"
                      className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{createValidationErrors.description}</span>
                    </p>
                  )}
                </div>

                {/* 3. Category & Course Creator (2-col grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="create-course-category"
                        className="text-xs font-semibold text-slate-700 flex items-center"
                      >
                        <span>Category</span>
                        <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {createCategory.trim().length} / 50
                      </span>
                    </div>
                    <input
                      id="create-course-category"
                      type="text"
                      value={createCategory}
                      onChange={(e) => {
                        setCreateCategory(e.target.value);
                        if (createValidationErrors.category) {
                          setCreateValidationErrors((prev) => ({ ...prev, category: '' }));
                        }
                      }}
                      placeholder="e.g., Programming, Web Development"
                      disabled={isSubmittingCreate}
                      maxLength={50}
                      className={`w-full px-3 py-2 rounded-lg border text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-colors ${
                        createValidationErrors.category
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                      }`}
                    />
                    {createValidationErrors.category && (
                      <p
                        id="error-create-category"
                        className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{createValidationErrors.category}</span>
                      </p>
                    )}
                  </div>

                  {/* Course Creator Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="create-course-creator"
                        className="text-xs font-semibold text-slate-700 flex items-center"
                      >
                        <span>Course Creator</span>
                        <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      {isLoadingCreators && (
                        <span className="text-[11px] text-slate-400 flex items-center">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin mr-1 text-primary-600" />
                          Loading...
                        </span>
                      )}
                    </div>
                    <select
                      id="create-course-creator"
                      value={createCreatorId}
                      onChange={(e) => {
                        setCreateCreatorId(e.target.value);
                        if (createValidationErrors.courseCreator) {
                          setCreateValidationErrors((prev) => ({ ...prev, courseCreator: '' }));
                        }
                      }}
                      disabled={isSubmittingCreate || isLoadingCreators}
                      className={`w-full px-3 py-2 rounded-lg border text-slate-900 bg-white focus:outline-hidden focus:ring-2 transition-colors ${
                        createValidationErrors.courseCreator
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                      }`}
                    >
                      <option value="">-- Select Active Creator --</option>
                      {courseCreators.map((creator) => (
                        <option key={creator.id} value={creator.id}>
                          {creator.name} ({creator.email})
                        </option>
                      ))}
                    </select>

                    {creatorsError && (
                      <p className="mt-1 text-xs text-rose-500">
                        {creatorsError}
                      </p>
                    )}

                    {!isLoadingCreators && courseCreators.length === 0 && !creatorsError && (
                      <p
                        id="no-creators-notice"
                        className="mt-1 text-xs text-amber-600 flex items-center space-x-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>No active course creators available.</span>
                      </p>
                    )}

                    {createValidationErrors.courseCreator && (
                      <p
                        id="error-create-creator"
                        className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{createValidationErrors.courseCreator}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Thumbnail URL (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="create-course-thumbnail"
                      className="text-xs font-semibold text-slate-700 flex items-center"
                    >
                      <span>Thumbnail URL</span>
                      <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {createThumbnail.trim().length} / 500
                    </span>
                  </div>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="create-course-thumbnail"
                      type="url"
                      value={createThumbnail}
                      onChange={(e) => {
                        setCreateThumbnail(e.target.value);
                        if (createValidationErrors.thumbnail) {
                          setCreateValidationErrors((prev) => ({ ...prev, thumbnail: '' }));
                        }
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      disabled={isSubmittingCreate}
                      maxLength={500}
                      className={`w-full pl-9 pr-3 py-2 rounded-lg border text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-colors ${
                        createValidationErrors.thumbnail
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                      }`}
                    />
                  </div>

                  {createValidationErrors.thumbnail && (
                    <p
                      id="error-create-thumbnail"
                      className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{createValidationErrors.thumbnail}</span>
                    </p>
                  )}

                  {/* Safe Thumbnail Preview */}
                  {createThumbnail.trim() && !createValidationErrors.thumbnail && (
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-3">
                      <div className="w-16 h-12 rounded bg-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-300">
                        <img
                          src={createThumbnail.trim()}
                          alt="Thumbnail preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector(
                              '.thumbnail-preview-fallback'
                            );
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div className="thumbnail-preview-fallback hidden absolute inset-0 items-center justify-center bg-slate-100 text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-medium text-slate-500 block">
                          Preview
                        </span>
                        <p className="text-xs text-slate-700 truncate">
                          {createThumbnail.trim()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Status Notice (Defaults to 'draft') */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs text-slate-600 font-medium">
                      Initial Lifecycle Status:
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    Draft (Default)
                  </span>
                </div>

                {/* 6. Syllabus Editor (Optional structured items) */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
                        <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                        <span>Syllabus Highlights</span>
                        <span className="text-slate-400 font-normal">(Optional)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Define high-level syllabus milestones (module and topic details are configured in curriculum).
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-add-syllabus-item"
                      onClick={handleAddSyllabusItem}
                      disabled={isSubmittingCreate}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  {createSyllabus.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      No syllabus milestones added. Click &quot;Add Milestone&quot; to include syllabus summary items.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {createSyllabus.map((item, index) => {
                        const titleError = createValidationErrors[`syllabus_${item.id}_title`];
                        const descError = createValidationErrors[`syllabus_${item.id}_desc`];
                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl bg-slate-50/75 border border-slate-200 space-y-2.5 relative"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Milestone #{index + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSyllabusItem(item.id)}
                                disabled={isSubmittingCreate}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                                title="Remove milestone"
                                aria-label={`Remove milestone ${index + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) =>
                                  handleUpdateSyllabusItem(item.id, 'title', e.target.value)
                                }
                                placeholder="Milestone title (e.g., Introduction to Syntax)"
                                maxLength={200}
                                disabled={isSubmittingCreate}
                                className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
                                  titleError
                                    ? 'border-rose-300 focus:ring-rose-200'
                                    : 'border-slate-300 focus:ring-primary-100 focus:border-primary-500'
                                }`}
                              />
                              {titleError && (
                                <p className="mt-1 text-[11px] text-rose-600">{titleError}</p>
                              )}
                            </div>

                            <div>
                              <textarea
                                rows={2}
                                value={item.description}
                                onChange={(e) =>
                                  handleUpdateSyllabusItem(item.id, 'description', e.target.value)
                                }
                                placeholder="Brief description of this milestone (optional, max 1000 chars)"
                                maxLength={1000}
                                disabled={isSubmittingCreate}
                                className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
                                  descError
                                    ? 'border-rose-300 focus:ring-rose-200'
                                    : 'border-slate-300 focus:ring-primary-100 focus:border-primary-500'
                                }`}
                              />
                              {descError && (
                                <p className="mt-1 text-[11px] text-rose-600">{descError}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
                <button
                  id="btn-cancel-create-course"
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={isSubmittingCreate}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Cancel
                </button>

                <button
                  id="btn-submit-create-course"
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {isSubmittingCreate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Creating Course...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Create Course</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Course Edit Accessible Modal (Step 5B) */}
      {isEditModalOpen && (
        <div
          id="edit-course-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-course-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] relative">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    id="edit-course-modal-title"
                    className="font-display font-bold text-base sm:text-lg text-slate-900"
                  >
                    Edit Course
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update core course metadata and syllabus highlights
                  </p>
                </div>
              </div>

              <button
                id="btn-close-edit-modal-header"
                type="button"
                onClick={() => handleCloseEditModal(false)}
                disabled={isSubmittingEdit}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40"
                aria-label="Close edit course modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Loading Skeleton, Error, or Form */}
            {isLoadingEditCourse ? (
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-10 bg-slate-100 rounded-lg w-full" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-24 bg-slate-100 rounded-lg w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-slate-100 rounded-lg w-full" />
                  <div className="h-10 bg-slate-100 rounded-lg w-full" />
                </div>
                <div className="h-10 bg-slate-100 rounded-lg w-full" />
                <div className="flex justify-center items-center py-6 text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2 text-primary-600" />
                  Loading authoritative course data...
                </div>
              </div>
            ) : editCourseLoadError ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Failed to Load Course</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {editCourseLoadError}
                  </p>
                </div>
                <div className="flex justify-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCloseEditModal(true)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  {editingCourseId && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(editingCourseId)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 inline-flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleEditCourseSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-left">
                  {/* General submission error banner */}
                  {editError && (
                    <div
                      id="edit-course-general-error"
                      className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs"
                      role="alert"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{editError}</span>
                    </div>
                  )}

                  {/* 1. Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="edit-course-title"
                        className="text-xs font-semibold text-slate-700 flex items-center"
                      >
                        <span>Course Title</span>
                        <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {editTitle.trim().length} / 150
                      </span>
                    </div>
                    <input
                      id="edit-course-title"
                      type="text"
                      value={editTitle}
                      onChange={(e) => {
                        setEditTitle(e.target.value);
                        if (editValidationErrors.title) {
                          setEditValidationErrors((prev) => ({ ...prev, title: '' }));
                        }
                      }}
                      placeholder="e.g., Advanced Full-Stack Web Development"
                      disabled={isSubmittingEdit}
                      maxLength={150}
                      className={`w-full px-3 py-2 rounded-lg border text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-colors ${
                        editValidationErrors.title
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                      }`}
                    />
                    {editValidationErrors.title && (
                      <p
                        id="error-edit-title"
                        className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{editValidationErrors.title}</span>
                      </p>
                    )}
                  </div>

                  {/* 2. Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="edit-course-description"
                        className="text-xs font-semibold text-slate-700 flex items-center"
                      >
                        <span>Description</span>
                        <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {editDescription.trim().length} / 5000
                      </span>
                    </div>
                    <textarea
                      id="edit-course-description"
                      rows={4}
                      value={editDescription}
                      onChange={(e) => {
                        setEditDescription(e.target.value);
                        if (editValidationErrors.description) {
                          setEditValidationErrors((prev) => ({ ...prev, description: '' }));
                        }
                      }}
                      placeholder="Provide a comprehensive course description..."
                      disabled={isSubmittingEdit}
                      maxLength={5000}
                      className={`w-full px-3 py-2 rounded-lg border text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-colors text-xs leading-relaxed ${
                        editValidationErrors.description
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                      }`}
                    />
                    {editValidationErrors.description && (
                      <p
                        id="error-edit-description"
                        className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{editValidationErrors.description}</span>
                      </p>
                    )}
                  </div>

                  {/* 3. Category & Course Creator (2 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="edit-course-category"
                          className="text-xs font-semibold text-slate-700 flex items-center"
                        >
                          <span>Category</span>
                          <span className="text-rose-500 ml-0.5">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {editCategory.trim().length} / 50
                        </span>
                      </div>
                      <input
                        id="edit-course-category"
                        type="text"
                        value={editCategory}
                        onChange={(e) => {
                          setEditCategory(e.target.value);
                          if (editValidationErrors.category) {
                            setEditValidationErrors((prev) => ({ ...prev, category: '' }));
                          }
                        }}
                        placeholder="e.g., Programming, Web Development"
                        disabled={isSubmittingEdit}
                        maxLength={50}
                        className={`w-full px-3 py-2 rounded-lg border text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-colors ${
                          editValidationErrors.category
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                      />
                      {editValidationErrors.category && (
                        <p
                          id="error-edit-category"
                          className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{editValidationErrors.category}</span>
                        </p>
                      )}
                    </div>

                    {/* Course Creator Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="edit-course-creator"
                          className="text-xs font-semibold text-slate-700 flex items-center"
                        >
                          <span>Course Creator</span>
                          <span className="text-rose-500 ml-0.5">*</span>
                        </label>
                        {isLoadingCreators && (
                          <span className="text-[11px] text-slate-400 flex items-center">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin mr-1 text-primary-600" />
                            Loading...
                          </span>
                        )}
                      </div>
                      <select
                        id="edit-course-creator"
                        value={editCreatorId}
                        onChange={(e) => {
                          setEditCreatorId(e.target.value);
                          if (editValidationErrors.courseCreator) {
                            setEditValidationErrors((prev) => ({ ...prev, courseCreator: '' }));
                          }
                        }}
                        disabled={isSubmittingEdit || isLoadingCreators}
                        className={`w-full px-3 py-2 rounded-lg border text-slate-900 bg-white focus:outline-hidden focus:ring-2 transition-colors ${
                          editValidationErrors.courseCreator
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                      >
                        <option value="">-- Select Active Creator --</option>
                        {courseCreators.map((creator) => (
                          <option key={creator.id} value={creator.id}>
                            {creator.name} ({creator.email})
                          </option>
                        ))}
                      </select>

                      {creatorsError && (
                        <p className="mt-1 text-xs text-rose-500">
                          {creatorsError}
                        </p>
                      )}

                      {!isLoadingCreators && courseCreators.length === 0 && !creatorsError && (
                        <p
                          id="no-creators-edit-notice"
                          className="mt-1 text-xs text-amber-600 flex items-center space-x-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>No active course creators available.</span>
                        </p>
                      )}

                      {editValidationErrors.courseCreator && (
                        <p
                          id="error-edit-creator"
                          className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{editValidationErrors.courseCreator}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 4. Thumbnail URL (Optional) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="edit-course-thumbnail"
                        className="text-xs font-semibold text-slate-700 flex items-center"
                      >
                        <span>Thumbnail URL</span>
                        <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {editThumbnail.trim().length} / 500
                      </span>
                    </div>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="edit-course-thumbnail"
                        type="url"
                        value={editThumbnail}
                        onChange={(e) => {
                          setEditThumbnail(e.target.value);
                          if (editValidationErrors.thumbnail) {
                            setEditValidationErrors((prev) => ({ ...prev, thumbnail: '' }));
                          }
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        disabled={isSubmittingEdit}
                        maxLength={500}
                        className={`w-full pl-9 pr-3 py-2 rounded-lg border text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-colors ${
                          editValidationErrors.thumbnail
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                            : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
                        }`}
                      />
                    </div>

                    {editValidationErrors.thumbnail && (
                      <p
                        id="error-edit-thumbnail"
                        className="mt-1 text-xs text-rose-600 flex items-center space-x-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{editValidationErrors.thumbnail}</span>
                      </p>
                    )}

                    {/* Safe Thumbnail Preview */}
                    {editThumbnail.trim() && !editValidationErrors.thumbnail && (
                      <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center space-x-3">
                        <div className="w-16 h-12 rounded bg-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-300">
                          <img
                            src={editThumbnail.trim()}
                            alt="Thumbnail preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector(
                                '.edit-thumbnail-preview-fallback'
                              );
                              if (fallback) {
                                (fallback as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                          <div className="edit-thumbnail-preview-fallback hidden absolute inset-0 items-center justify-center bg-slate-100 text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Preview
                          </span>
                          <p className="text-xs text-slate-700 truncate">
                            {editThumbnail.trim()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. Status Notice (Informational only, managed authoritatively in Step 4) */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-700 font-medium">
                          Lifecycle Status (Informational):
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Status transitions are managed via the dedicated confirmation workflow.
                        </p>
                      </div>
                    </div>
                    <div>
                      {renderStatusBadge(editStatus)}
                    </div>
                  </div>

                  {/* 6. Syllabus Highlights Editor (with Reorder, Edit, Add, Remove) */}
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
                          <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                          <span>Syllabus Highlights</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Adjust milestone titles, descriptions, order, or add/remove entries.
                        </p>
                      </div>

                      <button
                        type="button"
                        id="btn-edit-add-syllabus-item"
                        onClick={handleAddEditSyllabusItem}
                        disabled={isSubmittingEdit}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add Milestone</span>
                      </button>
                    </div>

                    {editSyllabus.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        No syllabus milestones recorded. Click &quot;Add Milestone&quot; to include syllabus summary items.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editSyllabus.map((item, index) => {
                          const titleError = editValidationErrors[`syllabus_${item.id}_title`];
                          const descError = editValidationErrors[`syllabus_${item.id}_desc`];
                          return (
                            <div
                              key={item.id}
                              className="p-3.5 rounded-xl bg-slate-50/75 border border-slate-200 space-y-2.5 relative"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  Milestone #{index + 1}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {/* Reorder Up */}
                                  <button
                                    type="button"
                                    onClick={() => handleMoveEditSyllabusItem(index, 'up')}
                                    disabled={index === 0 || isSubmittingEdit}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move milestone up"
                                    aria-label={`Move milestone ${index + 1} up`}
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Reorder Down */}
                                  <button
                                    type="button"
                                    onClick={() => handleMoveEditSyllabusItem(index, 'down')}
                                    disabled={index === editSyllabus.length - 1 || isSubmittingEdit}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move milestone down"
                                    aria-label={`Move milestone ${index + 1} down`}
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Remove */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditSyllabusItem(item.id)}
                                    disabled={isSubmittingEdit}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                                    title="Remove milestone"
                                    aria-label={`Remove milestone ${index + 1}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) =>
                                    handleUpdateEditSyllabusItem(item.id, 'title', e.target.value)
                                  }
                                  placeholder="Milestone title (e.g., Introduction to Syntax)"
                                  maxLength={200}
                                  disabled={isSubmittingEdit}
                                  className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
                                    titleError
                                      ? 'border-rose-300 focus:ring-rose-200'
                                      : 'border-slate-300 focus:ring-primary-100 focus:border-primary-500'
                                  }`}
                                />
                                {titleError && (
                                  <p className="mt-1 text-[11px] text-rose-600 flex items-center space-x-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    <span>{titleError}</span>
                                  </p>
                                )}
                              </div>

                              <div>
                                <textarea
                                  rows={2}
                                  value={item.description}
                                  onChange={(e) =>
                                    handleUpdateEditSyllabusItem(item.id, 'description', e.target.value)
                                  }
                                  placeholder="Brief summary of topics or objectives covered (optional)..."
                                  maxLength={1000}
                                  disabled={isSubmittingEdit}
                                  className={`w-full px-3 py-1.5 rounded-lg border text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 leading-relaxed ${
                                    descError
                                      ? 'border-rose-300 focus:ring-rose-200'
                                      : 'border-slate-300 focus:ring-primary-100 focus:border-primary-500'
                                  }`}
                                />
                                {descError && (
                                  <p className="mt-1 text-[11px] text-rose-600 flex items-center space-x-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    <span>{descError}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    {isEditFormDirty() && (
                      <span className="text-amber-600 font-medium flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 shrink-0" />
                        Unsaved modifications
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <button
                      id="btn-cancel-edit-course"
                      type="button"
                      onClick={() => handleCloseEditModal(false)}
                      disabled={isSubmittingEdit}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      Cancel
                    </button>

                    <button
                      id="btn-submit-edit-course"
                      type="submit"
                      disabled={isSubmittingEdit}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      {isSubmittingEdit ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* In-Modal Confirmation Overlay Before Discarding Unsaved Changes */}
            {showDiscardConfirm && (
              <div
                id="edit-course-discard-dialog"
                className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 rounded-2xl"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="discard-changes-title"
                aria-describedby="discard-changes-desc"
              >
                <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl border border-slate-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 id="discard-changes-title" className="text-sm font-bold text-slate-900">
                      Discard Unsaved Changes?
                    </h4>
                    <p id="discard-changes-desc" className="text-xs text-slate-500 mt-1">
                      You have modified course details that haven&apos;t been saved. Are you sure you want to close without saving?
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDiscardConfirm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                    >
                      Keep Editing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCloseEditModal(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-2xs"
                    >
                      Discard &amp; Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
