/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserState, Certificate } from '../types';
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

  // Safely deprecated legacy mutators: all student enrollment, topic progress, and assessments
  // are server-authoritative via studentEnrollmentApi, studentProgressApi, and studentAssessmentApi.
  const enrollInCourse = (_courseId: string) => {
    // Deprecated: Real enrollments are handled server-side via studentEnrollmentApi.enrollInCourse
  };

  const completeLesson = (_courseId: string, _lessonId: string) => {
    // Deprecated: Real topic progress is handled server-side via studentProgressApi.markTopicCompleted
  };

  const completeQuiz = (_courseId: string, _score: number, _passed: boolean) => {
    // Deprecated: Real assessments are evaluated server-side via studentAssessmentApi.submitAttempt
  };

  const addCertificate = (_courseId: string, _courseTitle: string) => {
    // Deprecated: Academic credentials/certificates are deferred to Phase 11
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
