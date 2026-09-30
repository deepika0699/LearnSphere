/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from '../types';

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  user: AuthUserResponse;
}

export interface ApiError {
  error?: string;
  message: string;
  statusCode?: number;
}

/**
 * Base API client with secure defaults:
 * - sends credentials: 'include' for secure HttpOnly cookie communication
 * - injects Authorization: Bearer header when access token is provided in memory
 * - safely extracts backend error messages
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly refreshToken cookie is transmitted
  });

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.errors?.[0]?.message ||
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    const error: ApiError = {
      message: errorMessage,
      error: data?.error,
      statusCode: response.status,
    };
    throw error;
  }

  return data;
}

export const authApi = {
  /**
   * POST /api/auth/login
   */
  async login(credentials: { email: string; password: string }): Promise<AuthLoginResponse> {
    const res = await apiRequest<{ status: string; data: AuthLoginResponse }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
    return res.data;
  },

  /**
   * POST /api/auth/register (Student only)
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: AuthUserResponse }> {
    const res = await apiRequest<{ status: string; data: { user: AuthUserResponse } }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    return res.data;
  },

  /**
   * POST /api/auth/refresh
   * Exchanges HttpOnly refreshToken cookie for a rotated access token & user profile
   */
  async refresh(): Promise<AuthLoginResponse> {
    const res = await apiRequest<{ status: string; data: AuthLoginResponse }>(
      '/api/auth/refresh',
      {
        method: 'POST',
      }
    );
    return res.data;
  },

  /**
   * GET /api/auth/me
   * Fetches the current authoritative user using the memory-held access token
   */
  async getMe(accessToken: string): Promise<AuthUserResponse> {
    const res = await apiRequest<{ status: string; data: { user: AuthUserResponse } }>(
      '/api/auth/me',
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data.user;
  },

  /**
   * POST /api/auth/logout
   * Informs backend to revoke refresh session and clear the HttpOnly cookie
   */
  async logout(): Promise<void> {
    await apiRequest<{ status: string; message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  },
};

/**
 * Admin Dashboard statistics response interface
 * Directly maps to GET /api/admin/dashboard MongoDB aggregation
 */
export interface AdminDashboardUsers {
  total: number;
  students: number;
  courseCreators: number;
  admins: number;
}

export interface AdminDashboardData {
  users: AdminDashboardUsers;
}

/**
 * Admin User Model Interface
 * Mapped to sanitized User record from MongoDB
 */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'courseCreator' | 'admin';
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersPagination {
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminUsersListResponse {
  users: AdminUser[];
  pagination: AdminUsersPagination;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'student' | 'courseCreator' | 'admin' | '';
  status?: 'active' | 'inactive' | '';
}

/**
 * Course lifecycle status strictly enforced by backend
 */
export type CourseStatus = 'draft' | 'published' | 'archived';

/**
 * Public Course Creator profile returned in course responses
 * Excludes sensitive fields (passwords, tokens, hashes)
 */
export interface AdminCourseCreator {
  id: string;
  name?: string;
  email?: string;
}

/**
 * Syllabus item representation in course documents
 */
export interface AdminCourseSyllabusItem {
  id: string;
  title: string;
  description?: string;
  order?: number;
}

/**
 * Admin Course Model Interface
 * Mapped to sanitized Course record from MongoDB
 */
export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  courseCreator: AdminCourseCreator | null;
  thumbnail?: string;
  syllabus?: AdminCourseSyllabusItem[];
  status: CourseStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Pagination metadata returned by GET /api/admin/courses
 */
export interface AdminCoursePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Response payload structure for GET /api/admin/courses
 */
export interface AdminCoursesResponse {
  courses: AdminCourse[];
  pagination: AdminCoursePagination;
}

export interface CreateAdminCourseSyllabusItem {
  title: string;
  description?: string;
  order?: number;
}

export interface CreateAdminCourseRequest {
  title: string;
  description: string;
  category: string;
  courseCreator: string;
  thumbnail?: string;
  syllabus?: CreateAdminCourseSyllabusItem[];
  status?: CourseStatus;
}

export interface UpdateAdminCourseSyllabusItem {
  id?: string;
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateAdminCourseRequest {
  title?: string;
  description?: string;
  category?: string;
  courseCreator?: string;
  thumbnail?: string;
  syllabus?: UpdateAdminCourseSyllabusItem[];
}

/**
 * Query parameters supported by GET /api/admin/courses
 */
export interface GetAdminCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatus | '';
  category?: string;
}

/**
 * Nested topic structure in course hierarchy
 */
export interface AdminCourseStructureTopic {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  content?: {
    explanation?: string;
    sections?: Array<{
      heading: string;
      body: string;
      order: number;
    }>;
  };
  images?: Array<{
    id?: string;
    url: string;
    caption?: string;
    altText?: string;
  }>;
  codeExamples?: Array<{
    id?: string;
    title?: string;
    language?: string;
    code: string;
    explanation?: string;
  }>;
  importantPoints?: string[];
  videos?: {
    english?: string | null;
    telugu?: string | null;
    hindi?: string | null;
  };
}

/**
 * Nested module structure in course hierarchy
 */
export interface AdminCourseStructureModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  topics: AdminCourseStructureTopic[];
}

/**
 * Admin Module record scoped to a course
 */
export interface AdminModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminModuleRequest {
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateAdminModuleRequest {
  title?: string;
  description?: string;
  order?: number;
}

export interface ReorderAdminModulesRequest {
  moduleIds: string[];
}

/**
 * Admin Topic Code Example structure
 */
export interface AdminTopicCodeExample {
  id?: string;
  title?: string;
  language?: string;
  code: string;
  explanation?: string;
}

/**
 * Admin Topic Image structure
 */
export interface AdminTopicImage {
  id?: string;
  url: string;
  caption?: string;
  altText?: string;
}

/**
 * Admin Topic record scoped to a course and module
 */
export interface AdminTopic {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  content?: {
    explanation?: string;
    sections?: Array<{
      heading: string;
      body: string;
      order: number;
    }>;
  };
  images?: AdminTopicImage[];
  codeExamples?: AdminTopicCodeExample[];
  importantPoints?: string[];
  videos?: {
    english?: string | null;
    telugu?: string | null;
    hindi?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminTopicRequest {
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateAdminTopicRequest {
  title?: string;
  description?: string;
  order?: number;
  content?: string | {
    explanation?: string;
    sections?: Array<{
      heading: string;
      body: string;
      order: number;
    }>;
  };
  images?: AdminTopicImage[];
  codeExamples?: AdminTopicCodeExample[];
  importantPoints?: string[];
  videos?: {
    english?: string | null;
    telugu?: string | null;
    hindi?: string | null;
  };
}

/**
 * Complete course structure payload for GET /api/admin/courses/:id/structure
 */
export interface AdminCourseStructureResponse {
  course: AdminCourse;
  modules: AdminCourseStructureModule[];
}

/**
 * ============================================================================
 * ASSESSMENT AUTHORING TYPES (Course Creator & Admin)
 * ============================================================================
 */

export type AssessmentStatus = 'draft' | 'published' | 'archived';

export interface AssessmentAuthorOption {
  id?: string;
  _id?: string;
  text: string;
  order: number;
}

export interface AssessmentAuthorQuestion {
  id?: string;
  _id?: string;
  prompt: string;
  codeSnippet?: string;
  order: number;
  options: AssessmentAuthorOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface AssessmentAuthorData {
  id: string;
  title: string;
  description: string;
  courseId: string;
  type: 'topic' | 'course';
  moduleId: string | null;
  topicId: string | null;
  status: AssessmentStatus;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  questionsCount: number;
  questions: AssessmentAuthorQuestion[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssessmentPayload {
  title: string;
  description?: string;
  type: 'topic' | 'course';
  moduleId?: string | null;
  topicId?: string | null;
  status?: AssessmentStatus;
  passingScore?: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  questions?: AssessmentAuthorQuestion[];
}

export interface UpdateAssessmentPayload {
  title?: string;
  description?: string;
  type?: 'topic' | 'course';
  moduleId?: string | null;
  topicId?: string | null;
  status?: AssessmentStatus;
  passingScore?: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  questions?: AssessmentAuthorQuestion[];
}

export interface DeleteAssessmentResponse {
  id: string;
  deleted?: boolean;
  status?: string;
  message: string;
}

export interface AdminAssessmentStats {
  totalAttempts: number;
  completedAttempts: number;
  timedOutAttempts: number;
  passCount: number;
  failCount: number;
  passRate: number;
  averageScore: number;
}

/**
 * Admin API service client
 * Requires short-lived access token held in memory
 */
export const adminApi = {
  /**
   * GET /api/admin/dashboard
   * Fetches real user role aggregations from MongoDB
   */
  async getDashboard(accessToken: string): Promise<AdminDashboardData> {
    const res = await apiRequest<{ status: string; data: AdminDashboardData }>(
      '/api/admin/dashboard',
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * GET /api/admin/users
   * Fetches paginated user records from MongoDB with optional search and filters
   */
  async getUsers(
    accessToken: string,
    params?: GetUsersParams
  ): Promise<AdminUsersListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search && params.search.trim()) searchParams.set('search', params.search.trim());
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/admin/users?${queryString}` : '/api/admin/users';

    const res = await apiRequest<{ status: string; data: AdminUsersListResponse }>(
      endpoint,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * GET /api/admin/users/:id
   * Fetches single user record by MongoDB ObjectId
   */
  async getUserById(accessToken: string, id: string): Promise<AdminUser> {
    const res = await apiRequest<{ status: string; data: { user: AdminUser } }>(
      `/api/admin/users/${encodeURIComponent(id)}`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data.user;
  },

  /**
   * PATCH /api/admin/users/:id/role
   * Updates user role with server-side validation and self-demotion protection
   */
  async updateUserRole(
    accessToken: string,
    id: string,
    role: 'student' | 'courseCreator' | 'admin'
  ): Promise<AdminUser> {
    const res = await apiRequest<{ status: string; message: string; data: { user: AdminUser } }>(
      `/api/admin/users/${encodeURIComponent(id)}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
      accessToken
    );
    return res.data.user;
  },

  /**
   * PATCH /api/admin/users/:id/status
   * Updates user account status (active/inactive) and invalidates refresh sessions upon deactivation
   */
  async updateUserStatus(
    accessToken: string,
    id: string,
    status: 'active' | 'inactive'
  ): Promise<AdminUser> {
    const res = await apiRequest<{ status: string; message: string; data: { user: AdminUser } }>(
      `/api/admin/users/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      accessToken
    );
    return res.data.user;
  },

  /**
   * GET /api/admin/courses
   * Fetches paginated and filtered course records from MongoDB
   */
  async getCourses(
    accessToken: string,
    params?: GetAdminCoursesParams
  ): Promise<AdminCoursesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search && params.search.trim()) {
      searchParams.set('search', params.search.trim());
    }
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category && params.category.trim()) {
      searchParams.set('category', params.category.trim());
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/admin/courses?${queryString}` : '/api/admin/courses';

    const res = await apiRequest<{ status: string; data: AdminCoursesResponse }>(
      endpoint,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * GET /api/admin/courses/:id
   * Fetches single course record by MongoDB ObjectId
   */
  async getCourseById(accessToken: string, id: string): Promise<AdminCourse> {
    const res = await apiRequest<{ status: string; data: { course: AdminCourse } }>(
      `/api/admin/courses/${encodeURIComponent(id)}`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data.course;
  },

  /**
   * GET /api/admin/courses/:id/structure
   * Fetches complete course hierarchy: Course -> Modules -> Topics
   */
  async getCourseStructure(
    accessToken: string,
    id: string
  ): Promise<AdminCourseStructureResponse> {
    const res = await apiRequest<{ status: string; data: AdminCourseStructureResponse }>(
      `/api/admin/courses/${encodeURIComponent(id)}/structure`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * PATCH /api/admin/courses/:id/status
   * Updates course lifecycle status ('draft' | 'published' | 'archived')
   */
  async updateCourseStatus(
    accessToken: string,
    id: string,
    status: CourseStatus
  ): Promise<AdminCourse> {
    const res = await apiRequest<{ status: string; message: string; data: { course: AdminCourse } }>(
      `/api/admin/courses/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      accessToken
    );
    return res.data.course;
  },

  /**
   * POST /api/admin/courses
   * Creates a new course under administrative control
   */
  async createCourse(
    accessToken: string,
    payload: CreateAdminCourseRequest
  ): Promise<AdminCourse> {
    const res = await apiRequest<{ status: string; message: string; data: { course: AdminCourse } }>(
      '/api/admin/courses',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.course;
  },

  /**
   * PATCH /api/admin/courses/:id
   * Updates an existing course record (title, description, category, creator, thumbnail, syllabus)
   */
  async updateCourse(
    accessToken: string,
    id: string,
    payload: UpdateAdminCourseRequest
  ): Promise<AdminCourse> {
    const res = await apiRequest<{ status: string; message: string; data: { course: AdminCourse } }>(
      `/api/admin/courses/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.course;
  },

  /**
   * GET /api/admin/courses/:courseId/modules
   * Fetches all modules for a specific course
   */
  async getCourseModules(
    accessToken: string,
    courseId: string
  ): Promise<AdminModule[]> {
    const res = await apiRequest<{ status: string; data: { modules: AdminModule[] } }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules`,
      { method: 'GET' },
      accessToken
    );
    return res.data.modules;
  },

  /**
   * GET /api/admin/courses/:courseId/modules/:moduleId
   * Retrieves a single module scoped to a course
   */
  async getModule(
    accessToken: string,
    courseId: string,
    moduleId: string
  ): Promise<AdminModule> {
    const res = await apiRequest<{ status: string; data: { module: AdminModule } }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
      { method: 'GET' },
      accessToken
    );
    return res.data.module;
  },

  /**
   * POST /api/admin/courses/:courseId/modules
   * Creates a new module for a course
   */
  async createModule(
    accessToken: string,
    courseId: string,
    payload: CreateAdminModuleRequest
  ): Promise<AdminModule> {
    const res = await apiRequest<{ status: string; message: string; data: { module: AdminModule } }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.module;
  },

  /**
   * PATCH /api/admin/courses/:courseId/modules/:moduleId
   * Updates an existing module
   */
  async updateModule(
    accessToken: string,
    courseId: string,
    moduleId: string,
    payload: UpdateAdminModuleRequest
  ): Promise<AdminModule> {
    const res = await apiRequest<{ status: string; message: string; data: { module: AdminModule } }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.module;
  },

  /**
   * DELETE /api/admin/courses/:courseId/modules/:moduleId
   * Deletes a module and cascades to child topics
   */
  async deleteModule(
    accessToken: string,
    courseId: string,
    moduleId: string
  ): Promise<{ deleted: boolean; deletedModuleId: string }> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { deleted: boolean; deletedModuleId: string };
    }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
      { method: 'DELETE' },
      accessToken
    );
    return res.data;
  },

  /**
   * PATCH /api/admin/courses/:courseId/modules/reorder
   * Reorders modules for a specific course sequentially
   */
  async reorderModules(
    accessToken: string,
    courseId: string,
    moduleIds: string[]
  ): Promise<AdminModule[]> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { modules: AdminModule[] };
    }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/reorder`,
      {
        method: 'PATCH',
        body: JSON.stringify({ moduleIds }),
      },
      accessToken
    );
    return res.data.modules;
  },

  /**
   * GET /api/admin/courses/:courseId/modules/:moduleId/topics
   * Fetches all topics for a specific module under a course
   */
  async getModuleTopics(
    accessToken: string,
    courseId: string,
    moduleId: string
  ): Promise<AdminTopic[]> {
    const res = await apiRequest<{ status: string; data: { topics: AdminTopic[] } }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics`,
      { method: 'GET' },
      accessToken
    );
    return res.data.topics;
  },

  /**
   * GET /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
   * Retrieves a single topic scoped to course and module
   */
  async getTopic(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicId: string
  ): Promise<AdminTopic> {
    const res = await apiRequest<{ status: string; data: { topic: AdminTopic } }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}`,
      { method: 'GET' },
      accessToken
    );
    return res.data.topic;
  },

  /**
   * POST /api/admin/courses/:courseId/modules/:moduleId/topics
   * Creates a new topic under a module
   */
  async createTopic(
    accessToken: string,
    courseId: string,
    moduleId: string,
    payload: CreateAdminTopicRequest
  ): Promise<AdminTopic> {
    const res = await apiRequest<{ status: string; message: string; data: { topic: AdminTopic } }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.topic;
  },

  /**
   * PATCH /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
   * Updates an existing topic
   */
  async updateTopic(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicId: string,
    payload: UpdateAdminTopicRequest
  ): Promise<AdminTopic> {
    const res = await apiRequest<{ status: string; message: string; data: { topic: AdminTopic } }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.topic;
  },

  /**
   * DELETE /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
   * Deletes a topic scoped strictly to course and module
   */
  async deleteTopic(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicId: string
  ): Promise<{ deleted: boolean; deletedTopicId: string }> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { deleted: boolean; deletedTopicId: string };
    }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}`,
      { method: 'DELETE' },
      accessToken
    );
    return res.data;
  },

  /**
   * PATCH /api/admin/courses/:courseId/modules/:moduleId/topics/reorder
   * Reorders topics within a module under a course
   */
  async reorderTopics(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicIds: string[]
  ): Promise<AdminTopic[]> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { topics: AdminTopic[] };
    }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/reorder`,
      {
        method: 'PATCH',
        body: JSON.stringify({ topicIds }),
      },
      accessToken
    );
    return res.data.topics;
  },

  /**
   * GET /api/admin/courses/:courseId/assessments
   * Fetches all assessments for any course
   */
  async getCourseAssessments(
    accessToken: string,
    courseId: string
  ): Promise<AssessmentAuthorData[]> {
    const res = await apiRequest<{
      status: string;
      data: { assessments: AssessmentAuthorData[] };
    }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/assessments`,
      { method: 'GET' },
      accessToken
    );
    return res.data.assessments;
  },

  /**
   * GET /api/admin/assessments/:assessmentId
   * Fetches single assessment details by ID as admin
   */
  async getAssessmentById(
    accessToken: string,
    assessmentId: string
  ): Promise<AssessmentAuthorData> {
    const res = await apiRequest<{
      status: string;
      data: { assessment: AssessmentAuthorData };
    }>(
      `/api/admin/assessments/${encodeURIComponent(assessmentId)}`,
      { method: 'GET' },
      accessToken
    );
    return res.data.assessment;
  },

  /**
   * POST /api/admin/courses/:courseId/assessments
   * Admin creates an assessment for any course
   */
  async createAssessment(
    accessToken: string,
    courseId: string,
    payload: CreateAssessmentPayload
  ): Promise<AssessmentAuthorData> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { assessment: AssessmentAuthorData };
    }>(
      `/api/admin/courses/${encodeURIComponent(courseId)}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.assessment;
  },

  /**
   * PUT /api/admin/assessments/:assessmentId
   * Admin updates an assessment
   */
  async updateAssessment(
    accessToken: string,
    assessmentId: string,
    payload: UpdateAssessmentPayload
  ): Promise<AssessmentAuthorData> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { assessment: AssessmentAuthorData };
    }>(
      `/api/admin/assessments/${encodeURIComponent(assessmentId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.assessment;
  },

  /**
   * DELETE /api/admin/assessments/:assessmentId
   * Admin deletes or archives an assessment
   */
  async deleteAssessment(
    accessToken: string,
    assessmentId: string
  ): Promise<DeleteAssessmentResponse> {
    const res = await apiRequest<{
      status: string;
      data: DeleteAssessmentResponse;
    }>(
      `/api/admin/assessments/${encodeURIComponent(assessmentId)}`,
      {
        method: 'DELETE',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * GET /api/admin/assessments/:assessmentId/stats
   * Admin gets aggregate statistics for an assessment
   */
  async getAssessmentStats(
    accessToken: string,
    assessmentId: string
  ): Promise<AdminAssessmentStats> {
    const res = await apiRequest<{
      status: string;
      data: { stats: AdminAssessmentStats };
    }>(
      `/api/admin/assessments/${encodeURIComponent(assessmentId)}/stats`,
      { method: 'GET' },
      accessToken
    );
    return res.data.stats;
  },
};

/**
 * ============================================================================
 * COURSE CREATOR API SERVICE & TYPES
 * ============================================================================
 */

export interface CourseCreatorProfile {
  id: string;
  name?: string;
  email?: string;
}

export interface CourseCreatorSyllabusItem {
  id?: string;
  title: string;
  description?: string;
  order?: number;
}

export interface CourseCreatorCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  syllabus?: CourseCreatorSyllabusItem[];
  courseCreator: CourseCreatorProfile | null;
  status: CourseStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseCreatorPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CourseCreatorCoursesResponse {
  courses: CourseCreatorCourse[];
  pagination: CourseCreatorPagination;
}

export interface GetCourseCreatorCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatus | '';
  category?: string;
}

export interface CreateCourseCreatorCourseRequest {
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  syllabus?: Array<{
    title: string;
    description?: string;
    order?: number;
  }>;
}

export interface UpdateCourseCreatorCourseRequest {
  title?: string;
  description?: string;
  category?: string;
  thumbnail?: string;
  syllabus?: Array<{
    title: string;
    description?: string;
    order?: number;
  }>;
}

/**
 * Course Creator Module record scoped to a course
 */
export interface CourseCreatorModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseCreatorModuleRequest {
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateCourseCreatorModuleRequest {
  title?: string;
  description?: string;
  order?: number;
}

export interface ReorderCourseCreatorModulesRequest {
  moduleIds: string[];
}

export interface DeleteCourseCreatorModuleResponse {
  deleted: boolean;
  deletedModuleId: string;
}

/**
 * Course Creator Topic record scoped to a module and course
 */
export interface CourseCreatorTopic {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  content?: {
    explanation?: string;
    sections?: Array<{
      id?: string;
      heading: string;
      body: string;
      order: number;
    }>;
  };
  images?: Array<{
    id?: string;
    url: string;
    caption?: string;
    altText?: string;
  }>;
  codeExamples?: Array<{
    id?: string;
    title: string;
    language: string;
    code: string;
    explanation?: string;
  }>;
  importantPoints?: string[];
  revisionPoints?: string[];
  videos?: {
    english?: string | null;
    telugu?: string | null;
    hindi?: string | null;
  };
  externalReferences?: Array<{
    id?: string;
    title: string;
    url: string;
    source?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseCreatorTopicRequest {
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateCourseCreatorTopicRequest {
  title?: string;
  description?: string;
  order?: number;
}

export interface ReorderCourseCreatorTopicsRequest {
  topicIds: string[];
}

export interface DeleteCourseCreatorTopicResponse {
  deleted: boolean;
  deletedTopicId: string;
}

export interface CourseCreatorTopicContentSection {
  id?: string;
  heading: string;
  body: string;
  order: number;
}

export interface CourseCreatorTopicImage {
  id?: string;
  url: string;
  caption?: string;
  altText?: string;
}

export interface CourseCreatorTopicCodeExample {
  id?: string;
  title?: string;
  language: string;
  code: string;
  explanation?: string;
}

export interface CourseCreatorTopicVideos {
  english?: string | null;
  telugu?: string | null;
  hindi?: string | null;
}

export interface CourseCreatorTopicExternalReference {
  id?: string;
  title: string;
  url: string;
  source?: string;
}

export interface CourseCreatorTopicContentData {
  topicId: string;
  moduleId: string;
  courseId: string;
  title: string;
  content: {
    explanation: string;
    sections: CourseCreatorTopicContentSection[];
  };
  images: CourseCreatorTopicImage[];
  codeExamples: CourseCreatorTopicCodeExample[];
  importantPoints: string[];
  revisionPoints?: string[];
  videos?: CourseCreatorTopicVideos;
  externalReferences?: CourseCreatorTopicExternalReference[];
  references?: CourseCreatorTopicExternalReference[];
  updatedAt?: string;
}

export interface UpdateCourseCreatorTopicContentRequest {
  content?: {
    explanation?: string;
    sections?: CourseCreatorTopicContentSection[];
  };
  images?: CourseCreatorTopicImage[];
  codeExamples?: CourseCreatorTopicCodeExample[];
  importantPoints?: string[];
  revisionPoints?: string[];
  videos?: CourseCreatorTopicVideos;
  externalReferences?: CourseCreatorTopicExternalReference[];
  references?: CourseCreatorTopicExternalReference[];
}

export const courseCreatorApi = {
  /**
   * GET /api/creator/courses
   * Fetches paginated & filtered courses owned by the authenticated Course Creator
   */
  async getCourses(
    accessToken: string,
    params: GetCourseCreatorCoursesParams = {}
  ): Promise<CourseCreatorCoursesResponse> {
    const queryParts: string[] = [];

    if (params.page !== undefined) {
      queryParts.push(`page=${encodeURIComponent(params.page)}`);
    }
    if (params.limit !== undefined) {
      queryParts.push(`limit=${encodeURIComponent(params.limit)}`);
    }
    if (params.search && params.search.trim()) {
      queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
    }
    if (params.status) {
      queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (params.category && params.category.trim()) {
      queryParts.push(`category=${encodeURIComponent(params.category.trim())}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const res = await apiRequest<{
      status: string;
      data: CourseCreatorCoursesResponse;
    }>(`/api/creator/courses${queryString}`, { method: 'GET' }, accessToken);

    return res.data;
  },

  /**
   * GET /api/creator/courses/:courseId
   * Retrieves a single course owned by the authenticated Course Creator
   */
  async getCourseById(
    accessToken: string,
    courseId: string
  ): Promise<CourseCreatorCourse> {
    const res = await apiRequest<{
      status: string;
      data: { course: CourseCreatorCourse };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}`,
      { method: 'GET' },
      accessToken
    );
    return res.data.course;
  },

  /**
   * POST /api/creator/courses
   * Creates a new course owned by the authenticated Course Creator (draft lifecycle)
   */
  async createCourse(
    accessToken: string,
    payload: CreateCourseCreatorCourseRequest
  ): Promise<CourseCreatorCourse> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { course: CourseCreatorCourse };
    }>(
      '/api/creator/courses',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.course;
  },

  /**
   * PATCH /api/creator/courses/:courseId
   * Updates an existing course owned by the authenticated Course Creator
   */
  async updateCourse(
    accessToken: string,
    courseId: string,
    payload: UpdateCourseCreatorCourseRequest
  ): Promise<CourseCreatorCourse> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { course: CourseCreatorCourse };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.course;
  },

  /**
   * GET /api/creator/courses/:courseId/modules
   * Retrieves all modules for the authenticated Course Creator's course
   */
  async getModules(
    accessToken: string,
    courseId: string
  ): Promise<CourseCreatorModule[]> {
    const res = await apiRequest<{
      status: string;
      data: { modules: CourseCreatorModule[] };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules`,
      { method: 'GET' },
      accessToken
    );
    return res.data.modules;
  },

  /**
   * GET /api/creator/courses/:courseId/modules/:moduleId
   * Retrieves a single module strictly belonging to the creator's course
   */
  async getModuleById(
    accessToken: string,
    courseId: string,
    moduleId: string
  ): Promise<CourseCreatorModule> {
    const res = await apiRequest<{
      status: string;
      data: { module: CourseCreatorModule };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
      { method: 'GET' },
      accessToken
    );
    return res.data.module;
  },

  /**
   * POST /api/creator/courses/:courseId/modules
   * Creates a new module under the authenticated Course Creator's course
   */
  async createModule(
    accessToken: string,
    courseId: string,
    payload: CreateCourseCreatorModuleRequest
  ): Promise<CourseCreatorModule> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { module: CourseCreatorModule };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.module;
  },

  /**
   * PATCH /api/creator/courses/:courseId/modules/:moduleId
   * Updates an existing module strictly belonging to the creator's course
   */
  async updateModule(
    accessToken: string,
    courseId: string,
    moduleId: string,
    payload: UpdateCourseCreatorModuleRequest
  ): Promise<CourseCreatorModule> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { module: CourseCreatorModule };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.module;
  },

  /**
   * DELETE /api/creator/courses/:courseId/modules/:moduleId
   * Deletes a module and its child topics strictly within the creator's course
   */
  async deleteModule(
    accessToken: string,
    courseId: string,
    moduleId: string
  ): Promise<DeleteCourseCreatorModuleResponse> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: DeleteCourseCreatorModuleResponse;
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
      {
        method: 'DELETE',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * PATCH /api/creator/courses/:courseId/modules/reorder
   * Reorders modules in creator's course by providing complete ordered array of module IDs
   */
  async reorderModules(
    accessToken: string,
    courseId: string,
    moduleIds: string[]
  ): Promise<CourseCreatorModule[]> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { modules: CourseCreatorModule[] };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/reorder`,
      {
        method: 'PATCH',
        body: JSON.stringify({ moduleIds }),
      },
      accessToken
    );
    return res.data.modules;
  },

  /**
   * GET /api/creator/courses/:courseId/modules/:moduleId/topics
   * Retrieves all topics for a module in the authenticated Course Creator's course
   */
  async getTopics(
    accessToken: string,
    courseId: string,
    moduleId: string
  ): Promise<CourseCreatorTopic[]> {
    const res = await apiRequest<{
      status: string;
      data: { topics: CourseCreatorTopic[] };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics`,
      { method: 'GET' },
      accessToken
    );
    return res.data.topics;
  },

  /**
   * GET /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId
   * Retrieves a single topic scoped strictly to the module and course
   */
  async getTopicById(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicId: string
  ): Promise<CourseCreatorTopic> {
    const res = await apiRequest<{
      status: string;
      data: { topic: CourseCreatorTopic };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}`,
      { method: 'GET' },
      accessToken
    );
    return res.data.topic;
  },

  /**
   * POST /api/creator/courses/:courseId/modules/:moduleId/topics
   * Creates a new topic under a module in the authenticated Course Creator's course
   */
  async createTopic(
    accessToken: string,
    courseId: string,
    moduleId: string,
    payload: CreateCourseCreatorTopicRequest
  ): Promise<CourseCreatorTopic> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { topic: CourseCreatorTopic };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.topic;
  },

  /**
   * PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId
   * Updates an existing topic metadata strictly belonging to the creator's module and course
   */
  async updateTopic(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicId: string,
    payload: UpdateCourseCreatorTopicRequest
  ): Promise<CourseCreatorTopic> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { topic: CourseCreatorTopic };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.topic;
  },

  /**
   * DELETE /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId
   * Deletes a topic strictly within the creator's module and course
   */
  async deleteTopic(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicId: string
  ): Promise<DeleteCourseCreatorTopicResponse> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: DeleteCourseCreatorTopicResponse;
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}`,
      {
        method: 'DELETE',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/reorder
   * Reorders topics in creator's module by providing complete ordered array of topic IDs
   */
  async reorderTopics(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicIds: string[]
  ): Promise<CourseCreatorTopic[]> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { topics: CourseCreatorTopic[] };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/reorder`,
      {
        method: 'PATCH',
        body: JSON.stringify({ topicIds }),
      },
      accessToken
    );
    return res.data.topics;
  },

  /**
   * GET /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content
   * Retrieves educational content for a verified topic within the creator's module and course
   */
  async getTopicContent(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicId: string
  ): Promise<CourseCreatorTopicContentData> {
    const res = await apiRequest<{
      status: string;
      data: { content: CourseCreatorTopicContentData };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}/content`,
      { method: 'GET' },
      accessToken
    );
    return res.data.content;
  },

  /**
   * PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content
   * Updates educational content for a verified topic within the creator's module and course
   */
  async updateTopicContent(
    accessToken: string,
    courseId: string,
    moduleId: string,
    topicId: string,
    payload: UpdateCourseCreatorTopicContentRequest
  ): Promise<CourseCreatorTopicContentData> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { content: CourseCreatorTopicContentData };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}/content`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.content;
  },

  /**
   * GET /api/creator/courses/:courseId/assessments
   * Retrieves all assessments for the creator's course
   */
  async getAssessments(
    accessToken: string,
    courseId: string
  ): Promise<AssessmentAuthorData[]> {
    const res = await apiRequest<{
      status: string;
      data: { assessments: AssessmentAuthorData[] };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/assessments`,
      { method: 'GET' },
      accessToken
    );
    return res.data.assessments;
  },

  /**
   * GET /api/creator/courses/:courseId/assessments/:assessmentId
   * Retrieves single assessment with full authoring details
   */
  async getAssessmentById(
    accessToken: string,
    courseId: string,
    assessmentId: string
  ): Promise<AssessmentAuthorData> {
    const res = await apiRequest<{
      status: string;
      data: { assessment: AssessmentAuthorData };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}`,
      { method: 'GET' },
      accessToken
    );
    return res.data.assessment;
  },

  /**
   * POST /api/creator/courses/:courseId/assessments
   * Creates a new assessment under the creator's course
   */
  async createAssessment(
    accessToken: string,
    courseId: string,
    payload: CreateAssessmentPayload
  ): Promise<AssessmentAuthorData> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { assessment: AssessmentAuthorData };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.assessment;
  },

  /**
   * PUT /api/creator/courses/:courseId/assessments/:assessmentId
   * Updates an existing assessment under the creator's course
   */
  async updateAssessment(
    accessToken: string,
    courseId: string,
    assessmentId: string,
    payload: UpdateAssessmentPayload
  ): Promise<AssessmentAuthorData> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { assessment: AssessmentAuthorData };
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.assessment;
  },

  /**
   * DELETE /api/creator/courses/:courseId/assessments/:assessmentId
   * Deletes or archives assessment (archives if student attempts exist)
   */
  async deleteAssessment(
    accessToken: string,
    courseId: string,
    assessmentId: string
  ): Promise<DeleteAssessmentResponse> {
    const res = await apiRequest<{
      status: string;
      data: DeleteAssessmentResponse;
    }>(
      `/api/creator/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}`,
      {
        method: 'DELETE',
      },
      accessToken
    );
    return res.data;
  },
};

// ============================================================================
// PUBLIC & STUDENT COURSE DELIVERY API (Phase 6C)
// ============================================================================

export interface PublicCourseCreator {
  id: string;
  name: string;
}

export interface PublicCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  status: 'published';
  courseCreator: PublicCourseCreator | null;
  moduleCount: number;
  topicCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface GetPublishedCoursesParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc';
}

export interface GetPublishedCoursesResponse {
  courses: PublicCourse[];
  pagination: CoursePagination;
}

export interface PublicTopicSummary {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
}

export interface PublicModuleStructure {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  topics: PublicTopicSummary[];
}

export interface PublicCourseStructureResponse {
  course: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnail?: string;
    status: 'published';
    courseCreator: PublicCourseCreator | null;
  };
  modules: PublicModuleStructure[];
}

export interface PublicTopicSection {
  heading: string;
  body: string;
  order: number;
}

export interface PublicTopicCodeExample {
  id?: string;
  title: string;
  language: string;
  code: string;
  explanation: string;
}

export interface PublicTopicImage {
  id?: string;
  url: string;
  caption?: string;
  altText?: string;
}

export interface PublicTopicVideos {
  english: string | null;
  telugu: string | null;
  hindi: string | null;
}

export interface PublicTopicExternalReference {
  id?: string;
  title: string;
  url: string;
  source?: string;
}

export interface PublicTopicContent {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  content: {
    explanation: string;
    sections: PublicTopicSection[];
  };
  codeExamples: PublicTopicCodeExample[];
  importantPoints: string[];
  revisionPoints?: string[];
  images: PublicTopicImage[];
  videos: PublicTopicVideos;
  externalReferences: PublicTopicExternalReference[];
  createdAt?: string;
  updatedAt?: string;
}

export const courseApi = {
  /**
   * GET /api/courses
   * Retrieves a paginated list of published courses for student/public catalog
   */
  async getCourses(params: GetPublishedCoursesParams = {}): Promise<GetPublishedCoursesResponse> {
    const queryParams = new URLSearchParams();
    if (params.page && params.page > 0) queryParams.append('page', params.page.toString());
    if (params.limit && params.limit > 0) queryParams.append('limit', params.limit.toString());
    if (params.category && params.category.trim()) queryParams.append('category', params.category.trim());
    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
    if (params.sort) queryParams.append('sort', params.sort);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/courses?${queryString}` : '/api/courses';

    const res = await apiRequest<{ status: string; data: GetPublishedCoursesResponse }>(endpoint, {
      method: 'GET',
    });
    return res.data;
  },

  /**
   * GET /api/courses/:courseId
   * Retrieves single published course details
   */
  async getCourseById(courseId: string): Promise<PublicCourse> {
    const res = await apiRequest<{ status: string; data: { course: PublicCourse } }>(
      `/api/courses/${encodeURIComponent(courseId)}`,
      { method: 'GET' }
    );
    return res.data.course;
  },

  /**
   * GET /api/courses/:courseId/structure
   * Retrieves curriculum structure (modules & topics in order) for a published course
   */
  async getCourseStructure(courseId: string): Promise<PublicCourseStructureResponse> {
    const res = await apiRequest<{ status: string; data: PublicCourseStructureResponse }>(
      `/api/courses/${encodeURIComponent(courseId)}/structure`,
      { method: 'GET' }
    );
    return res.data;
  },

  /**
   * GET /api/courses/:courseId/modules/:moduleId/topics/:topicId
   * Delivers full educational topic content for a published course topic
   */
  async getTopicContent(
    courseId: string,
    moduleId: string,
    topicId: string
  ): Promise<PublicTopicContent> {
    const res = await apiRequest<{ status: string; data: { topic: PublicTopicContent } }>(
      `/api/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/topics/${encodeURIComponent(topicId)}`,
      { method: 'GET' }
    );
    return res.data.topic;
  },
};

// ============================================================================
// STUDENT DASHBOARD API (Phase 7D-2A)
// ============================================================================

/**
 * Student identity returned by GET /api/student/dashboard
 */
export interface StudentDashboardIdentity {
  id: string;
  name: string;
  email: string;
  role: 'student';
}

/**
 * Aggregated dashboard metrics returned by GET /api/student/dashboard
 */
export interface StudentDashboardStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  inProgressCourses: number;
  completedCourses: number;
}

/**
 * Creator summary in student dashboard course items
 */
export interface StudentDashboardCourseCreator {
  id: string;
  name: string;
}

/**
 * Verified course summary with progress metrics
 */
export interface StudentDashboardCourseSummary {
  id: string;
  courseId: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  courseCreator: StudentDashboardCourseCreator | null;
  enrolledAt: string;
  enrollmentDate: string;
  enrollmentStatus: 'active' | 'completed' | 'withdrawn';
  totalTopics: number;
  completedTopics: number;
  totalAssessments?: number;
  passedAssessments?: number;
  allAssessmentsPassed?: boolean;
  completionPercentage: number;
  isCompleted: boolean;
}

/**
 * Recent course summary item
 */
export type StudentDashboardRecentCourse = StudentDashboardCourseSummary;

/**
 * Complete response payload for GET /api/student/dashboard
 */
export interface StudentDashboardResponse {
  student: StudentDashboardIdentity;
  stats: StudentDashboardStats;
  courses: StudentDashboardCourseSummary[];
  recentCourses: StudentDashboardRecentCourse[];
}

export const studentDashboardApi = {
  /**
   * GET /api/student/dashboard
   * Retrieves the authenticated student's dashboard metrics, enrollments,
   * course summaries, and progress data using the in-memory access token.
   */
  async getDashboard(accessToken?: string | null): Promise<StudentDashboardResponse> {
    const res = await apiRequest<{ status: string; data: StudentDashboardResponse }>(
      '/api/student/dashboard',
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },
};

// ============================================================================
// STUDENT ENROLLMENT API
// ============================================================================

export interface StudentEnrollmentCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  status: string;
  courseCreator?: {
    id: string;
    name: string;
  } | null;
}

export interface StudentEnrollment {
  id: string;
  userId?: string;
  courseId?: string;
  status: 'active' | 'completed' | 'withdrawn';
  enrolledAt: string;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  course?: StudentEnrollmentCourse;
}

export interface StudentEnrollmentListResponse {
  enrollments: StudentEnrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const studentEnrollmentApi = {
  /**
   * POST /api/student/enroll/:courseId
   * Enrolls the authenticated student in a published course.
   */
  async enrollInCourse(
    courseId: string,
    accessToken?: string | null
  ): Promise<StudentEnrollment> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { enrollment: StudentEnrollment };
    }>(
      `/api/student/enroll/${encodeURIComponent(courseId)}`,
      {
        method: 'POST',
      },
      accessToken
    );
    return res.data.enrollment;
  },

  /**
   * GET /api/student/enrollments/:courseId
   * Retrieves single enrollment record for the authenticated student. Returns null if not enrolled.
   */
  async getEnrollmentByCourseId(
    courseId: string,
    accessToken?: string | null
  ): Promise<StudentEnrollment | null> {
    try {
      const res = await apiRequest<{
        status: string;
        data: { enrollment: StudentEnrollment };
      }>(
        `/api/student/enrollments/${encodeURIComponent(courseId)}`,
        {
          method: 'GET',
        },
        accessToken
      );
      return res.data.enrollment;
    } catch (err: any) {
      if (err?.status === 404 || err?.statusCode === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * GET /api/student/enrollments
   * Retrieves paginated list of enrollments for authenticated student.
   */
  async getEnrollments(
    params: { page?: number; limit?: number; status?: 'active' | 'completed' | 'withdrawn' } = {},
    accessToken?: string | null
  ): Promise<StudentEnrollmentListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);

    const qs = query.toString();
    const endpoint = qs ? `/api/student/enrollments?${qs}` : '/api/student/enrollments';

    const res = await apiRequest<{
      status: string;
      data: StudentEnrollmentListResponse;
    }>(
      endpoint,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },
};

// ============================================================================
// STUDENT PROGRESS API
// ============================================================================

export interface StudentTopicProgress {
  id: string;
  userId?: string;
  courseId?: string;
  moduleId?: string;
  topicId?: string;
  completedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAssessmentProgressItem {
  id: string;
  assessmentId: string;
  title: string;
  description?: string;
  type: 'topic' | 'course';
  moduleId: string | null;
  topicId: string | null;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  totalQuestions: number;
  attemptsCount: number;
  bestScore: number;
  latestScore: number | null;
  isPassed: boolean;
  status: 'not_started' | 'in_progress' | 'passed' | 'failed';
  lastAttemptAt: string | null;
}

export interface StudentCourseProgressData {
  courseId: string;
  completedTopicIds: string[];
  completedCount: number;
  progress: StudentTopicProgress[];
  assessments?: StudentAssessmentProgressItem[];
  passedAssessmentIds?: string[];
  passedAssessmentCount?: number;
  totalAssessmentsCount?: number;
}

export interface StudentCourseProgressSummary {
  courseId: string;
  totalTopics: number;
  completedTopics: number;
  completionPercentage: number;
  totalAssessments?: number;
  passedAssessments?: number;
  allAssessmentsPassed?: boolean;
  isCompleted: boolean;
  enrollmentStatus?: 'active' | 'completed' | 'withdrawn';
}

export interface StudentMarkTopicCompletedResult {
  progress: StudentTopicProgress;
  alreadyCompleted: boolean;
  isCourseCompleted: boolean;
  enrollmentStatus: 'active' | 'completed' | 'withdrawn';
}

export const studentProgressApi = {
  /**
   * PUT /api/student/progress/:courseId/:topicId
   * Marks topic as completed for authenticated student.
   * Returns authoritative progress record, course completion state, and enrollment status.
   */
  async markTopicCompleted(
    courseId: string,
    topicId: string,
    accessToken?: string | null
  ): Promise<StudentMarkTopicCompletedResult> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: StudentMarkTopicCompletedResult;
    }>(
      `/api/student/progress/${encodeURIComponent(courseId)}/${encodeURIComponent(topicId)}`,
      {
        method: 'PUT',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * DELETE /api/student/progress/:courseId/:topicId
   * Marks topic as incomplete for authenticated student.
   */
  async markTopicIncomplete(
    courseId: string,
    topicId: string,
    accessToken?: string | null
  ): Promise<{ topicId: string; courseId: string; completed: boolean; wasRemoved: boolean }> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: { topicId: string; courseId: string; completed: boolean; wasRemoved: boolean };
    }>(
      `/api/student/progress/${encodeURIComponent(courseId)}/${encodeURIComponent(topicId)}`,
      {
        method: 'DELETE',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * GET /api/student/progress/:courseId
   * Retrieves all completed topic IDs for the authenticated student in the course.
   */
  async getCourseProgress(
    courseId: string,
    accessToken?: string | null
  ): Promise<StudentCourseProgressData> {
    const res = await apiRequest<{
      status: string;
      data: StudentCourseProgressData;
    }>(
      `/api/student/progress/${encodeURIComponent(courseId)}`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * GET /api/student/progress/:courseId/summary
   * Retrieves real-time topic completion percentage and counts.
   */
  async getCourseProgressSummary(
    courseId: string,
    accessToken?: string | null
  ): Promise<StudentCourseProgressSummary> {
    const res = await apiRequest<{
      status: string;
      data: StudentCourseProgressSummary;
    }>(
      `/api/student/progress/${encodeURIComponent(courseId)}/summary`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },
};

// ============================================================================
// STUDENT ASSESSMENT API (Phase 8C-1)
// ============================================================================

export type AssessmentType = 'topic' | 'course';

export type AssessmentAttemptStatus = 'in_progress' | 'completed' | 'timed_out' | 'abandoned';

/**
 * Question option presented to the student.
 * STRICT: Contains no indicator of correctness.
 */
export interface StudentAssessmentOption {
  id: string;
  text: string;
  order: number;
}

/**
 * Assessment question presented to the student during taking/preview.
 * STRICT SECURITY INVARIANT:
 * Zero exposure of correctOptionId or explanation before attempt finalization.
 */
export interface StudentAssessmentQuestion {
  id: string;
  prompt: string;
  codeSnippet: string;
  order: number;
  options: StudentAssessmentOption[];
}

/**
 * Published assessment data sanitized for student viewing.
 */
export interface StudentAssessment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  type: AssessmentType;
  moduleId: string | null;
  topicId: string | null;
  passingScore: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  totalQuestions: number;
  questions?: StudentAssessmentQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * High-level overview of student's past and current attempt status.
 */
export interface StudentAssessmentAttemptOverview {
  hasActiveAttempt: boolean;
  activeAttempt: SafeStudentAttempt | null;
  pastAttemptsCount: number;
  maxAttempts: number;
  isMaxAttemptsReached: boolean;
}

/**
 * Response payload for GET /api/student/courses/:courseId/assessments/:assessmentId
 */
export interface StudentAssessmentDetailsResponse {
  assessment: StudentAssessment;
  attemptOverview: StudentAssessmentAttemptOverview;
}

/**
 * Assessment attempt record sanitized for student view.
 * When in_progress, results (score, isPassed, correctAnswersCount) are undefined.
 * Once completed or timed_out, evaluation results are populated.
 */
export interface SafeStudentAttempt {
  id: string;
  assessmentId: string;
  courseId: string;
  topicId: string | null;
  attemptNumber: number;
  status: AssessmentAttemptStatus;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
  totalQuestions: number;
  correctAnswersCount?: number;
  score?: number;
  isPassed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Response payload for POST /api/student/courses/:courseId/assessments/:assessmentId/start
 */
export interface StudentStartAttemptResponse {
  attempt: SafeStudentAttempt;
  isResumed: boolean;
}

/**
 * Individual question answer in student submission payload.
 */
export interface StudentSubmitAnswerItem {
  questionId: string;
  selectedOptionId?: string | null;
}

/**
 * Payload sent to POST /api/student/courses/:courseId/assessments/:assessmentId/submit
 * STRICT: Only questionId and selectedOptionId are accepted.
 * No client-computed scores, statuses, or deadlines allowed.
 */
export interface StudentSubmitAttemptPayload {
  answers: StudentSubmitAnswerItem[];
}

/**
 * Finalized question review details, including the correct answer and explanation.
 * Only returned AFTER attempt finalization.
 */
export interface StudentAssessmentReviewQuestion {
  id: string;
  prompt: string;
  codeSnippet: string;
  order: number;
  options: StudentAssessmentOption[];
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
  explanation: string;
}

/**
 * Server-calculated results summary for a finalized attempt.
 */
export interface StudentAssessmentResults {
  totalQuestions: number;
  correctAnswersCount: number;
  score: number;
  passingScore: number;
  isPassed: boolean;
  status: AssessmentAttemptStatus;
  review: StudentAssessmentReviewQuestion[];
}

/**
 * Response payload for POST /api/student/courses/:courseId/assessments/:assessmentId/submit
 */
export interface StudentSubmitAttemptResponse {
  attempt: SafeStudentAttempt;
  results: StudentAssessmentResults;
}

/**
 * Response payload for GET /api/student/courses/:courseId/assessments/:assessmentId/attempts
 */
export interface StudentAssessmentAttemptsResponse {
  attempts: SafeStudentAttempt[];
}

/**
 * Response payload for GET /api/student/courses/:courseId/assessments/:assessmentId/attempts/:attemptId
 */
export interface StudentAttemptReviewResponse {
  attempt: SafeStudentAttempt;
  results: StudentAssessmentResults;
}

export const studentAssessmentApi = {
  /**
   * GET /api/student/courses/:courseId/assessments
   * Retrieves all published assessments for a course with the authenticated student's attempt overview.
   */
  async getCourseAssessments(
    courseId: string,
    accessToken?: string | null
  ): Promise<StudentAssessmentProgressItem[]> {
    const res = await apiRequest<{
      status: string;
      data: { assessments: StudentAssessmentProgressItem[] };
    }>(
      `/api/student/courses/${encodeURIComponent(courseId)}/assessments`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data.assessments;
  },

  /**
   * GET /api/student/courses/:courseId/assessments/:assessmentId
   * Retrieves published assessment structure (sanitized, no answer key) and student attempt overview.
   */
  async getAssessment(
    courseId: string,
    assessmentId: string,
    accessToken?: string | null
  ): Promise<StudentAssessmentDetailsResponse> {
    const res = await apiRequest<{
      status: string;
      data: StudentAssessmentDetailsResponse;
    }>(
      `/api/student/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * POST /api/student/courses/:courseId/assessments/:assessmentId/start
   * Starts a new assessment attempt or resumes an existing in-progress attempt.
   */
  async startAttempt(
    courseId: string,
    assessmentId: string,
    accessToken?: string | null
  ): Promise<StudentStartAttemptResponse> {
    const res = await apiRequest<{
      status: string;
      message: string;
      data: StudentStartAttemptResponse;
    }>(
      `/api/student/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}/start`,
      {
        method: 'POST',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * POST /api/student/courses/:courseId/assessments/:assessmentId/submit
   * Submits student answers for server-authoritative evaluation and scoring.
   * Strips any unknown or client-calculated fields before transmission.
   */
  async submitAttempt(
    courseId: string,
    assessmentId: string,
    payload: StudentSubmitAttemptPayload,
    accessToken?: string | null
  ): Promise<StudentSubmitAttemptResponse> {
    // Defense-in-depth: explicitly isolate and sanitize submission answers
    const sanitizedAnswers = (payload?.answers || []).map((ans) => {
      const item: { questionId: string; selectedOptionId?: string } = {
        questionId: String(ans.questionId),
      };
      if (ans.selectedOptionId) {
        item.selectedOptionId = String(ans.selectedOptionId);
      }
      return item;
    });

    const res = await apiRequest<{
      status: string;
      message: string;
      data: StudentSubmitAttemptResponse;
    }>(
      `/api/student/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ answers: sanitizedAnswers }),
      },
      accessToken
    );
    return res.data;
  },

  /**
   * GET /api/student/courses/:courseId/assessments/:assessmentId/attempts
   * Retrieves the authenticated student's attempt history for this assessment.
   */
  async getAttempts(
    courseId: string,
    assessmentId: string,
    accessToken?: string | null
  ): Promise<SafeStudentAttempt[]> {
    const res = await apiRequest<{
      status: string;
      data: { attempts: SafeStudentAttempt[] };
    }>(
      `/api/student/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}/attempts`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data.attempts;
  },

  /**
   * GET /api/student/courses/:courseId/assessments/:assessmentId/attempts/:attemptId
   * Retrieves full review of a finalized attempt, including evaluation and explanations.
   */
  async getAttemptReview(
    courseId: string,
    assessmentId: string,
    attemptId: string,
    accessToken?: string | null
  ): Promise<StudentAttemptReviewResponse> {
    const res = await apiRequest<{
      status: string;
      data: StudentAttemptReviewResponse;
    }>(
      `/api/student/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}/attempts/${encodeURIComponent(attemptId)}`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },
};

// ============================================================================
// Student Personalized Notes APIs & Interfaces (/api/student/notes)
// ============================================================================

export type StudentNoteType = 'standalone' | 'highlight';
export type StudentNoteColor = 'default' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'rose' | 'purple';

export interface StudentNote {
  id: string;
  userId?: string;
  noteType: StudentNoteType;
  title: string;
  content: string;
  selectedText: string;
  courseId: string | null;
  moduleId: string | null;
  topicId: string | null;
  courseTitle: string;
  moduleTitle: string;
  topicTitle: string;
  tags: string[];
  color: StudentNoteColor;
  createdAt: string;
  updatedAt: string;
}

export interface StudentNotesPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentNotesListResponse {
  notes: StudentNote[];
  pagination: StudentNotesPagination;
}

export interface StudentNotesStats {
  totalNotes: number;
  standaloneNotes: number;
  highlightNotes: number;
  coursesWithNotesCount: number;
}

export interface CreateStudentNotePayload {
  noteType?: StudentNoteType;
  title?: string;
  content?: string;
  selectedText?: string;
  courseId?: string | null;
  moduleId?: string | null;
  topicId?: string | null;
  tags?: string[];
  color?: StudentNoteColor;
}

export interface UpdateStudentNotePayload {
  title?: string;
  content?: string;
  tags?: string[];
  color?: StudentNoteColor;
}

export interface GetStudentNotesParams {
  courseId?: string;
  topicId?: string;
  noteType?: StudentNoteType;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'updated' | 'title_asc' | 'title_desc';
}

export const studentNoteApi = {
  /**
   * POST /api/student/notes
   * Creates a personal note (standalone or highlight-based).
   */
  async createNote(
    payload: CreateStudentNotePayload,
    accessToken?: string | null
  ): Promise<StudentNote> {
    const res = await apiRequest<{ status: string; data: { note: StudentNote } }>(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.note;
  },

  /**
   * GET /api/student/notes
   * Retrieves paginated notes with optional filters.
   */
  async getNotes(
    params?: GetStudentNotesParams,
    accessToken?: string | null
  ): Promise<StudentNotesListResponse> {
    const query = new URLSearchParams();
    if (params?.courseId) query.set('courseId', params.courseId);
    if (params?.topicId) query.set('topicId', params.topicId);
    if (params?.noteType) query.set('noteType', params.noteType);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.sort) query.set('sort', params.sort);

    const queryString = query.toString();
    const endpoint = queryString ? `/api/student/notes?${queryString}` : '/api/student/notes';

    const res = await apiRequest<{ status: string; data: StudentNotesListResponse }>(
      endpoint,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data;
  },

  /**
   * GET /api/student/notes/stats
   * Retrieves summary counts of notes for the student.
   */
  async getNotesStats(accessToken?: string | null): Promise<StudentNotesStats> {
    const res = await apiRequest<{ status: string; data: { stats: StudentNotesStats } }>(
      '/api/student/notes/stats',
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data.stats;
  },

  /**
   * GET /api/student/notes/:id
   * Retrieves a single note by ID.
   */
  async getNoteById(noteId: string, accessToken?: string | null): Promise<StudentNote> {
    const res = await apiRequest<{ status: string; data: { note: StudentNote } }>(
      `/api/student/notes/${encodeURIComponent(noteId)}`,
      {
        method: 'GET',
      },
      accessToken
    );
    return res.data.note;
  },

  /**
   * PUT /api/student/notes/:id
   * Updates note title, commentary, tags, or color.
   */
  async updateNote(
    noteId: string,
    payload: UpdateStudentNotePayload,
    accessToken?: string | null
  ): Promise<StudentNote> {
    const res = await apiRequest<{ status: string; data: { note: StudentNote } }>(
      `/api/student/notes/${encodeURIComponent(noteId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return res.data.note;
  },

  /**
   * DELETE /api/student/notes/:id
   * Deletes a student note.
   */
  async deleteNote(
    noteId: string,
    accessToken?: string | null
  ): Promise<{ success: boolean; deletedId: string }> {
    const res = await apiRequest<{ status: string; data: { success: boolean; deletedId: string } }>(
      `/api/student/notes/${encodeURIComponent(noteId)}`,
      {
        method: 'DELETE',
      },
      accessToken
    );
    return res.data;
  },
};


