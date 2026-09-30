/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './layouts/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AdminRoute } from './components/AdminRoute';
import { CreatorRoute } from './components/CreatorRoute';
import { StudentRoute } from './components/StudentRoute';

// Pages (Lazy Loaded)
const Home = React.lazy(() => import('./pages/public/Home').then(m => ({ default: m.Home })));
const About = React.lazy(() => import('./pages/public/About').then(m => ({ default: m.About })));
const Contact = React.lazy(() => import('./pages/public/Contact').then(m => ({ default: m.Contact })));
const Login = React.lazy(() => import('./pages/public/Login').then(m => ({ default: m.Login })));
const Signup = React.lazy(() => import('./pages/public/Signup').then(m => ({ default: m.Signup })));
const Dashboard = React.lazy(() => import('./pages/student/Dashboard').then(m => ({ default: m.Dashboard })));
const Courses = React.lazy(() => import('./pages/student/Courses').then(m => ({ default: m.Courses })));
const CourseDetails = React.lazy(() => import('./pages/student/CourseDetails').then(m => ({ default: m.CourseDetails })));
const TopicReader = React.lazy(() => import('./pages/student/TopicReader').then(m => ({ default: m.TopicReader })));
const Quiz = React.lazy(() => import('./pages/student/Quiz').then(m => ({ default: m.Quiz })));
const Certificates = React.lazy(() => import('./pages/student/Certificates').then(m => ({ default: m.Certificates })));
const Profile = React.lazy(() => import('./pages/student/Profile').then(m => ({ default: m.Profile })));
const Notes = React.lazy(() => import('./pages/student/Notes').then(m => ({ default: m.Notes })));
const StudentAssessmentPage = React.lazy(() => import('./pages/student/StudentAssessmentPage').then(m => ({ default: m.StudentAssessmentPage })));


// Admin Shells
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardShell = React.lazy(() => import('./pages/admin/AdminDashboardShell').then(m => ({ default: m.AdminDashboardShell })));
const AdminUsersShell = React.lazy(() => import('./pages/admin/AdminUsersShell').then(m => ({ default: m.AdminUsersShell })));
const AdminCoursesShell = React.lazy(() => import('./pages/admin/AdminCoursesShell').then(m => ({ default: m.AdminCoursesShell })));
const AdminCourseCreatorsShell = React.lazy(() => import('./pages/admin/AdminCourseCreatorsShell').then(m => ({ default: m.AdminCourseCreatorsShell })));
const AdminAssessmentsShell = React.lazy(() => import('./pages/admin/AdminAssessmentsShell').then(m => ({ default: m.AdminAssessmentsShell })));

// Course Creator Shells
const CreatorLayout = React.lazy(() => import('./layouts/CreatorLayout').then(m => ({ default: m.CreatorLayout })));
const CreatorDashboardShell = React.lazy(() => import('./pages/creator/CreatorDashboardShell').then(m => ({ default: m.CreatorDashboardShell })));
const CreatorCoursesShell = React.lazy(() => import('./pages/creator/CreatorCoursesShell').then(m => ({ default: m.CreatorCoursesShell })));
const CreatorCourseCreateShell = React.lazy(() => import('./pages/creator/CreatorCourseCreateShell').then(m => ({ default: m.CreatorCourseCreateShell })));
const CreatorCourseDetailsShell = React.lazy(() => import('./pages/creator/CreatorCourseDetailsShell').then(m => ({ default: m.CreatorCourseDetailsShell })));
const CreatorAssessmentsShell = React.lazy(() => import('./pages/creator/CreatorAssessmentsShell').then(m => ({ default: m.CreatorAssessmentsShell })));

const NotFound = React.lazy(() => import('./pages/public/NotFound').then(m => ({ default: m.NotFound })));

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Suspense fallback={
            <div className="min-h-[50vh] flex items-center justify-center">
              <LoadingSpinner size="lg" label="Loading LearnSphere..." direction="col" />
            </div>
          }>
            <Routes>
              {/* Landing Marketing Page */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Student Hubs */}
              <Route
                path="/dashboard"
                element={
                  <StudentRoute>
                    <Dashboard />
                  </StudentRoute>
                }
              />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CourseDetails />} />
              <Route path="/courses/:courseId/learn/:topicId" element={<TopicReader />} />
              
              {/* Interactivity & Assessments (Student Protected) */}
              <Route
                path="/courses/:courseId/assessments/:assessmentId"
                element={
                  <StudentRoute>
                    <StudentAssessmentPage />
                  </StudentRoute>
                }
              />
              <Route
                path="/courses/:courseId/assessments/:assessmentId/attempts/:attemptId"
                element={
                  <StudentRoute>
                    <StudentAssessmentPage />
                  </StudentRoute>
                }
              />
              <Route
                path="/quiz/:courseId"
                element={
                  <StudentRoute>
                    <Quiz />
                  </StudentRoute>
                }
              />
              <Route
                path="/notes"
                element={
                  <StudentRoute>
                    <Notes />
                  </StudentRoute>
                }
              />
              <Route
                path="/certificates"
                element={
                  <StudentRoute>
                    <Certificates />
                  </StudentRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <StudentRoute>
                    <Profile />
                  </StudentRoute>
                }
              />

              {/* Protected Admin Foundation & Nested Routing */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboardShell />} />
                <Route path="dashboard" element={<AdminDashboardShell />} />
                <Route path="users" element={<AdminUsersShell />} />
                <Route path="courses" element={<AdminCoursesShell />} />
                <Route path="assessments" element={<AdminAssessmentsShell />} />
                <Route path="course-creators" element={<AdminCourseCreatorsShell />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              {/* Protected Course Creator Foundation & Nested Routing */}
              <Route
                path="/creator"
                element={
                  <CreatorRoute>
                    <CreatorLayout />
                  </CreatorRoute>
                }
              >
                <Route index element={<CreatorDashboardShell />} />
                <Route path="dashboard" element={<CreatorDashboardShell />} />
                <Route path="courses" element={<CreatorCoursesShell />} />
                <Route path="assessments" element={<CreatorAssessmentsShell />} />
                <Route path="courses/new" element={<CreatorCourseCreateShell />} />
                <Route path="courses/:courseId" element={<CreatorCourseDetailsShell />} />
                <Route path="*" element={<Navigate to="/creator" replace />} />
              </Route>

              {/* Catch all fallback page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AppProvider>
  );
}
