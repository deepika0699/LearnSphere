import mongoose from 'mongoose';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';

/**
 * Sanitizes a topic document for safe API output.
 * Ensures internal Mongoose properties, raw buffers, passwords, or tokens are never leaked.
 *
 * @param {Object} topic
 * @returns {Object|null}
 */
export const sanitizeTopic = (topic) => {
  if (!topic) return null;
  return {
    id: topic._id ? topic._id.toString() : topic.id,
    moduleId: topic.moduleId?._id ? topic.moduleId._id.toString() : topic.moduleId?.toString(),
    courseId: topic.courseId?._id ? topic.courseId._id.toString() : topic.courseId?.toString(),
    title: topic.title,
    description: topic.description || '',
    order: typeof topic.order === 'number' ? topic.order : 0,
    content: topic.content || { explanation: '', sections: [] },
    images: Array.isArray(topic.images)
      ? topic.images.map((img) => ({
          id: img._id ? img._id.toString() : undefined,
          url: img.url,
          caption: img.caption || '',
          altText: img.altText || '',
        }))
      : [],
    codeExamples: Array.isArray(topic.codeExamples)
      ? topic.codeExamples.map((ex) => ({
          id: ex._id ? ex._id.toString() : undefined,
          title: ex.title || '',
          language: ex.language || 'c',
          code: ex.code,
          explanation: ex.explanation || '',
        }))
      : [],
    importantPoints: Array.isArray(topic.importantPoints) ? topic.importantPoints : [],
    revisionPoints: Array.isArray(topic.importantPoints) ? topic.importantPoints : [],
    videos: {
      english: topic.videos?.english || null,
      telugu: topic.videos?.telugu || null,
      hindi: topic.videos?.hindi || null,
    },
    externalReferences: Array.isArray(topic.externalReferences)
      ? topic.externalReferences.map((ref) => ({
          id: ref._id ? ref._id.toString() : ref.id,
          title: ref.title || '',
          url: ref.url,
          source: ref.source || '',
        }))
      : [],
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
  };
};

/**
 * Creates a new topic strictly scoped under the validated module and course.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.courseId - Parent course ID
 * @param {string|mongoose.Types.ObjectId} params.moduleId - Parent module ID
 * @param {string} params.title - Validated title
 * @param {string} [params.description] - Validated description
 * @param {number} [params.order] - Optional order index
 * @returns {Promise<Object>} Sanitized topic
 */
export const createTopic = async ({ courseId, moduleId, title, description, order }) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  // Verify module exists and strictly belongs to the parent course
  const parentModule = await Module.findOne({ _id: moduleId, courseId }).select('_id courseId').lean();
  if (!parentModule) {
    const error = new Error('Module not found in this course');
    error.statusCode = 404;
    throw error;
  }

  // Determine sequential order if omitted
  let topicOrder = order;
  if (topicOrder === undefined || topicOrder === null || typeof topicOrder !== 'number' || isNaN(topicOrder)) {
    const lastTopic = await Topic.findOne({ moduleId, courseId }).sort({ order: -1 }).select('order').lean();
    topicOrder = lastTopic && typeof lastTopic.order === 'number' ? lastTopic.order + 1 : 0;
  }

  // Strict whitelist of creator-allowed fields
  const cleanData = {
    moduleId,
    courseId,
    title: typeof title === 'string' ? title.trim() : '',
    description: typeof description === 'string' ? description.trim() : '',
    order: Math.max(0, topicOrder),
  };

  const newTopic = await Topic.create(cleanData);
  return sanitizeTopic(newTopic);
};

/**
 * Retrieves all topics belonging to a specific module within a course, sorted by order.
 *
 * @param {string|mongoose.Types.ObjectId} courseId
 * @param {string|mongoose.Types.ObjectId} moduleId
 * @returns {Promise<Array>} Sanitized topics list
 */
export const getTopicsByModule = async (courseId, moduleId) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  // Confirm module belongs to course
  const parentModule = await Module.findOne({ _id: moduleId, courseId }).select('_id courseId').lean();
  if (!parentModule) {
    const error = new Error('Module not found in this course');
    error.statusCode = 404;
    throw error;
  }

  const topics = await Topic.find({ moduleId, courseId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return topics.map(sanitizeTopic);
};

/**
 * Retrieves a single topic by ID, strictly scoped to its parent module and course.
 *
 * @param {string} topicId
 * @param {string|mongoose.Types.ObjectId} moduleId
 * @param {string|mongoose.Types.ObjectId} courseId
 * @returns {Promise<Object|null>} Sanitized topic or null
 */
export const getTopicById = async (topicId, moduleId, courseId) => {
  if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Invalid topic ID format');
    error.statusCode = 400;
    throw error;
  }

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

  const topic = await Topic.findOne({ _id: topicId, moduleId, courseId }).lean();
  if (!topic) return null;

  return sanitizeTopic(topic);
};

/**
 * Updates a topic with strict field whitelisting and module/course scoping.
 *
 * @param {string} topicId
 * @param {string|mongoose.Types.ObjectId} moduleId
 * @param {string|mongoose.Types.ObjectId} courseId
 * @param {Object} updateData
 * @returns {Promise<Object>} Updated sanitized topic
 */
export const updateTopic = async (topicId, moduleId, courseId, updateData = {}) => {
  if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Invalid topic ID format');
    error.statusCode = 400;
    throw error;
  }

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

  const existingTopic = await Topic.findOne({ _id: topicId, moduleId, courseId });
  if (!existingTopic) {
    const error = new Error('Topic not found');
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
    return sanitizeTopic(existingTopic);
  }

  const updatedTopic = await Topic.findOneAndUpdate(
    { _id: topicId, moduleId, courseId },
    { $set: updateFields },
    { returnDocument: 'after', runValidators: true }
  );

  return sanitizeTopic(updatedTopic);
};

/**
 * Deletes a topic strictly scoped to the specified module and course.
 * Affects only the target topic and never sibling topics.
 *
 * @param {string} topicId
 * @param {string|mongoose.Types.ObjectId} moduleId
 * @param {string|mongoose.Types.ObjectId} courseId
 * @returns {Promise<{ deleted: boolean, deletedTopicId: string }>}
 */
export const deleteTopic = async (topicId, moduleId, courseId) => {
  if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Invalid topic ID format');
    error.statusCode = 400;
    throw error;
  }

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

  const existing = await Topic.findOne({ _id: topicId, moduleId, courseId });
  if (!existing) {
    const error = new Error('Topic not found');
    error.statusCode = 404;
    throw error;
  }

  await Topic.findOneAndDelete({ _id: existing._id, moduleId, courseId });

  return { deleted: true, deletedTopicId: topicId };
};

/**
 * Reorders topics belonging to a module sequentially and deterministically.
 * Enforces that every topic belongs to the specified module/course and the list is complete.
 *
 * @param {string|mongoose.Types.ObjectId} courseId
 * @param {string|mongoose.Types.ObjectId} moduleId
 * @param {string[]} topicIds - Array of topic ObjectIds representing the entire set of topics
 * @returns {Promise<Array>} Sanitized updated topics sorted by order
 */
export const reorderTopics = async (courseId, moduleId, topicIds) => {
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Invalid course ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  // 1. Verify parent module exists in course
  const parentModule = await Module.findOne({ _id: moduleId, courseId }).select('_id courseId').lean();
  if (!parentModule) {
    const error = new Error('Module not found in this course');
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(topicIds)) {
    const error = new Error('topicIds must be an array of topic IDs');
    error.statusCode = 400;
    throw error;
  }

  for (const id of topicIds) {
    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
      const error = new Error(`Invalid topic ID format in reorder list: ${id}`);
      error.statusCode = 400;
      throw error;
    }
  }

  const trimmedIds = topicIds.map((id) => id.trim());

  // 2. Reject duplicates
  const uniqueIds = new Set(trimmedIds);
  if (uniqueIds.size !== trimmedIds.length) {
    const error = new Error('Duplicate topic IDs are not allowed in reorder list');
    error.statusCode = 400;
    throw error;
  }

  // 3. Query all existing topics belonging to this module and course
  const existingTopics = await Topic.find({ moduleId, courseId }).select('_id').lean();

  // 4. Reject incomplete/partial set
  if (trimmedIds.length !== existingTopics.length) {
    const error = new Error(
      `The provided topic list does not match the complete set of topics for this module. Expected ${existingTopics.length} topics, received ${trimmedIds.length}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Ensure every topic belongs to this module and course
  const existingIdSet = new Set(existingTopics.map((t) => t._id.toString()));
  for (const id of trimmedIds) {
    if (!existingIdSet.has(id)) {
      const error = new Error(`Topic ${id} does not belong to this module and course`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 6. Deterministic sequential order assignment: 0, 1, 2, ...
  const bulkOps = trimmedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, moduleId, courseId },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await Topic.bulkWrite(bulkOps);
  }

  // 7. Return refreshed, sanitized topics ordered sequentially
  const updatedTopics = await Topic.find({ moduleId, courseId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return updatedTopics.map(sanitizeTopic);
};

/**
 * Validates whether a URL or path is safe and well-formed.
 * Rejects executable/script protocols like javascript:, data:, vbscript:.
 *
 * @param {string} str
 * @returns {boolean}
 */
export const isValidUrl = (str) => {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;

  // Explicitly reject executable or script URLs
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return false;
  }

  // Safe relative paths: e.g. /assets/images/diagram.png
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !/[<>"'`;{}]/.test(trimmed)) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validates a YouTube video reference.
 * Accepts either an 11-character YouTube video ID or a full YouTube URL.
 * Rejects script/executable protocols and non-YouTube hosts.
 *
 * @param {string} str
 * @returns {boolean}
 */
export const isValidYouTubeReference = (str) => {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed || trimmed.length > 1000) return false;

  // Explicitly reject executable or script URLs
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return false;
  }

  // 11-character video ID (e.g. dQw4w9WgXcQ)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    const isYouTubeHost =
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be' ||
      host.endsWith('.youtu.be') ||
      host === 'youtube-nocookie.com' ||
      host.endsWith('.youtube-nocookie.com');

    if (!isYouTubeHost) return false;

    // Check youtu.be/<id>
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id);
    }

    // Check /watch?v=<id>
    if (parsed.pathname === '/watch') {
      const v = parsed.searchParams.get('v');
      return Boolean(v && /^[a-zA-Z0-9_-]{11}$/.test(v));
    }

    // Check /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const pathMatch = parsed.pathname.match(/^\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})/);
    if (pathMatch) {
      return true;
    }

    // Fallback if 'v' query param exists
    if (parsed.searchParams.has('v')) {
      const v = parsed.searchParams.get('v');
      return Boolean(v && /^[a-zA-Z0-9_-]{11}$/.test(v));
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Validates and sanitizes multi-language video references.
 *
 * @param {Object} videosInput
 * @param {Object} [existingVideos]
 * @returns {Object}
 */
export const sanitizeAndValidateVideos = (videosInput, existingVideos = {}) => {
  if (!videosInput || typeof videosInput !== 'object' || Array.isArray(videosInput)) {
    const err = new Error('Videos must be an object');
    err.statusCode = 400;
    throw err;
  }

  const allowedLangs = ['english', 'telugu', 'hindi'];
  const keys = Object.keys(videosInput);
  const unexpected = keys.filter((k) => !allowedLangs.includes(k) || k.startsWith('$') || k.includes('.'));
  if (unexpected.length > 0) {
    const err = new Error(`Videos contains unexpected field(s): ${unexpected.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const sanitized = {
    english: existingVideos?.english || null,
    telugu: existingVideos?.telugu || null,
    hindi: existingVideos?.hindi || null,
  };

  for (const lang of allowedLangs) {
    if (videosInput[lang] !== undefined) {
      const val = videosInput[lang];
      if (val === null || val === '') {
        sanitized[lang] = null;
      } else if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.length === 0) {
          sanitized[lang] = null;
        } else if (trimmed.length > 1000) {
          const err = new Error(`Video URL for ${lang} cannot exceed 1000 characters`);
          err.statusCode = 400;
          throw err;
        } else if (!isValidYouTubeReference(trimmed)) {
          const err = new Error(`Invalid YouTube reference for ${lang}: must be an 11-character video ID or valid YouTube URL`);
          err.statusCode = 400;
          throw err;
        } else {
          sanitized[lang] = trimmed;
        }
      } else {
        const err = new Error(`Video URL for ${lang} must be a string or null`);
        err.statusCode = 400;
        throw err;
      }
    }
  }

  return sanitized;
};

/**
 * Validates and sanitizes external educational references.
 * External references are links only; external content is never scraped or downloaded.
 * Rejects executable/script protocols like javascript:, data:, vbscript:.
 *
 * @param {Array} referencesInput
 * @returns {Array}
 */
export const sanitizeAndValidateExternalReferences = (referencesInput) => {
  if (!referencesInput) return [];
  if (!Array.isArray(referencesInput)) {
    const err = new Error('External references must be an array');
    err.statusCode = 400;
    throw err;
  }
  if (referencesInput.length > 50) {
    const err = new Error('Cannot exceed 50 external references per topic');
    err.statusCode = 400;
    throw err;
  }

  const allowedKeys = ['id', '_id', 'title', 'url', 'source'];

  return referencesInput.map((ref, idx) => {
    if (!ref || typeof ref !== 'object' || Array.isArray(ref)) {
      const err = new Error(`Invalid external reference at index ${idx}: must be an object`);
      err.statusCode = 400;
      throw err;
    }

    const keys = Object.keys(ref);
    const unexpected = keys.filter((k) => !allowedKeys.includes(k) || k.startsWith('$') || k.includes('.'));
    if (unexpected.length > 0) {
      const err = new Error(`External reference at index ${idx} contains unexpected or invalid field(s): ${unexpected.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    // Title validation
    if (typeof ref.title !== 'string') {
      const err = new Error(`External reference title at index ${idx} must be a string`);
      err.statusCode = 400;
      throw err;
    }
    const trimmedTitle = ref.title.trim();
    if (trimmedTitle.length === 0) {
      const err = new Error(`External reference title at index ${idx} cannot be empty`);
      err.statusCode = 400;
      throw err;
    }
    if (trimmedTitle.length > 200) {
      const err = new Error(`External reference title at index ${idx} cannot exceed 200 characters`);
      err.statusCode = 400;
      throw err;
    }

    // URL validation
    if (typeof ref.url !== 'string') {
      const err = new Error(`External reference URL at index ${idx} must be a string`);
      err.statusCode = 400;
      throw err;
    }
    const trimmedUrl = ref.url.trim();
    if (trimmedUrl.length === 0) {
      const err = new Error(`External reference URL at index ${idx} cannot be empty`);
      err.statusCode = 400;
      throw err;
    }
    if (trimmedUrl.length > 1000) {
      const err = new Error(`External reference URL at index ${idx} cannot exceed 1000 characters`);
      err.statusCode = 400;
      throw err;
    }

    // Reject executable/script protocols and require http/https
    if (/^(javascript|data|vbscript|file|blob):/i.test(trimmedUrl)) {
      const err = new Error(`Invalid external reference URL at index ${idx}: script and executable protocols are not permitted`);
      err.statusCode = 400;
      throw err;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        const err = new Error(`Invalid external reference URL at index ${idx}: must use http or https protocol`);
        err.statusCode = 400;
        throw err;
      }
    } catch {
      const err = new Error(`Invalid external reference URL at index ${idx}: must be a well-formed URL`);
      err.statusCode = 400;
      throw err;
    }

    // Source validation (optional)
    let trimmedSource = '';
    if (ref.source !== undefined && ref.source !== null) {
      if (typeof ref.source !== 'string') {
        const err = new Error(`External reference source at index ${idx} must be a string`);
        err.statusCode = 400;
        throw err;
      }
      trimmedSource = ref.source.trim();
      if (trimmedSource.length > 100) {
        const err = new Error(`External reference source at index ${idx} cannot exceed 100 characters`);
        err.statusCode = 400;
        throw err;
      }
    }

    return {
      title: trimmedTitle,
      url: trimmedUrl,
      source: trimmedSource,
    };
  });
};

/**
 * Validates and sanitizes educational images/diagram references.
 *
 * @param {Array} imagesInput
 * @returns {Array}
 */
export const sanitizeAndValidateImages = (imagesInput) => {
  if (!imagesInput) return [];
  if (!Array.isArray(imagesInput)) {
    const err = new Error('Images must be an array');
    err.statusCode = 400;
    throw err;
  }
  if (imagesInput.length > 50) {
    const err = new Error('Cannot exceed 50 images per topic');
    err.statusCode = 400;
    throw err;
  }

  const allowedKeys = ['id', '_id', 'url', 'caption', 'altText'];

  return imagesInput.map((img, idx) => {
    if (typeof img === 'string') {
      const trimmed = img.trim();
      if (!trimmed || trimmed.length > 1000 || !isValidUrl(trimmed)) {
        const err = new Error(`Invalid image reference at index ${idx}: must be a valid HTTP/HTTPS URL or safe path (max 1000 characters)`);
        err.statusCode = 400;
        throw err;
      }
      return { url: trimmed, caption: '', altText: '' };
    }

    if (typeof img === 'object' && img !== null && !Array.isArray(img)) {
      const keys = Object.keys(img);
      const unexpected = keys.filter((k) => !allowedKeys.includes(k) || k.startsWith('$') || k.includes('.'));
      if (unexpected.length > 0) {
        const err = new Error(`Image at index ${idx} contains unexpected or invalid field(s): ${unexpected.join(', ')}`);
        err.statusCode = 400;
        throw err;
      }

      const { url, caption, altText } = img;
      if (!url || typeof url !== 'string') {
        const err = new Error(`Image at index ${idx} requires a valid URL string`);
        err.statusCode = 400;
        throw err;
      }
      const trimmedUrl = url.trim();
      if (!trimmedUrl || trimmedUrl.length > 1000 || !isValidUrl(trimmedUrl)) {
        const err = new Error(`Invalid image URL at index ${idx}: must be a valid HTTP/HTTPS URL or safe path (max 1000 characters)`);
        err.statusCode = 400;
        throw err;
      }

      const sanitizedCaption = typeof caption === 'string' ? caption.trim() : '';
      if (sanitizedCaption.length > 500) {
        const err = new Error(`Image caption at index ${idx} cannot exceed 500 characters`);
        err.statusCode = 400;
        throw err;
      }

      const sanitizedAltText = typeof altText === 'string' ? altText.trim() : '';
      if (sanitizedAltText.length > 200) {
        const err = new Error(`Image alt text at index ${idx} cannot exceed 200 characters`);
        err.statusCode = 400;
        throw err;
      }

      return {
        url: trimmedUrl,
        caption: sanitizedCaption,
        altText: sanitizedAltText,
      };
    }

    const err = new Error(`Invalid image data at index ${idx}`);
    err.statusCode = 400;
    throw err;
  });
};

/**
 * Validates and sanitizes code examples.
 * Code is treated strictly as data; never executed on server.
 *
 * @param {Array} examplesInput
 * @returns {Array}
 */
export const sanitizeAndValidateCodeExamples = (examplesInput) => {
  if (!examplesInput) return [];
  if (!Array.isArray(examplesInput)) {
    const err = new Error('Code examples must be an array');
    err.statusCode = 400;
    throw err;
  }
  if (examplesInput.length > 50) {
    const err = new Error('Cannot exceed 50 code examples per topic');
    err.statusCode = 400;
    throw err;
  }

  const allowedKeys = ['id', '_id', 'title', 'language', 'code', 'explanation'];

  return examplesInput.map((item, idx) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      const err = new Error(`Invalid code example item at index ${idx}: must be an object`);
      err.statusCode = 400;
      throw err;
    }

    const keys = Object.keys(item);
    const unexpected = keys.filter((k) => !allowedKeys.includes(k) || k.startsWith('$') || k.includes('.'));
    if (unexpected.length > 0) {
      const err = new Error(`Code example at index ${idx} contains unexpected or invalid field(s): ${unexpected.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (typeof item.code !== 'string' || item.code.trim().length === 0) {
      const err = new Error(`Code snippet is required for example at index ${idx}`);
      err.statusCode = 400;
      throw err;
    }
    if (item.code.length > 30000) {
      const err = new Error(`Code snippet at index ${idx} cannot exceed 30000 characters`);
      err.statusCode = 400;
      throw err;
    }

    const title = typeof item.title === 'string' ? item.title.trim() : '';
    if (title.length > 200) {
      const err = new Error(`Code example title at index ${idx} cannot exceed 200 characters`);
      err.statusCode = 400;
      throw err;
    }

    const language = typeof item.language === 'string' ? item.language.trim().toLowerCase() : 'c';
    if (language.length > 50) {
      const err = new Error(`Language at index ${idx} cannot exceed 50 characters`);
      err.statusCode = 400;
      throw err;
    }

    const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : '';
    if (explanation.length > 5000) {
      const err = new Error(`Code explanation at index ${idx} cannot exceed 5000 characters`);
      err.statusCode = 400;
      throw err;
    }

    return {
      title,
      language: language || 'c',
      code: item.code,
      explanation,
    };
  });
};

/**
 * Validates and sanitizes important / revision points.
 *
 * @param {Array} pointsInput
 * @returns {Array<string>}
 */
export const sanitizeAndValidateImportantPoints = (pointsInput) => {
  if (!pointsInput) return [];
  if (!Array.isArray(pointsInput)) {
    const err = new Error('Important / revision points must be an array');
    err.statusCode = 400;
    throw err;
  }
  if (pointsInput.length > 100) {
    const err = new Error('Cannot exceed 100 revision points per topic');
    err.statusCode = 400;
    throw err;
  }

  return pointsInput.map((pt, idx) => {
    if (typeof pt !== 'string') {
      const err = new Error(`Revision point at index ${idx} must be a string`);
      err.statusCode = 400;
      throw err;
    }
    const trimmed = pt.trim();
    if (trimmed.length === 0) {
      const err = new Error(`Revision point at index ${idx} cannot be empty`);
      err.statusCode = 400;
      throw err;
    }
    if (trimmed.length > 1000) {
      const err = new Error(`Revision point at index ${idx} cannot exceed 1000 characters`);
      err.statusCode = 400;
      throw err;
    }
    return trimmed;
  });
};

/**
 * Validates and sanitizes structured topic content (explanation and sections).
 * Supports partial merging with existing topic content on PATCH.
 *
 * @param {Object|string} contentInput
 * @param {Object} [existingContent]
 * @returns {Object}
 */
export const sanitizeAndValidateContent = (contentInput, existingContent = null) => {
  if (!contentInput) {
    return {
      explanation: existingContent?.explanation || '',
      sections: Array.isArray(existingContent?.sections) ? existingContent.sections : [],
    };
  }

  if (typeof contentInput === 'string') {
    const trimmed = contentInput.trim();
    if (trimmed.length > 50000) {
      const err = new Error('Content explanation cannot exceed 50000 characters');
      err.statusCode = 400;
      throw err;
    }
    return {
      explanation: trimmed,
      sections: Array.isArray(existingContent?.sections) ? existingContent.sections : [],
    };
  }

  if (typeof contentInput === 'object' && !Array.isArray(contentInput)) {
    const keys = Object.keys(contentInput);
    const allowedKeys = ['explanation', 'sections'];
    const unexpected = keys.filter((k) => !allowedKeys.includes(k) || k.startsWith('$') || k.includes('.'));
    if (unexpected.length > 0) {
      const err = new Error(`Content contains unexpected field(s): ${unexpected.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    let explanation = existingContent?.explanation || '';
    if (contentInput.explanation !== undefined) {
      if (typeof contentInput.explanation !== 'string') {
        const err = new Error('Explanation must be a string');
        err.statusCode = 400;
        throw err;
      }
      explanation = contentInput.explanation.trim();
      if (explanation.length > 50000) {
        const err = new Error('Content explanation cannot exceed 50000 characters');
        err.statusCode = 400;
        throw err;
      }
    }

    let sections = Array.isArray(existingContent?.sections) ? existingContent.sections : [];
    if (contentInput.sections !== undefined) {
      if (!Array.isArray(contentInput.sections)) {
        const err = new Error('Sections must be an array');
        err.statusCode = 400;
        throw err;
      }
      if (contentInput.sections.length > 50) {
        const err = new Error('Cannot exceed 50 sections per topic');
        err.statusCode = 400;
        throw err;
      }

      const allowedSectionKeys = ['id', '_id', 'heading', 'body', 'order'];

      sections = contentInput.sections.map((sec, idx) => {
        if (!sec || typeof sec !== 'object' || Array.isArray(sec)) {
          const err = new Error(`Section at index ${idx} must be an object`);
          err.statusCode = 400;
          throw err;
        }

        const secKeys = Object.keys(sec);
        const unexpSec = secKeys.filter((k) => !allowedSectionKeys.includes(k) || k.startsWith('$') || k.includes('.'));
        if (unexpSec.length > 0) {
          const err = new Error(`Section at index ${idx} contains unexpected field(s): ${unexpSec.join(', ')}`);
          err.statusCode = 400;
          throw err;
        }

        const heading = typeof sec.heading === 'string' ? sec.heading.trim() : '';
        if (heading.length > 200) {
          const err = new Error(`Section heading at index ${idx} cannot exceed 200 characters`);
          err.statusCode = 400;
          throw err;
        }

        const body = typeof sec.body === 'string' ? sec.body.trim() : '';
        if (body.length > 20000) {
          const err = new Error(`Section body at index ${idx} cannot exceed 20000 characters`);
          err.statusCode = 400;
          throw err;
        }

        const order = typeof sec.order === 'number' && !isNaN(sec.order) ? Math.max(0, sec.order) : idx;

        return { heading, body, order };
      });
    }

    return { explanation, sections };
  }

  const err = new Error('Content must be an object or string');
  err.statusCode = 400;
  throw err;
};

/**
 * Sanitizes topic content for the content management API.
 *
 * @param {Object} topic
 * @returns {Object|null}
 */
export const sanitizeTopicContent = (topic) => {
  if (!topic) return null;
  return {
    topicId: topic._id ? topic._id.toString() : topic.id,
    moduleId: topic.moduleId?._id ? topic.moduleId._id.toString() : topic.moduleId?.toString(),
    courseId: topic.courseId?._id ? topic.courseId._id.toString() : topic.courseId?.toString(),
    title: topic.title,
    content: topic.content || { explanation: '', sections: [] },
    images: Array.isArray(topic.images)
      ? topic.images.map((img) => ({
          id: img._id ? img._id.toString() : undefined,
          url: img.url,
          caption: img.caption || '',
          altText: img.altText || '',
        }))
      : [],
    codeExamples: Array.isArray(topic.codeExamples)
      ? topic.codeExamples.map((ex) => ({
          id: ex._id ? ex._id.toString() : undefined,
          title: ex.title || '',
          language: ex.language || 'c',
          code: ex.code,
          explanation: ex.explanation || '',
        }))
      : [],
    importantPoints: Array.isArray(topic.importantPoints) ? topic.importantPoints : [],
    revisionPoints: Array.isArray(topic.importantPoints) ? topic.importantPoints : [],
    videos: {
      english: topic.videos?.english || null,
      telugu: topic.videos?.telugu || null,
      hindi: topic.videos?.hindi || null,
    },
    externalReferences: Array.isArray(topic.externalReferences)
      ? topic.externalReferences.map((ref) => ({
          id: ref._id ? ref._id.toString() : ref.id,
          title: ref.title || '',
          url: ref.url,
          source: ref.source || '',
        }))
      : [],
    references: Array.isArray(topic.externalReferences)
      ? topic.externalReferences.map((ref) => ({
          id: ref._id ? ref._id.toString() : ref.id,
          title: ref.title || '',
          url: ref.url,
          source: ref.source || '',
        }))
      : [],
    updatedAt: topic.updatedAt,
  };
};

/**
 * Retrieves the educational content belonging strictly to the verified topic, module, and course.
 *
 * @param {string|mongoose.Types.ObjectId} topicId
 * @param {string|mongoose.Types.ObjectId} moduleId
 * @param {string|mongoose.Types.ObjectId} courseId
 * @returns {Promise<Object>}
 */
export const getTopicContent = async (topicId, moduleId, courseId) => {
  if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Invalid topic ID format');
    error.statusCode = 400;
    throw error;
  }
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

  const topic = await Topic.findOne({ _id: topicId, moduleId, courseId }).lean();
  if (!topic) {
    const error = new Error('Topic not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeTopicContent(topic);
};

/**
 * Updates educational content strictly belonging to the verified topic, module, and course.
 *
 * @param {string|mongoose.Types.ObjectId} topicId
 * @param {string|mongoose.Types.ObjectId} moduleId
 * @param {string|mongoose.Types.ObjectId} courseId
 * @param {Object} contentData
 * @returns {Promise<Object>}
 */
export const updateTopicContent = async (topicId, moduleId, courseId, contentData) => {
  if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Invalid topic ID format');
    error.statusCode = 400;
    throw error;
  }
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

  if (!contentData || typeof contentData !== 'object' || Array.isArray(contentData)) {
    const error = new Error('Content update payload must be an object');
    error.statusCode = 400;
    throw error;
  }

  // Find target topic ensuring complete hierarchy match
  const existingTopic = await Topic.findOne({ _id: topicId, moduleId, courseId });
  if (!existingTopic) {
    const error = new Error('Topic not found');
    error.statusCode = 404;
    throw error;
  }

  const updateFields = {};

  // 1. Content (explanation and sections)
  if (contentData.content !== undefined) {
    updateFields.content = sanitizeAndValidateContent(contentData.content, existingTopic.content);
  }

  // 2. Images
  if (contentData.images !== undefined) {
    updateFields.images = sanitizeAndValidateImages(contentData.images);
  }

  // 3. Code Examples
  if (contentData.codeExamples !== undefined) {
    updateFields.codeExamples = sanitizeAndValidateCodeExamples(contentData.codeExamples);
  }

  // 4. Important Points / Revision Points (support both field names cleanly)
  const pointsToProcess = contentData.importantPoints !== undefined ? contentData.importantPoints : contentData.revisionPoints;
  if (pointsToProcess !== undefined) {
    updateFields.importantPoints = sanitizeAndValidateImportantPoints(pointsToProcess);
  }

  // 5. Videos (multilingual references)
  if (contentData.videos !== undefined) {
    updateFields.videos = sanitizeAndValidateVideos(contentData.videos, existingTopic.videos);
  }

  // 6. External References (curated links to documentation/articles)
  const refsToProcess = contentData.externalReferences !== undefined ? contentData.externalReferences : contentData.references;
  if (refsToProcess !== undefined) {
    updateFields.externalReferences = sanitizeAndValidateExternalReferences(refsToProcess);
  }

  if (Object.keys(updateFields).length === 0) {
    return sanitizeTopicContent(existingTopic);
  }

  const updatedTopic = await Topic.findOneAndUpdate(
    { _id: topicId, moduleId, courseId },
    { $set: updateFields },
    { returnDocument: 'after', runValidators: true }
  );

  return sanitizeTopicContent(updatedTopic);
};

export default {
  createTopic,
  getTopicsByModule,
  getTopicById,
  updateTopic,
  deleteTopic,
  reorderTopics,
  sanitizeTopic,
  sanitizeTopicContent,
  getTopicContent,
  updateTopicContent,
  isValidUrl,
  isValidYouTubeReference,
  sanitizeAndValidateVideos,
  sanitizeAndValidateExternalReferences,
  sanitizeAndValidateImages,
  sanitizeAndValidateCodeExamples,
  sanitizeAndValidateImportantPoints,
  sanitizeAndValidateContent,
};
