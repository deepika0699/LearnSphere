import mongoose from 'mongoose';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Topic from '../models/Topic.js';

/**
 * Sanitizes a module document for safe API output.
 * Ensures internal sensitive fields or raw MongoDB objects are never leaked.
 *
 * @param {Object} module
 * @returns {Object|null}
 */
export const sanitizeModule = (module) => {
  if (!module) return null;
  return {
    id: module._id ? module._id.toString() : module.id,
    courseId: module.courseId?._id ? module.courseId._id.toString() : module.courseId?.toString(),
    title: module.title,
    description: module.description || '',
    order: typeof module.order === 'number' ? module.order : 0,
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  };
};

/**
 * Creates a new module under an authenticated Course Creator's course.
 * Ownership is guaranteed by the parent course document verified upstream.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.courseId - Validated course ID
 * @param {string} params.title - Validated title
 * @param {string} [params.description] - Validated description
 * @param {number} [params.order] - Optional order number
 * @returns {Promise<Object>} Sanitized new module
 */
export const createModule = async ({ courseId, title, description, order }) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  // 1. Double check parent course existence
  const course = await Course.findById(courseId).select('_id courseCreator').lean();
  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Determine sequential order if not explicitly specified
  let moduleOrder = order;
  if (moduleOrder === undefined || moduleOrder === null || typeof moduleOrder !== 'number' || isNaN(moduleOrder)) {
    const lastModule = await Module.findOne({ courseId }).sort({ order: -1 }).select('order').lean();
    moduleOrder = lastModule && typeof lastModule.order === 'number' ? lastModule.order + 1 : 0;
  }

  // 3. Strict whitelist payload
  const cleanData = {
    courseId,
    title: typeof title === 'string' ? title.trim() : '',
    description: typeof description === 'string' ? description.trim() : '',
    order: Math.max(0, moduleOrder),
  };

  const newModule = await Module.create(cleanData);
  return sanitizeModule(newModule);
};

/**
 * Retrieves all modules belonging to the specified course, sorted strictly by order.
 *
 * @param {string|mongoose.Types.ObjectId} courseId
 * @returns {Promise<Array>} Sanitized modules list
 */
export const getModulesByCourse = async (courseId) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  const modules = await Module.find({ courseId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return modules.map(sanitizeModule);
};

/**
 * Retrieves a single module by ID, strictly scoped to the parent course.
 * Returns null if not found or belongs to another course.
 *
 * @param {string} moduleId
 * @param {string|mongoose.Types.ObjectId} courseId
 * @returns {Promise<Object|null>}
 */
export const getModuleById = async (moduleId, courseId) => {
  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  const module = await Module.findOne({ _id: moduleId, courseId }).lean();
  if (!module) return null;

  return sanitizeModule(module);
};

/**
 * Updates an existing module with strict field whitelisting and course scoping.
 *
 * @param {string} moduleId
 * @param {string|mongoose.Types.ObjectId} courseId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
export const updateModule = async (moduleId, courseId, updateData = {}) => {
  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  // Find module scoped to this course
  const existingModule = await Module.findOne({ _id: moduleId, courseId });
  if (!existingModule) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  if (typeof updateData.title === 'string' && updateData.title.trim().length > 0) {
    updateFields.title = updateData.title.trim();
  }

  if (typeof updateData.description === 'string') {
    updateFields.description = updateData.description.trim();
  }

  if (typeof updateData.order === 'number' && !isNaN(updateData.order)) {
    updateFields.order = Math.max(0, updateData.order);
  }

  if (Object.keys(updateFields).length === 0) {
    return sanitizeModule(existingModule);
  }

  const updatedModule = await Module.findOneAndUpdate(
    { _id: moduleId, courseId },
    { $set: updateFields },
    { returnDocument: 'after', runValidators: true }
  );

  return sanitizeModule(updatedModule);
};

/**
 * Reorders modules within a course sequentially and deterministically.
 * Enforces that every module belongs to the specified course and the list is complete.
 *
 * @param {string|mongoose.Types.ObjectId} courseId - ID of the parent course
 * @param {string[]} moduleIds - Ordered array of module IDs representing the entire module set
 * @returns {Promise<Array>} Sanitized updated modules sorted by order
 */
export const reorderModules = async (courseId, moduleIds) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(moduleIds)) {
    const error = new Error('moduleIds must be an array of module IDs');
    error.statusCode = 400;
    throw error;
  }

  for (const id of moduleIds) {
    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
      const error = new Error(`Invalid module ID format in reorder list: ${id}`);
      error.statusCode = 400;
      throw error;
    }
  }

  const trimmedIds = moduleIds.map((id) => id.trim());

  // 1. Reject duplicate IDs
  const uniqueIds = new Set(trimmedIds);
  if (uniqueIds.size !== trimmedIds.length) {
    const error = new Error('Duplicate module IDs are not allowed in reorder list');
    error.statusCode = 400;
    throw error;
  }

  // 2. Query all existing modules strictly belonging to this course
  const existingModules = await Module.find({ courseId }).select('_id courseId').lean();

  // 3. Reject partial / incomplete module sets
  if (trimmedIds.length !== existingModules.length) {
    const error = new Error(
      `The provided module list does not match the complete set of modules for this course. Expected ${existingModules.length} modules, received ${trimmedIds.length}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Ensure every module belongs to this course
  const existingIdSet = new Set(existingModules.map((m) => m._id.toString()));
  for (const id of trimmedIds) {
    if (!existingIdSet.has(id)) {
      const error = new Error(`Module ${id} does not belong to this course`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Deterministic and sequential order assignment: 0, 1, 2, ...
  const bulkOps = trimmedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, courseId },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await Module.bulkWrite(bulkOps);
  }

  // 6. Return refreshed, sanitized modules ordered sequentially
  const updatedModules = await Module.find({ courseId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return updatedModules.map(sanitizeModule);
};

/**
 * Safely deletes a module belonging to a Course Creator's course.
 * Cascades deletion of topics strictly belonging to this module and course.
 * Never deletes topics from another module or course.
 *
 * @param {string} moduleId
 * @param {string|mongoose.Types.ObjectId} courseId
 * @returns {Promise<{ deleted: boolean, deletedModuleId: string }>}
 */
export const deleteModule = async (moduleId, courseId) => {
  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  // Ensure module exists and belongs to this course
  const existing = await Module.findOne({ _id: moduleId, courseId });
  if (!existing) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    throw error;
  }

  // Strictly cascade deletion of child topics scoped to this module and course
  await Topic.deleteMany({ moduleId: existing._id, courseId });

  // Delete the module
  await Module.findOneAndDelete({ _id: existing._id, courseId });

  return { deleted: true, deletedModuleId: moduleId };
};

export default {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  reorderModules,
  deleteModule,
  sanitizeModule,
};
