import mongoose from 'mongoose';
import Course from '../models/Course.js';
import User, { normalizeRole } from '../models/User.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import { sanitizeModule } from './adminModuleService.js';
import { sanitizeTopic } from './adminTopicService.js';

/**
 * Validates that a course creator exists, is active, and possesses the canonical 'courseCreator' role.
 *
 * @param {string} creatorId
 * @returns {Promise<Object>} Safe course creator profile
 */
const validateActiveCourseCreator = async (creatorId) => {
  if (!mongoose.Types.ObjectId.isValid(creatorId)) {
    const error = new Error('Invalid course creator ID format');
    error.statusCode = 400;
    throw error;
  }

  const creator = await User.findById(creatorId).select('_id name email role status');
  if (!creator) {
    const error = new Error('Course creator not found');
    error.statusCode = 400;
    throw error;
  }

  if (normalizeRole(creator.role) !== 'courseCreator') {
    const error = new Error('Referenced user is not a course creator');
    error.statusCode = 400;
    throw error;
  }

  if (creator.status !== 'active') {
    const error = new Error('Course creator account is not active');
    error.statusCode = 400;
    throw error;
  }

  return creator;
};

/**
 * Sanitizes and normalizes a course document to guarantee safe API responses.
 * Ensures course creator information is restricted to safe public fields (id, name, email)
 * and strips any potential sensitive or internal fields.
 *
 * @param {Object} course - Mongoose course doc or lean object
 * @returns {Object} Sanitized course output
 */
export const sanitizeCourse = (course) => {
  if (!course) return null;

  const rawCreator = course.courseCreator;
  let creatorData = null;
  if (rawCreator) {
    if (typeof rawCreator === 'object' && rawCreator._id) {
      creatorData = {
        id: rawCreator._id.toString(),
        name: rawCreator.name,
        email: rawCreator.email,
      };
    } else {
      creatorData = {
        id: rawCreator.toString(),
      };
    }
  }

  return {
    id: course._id ? course._id.toString() : course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    courseCreator: creatorData,
    thumbnail: course.thumbnail || '',
    syllabus: Array.isArray(course.syllabus)
      ? course.syllabus.map((item, idx) => ({
          id: item._id ? item._id.toString() : String(idx),
          title: item.title,
          description: item.description || '',
          order: typeof item.order === 'number' ? item.order : idx,
        }))
      : [],
    status: course.status,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
};

/**
 * Creates a new course under administrative control.
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.category
 * @param {string} params.courseCreator
 * @param {string} [params.thumbnail]
 * @param {Array} [params.syllabus]
 * @param {string} [params.status]
 * @returns {Promise<Object>} Sanitized course object
 */
export const createCourse = async ({
  title,
  description,
  category,
  courseCreator,
  thumbnail,
  syllabus,
  status = 'draft',
}) => {
  const creatorId = courseCreator;
  if (!creatorId) {
    const error = new Error('Course creator is required');
    error.statusCode = 400;
    throw error;
  }

  // 1. Authoritative verification of assigned course creator
  await validateActiveCourseCreator(creatorId);

  // 2. Validate and restrict initial status
  const validStatuses = ['draft', 'published', 'archived'];
  const courseStatus = validStatuses.includes(status) ? status : 'draft';

  // 3. Construct clean course data with explicit whitelist
  const cleanData = {
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    courseCreator: creatorId,
    thumbnail: typeof thumbnail === 'string' ? thumbnail.trim() : '',
    syllabus: Array.isArray(syllabus) ? syllabus : [],
    status: courseStatus,
  };

  const newCourse = await Course.create(cleanData);
  await newCourse.populate([
    { path: 'courseCreator', select: 'name email' },
  ]);

  return sanitizeCourse(newCourse);
};

/**
 * Retrieves a paginated and optionally filtered list of courses.
 *
 * @param {Object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.status]
 * @param {string} [params.category]
 * @param {string} [params.search]
 * @returns {Promise<Object>} Object containing courses list and pagination metadata
 */
export const getCourses = async ({ page = 1, limit = 10, status, category, search }) => {
  const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = parseInt(limit, 10) || 10;
  const normalizedLimit = Math.min(100, Math.max(1, parsedLimit));

  // Build filter safely without spreading client query parameters directly
  const filter = {};
  const validStatuses = ['draft', 'published', 'archived'];
  if (status && validStatuses.includes(status)) {
    filter.status = status;
  }
  if (category && typeof category === 'string' && category.trim().length > 0) {
    filter.category = category.trim();
  }

  // Safe server-side search across course title, description, and category
  if (search && typeof search === 'string' && search.trim().length > 0) {
    // Escape regex metacharacters to prevent regex injection and ReDoS:
    // . * + ? ^ $ { } ( ) | [ ] \
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
      { category: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const skip = (normalizedPage - 1) * normalizedLimit;

  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit)
      .populate('courseCreator', 'name email')
      .lean(),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedLimit);

  return {
    courses: courses.map(sanitizeCourse),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages,
      hasNextPage: normalizedPage < totalPages,
      hasPreviousPage: normalizedPage > 1,
    },
  };
};

/**
 * Retrieves a single course by its MongoDB ObjectId.
 *
 * @param {string} courseId
 * @returns {Promise<Object>} Sanitized course object or null
 */
export const getCourseById = async (courseId) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  const course = await Course.findById(courseId)
    .populate('courseCreator', 'name email')
    .lean();

  if (!course) {
    return null;
  }

  return sanitizeCourse(course);
};

/**
 * Updates an existing course using strict field whitelisting.
 * Prevents mass-assignment vulnerabilities.
 *
 * @param {string} courseId
 * @param {Object} updateData
 * @returns {Promise<Object>} Sanitized updated course object
 */
export const updateCourse = async (courseId, updateData = {}) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  const existingCourse = await Course.findById(courseId);
  if (!existingCourse) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Whitelist and sanitize fields explicitly
  const updateFields = {};

  if (typeof updateData.title === 'string' && updateData.title.trim().length > 0) {
    updateFields.title = updateData.title.trim();
  }

  if (typeof updateData.description === 'string' && updateData.description.trim().length > 0) {
    updateFields.description = updateData.description.trim();
  }

  if (typeof updateData.category === 'string' && updateData.category.trim().length > 0) {
    updateFields.category = updateData.category.trim();
  }

  const creatorId = updateData.courseCreator;
  if (creatorId) {
    await validateActiveCourseCreator(creatorId);
    updateFields.courseCreator = creatorId;
  }

  if (typeof updateData.thumbnail === 'string') {
    updateFields.thumbnail = updateData.thumbnail.trim();
  }

  if (Array.isArray(updateData.syllabus)) {
    updateFields.syllabus = updateData.syllabus;
  }

  if (updateData.status && ['draft', 'published', 'archived'].includes(updateData.status)) {
    updateFields.status = updateData.status;
  }

  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    { $set: updateFields },
    { returnDocument: 'after', runValidators: true }
  )
    .populate('courseCreator', 'name email');

  return sanitizeCourse(updatedCourse);
};

/**
 * Updates the lifecycle status of a course (draft, published, archived).
 *
 * @param {string} courseId
 * @param {string} newStatus
 * @returns {Promise<Object>} Sanitized updated course object
 */
export const updateCourseStatus = async (courseId, newStatus) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  const validStatuses = ['draft', 'published', 'archived'];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error('Invalid course status');
    error.statusCode = 400;
    throw error;
  }

  const existingCourse = await Course.findById(courseId);
  if (!existingCourse) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    { $set: { status: newStatus } },
    { returnDocument: 'after', runValidators: true }
  )
    .populate('courseCreator', 'name email');

  return sanitizeCourse(updatedCourse);
};

/**
 * Retrieves the complete course hierarchy:
 * Course details -> Ordered Modules -> Ordered Topics.
 * Supports efficient hierarchical rendering of syllabus / learning trees.
 *
 * @param {string} courseId
 * @returns {Promise<Object|null>}
 */
export const getCourseStructure = async (courseId) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  const course = await Course.findById(courseId)
    .populate('courseCreator', 'name email')
    .lean();

  if (!course) {
    return null;
  }

  // Fetch modules and topics in parallel, ordered strictly
  const [modules, topics] = await Promise.all([
    Module.find({ courseId }).sort({ order: 1, createdAt: 1 }).lean(),
    Topic.find({ courseId }).sort({ order: 1, createdAt: 1 }).lean(),
  ]);

  // Group topics by moduleId
  const topicsByModuleId = {};
  for (const topic of topics) {
    const modId = topic.moduleId ? topic.moduleId.toString() : '';
    if (!topicsByModuleId[modId]) {
      topicsByModuleId[modId] = [];
    }
    topicsByModuleId[modId].push(sanitizeTopic(topic));
  }

  const structuredModules = modules.map((mod) => {
    const sanitizedMod = sanitizeModule(mod);
    sanitizedMod.topics = topicsByModuleId[sanitizedMod.id] || [];
    return sanitizedMod;
  });

  return {
    course: sanitizeCourse(course),
    modules: structuredModules,
  };
};

export default {
  createCourse,
  getCourses,
  getCourseById,
  getCourseStructure,
  updateCourse,
  updateCourseStatus,
};
