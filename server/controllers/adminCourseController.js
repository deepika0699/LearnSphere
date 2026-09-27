import adminCourseService from '../services/adminCourseService.js';

/**
 * POST /api/admin/courses
 * Creates a new course under administrative control.
 */
export const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      courseCreator,
      thumbnail,
      syllabus,
      status,
    } = req.body;

    const newCourse = await adminCourseService.createCourse({
      title,
      description,
      category,
      courseCreator,
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
 * GET /api/admin/courses
 * Retrieves a paginated and filtered list of courses.
 */
export const getCourses = async (req, res, next) => {
  try {
    const { page, limit, status, category, search } = req.query;

    const result = await adminCourseService.getCourses({
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
 * GET /api/admin/courses/:id
 * Retrieves a single course by its MongoDB ID.
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await adminCourseService.getCourseById(id);

    if (!course) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Course not found',
      });
    }

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
 * PATCH /api/admin/courses/:id
 * Updates an existing course using strict field whitelisting.
 */
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      courseCreator,
      thumbnail,
      syllabus,
      status,
    } = req.body;

    const updatedCourse = await adminCourseService.updateCourse(id, {
      title,
      description,
      category,
      courseCreator,
      thumbnail,
      syllabus,
      status,
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

/**
 * PATCH /api/admin/courses/:id/status
 * Updates the lifecycle status of a course (draft, published, archived).
 */
export const updateCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedCourse = await adminCourseService.updateCourseStatus(id, status);

    return res.status(200).json({
      status: 'success',
      message: 'Course status updated successfully',
      data: {
        course: updatedCourse,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/courses/:id/structure
 * Retrieves the complete course hierarchy: Course -> Ordered Modules -> Ordered Topics.
 */
export const getCourseStructure = async (req, res, next) => {
  try {
    const { id } = req.params;

    const structure = await adminCourseService.getCourseStructure(id);

    if (!structure) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Course not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: structure,
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createCourse,
  getCourses,
  getCourseById,
  getCourseStructure,
  updateCourse,
  updateCourseStatus,
};
