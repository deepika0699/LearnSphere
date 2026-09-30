/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'courseCreator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status?: 'active' | 'inactive';
  bio?: string;
  title?: string;
  enrolledCourses: string[]; // Course IDs
  completedCourses: string[]; // Course IDs
  createdAt?: string;
}

export interface SyllabusItem {
  id: string;
  title: string;
  duration: string; // e.g., "15 mins"
  type: 'video' | 'article' | 'quiz';
  isCompleted?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  courseCreator: {
    name: string;
    avatar?: string;
    bio?: string;
    title?: string;
    email?: string;
    id?: string;
  };
  instructor?: {
    name: string;
    avatar?: string;
    bio?: string;
    title?: string;
    email?: string;
    id?: string;
  };
  category: 'Development' | 'Design' | 'Business' | 'Marketing' | 'Data Science';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string; // e.g., "12 hours"
  rating: number; // e.g., 4.8
  reviewsCount: number;
  lessonsCount: number;
  price: number; // 0 for free, or positive number
  image: string;
  syllabus: SyllabusItem[];
  skillsGained: string[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: Question[];
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  issueDate: string;
  credentialId: string;
}

export interface UserState {
  user: User | null;
  courseProgress: {
    [courseId: string]: {
      completedLessons: string[]; // SyllabusItem IDs
      quizScore?: number;
      quizPassed?: boolean;
    };
  };
  certificates: Certificate[];
}

export type {
  AssessmentType,
  AssessmentAttemptStatus,
  AssessmentStatus,
  AssessmentAuthorOption,
  AssessmentAuthorQuestion,
  AssessmentAuthorData,
  CreateAssessmentPayload,
  UpdateAssessmentPayload,
  DeleteAssessmentResponse,
  AdminAssessmentStats,
  StudentAssessmentOption,
  StudentAssessmentQuestion,
  StudentAssessment,
  StudentAssessmentAttemptOverview,
  StudentAssessmentDetailsResponse,
  SafeStudentAttempt,
  StudentStartAttemptResponse,
  StudentSubmitAnswerItem,
  StudentSubmitAttemptPayload,
  StudentAssessmentReviewQuestion,
  StudentAssessmentResults,
  StudentSubmitAttemptResponse,
  StudentAssessmentAttemptsResponse,
  StudentAttemptReviewResponse,
  StudentMarkTopicCompletedResult,
  StudentNote,
  StudentNoteType,
  StudentNoteColor,
  StudentNotesPagination,
  StudentNotesListResponse,
  StudentNotesStats,
  CreateStudentNotePayload,
  UpdateStudentNotePayload,
  GetStudentNotesParams,
} from '../services/api';

