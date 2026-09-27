import mongoose from 'mongoose';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';

/**
 * Validates whether a string is a well-formed HTTP/HTTPS URL.
 *
 * @param {string} str
 * @returns {boolean}
 */
export const isValidUrl = (str) => {
  if (typeof str !== 'string') return false;
  try {
    const parsed = new URL(str);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validates whether a string is an appropriate YouTube URL or video reference.
 * Supports:
 * - Direct 11-character YouTube video IDs (e.g. dQw4w9WgXcQ)
 * - Standard watch URLs (youtube.com/watch?v=...)
 * - Shortened youtu.be URLs (youtu.be/...)
 * - Embed URLs (youtube.com/embed/... or youtube-nocookie.com/embed/...)
 * - YouTube Shorts (youtube.com/shorts/...)
 * - YouTube Live (youtube.com/live/...)
 *
 * @param {string} str
 * @returns {boolean}
 */
export const isValidYouTubeReference = (str) => {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed || trimmed.length > 1000) return false;

  // Direct 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return true;
  }

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
      host === 'youtube-nocookie.com' ||
      host.endsWith('.youtube-nocookie.com');

    if (!isYouTubeHost) return false;

    // Check youtu.be /<VIDEO_ID>
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id);
    }

    // Check youtube.com /watch?v=<VIDEO_ID>
    if (parsed.pathname === '/watch') {
      const v = parsed.searchParams.get('v');
      return Boolean(v && /^[a-zA-Z0-9_-]{11}$/.test(v));
    }

    // Check /embed/<id>, /v/<id>, /shorts/<id>, /live/<id>
    const pathMatch = parsed.pathname.match(/^\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})/);
    if (pathMatch) {
      return true;
    }

    // General fallback for YouTube URL containing valid 'v' parameter
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
 * Allowed keys strictly limited to: 'english', 'telugu', 'hindi'.
 * Unrecognized keys or invalid YouTube URLs are rejected with HTTP 400.
 * Missing or empty fields are consistently stored as null.
 *
 * @param {Object} videosInput
 * @param {Object|null} [existingVideos=null]
 * @returns {Object} { english: string|null, telugu: string|null, hindi: string|null }
 */
export const sanitizeAndValidateVideos = (videosInput, existingVideos = null) => {
  if (!videosInput || typeof videosInput !== 'object' || Array.isArray(videosInput)) {
    const err = new Error('Videos payload must be an object with english, telugu, and/or hindi references');
    err.statusCode = 400;
    throw err;
  }

  const allowedLanguages = ['english', 'telugu', 'hindi'];
  const inputKeys = Object.keys(videosInput);

  // Reject unsupported languages / unexpected keys
  for (const key of inputKeys) {
    if (!allowedLanguages.includes(key)) {
      const err = new Error(`Unsupported video language '${key}'. Supported languages are: english, telugu, hindi`);
      err.statusCode = 400;
      throw err;
    }
  }

  const sanitized = {
    english: existingVideos?.english || null,
    telugu: existingVideos?.telugu || null,
    hindi: existingVideos?.hindi || null,
  };

  for (const lang of allowedLanguages) {
    if (videosInput[lang] !== undefined) {
      const val = videosInput[lang];
      if (val === null) {
        sanitized[lang] = null;
      } else if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '') {
          sanitized[lang] = null;
        } else {
          if (trimmed.length > 1000) {
            const err = new Error(`Video URL for language '${lang}' cannot exceed 1000 characters`);
            err.statusCode = 400;
            throw err;
          }
          if (!isValidYouTubeReference(trimmed)) {
            const err = new Error(
              `Invalid YouTube video reference for language '${lang}'. Must be a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...) or video ID`
            );
            err.statusCode = 400;
            throw err;
          }
          sanitized[lang] = trimmed.startsWith('http://') || trimmed.startsWith('https://')
            ? trimmed
            : `https://www.youtube.com/watch?v=${trimmed}`;
        }
      } else {
        const err = new Error(`Video reference for language '${lang}' must be a string or null`);
        err.statusCode = 400;
        throw err;
      }
    }
  }

  return sanitized;
};

/**
 * Validates and sanitizes educational images/diagrams.
 * Only stores URLs and references; binary payloads are rejected.
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

  const allowedImageKeys = ['id', '_id', 'url', 'caption', 'altText'];

  return imagesInput.map((img, idx) => {
    if (typeof img === 'string') {
      const trimmed = img.trim();
      if (!trimmed || trimmed.length > 1000 || (!isValidUrl(trimmed) && !trimmed.startsWith('/'))) {
        const err = new Error(`Invalid image reference at index ${idx}: must be a valid URL or path (max 1000 characters)`);
        err.statusCode = 400;
        throw err;
      }
      return { url: trimmed, caption: '', altText: '' };
    }

    if (typeof img === 'object' && img !== null && !Array.isArray(img)) {
      const keys = Object.keys(img);
      const unexpected = keys.filter((k) => !allowedImageKeys.includes(k) || k.startsWith('$') || k.includes('.'));
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
      if (trimmedUrl.length === 0 || trimmedUrl.length > 1000 || (!isValidUrl(trimmedUrl) && !trimmedUrl.startsWith('/'))) {
        const err = new Error(`Invalid image URL at index ${idx}: must be a valid HTTP/HTTPS URL or relative path (max 1000 characters)`);
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

  const allowedExampleKeys = ['id', '_id', 'title', 'language', 'code', 'explanation'];

  return examplesInput.map((item, idx) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      const err = new Error(`Invalid code example item at index ${idx}: must be an object`);
      err.statusCode = 400;
      throw err;
    }

    const keys = Object.keys(item);
    const unexpected = keys.filter((k) => !allowedExampleKeys.includes(k) || k.startsWith('$') || k.includes('.'));
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
 * Validates and sanitizes important revision points.
 *
 * @param {Array} pointsInput
 * @returns {Array<string>}
 */
export const sanitizeAndValidateImportantPoints = (pointsInput) => {
  if (!pointsInput) return [];
  if (!Array.isArray(pointsInput)) {
    const err = new Error('importantPoints must be an array');
    err.statusCode = 400;
    throw err;
  }
  return pointsInput
    .filter((pt) => typeof pt === 'string' && pt.trim().length > 0)
    .map((pt) => pt.trim());
};

/**
 * Validates and sanitizes structured topic content.
 * Supports GFG/W3Schools-style detailed explanations and sectional breakdowns.
 *
 * @param {Object|string} contentInput
 * @returns {Object}
 */
export const sanitizeAndValidateContent = (contentInput) => {
  if (!contentInput) {
    return { explanation: '', sections: [] };
  }
  if (typeof contentInput === 'string') {
    return { explanation: contentInput.trim(), sections: [] };
  }
  if (typeof contentInput === 'object' && !Array.isArray(contentInput)) {
    const explanation = typeof contentInput.explanation === 'string' ? contentInput.explanation.trim() : '';
    let sections = [];
    if (Array.isArray(contentInput.sections)) {
      sections = contentInput.sections.map((sec, idx) => ({
        heading: typeof sec.heading === 'string' ? sec.heading.trim() : '',
        body: typeof sec.body === 'string' ? sec.body.trim() : '',
        order: typeof sec.order === 'number' ? sec.order : idx,
      }));
    }
    return { explanation, sections };
  }
  return { explanation: '', sections: [] };
};

/**
 * Sanitizes a topic document for safe API output.
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
 * Creates a new educational topic under an existing module.
 *
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export const createTopic = async ({
  moduleId,
  title,
  description,
  order,
  content,
  images,
  codeExamples,
  importantPoints,
  videos,
}) => {
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  // Authoritative check that referenced module exists
  const parentModule = await Module.findById(moduleId).select('_id courseId').lean();
  if (!parentModule) {
    const error = new Error('Referenced module not found');
    error.statusCode = 404;
    throw error;
  }

  // Determine order if omitted
  let topicOrder = order;
  if (topicOrder === undefined || topicOrder === null || typeof topicOrder !== 'number' || isNaN(topicOrder)) {
    const lastTopic = await Topic.findOne({ moduleId }).sort({ order: -1 }).select('order').lean();
    topicOrder = lastTopic && typeof lastTopic.order === 'number' ? lastTopic.order + 1 : 0;
  }

  // Sanitize components strictly
  const cleanContent = sanitizeAndValidateContent(content);
  const cleanImages = sanitizeAndValidateImages(images);
  const cleanCodeExamples = sanitizeAndValidateCodeExamples(codeExamples);
  const cleanImportantPoints = sanitizeAndValidateImportantPoints(importantPoints);
  const cleanVideos = sanitizeAndValidateVideos(videos);

  // Construct whitelist object
  const cleanData = {
    moduleId,
    courseId: parentModule.courseId,
    title: typeof title === 'string' ? title.trim() : '',
    description: typeof description === 'string' ? description.trim() : '',
    order: Math.max(0, topicOrder),
    content: cleanContent,
    images: cleanImages,
    codeExamples: cleanCodeExamples,
    importantPoints: cleanImportantPoints,
    videos: cleanVideos,
  };

  const newTopic = await Topic.create(cleanData);
  return sanitizeTopic(newTopic);
};

/**
 * Retrieves all topics belonging to a module, sorted strictly by order.
 *
 * @param {string} moduleId
 * @returns {Promise<Array>}
 */
export const getTopicsByModule = async (moduleId) => {
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  const parentModule = await Module.findById(moduleId).select('_id').lean();
  if (!parentModule) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    throw error;
  }

  const topics = await Topic.find({ moduleId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return topics.map(sanitizeTopic);
};

/**
 * Retrieves a single topic by ID with all educational content.
 *
 * @param {string} topicId
 * @returns {Promise<Object|null>}
 */
export const getTopicById = async (topicId) => {
  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Invalid topic ID format');
    error.statusCode = 400;
    throw error;
  }

  const topic = await Topic.findById(topicId).lean();
  if (!topic) return null;

  return sanitizeTopic(topic);
};

/**
 * Updates an existing topic with strict field whitelisting.
 *
 * @param {string} topicId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
export const updateTopic = async (topicId, updateData = {}) => {
  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Invalid topic ID format');
    error.statusCode = 400;
    throw error;
  }

  const existingTopic = await Topic.findById(topicId);
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

  if (updateData.content !== undefined) {
    updateFields.content = sanitizeAndValidateContent(updateData.content);
  }

  if (updateData.images !== undefined) {
    updateFields.images = sanitizeAndValidateImages(updateData.images);
  }

  if (updateData.codeExamples !== undefined) {
    updateFields.codeExamples = sanitizeAndValidateCodeExamples(updateData.codeExamples);
  }

  if (updateData.importantPoints !== undefined) {
    updateFields.importantPoints = sanitizeAndValidateImportantPoints(updateData.importantPoints);
  }

  if (updateData.videos !== undefined) {
    updateFields.videos = sanitizeAndValidateVideos(updateData.videos);
  }

  const updatedTopic = await Topic.findByIdAndUpdate(
    topicId,
    { $set: updateFields },
    { returnDocument: 'after', runValidators: true }
  );

  return sanitizeTopic(updatedTopic);
};

/**
 * Reorders topics within a module.
 *
 * @param {string} moduleId
 * @param {Array<{id: string, order: number}>} topicOrders
 * @returns {Promise<Array>}
 */
export const reorderTopics = async (moduleId, topicOrders) => {
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.statusCode = 400;
    throw error;
  }

  const parentModule = await Module.findById(moduleId).select('_id').lean();
  if (!parentModule) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(topicOrders) || topicOrders.length === 0) {
    const error = new Error('topicOrders must be a non-empty array');
    error.statusCode = 400;
    throw error;
  }

  for (const item of topicOrders) {
    if (!item || !mongoose.Types.ObjectId.isValid(item.id) || typeof item.order !== 'number' || item.order < 0) {
      const error = new Error('Each reorder item must have a valid topic id and a non-negative order number');
      error.statusCode = 400;
      throw error;
    }
  }

  const bulkOps = topicOrders.map((item) => ({
    updateOne: {
      filter: { _id: item.id, moduleId },
      update: { $set: { order: Math.max(0, item.order) } },
    },
  }));

  await Topic.bulkWrite(bulkOps);

  const updatedTopics = await Topic.find({ moduleId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return updatedTopics.map(sanitizeTopic);
};

/**
 * Deletes a topic by ID.
 *
 * @param {string} topicId
 * @returns {Promise<{ deleted: boolean, deletedTopicId: string }>}
 */
export const deleteTopic = async (topicId) => {
  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    const error = new Error('Invalid topic ID format');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Topic.findById(topicId);
  if (!existing) {
    const error = new Error('Topic not found');
    error.statusCode = 404;
    throw error;
  }

  await Topic.findByIdAndDelete(topicId);
  return { deleted: true, deletedTopicId: topicId };
};

/**
 * Authoritatively verifies the full parent hierarchy chain:
 * Course -> Module (-> Topic)
 *
 * Checks:
 * 1. courseId format valid -> 400
 * 2. moduleId format valid -> 400
 * 3. Course exists -> 404
 * 4. Module exists -> 404
 * 5. Module belongs to the course -> 404
 * 6. If topicId: topicId format valid -> 400
 * 7. Topic exists -> 404
 * 8. Topic belongs to the module -> 404
 * 9. Topic courseId matches courseId -> 404
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.moduleId
 * @param {string|null} [params.topicId]
 * @returns {Promise<{ course: Object, module: Object, topic: Object|null }>}
 */
export const verifyParentChain = async ({ courseId, moduleId, topicId = null }) => {
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

  const course = await Course.findById(courseId).select('_id').lean();
  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const parentModule = await Module.findById(moduleId).select('_id courseId').lean();
  if (!parentModule) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    throw error;
  }

  if (parentModule.courseId.toString() !== courseId.toString()) {
    const error = new Error('Module does not belong to the specified course');
    error.statusCode = 404;
    throw error;
  }

  let topic = null;
  if (topicId !== null) {
    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      const error = new Error('Invalid topic ID format');
      error.statusCode = 400;
      throw error;
    }

    topic = await Topic.findById(topicId);
    if (!topic) {
      const error = new Error('Topic not found');
      error.statusCode = 404;
      throw error;
    }

    if (topic.moduleId.toString() !== moduleId.toString()) {
      const error = new Error('Topic does not belong to the specified module');
      error.statusCode = 404;
      throw error;
    }

    if (topic.courseId.toString() !== courseId.toString()) {
      const error = new Error('Topic does not belong to the specified course');
      error.statusCode = 404;
      throw error;
    }
  }

  return { course, module: parentModule, topic };
};

/**
 * Creates a new topic under a verified course and module parent chain.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.moduleId
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {number} [params.order]
 * @returns {Promise<Object>}
 */
export const createTopicUnderModule = async ({ courseId, moduleId, title, description, order }) => {
  await verifyParentChain({ courseId, moduleId });

  let topicOrder = order;
  if (topicOrder === undefined || topicOrder === null || typeof topicOrder !== 'number' || isNaN(topicOrder)) {
    const lastTopic = await Topic.findOne({ moduleId }).sort({ order: -1 }).select('order').lean();
    topicOrder = lastTopic && typeof lastTopic.order === 'number' ? lastTopic.order + 1 : 0;
  }

  const cleanData = {
    courseId,
    moduleId,
    title: typeof title === 'string' ? title.trim() : '',
    description: typeof description === 'string' ? description.trim() : '',
    order: Math.max(0, Math.floor(topicOrder)),
  };

  const newTopic = await Topic.create(cleanData);
  return sanitizeTopic(newTopic);
};

/**
 * Retrieves all topics for a module verifying the full course -> module parent chain.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.moduleId
 * @returns {Promise<Array>}
 */
export const getTopicsByCourseAndModule = async ({ courseId, moduleId }) => {
  await verifyParentChain({ courseId, moduleId });

  const topics = await Topic.find({ moduleId, courseId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return topics.map(sanitizeTopic);
};

/**
 * Retrieves a single topic verifying the full course -> module -> topic chain.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.moduleId
 * @param {string} params.topicId
 * @returns {Promise<Object>}
 */
export const getTopicByCourseAndModule = async ({ courseId, moduleId, topicId }) => {
  const { topic } = await verifyParentChain({ courseId, moduleId, topicId });
  return sanitizeTopic(topic);
};

/**
 * Updates an existing topic with strict field whitelisting and hierarchy verification.
 * Allows updating title, description, order, content (main textual learning content), and importantPoints.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.moduleId
 * @param {string} params.topicId
 * @param {Object} params.updateData
 * @returns {Promise<Object>}
 */
export const updateTopicUnderModule = async ({ courseId, moduleId, topicId, updateData = {} }) => {
  const { topic } = await verifyParentChain({ courseId, moduleId, topicId });

  // Disallow changing immutable hierarchy / ownership / system fields
  const forbiddenFields = ['courseId', 'moduleId', '_id', 'id', 'courseCreator', 'creatorId', 'role', 'status', 'createdAt', 'updatedAt'];
  for (const forbidden of forbiddenFields) {
    if (updateData[forbidden] !== undefined) {
      const err = new Error(`Modifying protected field '${forbidden}' is forbidden`);
      err.statusCode = 400;
      throw err;
    }
  }

  const updateFields = {};

  if (updateData.title !== undefined) {
    if (typeof updateData.title !== 'string') {
      const err = new Error('Title must be a string');
      err.statusCode = 400;
      throw err;
    }
    const trimmedTitle = updateData.title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 200) {
      const err = new Error('Title must be between 2 and 200 characters');
      err.statusCode = 400;
      throw err;
    }
    updateFields.title = trimmedTitle;
  }

  if (updateData.description !== undefined) {
    if (typeof updateData.description !== 'string') {
      const err = new Error('Description must be a string');
      err.statusCode = 400;
      throw err;
    }
    const trimmedDesc = updateData.description.trim();
    if (trimmedDesc.length > 2000) {
      const err = new Error('Description cannot exceed 2000 characters');
      err.statusCode = 400;
      throw err;
    }
    updateFields.description = trimmedDesc;
  }

  if (updateData.order !== undefined) {
    if (typeof updateData.order === 'number' && !isNaN(updateData.order)) {
      updateFields.order = Math.max(0, Math.floor(updateData.order));
    }
  }

  if (updateData.content !== undefined) {
    if (typeof updateData.content === 'string') {
      const trimmed = updateData.content.trim();
      if (trimmed.length > 50000) {
        const err = new Error('Content cannot exceed 50000 characters');
        err.statusCode = 400;
        throw err;
      }
      const existingSections = Array.isArray(topic.content?.sections) ? topic.content.sections : [];
      updateFields.content = {
        explanation: trimmed,
        sections: existingSections,
      };
    } else if (typeof updateData.content === 'object' && updateData.content !== null && !Array.isArray(updateData.content)) {
      if (updateData.content.explanation !== undefined) {
        if (typeof updateData.content.explanation !== 'string') {
          const err = new Error('Content explanation must be a string');
          err.statusCode = 400;
          throw err;
        }
        if (updateData.content.explanation.trim().length > 50000) {
          const err = new Error('Content explanation cannot exceed 50000 characters');
          err.statusCode = 400;
          throw err;
        }
      }
      updateFields.content = sanitizeAndValidateContent(updateData.content);
    } else {
      const err = new Error('Content must be a string or structured content object');
      err.statusCode = 400;
      throw err;
    }
  }

  if (updateData.importantPoints !== undefined) {
    if (!Array.isArray(updateData.importantPoints)) {
      const err = new Error('importantPoints must be an array');
      err.statusCode = 400;
      throw err;
    }
    if (updateData.importantPoints.length > 50) {
      const err = new Error('importantPoints cannot contain more than 50 items');
      err.statusCode = 400;
      throw err;
    }
    const sanitizedPoints = [];
    for (let i = 0; i < updateData.importantPoints.length; i++) {
      const pt = updateData.importantPoints[i];
      if (typeof pt !== 'string') {
        const err = new Error(`importantPoints item at index ${i} must be a string`);
        err.statusCode = 400;
        throw err;
      }
      const trimmed = pt.trim();
      if (trimmed.length > 1000) {
        const err = new Error(`importantPoints item at index ${i} cannot exceed 1000 characters`);
        err.statusCode = 400;
        throw err;
      }
      if (trimmed.length > 0) {
        sanitizedPoints.push(trimmed);
      }
    }
    updateFields.importantPoints = sanitizedPoints;
  }

  if (updateData.videos !== undefined) {
    updateFields.videos = sanitizeAndValidateVideos(updateData.videos, topic.videos);
  }

  if (updateData.codeExamples !== undefined) {
    updateFields.codeExamples = sanitizeAndValidateCodeExamples(updateData.codeExamples);
  }

  if (updateData.images !== undefined) {
    updateFields.images = sanitizeAndValidateImages(updateData.images);
  }

  const updatedTopic = await Topic.findByIdAndUpdate(
    topicId,
    { $set: updateFields },
    { new: true, returnDocument: 'after', runValidators: true }
  );

  return sanitizeTopic(updatedTopic);
};

/**
 * Deletes a topic verifying the parent chain.
 * Only deletes the specific topic without altering siblings, parent module, or course.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.moduleId
 * @param {string} params.topicId
 * @returns {Promise<{ deleted: boolean, deletedTopicId: string }>}
 */
export const deleteTopicUnderModule = async ({ courseId, moduleId, topicId }) => {
  await verifyParentChain({ courseId, moduleId, topicId });

  await Topic.findByIdAndDelete(topicId);
  return { deleted: true, deletedTopicId: topicId.toString() };
};

/**
 * Reorders topics within a module under a course.
 * Enforces course boundary, module boundary, duplicate rejection, full topic set match,
 * sequential order starting at 0, and returns sanitized topics in authoritative order.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.moduleId
 * @param {Array<string>} params.topicIds
 * @returns {Promise<Array>}
 */
export const reorderTopicsUnderModule = async ({ courseId, moduleId, topicIds }) => {
  // 1. Verify parent chain for course & module
  await verifyParentChain({ courseId, moduleId });

  // 2. Validate topicIds array
  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    const error = new Error('topicIds must be a non-empty array of topic IDs');
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

  // 3. Reject duplicate IDs
  const uniqueIds = new Set(trimmedIds);
  if (uniqueIds.size !== trimmedIds.length) {
    const error = new Error('Duplicate topic IDs are not allowed in reorder list');
    error.statusCode = 400;
    throw error;
  }

  // 4. Retrieve all existing topics belonging to this module
  const existingTopics = await Topic.find({ moduleId })
    .select('_id moduleId title description order createdAt updatedAt')
    .lean();

  // Reject partial/incomplete topic sets; submitted IDs must represent exactly all topics in that module
  if (trimmedIds.length !== existingTopics.length) {
    const error = new Error(
      `The provided topic list does not match the complete set of topics for this module. Expected ${existingTopics.length} topics, received ${trimmedIds.length}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const existingIdSet = new Set(existingTopics.map((t) => t._id.toString()));
  for (const id of trimmedIds) {
    if (!existingIdSet.has(id)) {
      const error = new Error(`Topic ${id} does not belong to this module and course`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Assign sequential order values starting from 0 according to the submitted order
  const bulkOps = trimmedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, moduleId },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await Topic.bulkWrite(bulkOps);
  }

  // 6. Return updated topics in authoritative order, sanitized
  const updatedTopics = await Topic.find({ moduleId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return updatedTopics.map(sanitizeTopic);
};

export default {
  createTopic,
  getTopicsByModule,
  getTopicById,
  updateTopic,
  reorderTopics,
  deleteTopic,
  sanitizeTopic,
  sanitizeAndValidateVideos,
  sanitizeAndValidateImages,
  sanitizeAndValidateCodeExamples,
  sanitizeAndValidateImportantPoints,
  sanitizeAndValidateContent,
  verifyParentChain,
  createTopicUnderModule,
  getTopicsByCourseAndModule,
  getTopicByCourseAndModule,
  updateTopicUnderModule,
  deleteTopicUnderModule,
  reorderTopicsUnderModule,
};
