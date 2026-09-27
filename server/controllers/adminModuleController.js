import adminModuleService from '../services/adminModuleService.js';

/**
 * POST /api/admin/modules OR POST /api/admin/courses/:courseId/modules
 * Creates a new module under a course.
 */
export const createModule = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;
    const { title, description, order } = req.body;

    const module = await adminModuleService.createModule({
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
 * GET /api/admin/courses/:courseId/modules
 * Retrieves all modules for a specific course ordered by order.
 */
export const getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const modules = await adminModuleService.getModulesByCourse(courseId);

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
 * GET /api/admin/modules/:id OR GET /api/admin/courses/:courseId/modules/:moduleId
 * Retrieves a single module by ID, respecting course boundary if courseId is present.
 */
export const getModuleById = async (req, res, next) => {
  try {
    const { id, moduleId, courseId } = req.params;
    const targetModuleId = moduleId || id;
    const module = await adminModuleService.getModuleById(targetModuleId, courseId);

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
 * PATCH /api/admin/modules/:id OR PATCH /api/admin/courses/:courseId/modules/:moduleId
 * Updates an existing module using strict field whitelisting.
 */
export const updateModule = async (req, res, next) => {
  try {
    const { id, moduleId, courseId } = req.params;
    const targetModuleId = moduleId || id;
    const { title, description, order } = req.body;

    const updatedModule = await adminModuleService.updateModule(
      targetModuleId,
      {
        title,
        description,
        order: typeof order === 'number' ? order : (order !== undefined && order !== null && !isNaN(Number(order)) ? Number(order) : undefined),
      },
      courseId
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
 * PATCH /api/admin/courses/:courseId/modules/reorder OR PATCH /api/admin/modules/reorder
 * Reorders modules within a course.
 */
export const reorderModules = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;

    // Strict validation of allowed body keys
    const allowedKeys = ['moduleIds', 'courseId'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      const error = new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const { moduleIds } = req.body;

    const modules = await adminModuleService.reorderModules(courseId, moduleIds);

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
 * DELETE /api/admin/modules/:id OR DELETE /api/admin/courses/:courseId/modules/:moduleId
 * Deletes a module and cascades to prevent orphaned topics.
 */
export const deleteModule = async (req, res, next) => {
  try {
    const { id, moduleId, courseId } = req.params;
    const targetModuleId = moduleId || id;
    const result = await adminModuleService.deleteModule(targetModuleId, courseId);

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
  getModulesByCourse,
  getModuleById,
  updateModule,
  reorderModules,
  deleteModule,
};
