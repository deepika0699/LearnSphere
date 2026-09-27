import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';

/**
 * Validates course hierarchy relationships for assessments.
 * Ensures Course, Module, and Topic strictly belong to one another without trusting client input.
 *
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.type - 'topic' | 'course'
 * @param {string} [params.moduleId]
 * @param {string} [params.topicId]
 * @returns {Promise<{ course: Object, module: Object|null, topic: Object|null }>}
 */
export const validateAssessmentHierarchy = async ({ courseId, type, moduleId, topicId }) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const err = new Error('Invalid course ID format');
    err.statusCode = 400;
    throw err;
  }

  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  if (type === 'course') {
    if (moduleId || topicId) {
      const err = new Error('Course-level assessments must not specify moduleId or topicId');
      err.statusCode = 400;
      throw err;
    }
    return { course, module: null, topic: null };
  }

  if (type === 'topic') {
    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      const err = new Error('moduleId is required for topic assessments');
      err.statusCode = 400;
      throw err;
    }
    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      const err = new Error('topicId is required for topic assessments');
      err.statusCode = 400;
      throw err;
    }

    const moduleDoc = await Module.findById(moduleId);
    if (!moduleDoc) {
      const err = new Error('Module not found');
      err.statusCode = 404;
      throw err;
    }

    if (moduleDoc.courseId.toString() !== courseId.toString()) {
      const err = new Error('Module does not belong to the specified course');
      err.statusCode = 400;
      throw err;
    }

    const topicDoc = await Topic.findById(topicId);
    if (!topicDoc) {
      const err = new Error('Topic not found');
      err.statusCode = 404;
      throw err;
    }

    if (topicDoc.courseId.toString() !== courseId.toString() || topicDoc.moduleId.toString() !== moduleId.toString()) {
      const err = new Error('Topic does not belong to the specified module and course');
      err.statusCode = 400;
      throw err;
    }

    return { course, module: moduleDoc, topic: topicDoc };
  }

  const err = new Error("Invalid assessment type. Must be 'topic' or 'course'");
  err.statusCode = 400;
  throw err;
};

/**
 * Validates and normalizes questions and their options.
 * Ensures stable ObjectIds, option integrity, and exactly one correct option per question.
 *
 * @param {Array} questions - Raw questions array from payload.
 * @returns {Array} Normalized questions array.
 */
export const validateAndNormalizeQuestions = (questions) => {
  if (!questions) return [];
  if (!Array.isArray(questions)) {
    const err = new Error('Questions must be an array');
    err.statusCode = 400;
    throw err;
  }

  return questions.map((q, qIndex) => {
    if (!q || typeof q !== 'object') {
      const err = new Error(`Question at index ${qIndex} must be an object`);
      err.statusCode = 400;
      throw err;
    }

    const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : '';
    if (prompt.length < 3 || prompt.length > 5000) {
      const err = new Error(`Question ${qIndex + 1} prompt must be between 3 and 5000 characters`);
      err.statusCode = 400;
      throw err;
    }

    const codeSnippet = typeof q.codeSnippet === 'string' ? q.codeSnippet.trim() : '';
    if (codeSnippet.length > 10000) {
      const err = new Error(`Question ${qIndex + 1} code snippet cannot exceed 10000 characters`);
      err.statusCode = 400;
      throw err;
    }

    const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
    if (explanation.length > 2000) {
      const err = new Error(`Question ${qIndex + 1} explanation cannot exceed 2000 characters`);
      err.statusCode = 400;
      throw err;
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      const err = new Error(`Question ${qIndex + 1} must have at least 2 options`);
      err.statusCode = 400;
      throw err;
    }

    // Normalize options and establish stable ObjectIds
    const normalizedOptions = q.options.map((opt, optIndex) => {
      if (!opt || typeof opt !== 'object') {
        const err = new Error(`Option ${optIndex + 1} in question ${qIndex + 1} must be an object`);
        err.statusCode = 400;
        throw err;
      }
      const text = typeof opt.text === 'string' ? opt.text.trim() : '';
      if (!text || text.length > 1000) {
        const err = new Error(`Option ${optIndex + 1} in question ${qIndex + 1} text must be between 1 and 1000 characters`);
        err.statusCode = 400;
        throw err;
      }

      const optId = opt._id && mongoose.Types.ObjectId.isValid(opt._id)
        ? new mongoose.Types.ObjectId(opt._id)
        : opt.id && mongoose.Types.ObjectId.isValid(opt.id)
        ? new mongoose.Types.ObjectId(opt.id)
        : new mongoose.Types.ObjectId();

      return {
        _id: optId,
        text,
        order: typeof opt.order === 'number' ? opt.order : optIndex,
      };
    });

    // Validate correctOptionId
    if (!q.correctOptionId) {
      const err = new Error(`Question ${qIndex + 1} must specify a correctOptionId`);
      err.statusCode = 400;
      throw err;
    }

    const correctOptionIdStr = q.correctOptionId.toString();
    const matchingOption = normalizedOptions.find((o) => o._id.toString() === correctOptionIdStr);
    if (!matchingOption) {
      const err = new Error(`correctOptionId in question ${qIndex + 1} must match one of its option IDs`);
      err.statusCode = 400;
      throw err;
    }

    const questionId = q._id && mongoose.Types.ObjectId.isValid(q._id)
      ? new mongoose.Types.ObjectId(q._id)
      : q.id && mongoose.Types.ObjectId.isValid(q.id)
      ? new mongoose.Types.ObjectId(q.id)
      : new mongoose.Types.ObjectId();

    return {
      _id: questionId,
      prompt,
      codeSnippet,
      order: typeof q.order === 'number' ? q.order : qIndex,
      options: normalizedOptions,
      correctOptionId: matchingOption._id,
      explanation,
    };
  });
};

/**
 * Formats an assessment document for Author/Admin view.
 * Includes correctOptionId and explanation for authorized authoring.
 */
export const formatSafeAssessmentForAuthor = (assessment) => {
  if (!assessment) return null;
  const doc = assessment.toObject ? assessment.toObject() : assessment;

  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description || '',
    courseId: doc.courseId?.toString ? doc.courseId.toString() : doc.courseId,
    type: doc.type,
    moduleId: doc.moduleId?.toString ? doc.moduleId.toString() : doc.moduleId || null,
    topicId: doc.topicId?.toString ? doc.topicId.toString() : doc.topicId || null,
    status: doc.status,
    passingScore: doc.passingScore,
    timeLimitMinutes: doc.timeLimitMinutes,
    maxAttempts: doc.maxAttempts,
    questionsCount: doc.questions ? doc.questions.length : 0,
    questions: (doc.questions || []).map((q) => ({
      id: q._id.toString(),
      prompt: q.prompt,
      codeSnippet: q.codeSnippet || '',
      order: q.order,
      options: (q.options || []).map((o) => ({
        id: o._id.toString(),
        text: o.text,
        order: o.order,
      })),
      correctOptionId: q.correctOptionId?.toString ? q.correctOptionId.toString() : q.correctOptionId,
      explanation: q.explanation || '',
    })),
    createdBy: doc.createdBy?.toString ? doc.createdBy.toString() : doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * Formats an assessment document for Student view.
 * STRICT SECURITY INVARIANT: Removes correctOptionId and explanation from every question.
 */
export const formatSafeAssessmentForStudent = (assessment, includeQuestions = true) => {
  if (!assessment) return null;
  const doc = assessment.toObject ? assessment.toObject() : assessment;

  const result = {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description || '',
    courseId: doc.courseId?.toString ? doc.courseId.toString() : doc.courseId,
    type: doc.type,
    moduleId: doc.moduleId?.toString ? doc.moduleId.toString() : doc.moduleId || null,
    topicId: doc.topicId?.toString ? doc.topicId.toString() : doc.topicId || null,
    passingScore: doc.passingScore,
    timeLimitMinutes: doc.timeLimitMinutes,
    maxAttempts: doc.maxAttempts,
    totalQuestions: doc.questions ? doc.questions.length : 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (includeQuestions && Array.isArray(doc.questions)) {
    result.questions = doc.questions.map((q) => ({
      id: q._id.toString(),
      prompt: q.prompt,
      codeSnippet: q.codeSnippet || '',
      order: q.order,
      options: (q.options || []).map((o) => ({
        id: o._id.toString(),
        text: o.text,
        order: o.order,
      })),
    }));
  }

  return result;
};

/**
 * Create a new assessment.
 */
export const createAssessment = async ({ courseId, data, user }) => {
  const { title, description, type, moduleId, topicId, status, passingScore, timeLimitMinutes, maxAttempts, questions } = data;

  // 1. Hierarchy verification
  const { course } = await validateAssessmentHierarchy({
    courseId,
    type: type || 'topic',
    moduleId,
    topicId,
  });

  // 2. Ownership verification for Course Creator
  if (user.role === 'courseCreator') {
    if (course.courseCreator.toString() !== (user.userId || user.id).toString()) {
      const err = new Error('Forbidden: You do not own this course');
      err.statusCode = 403;
      throw err;
    }
  }

  // 3. Question validation & normalization
  const normalizedQuestions = validateAndNormalizeQuestions(questions || []);

  // 4. Default attempt limits
  const defaultMaxAttempts = type === 'course' ? 3 : 0;
  const resolvedMaxAttempts = typeof maxAttempts === 'number' ? maxAttempts : defaultMaxAttempts;

  const assessment = new Assessment({
    title,
    description: description || '',
    courseId,
    type: type || 'topic',
    moduleId: type === 'topic' ? moduleId : null,
    topicId: type === 'topic' ? topicId : null,
    status: status || 'draft',
    passingScore: typeof passingScore === 'number' ? passingScore : 70,
    timeLimitMinutes: typeof timeLimitMinutes === 'number' ? timeLimitMinutes : 0,
    maxAttempts: resolvedMaxAttempts,
    questions: normalizedQuestions,
    createdBy: user.userId || user.id,
  });

  await assessment.save();
  return formatSafeAssessmentForAuthor(assessment);
};

/**
 * Get all assessments for a course (Creator/Admin view).
 */
export const getAssessmentsByCourse = async ({ courseId, user }) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const err = new Error('Invalid course ID format');
    err.statusCode = 400;
    throw err;
  }

  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Course not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'courseCreator') {
    if (course.courseCreator.toString() !== (user.userId || user.id).toString()) {
      const err = new Error('Forbidden: You do not own this course');
      err.statusCode = 403;
      throw err;
    }
  }

  const assessments = await Assessment.find({ courseId }).sort({ createdAt: -1 });
  return assessments.map(formatSafeAssessmentForAuthor);
};

/**
 * Get single assessment by ID (Creator/Admin view).
 */
export const getAssessmentById = async ({ assessmentId, courseId = null, user }) => {
  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    const err = new Error('Invalid assessment ID format');
    err.statusCode = 400;
    throw err;
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    const err = new Error('Assessment not found');
    err.statusCode = 404;
    throw err;
  }

  if (courseId && assessment.courseId.toString() !== courseId.toString()) {
    const err = new Error('Assessment does not belong to the specified course');
    err.statusCode = 400;
    throw err;
  }

  if (user.role === 'courseCreator') {
    const course = await Course.findById(assessment.courseId);
    if (!course || course.courseCreator.toString() !== (user.userId || user.id).toString()) {
      const err = new Error('Forbidden: You do not own this course');
      err.statusCode = 403;
      throw err;
    }
  }

  return formatSafeAssessmentForAuthor(assessment);
};

/**
 * Update assessment.
 */
export const updateAssessment = async ({ assessmentId, courseId = null, data, user }) => {
  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    const err = new Error('Invalid assessment ID format');
    err.statusCode = 400;
    throw err;
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    const err = new Error('Assessment not found');
    err.statusCode = 404;
    throw err;
  }

  if (courseId && assessment.courseId.toString() !== courseId.toString()) {
    const err = new Error('Assessment does not belong to the specified course');
    err.statusCode = 400;
    throw err;
  }

  if (user.role === 'courseCreator') {
    const course = await Course.findById(assessment.courseId);
    if (!course || course.courseCreator.toString() !== (user.userId || user.id).toString()) {
      const err = new Error('Forbidden: You do not own this course');
      err.statusCode = 403;
      throw err;
    }
  }

  // If hierarchy fields are being changed, validate them
  const targetCourseId = data.courseId || assessment.courseId;
  const targetType = data.type || assessment.type;
  const targetModuleId = data.moduleId !== undefined ? data.moduleId : assessment.moduleId;
  const targetTopicId = data.topicId !== undefined ? data.topicId : assessment.topicId;

  if (data.courseId || data.type || data.moduleId !== undefined || data.topicId !== undefined) {
    await validateAssessmentHierarchy({
      courseId: targetCourseId,
      type: targetType,
      moduleId: targetModuleId,
      topicId: targetTopicId,
    });
    assessment.courseId = targetCourseId;
    assessment.type = targetType;
    assessment.moduleId = targetType === 'topic' ? targetModuleId : null;
    assessment.topicId = targetType === 'topic' ? targetTopicId : null;
  }

  if (data.title !== undefined) assessment.title = data.title;
  if (data.description !== undefined) assessment.description = data.description;
  if (data.status !== undefined) assessment.status = data.status;
  if (data.passingScore !== undefined) assessment.passingScore = data.passingScore;
  if (data.timeLimitMinutes !== undefined) assessment.timeLimitMinutes = data.timeLimitMinutes;
  if (data.maxAttempts !== undefined) assessment.maxAttempts = data.maxAttempts;

  if (data.questions !== undefined) {
    assessment.questions = validateAndNormalizeQuestions(data.questions);
  }

  await assessment.save();
  return formatSafeAssessmentForAuthor(assessment);
};

/**
 * Archive or Delete an assessment.
 */
export const archiveOrDeleteAssessment = async ({ assessmentId, courseId = null, user }) => {
  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    const err = new Error('Invalid assessment ID format');
    err.statusCode = 400;
    throw err;
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    const err = new Error('Assessment not found');
    err.statusCode = 404;
    throw err;
  }

  if (courseId && assessment.courseId.toString() !== courseId.toString()) {
    const err = new Error('Assessment does not belong to the specified course');
    err.statusCode = 400;
    throw err;
  }

  if (user.role === 'courseCreator') {
    const course = await Course.findById(assessment.courseId);
    if (!course || course.courseCreator.toString() !== (user.userId || user.id).toString()) {
      const err = new Error('Forbidden: You do not own this course');
      err.statusCode = 403;
      throw err;
    }
  }

  // Check if any attempts exist; if attempts exist, archive instead of hard delete to preserve student records
  const attemptsCount = await AssessmentAttempt.countDocuments({ assessmentId });
  if (attemptsCount > 0) {
    assessment.status = 'archived';
    await assessment.save();
    return {
      id: assessment._id.toString(),
      status: 'archived',
      message: 'Assessment has existing student attempts; status changed to archived to preserve records',
    };
  }

  await Assessment.findByIdAndDelete(assessmentId);
  return {
    id: assessmentId,
    deleted: true,
    message: 'Assessment deleted successfully',
  };
};

/**
 * Get aggregate statistics for an assessment (Admin only, privacy-safe).
 */
export const getAssessmentStats = async ({ assessmentId }) => {
  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    const err = new Error('Invalid assessment ID format');
    err.statusCode = 400;
    throw err;
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    const err = new Error('Assessment not found');
    err.statusCode = 404;
    throw err;
  }

  const totalAttempts = await AssessmentAttempt.countDocuments({ assessmentId });
  const completedAttempts = await AssessmentAttempt.countDocuments({ assessmentId, status: 'completed' });
  const passedAttempts = await AssessmentAttempt.countDocuments({ assessmentId, status: 'completed', isPassed: true });
  const timedOutAttempts = await AssessmentAttempt.countDocuments({ assessmentId, status: 'timed_out' });

  // Average score for completed attempts
  const scoreAgg = await AssessmentAttempt.aggregate([
    { $match: { assessmentId: new mongoose.Types.ObjectId(assessmentId), status: 'completed' } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]);

  const avgScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0;
  const passRate = completedAttempts > 0 ? Math.round((passedAttempts / completedAttempts) * 100) : 0;
  const passCount = passedAttempts;
  const failCount = Math.max(0, completedAttempts - passedAttempts);

  return {
    assessmentId: assessment._id.toString(),
    title: assessment.title,
    type: assessment.type,
    totalAttempts,
    completedAttempts,
    passedAttempts,
    passCount,
    failCount,
    timedOutAttempts,
    passRate,
    averageScore: avgScore,
  };
};

export default {
  validateAssessmentHierarchy,
  validateAndNormalizeQuestions,
  formatSafeAssessmentForAuthor,
  formatSafeAssessmentForStudent,
  createAssessment,
  getAssessmentsByCourse,
  getAssessmentById,
  updateAssessment,
  archiveOrDeleteAssessment,
  getAssessmentStats,
};
