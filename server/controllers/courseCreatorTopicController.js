import * as courseCreatorTopicService from '../services/courseCreatorTopicService.js';

/**
 * Handles creation of a new topic under a creator's verified module and course.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const createTopic = async (req, res, next) => {
  try {
    const courseId = req.course?._id;
    const { moduleId } = req.params;
    const { title, description, order } = req.body;

    const topic = await courseCreatorTopicService.createTopic({
      courseId,
      moduleId,
      title,
      description,
      order,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Topic created successfully',
      data: { topic },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Handles retrieving all topics belonging to a creator's verified module.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getTopics = async (req, res, next) => {
  try {
    const courseId = req.course?._id;
    const { moduleId } = req.params;

    const topics = await courseCreatorTopicService.getTopicsByModule(courseId, moduleId);

    return res.status(200).json({
      status: 'success',
      data: { topics },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Handles retrieving a single topic scoped strictly to the creator's module and course.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getTopicById = async (req, res, next) => {
  try {
    const courseId = req.course?._id;
    const { moduleId, topicId } = req.params;

    const topic = await courseCreatorTopicService.getTopicById(topicId, moduleId, courseId);

    if (!topic) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Topic not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { topic },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Handles updating an existing topic under a creator's verified module and course.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const updateTopic = async (req, res, next) => {
  try {
    const courseId = req.course?._id;
    const { moduleId, topicId } = req.params;

    const topic = await courseCreatorTopicService.updateTopic(topicId, moduleId, courseId, req.body);

    return res.status(200).json({
      status: 'success',
      message: 'Topic updated successfully',
      data: { topic },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Handles deleting a single topic under a creator's verified module and course.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const deleteTopic = async (req, res, next) => {
  try {
    const courseId = req.course?._id;
    const { moduleId, topicId } = req.params;

    const result = await courseCreatorTopicService.deleteTopic(topicId, moduleId, courseId);

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
 * Handles reordering topics within a creator's verified module.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const reorderTopics = async (req, res, next) => {
  try {
    const courseId = req.course?._id;
    const { moduleId } = req.params;
    const { topicIds } = req.body;

    const topics = await courseCreatorTopicService.reorderTopics(courseId, moduleId, topicIds);

    return res.status(200).json({
      status: 'success',
      message: 'Topics reordered successfully',
      data: { topics },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Handles retrieving educational content for a creator's verified topic.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getTopicContent = async (req, res, next) => {
  try {
    const courseId = req.course?._id || req.params.courseId;
    const moduleId = req.module?._id || req.params.moduleId;
    const { topicId } = req.params;

    const content = await courseCreatorTopicService.getTopicContent(topicId, moduleId, courseId);

    return res.status(200).json({
      status: 'success',
      data: { content },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Handles updating educational content for a creator's verified topic.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const updateTopicContent = async (req, res, next) => {
  try {
    const courseId = req.course?._id || req.params.courseId;
    const moduleId = req.module?._id || req.params.moduleId;
    const { topicId } = req.params;

    const content = await courseCreatorTopicService.updateTopicContent(
      topicId,
      moduleId,
      courseId,
      req.body
    );

    return res.status(200).json({
      status: 'success',
      message: 'Topic content updated successfully',
      data: { content },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createTopic,
  getTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
  reorderTopics,
  getTopicContent,
  updateTopicContent,
};
