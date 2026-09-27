/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserState, Certificate } from '../types';
import { MOCK_COURSES } from '../constants/data';
import { authApi } from '../services/api';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AppContextType {
  state: UserState;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  enrollInCourse: (courseId: string) => void;
  completeLesson: (courseId: string, lessonId: string) => void;
  completeQuiz: (courseId: string, score: number, passed: boolean) => void;
  addCertificate: (courseId: string, courseTitle: string) => void;
  updateProfile: (name: string, title: string, bio: string) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_STATE: UserState = {
  user: null,
  courseProgress: {},
  certificates: [],
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserState>(INITIAL_STATE);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on initial mount via HttpOnly refresh cookie
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const data = await authApi.refresh();
        if (isMounted) {
          setAccessToken(data.accessToken);

          // Query authoritative user identity and role from /api/auth/me
          let authoritativeUser = data.user;
          try {
            const meData = await authApi.getMe(data.accessToken);
            if (meData) {
              authoritativeUser = meData;
            }
          } catch {
            // Keep data.user if /me is temporarily unreachable
          }

          const restoredUser: User = {
            id: authoritativeUser.id,
            name: authoritativeUser.name,
            email: authoritativeUser.email,
            role: authoritativeUser.role,
            status: (authoritativeUser as any).status || 'active',
            createdAt: authoritativeUser.createdAt,
            avatar: `https://images.unsplash.com/photo-1535713875002?auto=format&fit=crop&w=150&h=150&q=80`,
            enrolledCourses: [],
            completedCourses: [],
            xp: 0,
            streak: 1,
          };
          setState((prev) => ({
            ...prev,
            user: restoredUser,
          }));
        }
      } catch {
        // No active or valid refresh session exists
        if (isMounted) {
          setAccessToken(null);
          setState((prev) => ({
            ...prev,
            user: null,
          }));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const data = await authApi.login({ email, password });
      setAccessToken(data.accessToken);

      // Verify and retrieve authoritative user role from /api/auth/me
      let authoritativeUser = data.user;
      try {
        const meData = await authApi.getMe(data.accessToken);
        if (meData) {
          authoritativeUser = meData;
        }
      } catch {
        // Fallback to data.user
      }

      const authenticatedUser: User = {
        id: authoritativeUser.id,
        name: authoritativeUser.name,
        email: authoritativeUser.email,
        role: authoritativeUser.role,
        status: (authoritativeUser as any).status || 'active',
        createdAt: authoritativeUser.createdAt,
        avatar: `https://images.unsplash.com/photo-1535713875002?auto=format&fit=crop&w=150&h=150&q=80`,
        enrolledCourses: [],
        completedCourses: [],
        xp: 0,
        streak: 1,
      };

      setState((prev) => ({
        ...prev,
        user: authenticatedUser,
      }));

      return { success: true, user: authenticatedUser };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Invalid email or password. Please try again.',
      };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      await authApi.register({ name, email, password });
      // Establish session immediately after registration by calling login
      return await login(email, password);
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Registration failed. Please check your information.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
      setState({
        user: null,
        courseProgress: {},
        certificates: [],
      });
    }
  };

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const data = await authApi.refresh();
      setAccessToken(data.accessToken);

      let authoritativeUser = data.user;
      try {
        const meData = await authApi.getMe(data.accessToken);
        if (meData) {
          authoritativeUser = meData;
        }
      } catch {
        // Fallback to data.user
      }

      const refreshedUser: User = {
        id: authoritativeUser.id,
        name: authoritativeUser.name,
        email: authoritativeUser.email,
        role: authoritativeUser.role,
        status: (authoritativeUser as any).status || 'active',
        createdAt: authoritativeUser.createdAt,
        avatar: `https://images.unsplash.com/photo-1535713875002?auto=format&fit=crop&w=150&h=150&q=80`,
        enrolledCourses: state.user?.enrolledCourses || [],
        completedCourses: state.user?.completedCourses || [],
        xp: state.user?.xp || 0,
        streak: state.user?.streak || 1,
      };
      setState((prev) => ({
        ...prev,
        user: refreshedUser,
      }));
      return true;
    } catch {
      setAccessToken(null);
      setState((prev) => ({
        ...prev,
        user: null,
      }));
      return false;
    }
  }, [state.user]);

  const enrollInCourse = (courseId: string) => {
    if (!state.user) return;
    if (state.user.enrolledCourses.includes(courseId)) return;

    setState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          enrolledCourses: [...prev.user.enrolledCourses, courseId],
          xp: prev.user.xp + 50, // 50 XP for enrolling!
        },
        courseProgress: {
          ...prev.courseProgress,
          [courseId]: {
            completedLessons: [],
          },
        },
      };
    });
  };

  const completeLesson = (courseId: string, lessonId: string) => {
    if (!state.user) return;

    setState((prev) => {
      const currentProgress = prev.courseProgress[courseId] || { completedLessons: [] };
      if (currentProgress.completedLessons.includes(lessonId)) return prev;

      const updatedLessons = [...currentProgress.completedLessons, lessonId];
      const isAlreadyPassed = currentProgress.quizPassed || false;

      // Find the course to check if all lessons (excluding the final quiz itself) are complete
      const course = MOCK_COURSES.find((c) => c.id === courseId);
      const totalNonQuizLessonsCount = course
        ? course.syllabus.filter((item) => item.type !== 'quiz').length
        : 0;

      const completedNonQuizCount = course
        ? course.syllabus.filter((item) => item.type !== 'quiz' && updatedLessons.includes(item.id)).length
        : 0;

      const xpGained = 20; // 20 XP per lesson

      return {
        ...prev,
        user: prev.user
          ? {
              ...prev.user,
              xp: prev.user.xp + xpGained,
            }
          : null,
        courseProgress: {
          ...prev.courseProgress,
          [courseId]: {
            ...currentProgress,
            completedLessons: updatedLessons,
          },
        },
      };
    });
  };

  const completeQuiz = (courseId: string, score: number, passed: boolean) => {
    if (!state.user) return;

    setState((prev) => {
      if (!prev.user) return prev;
      const currentProgress = prev.courseProgress[courseId] || { completedLessons: [] };
      const previouslyPassed = currentProgress.quizPassed;

      // Add lesson completion for the quiz item itself if passed
      const course = MOCK_COURSES.find((c) => c.id === courseId);
      const quizSyllabusItem = course?.syllabus.find((item) => item.type === 'quiz');
      let completedLessons = currentProgress.completedLessons;
      if (passed && quizSyllabusItem && !completedLessons.includes(quizSyllabusItem.id)) {
        completedLessons = [...completedLessons, quizSyllabusItem.id];
      }

      const xpGained = passed && !previouslyPassed ? 100 : 25; // 100 XP for passing, 25 for attempt

      let updatedCompletedCourses = prev.user.completedCourses;
      if (passed && !prev.user.completedCourses.includes(courseId)) {
        updatedCompletedCourses = [...prev.user.completedCourses, courseId];
      }

      return {
        ...prev,
        user: {
          ...prev.user,
          completedCourses: updatedCompletedCourses,
          xp: prev.user.xp + xpGained,
        },
        courseProgress: {
          ...prev.courseProgress,
          [courseId]: {
            ...currentProgress,
            completedLessons,
            quizScore: score,
            quizPassed: passed,
          },
        },
      };
    });
  };

  const addCertificate = (courseId: string, courseTitle: string) => {
    if (!state.user) return;
    const exists = state.certificates.some((c) => c.courseId === courseId);
    if (exists) return;

    const cert: Certificate = {
      id: `cert-${Date.now()}`,
      courseId,
      courseTitle,
      studentName: state.user.name,
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      credentialId: `LS-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setState((prev) => ({
      ...prev,
      certificates: [...prev.certificates, cert],
    }));
  };

  const updateProfile = (name: string, title: string, bio: string) => {
    setState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          name,
          title,
          bio,
        },
      };
    });
  };

  const resetState = () => {
    setState(INITIAL_STATE);
  };

  const isAuthenticated = !!state.user && !!accessToken;

  return (
    <AppContext.Provider
      value={{
        state,
        accessToken,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshSession,
        enrollInCourse,
        completeLesson,
        completeQuiz,
        addCertificate,
        updateProfile,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
