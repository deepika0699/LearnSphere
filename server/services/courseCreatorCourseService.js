import mongoose from 'mongoose';
import Course from '../models/Course.js';
import User, { normalizeRole } from '../models/User.js';
import { sanitizeCourse } from './adminCourseService.js';

/**
 * Validates that an authenticated creator exists, is active, and possesses the canonical 'courseCreator' role.
 *
 * @param {string|mongoose.Types.ObjectId} creatorId
 * @returns {Promise<Object>} Safe creator profile
 */
export const validateActiveCreator = async (creatorId) => {
  if (!mongoose.Types.ObjectId.isValid(creatorId)) {
    const error = new Error('Invalid course creator ID format');
    error.statusCode = 400;
    throw error;
  }

  const creator = await User.findById(creatorId).select('_id name email role status');
  if (!creator) {
    const error = new Error('Course creator not found');
    error.statusCode = 401;
    throw error;
  }

  const canonicalRole = normalizeRole(creator.role);
  if (canonicalRole !== 'courseCreator') {
    const error = new Error('Access denied: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  if (creator.status !== 'active') {
    const error = new Error('Course creator account is not active');
    error.statusCode = 401;
    throw error;
  }

  return creator;
};

/**
 * Sanitizes and formats syllabus items to prevent arbitrary subfield injection.
 *
 * @param {Array} syllabus
 * @returns {Array} Formatted syllabus items
 */
export const formatSyllabus = (syllabus) => {
  if (!Array.isArray(syllabus)) return undefined;

  return syllabus.map((item, idx) => ({
    title: typeof item.title === 'string' ? item.title.trim() : '',
    description: typeof item.description === 'string' ? item.description.trim() : '',
    order: typeof item.order === 'number' && !isNaN(item.order) ? item.order : idx,
  }));
};

/**
 * Creates a new course owned by the authenticated Course Creator.
 * Enforces server-authoritative ownership and draft lifecycle status.
 *
 * @param {Object} params
 * @param {string} params.creatorId - Server-authenticated user ID
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.category
 * @param {string} [params.thumbnail]
 * @param {Array} [params.syllabus]
 * @param {string} [params.status]
 * @returns {Promise<Object>} Sanitized created course
 */
export const createCourse = async ({
  creatorId,
  title,
  description,
  category,
  thumbnail,
  syllabus,
  status,
}) => {
  await validateActiveCreator(creatorId);

  // Prevent creators from directly publishing courses
  if (status === 'published') {
    const error = new Error('Course creators cannot directly publish courses');
    error.statusCode = 400;
    throw error;
  }

  const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

  // Strictly enforce server-authoritative ownership and draft status for new courses
  const courseDoc = new Course({
    title: typeof title === 'string' ? title.trim() : '',
    description: typeof description === 'string' ? description.trim() : '',
    category: typeof category === 'string' ? category.trim() : '',
    thumbnail: typeof thumbnail === 'string' ? thumbnail.trim() : '',
    syllabus: Array.isArray(syllabus) ? formatSyllabus(syllabus) : [],
    courseCreator: creatorObjectId,
    status: 'draft', // Course creators cannot directly publish; new courses always default to draft
  });

  const savedCourse = await courseDoc.save();

  await savedCourse.populate([
    { path: 'courseCreator', select: 'name email' },
  ]);

  return sanitizeCourse(savedCourse);
};

/**
 * Retrieves a paginated and filtered list of courses owned strictly by the authenticated creator.
 *
 * @param {Object} params
 * @param {string} params.creatorId - Authenticated creator ID
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.status]
 * @param {string} [params.category]
 * @param {string} [params.search]
 * @returns {Promise<Object>} Object containing courses list and pagination metadata
 */
export const getCourses = async ({
  creatorId,
  page = 1,
  limit = 10,
  status,
  category,
  search,
}) => {
  if (!mongoose.Types.ObjectId.isValid(creatorId)) {
    const error = new Error('Invalid course creator ID format');
    error.statusCode = 400;
    throw error;
  }

  const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = parseInt(limit, 10) || 10;
  const normalizedLimit = Math.min(100, Math.max(1, parsedLimit));

  const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

  // Ownership condition: strictly scoped to the authenticated creator
  const conditions = [
    { courseCreator: creatorObjectId },
  ];

  // Optional status filter
  const validStatuses = ['draft', 'published', 'archived'];
  if (status && validStatuses.includes(status)) {
    conditions.push({ status });
  }

  // Optional category filter
  if (category && typeof category === 'string' && category.trim().length > 0) {
    conditions.push({ category: category.trim() });
  }

  // Optional search filter across title, description, and category with regex escaping
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    conditions.push({
      $or: [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } },
      ],
    });
  }

  const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };
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
 * Retrieves a single course owned by the authenticated creator.
 * Fails with 404 if the course does not exist OR belongs to another creator,
 * ensuring zero leakage of another creator's course existence.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.creatorId
 * @returns {Promise<Object>} Sanitized course
 */
export const getCourseById = async ({ courseId, creatorId }) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(creatorId)) {
    const error = new Error('Invalid creator ID format');
    error.statusCode = 400;
    throw error;
  }

  const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

  // Authoritative ownership query: prevents leaking other creators' course existence
  const course = await Course.findOne({
    _id: courseId,
    courseCreator: creatorObjectId,
  })
    .populate('courseCreator', 'name email')
    .lean();

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeCourse(course);
};

/**
 * Updates an existing course owned by the authenticated creator using strict field whitelisting.
 * Fails with 404 if the course does not exist OR belongs to another creator.
 * Rejects publishing attempts with 400.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.creatorId
 * @param {Object} params.updateData
 * @returns {Promise<Object>} Sanitized updated course
 */
export const updateCourse = async ({ courseId, creatorId, updateData = {} }) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(creatorId)) {
    const error = new Error('Invalid creator ID format');
    error.statusCode = 400;
    throw error;
  }

  const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

  const existingCourse = await Course.findOne({
    _id: courseId,
    courseCreator: creatorObjectId,
  });

  if (!existingCourse) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent publishing directly through creator route
  if (updateData.status === 'published') {
    const error = new Error('Course creators cannot directly publish courses');
    error.statusCode = 400;
    throw error;
  }

  // Whitelist-only updates: assign allowed fields explicitly
  if (typeof updateData.title === 'string') {
    existingCourse.title = updateData.title.trim();
  }

  if (typeof updateData.description === 'string') {
    existingCourse.description = updateData.description.trim();
  }

  if (typeof updateData.category === 'string') {
    existingCourse.category = updateData.category.trim();
  }

  if (typeof updateData.thumbnail === 'string') {
    existingCourse.thumbnail = updateData.thumbnail.trim();
  }

  if (Array.isArray(updateData.syllabus)) {
    existingCourse.syllabus = formatSyllabus(updateData.syllabus);
  }

  // Only allow non-published status transitions (draft or archived)
  if (updateData.status && ['draft', 'archived'].includes(updateData.status)) {
    existingCourse.status = updateData.status;
  } else if (updateData.status && updateData.status !== existingCourse.status) {
    const error = new Error('Invalid status specified');
    error.statusCode = 400;
    throw error;
  }

  // Disallowed fields (courseCreator, createdAt, updatedAt, approval, etc.) are strictly ignored

  const updatedCourse = await existingCourse.save();

  await updatedCourse.populate([
    { path: 'courseCreator', select: 'name email' },
  ]);

  return sanitizeCourse(updatedCourse);
};

export default {
  validateActiveCreator,
  formatSyllabus,
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
};
