import adminTopicService from '../services/adminTopicService.js';

/**
 * POST /api/admin/topics OR POST /api/admin/modules/:moduleId/topics
 * Creates a new topic under a module.
 */
export const createTopic = async (req, res, next) => {
  try {
    const moduleId = req.params.moduleId || req.body.moduleId;
    const {
      title,
      description,
      order,
      content,
      images,
      codeExamples,
      importantPoints,
      videos,
    } = req.body;

    const topic = await adminTopicService.createTopic({
      moduleId,
      title,
      description,
      order: typeof order === 'number' ? order : undefined,
      content,
      images,
      codeExamples,
      importantPoints,
      videos,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Topic created successfully',
      data: {
        topic,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/modules/:moduleId/topics
 * Retrieves all topics for a module ordered by order.
 */
export const getTopicsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const topics = await adminTopicService.getTopicsByModule(moduleId);

    return res.status(200).json({
      status: 'success',
      data: {
        topics,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/topics/:id
 * Retrieves a single topic by ID with all educational content.
 */
export const getTopicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const topic = await adminTopicService.getTopicById(id);

    if (!topic) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Topic not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        topic,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/admin/topics/:id
 * Updates an existing topic using strict field whitelisting.
 */
export const updateTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      order,
      content,
      images,
      codeExamples,
      importantPoints,
      videos,
    } = req.body;

    const updatedTopic = await adminTopicService.updateTopic(id, {
      title,
      description,
      order,
      content,
      images,
      codeExamples,
      importantPoints,
      videos,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Topic updated successfully',
      data: {
        topic: updatedTopic,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/admin/modules/:moduleId/topics/reorder OR PATCH /api/admin/topics/reorder
 * Reorders topics within a module.
 */
export const reorderTopics = async (req, res, next) => {
  try {
    const moduleId = req.params.moduleId || req.body.moduleId;
    const topicOrders = req.body.topicOrders || req.body.topics;

    const topics = await adminTopicService.reorderTopics(moduleId, topicOrders);

    return res.status(200).json({
      status: 'success',
      message: 'Topics reordered successfully',
      data: {
        topics,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/admin/topics/:id
 * Deletes a topic by ID.
 */
export const deleteTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminTopicService.deleteTopic(id);

    return res.status(200).json({
      status: 'success',
      message: 'Topic deleted successfully',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/admin/courses/:courseId/modules/:moduleId/topics
 * Creates a new topic under a module enforcing full parent chain.
 */
export const createTopicUnderModule = async (req, res, next) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, description, order } = req.body;

    const topic = await adminTopicService.createTopicUnderModule({
      courseId,
      moduleId,
      title,
      description,
      order: typeof order === 'number' ? order : (order !== undefined && order !== null && !isNaN(Number(order)) ? Number(order) : undefined),
    });

    return res.status(201).json({
      status: 'success',
      message: 'Topic created successfully',
      data: {
        topic,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/courses/:courseId/modules/:moduleId/topics
 * Lists all topics for a module verifying course and module boundaries.
 */
export const getTopicsByCourseAndModule = async (req, res, next) => {
  try {
    const { courseId, moduleId } = req.params;
    const topics = await adminTopicService.getTopicsByCourseAndModule({ courseId, moduleId });

    return res.status(200).json({
      status: 'success',
      data: {
        topics,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
 * Retrieves a single topic scoped strictly to course and module.
 */
export const getTopicByCourseAndModule = async (req, res, next) => {
  try {
    const { courseId, moduleId, topicId } = req.params;
    const topic = await adminTopicService.getTopicByCourseAndModule({
      courseId,
      moduleId,
      topicId,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        topic,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH / PUT /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
 * Updates topic fields (title, description, order, content, importantPoints) verifying parent chain isolation.
 */
export const updateTopicUnderModule = async (req, res, next) => {
  try {
    const { courseId, moduleId, topicId } = req.params;
    const { title, description, order, content, importantPoints, videos, codeExamples, images } = req.body;

    // Strict validation of allowed body keys to reject unexpected request fields
    const allowedKeys = ['title', 'description', 'order', 'content', 'importantPoints', 'videos', 'codeExamples', 'images'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      const error = new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) {
      updateData.order = typeof order === 'number' ? order : (order !== null && !isNaN(Number(order)) ? Number(order) : undefined);
    }
    if (content !== undefined) updateData.content = content;
    if (importantPoints !== undefined) updateData.importantPoints = importantPoints;
    if (videos !== undefined) updateData.videos = videos;
    if (codeExamples !== undefined) updateData.codeExamples = codeExamples;
    if (images !== undefined) updateData.images = images;

    const topic = await adminTopicService.updateTopicUnderModule({
      courseId,
      moduleId,
      topicId,
      updateData,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Topic updated successfully',
      data: {
        topic,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
 * Deletes only the specific topic verifying parent chain.
 */
export const deleteTopicUnderModule = async (req, res, next) => {
  try {
    const { courseId, moduleId, topicId } = req.params;
    const result = await adminTopicService.deleteTopicUnderModule({
      courseId,
      moduleId,
      topicId,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Topic deleted successfully',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/admin/courses/:courseId/modules/:moduleId/topics/reorder
 * Reorders topics within a module under a course.
 */
export const reorderTopicsUnderModule = async (req, res, next) => {
  try {
    const { courseId, moduleId } = req.params;

    // Strict validation of allowed body keys
    const allowedKeys = ['topicIds'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      const error = new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const { topicIds } = req.body;

    const topics = await adminTopicService.reorderTopicsUnderModule({
      courseId,
      moduleId,
      topicIds,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Topics reordered successfully',
      data: {
        topics,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createTopic,
  getTopicsByModule,
  getTopicById,
  updateTopic,
  reorderTopics,
  deleteTopic,
  createTopicUnderModule,
  getTopicsByCourseAndModule,
  getTopicByCourseAndModule,
  updateTopicUnderModule,
  deleteTopicUnderModule,
  reorderTopicsUnderModule,
};
