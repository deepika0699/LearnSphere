import courseCreatorModuleService from '../services/courseCreatorModuleService.js';

/**
 * POST /api/creator/courses/:courseId/modules
 * Creates a module under the authenticated Course Creator's course.
 */
export const createModule = async (req, res, next) => {
  try {
    const courseId = req.course._id;
    const { title, description, order } = req.body;

    const module = await courseCreatorModuleService.createModule({
      courseId,
      title,
      description,
      order: typeof order === 'number' ? order : (order !== undefined && order !== null && !isNaN(Number(order)) ? Number(order) : undefined),
    });

    return res.status(201).json({
      status: 'success',
      message: 'Module created successfully',
      data: {
        module,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/creator/courses/:courseId/modules
 * Retrieves all modules for the authenticated Course Creator's course.
 */
export const getModules = async (req, res, next) => {
  try {
    const courseId = req.course._id;
    const modules = await courseCreatorModuleService.getModulesByCourse(courseId);

    return res.status(200).json({
      status: 'success',
      data: {
        modules,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/creator/courses/:courseId/modules/:moduleId
 * Retrieves a single module strictly belonging to the creator's course.
 */
export const getModuleById = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const courseId = req.course._id;

    const module = await courseCreatorModuleService.getModuleById(moduleId, courseId);

    if (!module) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Module not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        module,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/creator/courses/:courseId/modules/:moduleId
 * Updates a module strictly belonging to the creator's course.
 */
export const updateModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const courseId = req.course._id;
    const { title, description, order } = req.body;

    const updatedModule = await courseCreatorModuleService.updateModule(
      moduleId,
      courseId,
      {
        title,
        description,
        order: typeof order === 'number' ? order : (order !== undefined && order !== null && !isNaN(Number(order)) ? Number(order) : undefined),
      }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Module updated successfully',
      data: {
        module: updatedModule,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/creator/courses/:courseId/modules/reorder
 * Reorders modules belonging to the authenticated creator's course.
 */
export const reorderModules = async (req, res, next) => {
  try {
    const courseId = req.course._id;
    const { moduleIds } = req.body;

    const modules = await courseCreatorModuleService.reorderModules(courseId, moduleIds);

    return res.status(200).json({
      status: 'success',
      message: 'Modules reordered successfully',
      data: {
        modules,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/creator/courses/:courseId/modules/:moduleId
 * Deletes a module and its child topics strictly within the creator's course.
 */
export const deleteModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const courseId = req.course._id;

    const result = await courseCreatorModuleService.deleteModule(moduleId, courseId);

    return res.status(200).json({
      status: 'success',
      message: 'Module deleted successfully',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  reorderModules,
  deleteModule,
};
