import courseCreatorCourseService from '../services/courseCreatorCourseService.js';

/**
 * POST /api/creator/courses
 * Creates a new course owned by the authenticated course creator.
 */
export const createCourse = async (req, res, next) => {
  try {
    const creatorId = req.user?.userId || req.user?.id;
    const { title, description, category, thumbnail, syllabus, status } = req.body;

    const newCourse = await courseCreatorCourseService.createCourse({
      creatorId,
      title,
      description,
      category,
      thumbnail,
      syllabus,
      status,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: {
        course: newCourse,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/creator/courses
 * Retrieves a paginated and filtered list of courses owned strictly by the authenticated course creator.
 */
export const getCourses = async (req, res, next) => {
  try {
    const creatorId = req.user?.userId || req.user?.id;
    const { page, limit, status, category, search } = req.query;

    const result = await courseCreatorCourseService.getCourses({
      creatorId,
      page,
      limit,
      status,
      category,
      search,
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
 * GET /api/creator/courses/:courseId
 * Retrieves a single course owned by the authenticated course creator.
 * Fails with 404 if not found or owned by someone else.
 */
export const getCourseById = async (req, res, next) => {
  try {
    const creatorId = req.user?.userId || req.user?.id;
    const { courseId } = req.params;

    const course = await courseCreatorCourseService.getCourseById({
      courseId,
      creatorId,
    });

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
 * PATCH /api/creator/courses/:courseId
 * Updates an existing course owned by the authenticated course creator.
 */
export const updateCourse = async (req, res, next) => {
  try {
    const creatorId = req.user?.userId || req.user?.id;
    const { courseId } = req.params;
    const { title, description, category, thumbnail, syllabus, status } = req.body;

    const updatedCourse = await courseCreatorCourseService.updateCourse({
      courseId,
      creatorId,
      updateData: {
        title,
        description,
        category,
        thumbnail,
        syllabus,
        status,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Course updated successfully',
      data: {
        course: updatedCourse,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
};
