import { Router } from 'express';
import { getDashboard } from '../controllers/adminController.js';
import adminUsersRouter from './adminUsers.js';
import adminCoursesRouter from './adminCourses.js';
import adminModulesRouter from './adminModules.js';
import adminTopicsRouter from './adminTopics.js';
import adminAssessmentsRouter, {
  courseIdParamValidation,
  createAssessmentValidation,
} from './adminAssessments.js';
import {
  getCourseAssessmentsHandler,
  createAssessmentHandler,
} from '../controllers/adminAssessmentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Router-level protection: All admin endpoints require valid authentication and the 'admin' role
router.use(authenticate, authorize('admin'));

// Admin Dashboard Summary Endpoint
router.get('/dashboard', getDashboard);

// Admin User Management Sub-routes (/api/admin/users)
router.use('/users', adminUsersRouter);

// Admin Course Assessment Endpoints (/api/admin/courses/:courseId/assessments)
router.get('/courses/:courseId/assessments', courseIdParamValidation, getCourseAssessmentsHandler);
router.post('/courses/:courseId/assessments', createAssessmentValidation, createAssessmentHandler);

// Admin Course Management Sub-routes (/api/admin/courses)
router.use('/courses', adminCoursesRouter);

// Admin Module Management Sub-routes (/api/admin/modules)
router.use('/modules', adminModulesRouter);

// Admin Topic Management Sub-routes (/api/admin/topics)
router.use('/topics', adminTopicsRouter);

// Admin Assessment Management Sub-routes (/api/admin/assessments)
router.use('/assessments', adminAssessmentsRouter);

export default router;

