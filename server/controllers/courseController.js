/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import courseService from '../services/courseService.js';

/**
 * GET /api/courses
 * Retrieves a paginated list of published courses for student/public catalog.
 */
export const getCourses = async (req, res, next) => {
  try {
    const { page, limit, category, search, sort } = req.query;

    const result = await courseService.getPublishedCourses({
      page,
      limit,
      category,
      search,
      sort,
    });

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/courses/:courseId
 * Retrieves safe metadata and details for a single published course.
 * Returns 404 if draft, archived, or non-existent.
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await courseService.getPublishedCourseById(courseId);

    return res.status(200).json({
      status: 'success',
      data: {
        course,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/courses/:courseId/structure
 * Retrieves the sequential curriculum structure (modules and topics) for a published course.
 * Returns 404 if draft, archived, or non-existent.
 */
export const getCourseStructure = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const structure = await courseService.getPublishedCourseStructure(courseId);

    return res.status(200).json({
      status: 'success',
      data: structure,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/courses/:courseId/modules/:moduleId/topics/:topicId
 * Delivers full educational topic content for a published course topic.
 * Enforces course -> module -> topic hierarchy.
 * Returns 404 on draft, archived, missing, or cross-hierarchy entities.
 */
export const getTopicContent = async (req, res, next) => {
  try {
    const { courseId, moduleId, topicId } = req.params;

    const topic = await courseService.getPublishedTopicContent({
      courseId,
      moduleId,
      topicId,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        topic,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getCourses,
  getCourseById,
  getCourseStructure,
  getTopicContent,
};
