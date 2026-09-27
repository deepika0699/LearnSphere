/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';

/**
 * Validates that a string is a valid HTTP or HTTPS URL.
 * Rejects javascript:, data:, vbscript:, and relative or malformed protocols.
 *
 * @param {string} urlStr
 * @returns {boolean}
 */
export const isValidHttpUrl = (urlStr) => {
  if (typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (!trimmed || trimmed.length > 2000) return false;
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Retrieves a paginated list of published courses for public/student delivery.
 * Draft and archived courses are strictly excluded.
 *
 * @param {Object} params
 * @param {number|string} [params.page=1]
 * @param {number|string} [params.limit=12]
 * @param {string} [params.category]
 * @param {string} [params.search]
 * @param {string} [params.sort='newest']
 * @returns {Promise<Object>} { courses, pagination }
 */
export const getPublishedCourses = async ({
  page = 1,
  limit = 12,
  category,
  search,
  sort = 'newest',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  // Authoritative filter: ONLY published courses are visible to students and the public
  const filter = { status: 'published' };

  if (category && typeof category === 'string' && category.trim()) {
    const escapedCat = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.category = { $regex: new RegExp(`^${escapedCat}$`, 'i') };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  let sortCriteria = { createdAt: -1 };
  if (sort === 'oldest') {
    sortCriteria = { createdAt: 1 };
  } else if (sort === 'title_asc') {
    sortCriteria = { title: 1 };
  } else if (sort === 'title_desc') {
    sortCriteria = { title: -1 };
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .populate('courseCreator', '_id name')
      .lean(),
    Course.countDocuments(filter),
  ]);

  // Aggregate module and topic counts for returned courses
  const courseIds = courses.map((c) => c._id);
  const [moduleAgg, topicAgg] = await Promise.all([
    Module.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]),
    Topic.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]),
  ]);

  const moduleCountMap = {};
  for (const m of moduleAgg) {
    moduleCountMap[m._id.toString()] = m.count;
  }

  const topicCountMap = {};
  for (const t of topicAgg) {
    topicCountMap[t._id.toString()] = t.count;
  }

  const sanitizedCourses = courses.map((course) => {
    const creator = course.courseCreator;
    return {
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail || '',
      status: course.status,
      courseCreator: creator
        ? {
            id: creator._id ? creator._id.toString() : creator.toString(),
            name: creator.name || 'Course Creator',
          }
        : null,
      moduleCount: moduleCountMap[course._id.toString()] || 0,
      topicCount: topicCountMap[course._id.toString()] || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  });

  return {
    courses: sanitizedCourses,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      hasMore: pageNum * limitNum < total,
    },
  };
};

/**
 * Retrieves details for a single published course.
 * If course is missing, draft, or archived, throws HTTP 404.
 *
 * @param {string} courseId
 * @returns {Promise<Object>} Sanitized course details
 */
export const getPublishedCourseById = async (courseId) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Strict check: status must be 'published'
  const course = await Course.findOne({ _id: courseId, status: 'published' })
    .populate('courseCreator', '_id name')
    .lean();

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const [moduleCount, topicCount] = await Promise.all([
    Module.countDocuments({ courseId }),
    Topic.countDocuments({ courseId }),
  ]);

  const creator = course.courseCreator;

  return {
    id: course._id.toString(),
    title: course.title,
    description: course.description,
    category: course.category,
    thumbnail: course.thumbnail || '',
    status: course.status,
    courseCreator: creator
      ? {
          id: creator._id ? creator._id.toString() : creator.toString(),
          name: creator.name || 'Course Creator',
        }
      : null,
    moduleCount,
    topicCount,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
};

/**
 * Retrieves the sequential curriculum structure (modules and topics) for a published course.
 * Preserves module and topic ordering using existing order fields.
 * If course is missing, draft, or archived, throws HTTP 404.
 *
 * @param {string} courseId
 * @returns {Promise<Object>} { course, modules }
 */
export const getPublishedCourseStructure = async (courseId) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Authoritative validation: target course must be published
  const course = await Course.findOne({ _id: courseId, status: 'published' })
    .populate('courseCreator', '_id name')
    .lean();

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Query modules and topics strictly ordered by order ascending, then createdAt ascending
  const [modules, topics] = await Promise.all([
    Module.find({ courseId }).sort({ order: 1, createdAt: 1 }).lean(),
    Topic.find({ courseId })
      .sort({ order: 1, createdAt: 1 })
      .select('_id moduleId courseId title description order')
      .lean(),
  ]);

  // Group topics by moduleId
  const topicsByModuleId = {};
  for (const topic of topics) {
    const modId = topic.moduleId ? topic.moduleId.toString() : '';
    if (!topicsByModuleId[modId]) {
      topicsByModuleId[modId] = [];
    }
    topicsByModuleId[modId].push({
      id: topic._id.toString(),
      moduleId: modId,
      courseId: courseId.toString(),
      title: topic.title,
      description: topic.description || '',
      order: typeof topic.order === 'number' ? topic.order : 0,
    });
  }

  const structuredModules = modules.map((mod) => ({
    id: mod._id.toString(),
    courseId: courseId.toString(),
    title: mod.title,
    description: mod.description || '',
    order: typeof mod.order === 'number' ? mod.order : 0,
    topics: topicsByModuleId[mod._id.toString()] || [],
  }));

  return {
    course: {
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail || '',
      status: course.status,
      courseCreator: course.courseCreator
        ? {
            id: course.courseCreator._id.toString(),
            name: course.courseCreator.name || 'Course Creator',
          }
        : null,
    },
    modules: structuredModules,
  };
};

/**
 * Delivers full topic educational content strictly scoped under a published course and module.
 * Validates course -> module -> topic hierarchy.
 * Sanitizes external references to allow only HTTP/HTTPS protocols.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.moduleId
 * @param {string} params.topicId
 * @returns {Promise<Object>} Sanitized topic content
 */
export const getPublishedTopicContent = async ({ courseId, moduleId, topicId }) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    throw error;
  }

  if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Topic not found');
    error.statusCode = 404;
    throw error;
  }

  // 1. Authoritative check: Course must be published
  const course = await Course.findOne({ _id: courseId, status: 'published' })
    .select('_id status')
    .lean();

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Authoritative check: Module must belong to course
  const moduleDoc = await Module.findOne({ _id: moduleId, courseId })
    .select('_id courseId')
    .lean();

  if (!moduleDoc) {
    const error = new Error('Module not found in this course');
    error.statusCode = 404;
    throw error;
  }

  // 3. Authoritative check: Topic must belong to module and course
  const topicDoc = await Topic.findOne({ _id: topicId, moduleId, courseId }).lean();

  if (!topicDoc) {
    const error = new Error('Topic not found in this module');
    error.statusCode = 404;
    throw error;
  }

  // 4. Sanitize external reference URLs - strictly allow HTTP/HTTPS, reject javascript:, data:, vbscript:
  const safeReferences = [];
  if (Array.isArray(topicDoc.externalReferences)) {
    for (const ref of topicDoc.externalReferences) {
      if (!ref || !ref.url) continue;
      const rawUrl = String(ref.url).trim();
      if (isValidHttpUrl(rawUrl)) {
        safeReferences.push({
          id: ref._id ? ref._id.toString() : ref.id,
          title: ref.title || '',
          url: rawUrl,
          source: ref.source || '',
        });
      }
    }
  }

  // 5. Sanitize sections, code examples, images, videos, points
  const rawSections = topicDoc.content?.sections || [];
  const safeSections = Array.isArray(rawSections)
    ? [...rawSections]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((s, idx) => ({
          heading: typeof s.heading === 'string' ? s.heading : '',
          body: typeof s.body === 'string' ? s.body : '',
          order: typeof s.order === 'number' ? s.order : idx,
        }))
    : [];

  const safeCodeExamples = Array.isArray(topicDoc.codeExamples)
    ? topicDoc.codeExamples.map((ex) => ({
        id: ex._id ? ex._id.toString() : undefined,
        title: ex.title || '',
        language: ex.language || 'c',
        code: ex.code || '',
        explanation: ex.explanation || '',
      }))
    : [];

  const safeImages = Array.isArray(topicDoc.images)
    ? topicDoc.images.map((img) => ({
        id: img._id ? img._id.toString() : undefined,
        url: img.url,
        caption: img.caption || '',
        altText: img.altText || '',
      }))
    : [];

  const safeVideos = {
    english: topicDoc.videos?.english || null,
    telugu: topicDoc.videos?.telugu || null,
    hindi: topicDoc.videos?.hindi || null,
  };

  const safePoints = Array.isArray(topicDoc.importantPoints) ? topicDoc.importantPoints : [];

  return {
    id: topicDoc._id.toString(),
    moduleId: topicDoc.moduleId.toString(),
    courseId: topicDoc.courseId.toString(),
    title: topicDoc.title,
    description: topicDoc.description || '',
    order: typeof topicDoc.order === 'number' ? topicDoc.order : 0,
    content: {
      explanation: topicDoc.content?.explanation || '',
      sections: safeSections,
    },
    codeExamples: safeCodeExamples,
    importantPoints: safePoints,
    revisionPoints: safePoints,
    images: safeImages,
    videos: safeVideos,
    externalReferences: safeReferences,
    createdAt: topicDoc.createdAt,
    updatedAt: topicDoc.updatedAt,
  };
};

export default {
  isValidHttpUrl,
  getPublishedCourses,
  getPublishedCourseById,
  getPublishedCourseStructure,
  getPublishedTopicContent,
};
