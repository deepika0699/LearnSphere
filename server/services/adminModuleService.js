import mongoose from 'mongoose';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Topic from '../models/Topic.js';

/**
 * Sanitizes a module document for safe API output.
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
 * Creates a new module under an existing course.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {number} [params.order]
 * @returns {Promise<Object>}
 */
export const createModule = async ({ courseId, title, description, order }) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  // 1. Authoritative verification that target course exists
  const course = await Course.findById(courseId).select('_id');
  if (!course) {
    const error = new Error('Referenced course not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Determine order if not explicitly specified
  let moduleOrder = order;
  if (moduleOrder === undefined || moduleOrder === null || typeof moduleOrder !== 'number' || isNaN(moduleOrder)) {
    const lastModule = await Module.findOne({ courseId }).sort({ order: -1 }).select('order').lean();
    moduleOrder = lastModule && typeof lastModule.order === 'number' ? lastModule.order + 1 : 0;
  }

  // 3. Construct clean whitelist payload
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
 * Retrieves all modules belonging to a course, sorted strictly by order.
 *
 * @param {string} courseId
 * @returns {Promise<Array>}
 */
export const getModulesByCourse = async (courseId) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  // Authoritative check that course exists
  const course = await Course.findById(courseId).select('_id').lean();
  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const modules = await Module.find({ courseId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return modules.map(sanitizeModule);
};

/**
 * Retrieves a single module by its ID, optionally enforcing parent course boundary.
 *
 * @param {string} moduleId
 * @param {string} [courseId]
 * @returns {Promise<Object|null>}
 */
export const getModuleById = async (moduleId, courseId = null) => {
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  if (courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const error = new Error('Invalid course ID format');
      error.statusCode = 400;
      throw error;
    }

    const course = await Course.findById(courseId).select('_id').lean();
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const module = await Module.findById(moduleId).lean();
  if (!module) return null;

  // Enforce course boundary: module must belong to the specified course
  if (courseId && module.courseId.toString() !== courseId.toString()) {
    const error = new Error('Module does not belong to the specified course');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeModule(module);
};

/**
 * Updates an existing module with strict field whitelisting and optional course boundary check.
 *
 * @param {string} moduleId
 * @param {Object} updateData
 * @param {string} [courseId]
 * @returns {Promise<Object>}
 */
export const updateModule = async (moduleId, updateData = {}, courseId = null) => {
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  if (courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const error = new Error('Invalid course ID format');
      error.statusCode = 400;
      throw error;
    }

    const course = await Course.findById(courseId).select('_id').lean();
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const existingModule = await Module.findById(moduleId);
  if (!existingModule) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    throw error;
  }

  // Enforce course boundary: module must belong to the specified course
  if (courseId && existingModule.courseId.toString() !== courseId.toString()) {
    const error = new Error('Module does not belong to the specified course');
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

  const updatedModule = await Module.findByIdAndUpdate(
    moduleId,
    { $set: updateFields },
    { returnDocument: 'after', runValidators: true }
  );

  return sanitizeModule(updatedModule);
};

/**
 * Reorders modules within a course sequentially and deterministically.
 *
 * @param {string} courseId - ID of the course containing the modules
 * @param {string[]} moduleIds - Ordered array of module IDs representing the entire module set
 * @returns {Promise<Array>} Sanitized updated modules sorted by order
 */
export const reorderModules = async (courseId, moduleIds) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  // 1. Authoritative verification that target course exists
  const course = await Course.findById(courseId).select('_id').lean();
  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate moduleIds array
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

  // 3. Reject duplicate IDs
  const uniqueIds = new Set(trimmedIds);
  if (uniqueIds.size !== trimmedIds.length) {
    const error = new Error('Duplicate module IDs are not allowed in reorder list');
    error.statusCode = 400;
    throw error;
  }

  // 4. Course isolation: verify every supplied module belongs to this specific course
  const existingModules = await Module.find({ courseId }).select('_id courseId title description order').lean();

  // If the supplied module set does not match the course's module set, reject safely
  if (trimmedIds.length !== existingModules.length) {
    const error = new Error(
      `The provided module list does not match the complete set of modules for this course. Expected ${existingModules.length} modules, received ${trimmedIds.length}.`
    );
    error.statusCode = 400;
    throw error;
  }

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
 * Safely deletes a module and prevents orphaned topics by cascading deletion.
 * Enforces course boundary if courseId is provided.
 *
 * @param {string} moduleId
 * @param {string} [courseId]
 * @returns {Promise<{ deleted: boolean, deletedModuleId: string }>}
 */
export const deleteModule = async (moduleId, courseId = null) => {
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  if (courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const error = new Error('Invalid course ID format');
      error.statusCode = 400;
      throw error;
    }

    const course = await Course.findById(courseId).select('_id').lean();
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const existing = await Module.findById(moduleId);
  if (!existing) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    throw error;
  }

  // Enforce course boundary: module must belong to the specified course
  if (courseId && existing.courseId.toString() !== courseId.toString()) {
    const error = new Error('Module does not belong to the specified course');
    error.statusCode = 404;
    throw error;
  }

  // Delete all topics belonging to this module to guarantee no orphans
  await Topic.deleteMany({ moduleId });
  await Module.findByIdAndDelete(moduleId);

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
