import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { formatSafeAssessmentForStudent } from './assessmentService.js';
import studentProgressService from './studentProgressService.js';

// 5-second network grace period for server-side timer enforcement
const TIMER_GRACE_PERIOD_MS = 5000;

/**
 * Validates that a course is published and the student is actively enrolled.
 *
 * @param {string} courseId
 * @param {string} studentId
 * @returns {Promise<{ course: Object, enrollment: Object }>}
 */
export const verifyActiveEnrollment = async (courseId, studentId) => {
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

  if (course.status !== 'published') {
    const err = new Error('Course is not published');
    err.statusCode = 403;
    throw err;
  }

  const enrollment = await Enrollment.findOne({
    userId: studentId,
    courseId,
    status: { $in: ['active', 'completed'] },
  });

  if (!enrollment) {
    const err = new Error('Forbidden: You must be actively enrolled in this course to access assessments');
    err.statusCode = 403;
    throw err;
  }

  return { course, enrollment };
};

/**
 * Formats an attempt document for student response.
 * In-progress attempts omit evaluation details (isCorrect, score, isPassed).
 */
export const formatSafeAttempt = (attempt) => {
  if (!attempt) return null;
  const doc = attempt.toObject ? attempt.toObject() : attempt;

  const isFinalized = doc.status === 'completed' || doc.status === 'timed_out';

  return {
    id: doc._id.toString(),
    assessmentId: doc.assessmentId?.toString ? doc.assessmentId.toString() : doc.assessmentId,
    courseId: doc.courseId?.toString ? doc.courseId.toString() : doc.courseId,
    topicId: doc.topicId?.toString ? doc.topicId.toString() : doc.topicId || null,
    attemptNumber: doc.attemptNumber,
    status: doc.status,
    startedAt: doc.startedAt,
    expiresAt: doc.expiresAt,
    submittedAt: doc.submittedAt,
    totalQuestions: doc.totalQuestions,
    // Results included only when finalized
    correctAnswersCount: isFinalized ? doc.correctAnswersCount : undefined,
    score: isFinalized ? doc.score : undefined,
    isPassed: isFinalized ? doc.isPassed : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * Get assessment details for taking/previewing.
 * STRICT SECURITY: Never leaks correctOptionId or explanation.
 */
export const getAssessmentForStudent = async (courseId, assessmentId, studentId) => {
  await verifyActiveEnrollment(courseId, studentId);

  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    const err = new Error('Invalid assessment ID format');
    err.statusCode = 400;
    throw err;
  }

  const assessment = await Assessment.findOne({
    _id: assessmentId,
    courseId,
    status: 'published',
  });

  if (!assessment) {
    const err = new Error('Published assessment not found');
    err.statusCode = 404;
    throw err;
  }

  const safeAssessment = formatSafeAssessmentForStudent(assessment, true);

  // Check student's attempts overview
  const pastAttempts = await AssessmentAttempt.find({
    assessmentId,
    userId: studentId,
  }).sort({ attemptNumber: 1 });

  const activeAttempt = pastAttempts.find((a) => a.status === 'in_progress');
  const finalizedAttempts = pastAttempts.filter((a) => a.status !== 'in_progress');

  return {
    assessment: safeAssessment,
    attemptOverview: {
      hasActiveAttempt: Boolean(activeAttempt),
      activeAttempt: activeAttempt ? formatSafeAttempt(activeAttempt) : null,
      pastAttemptsCount: finalizedAttempts.length,
      maxAttempts: assessment.maxAttempts,
      isMaxAttemptsReached: assessment.maxAttempts > 0 && finalizedAttempts.length >= assessment.maxAttempts,
    },
  };
};

/**
 * Start a new assessment attempt or resume an existing in-progress attempt.
 */
export const startAssessmentAttempt = async (courseId, assessmentId, studentId) => {
  await verifyActiveEnrollment(courseId, studentId);

  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    const err = new Error('Invalid assessment ID format');
    err.statusCode = 400;
    throw err;
  }

  const assessment = await Assessment.findOne({
    _id: assessmentId,
    courseId,
    status: 'published',
  });

  if (!assessment) {
    const err = new Error('Published assessment not found');
    err.statusCode = 404;
    throw err;
  }

  // 1. Check for existing in_progress attempt
  const existingAttempt = await AssessmentAttempt.findOne({
    assessmentId,
    userId: studentId,
    status: 'in_progress',
  });

  if (existingAttempt) {
    // Check if the existing attempt has expired past the grace period
    if (existingAttempt.expiresAt && Date.now() > existingAttempt.expiresAt.getTime() + TIMER_GRACE_PERIOD_MS) {
      existingAttempt.status = 'timed_out';
      existingAttempt.submittedAt = existingAttempt.expiresAt;
      await existingAttempt.save();
      // Proceed to allow new attempt if within limits
    } else {
      // Resume existing in-progress attempt without creating duplicates
      return {
        attempt: formatSafeAttempt(existingAttempt),
        isResumed: true,
      };
    }
  }

  // 2. Check maximum attempts limit
  const finalizedAttemptsCount = await AssessmentAttempt.countDocuments({
    assessmentId,
    userId: studentId,
    status: { $in: ['completed', 'timed_out', 'abandoned'] },
  });

  if (assessment.maxAttempts > 0 && finalizedAttemptsCount >= assessment.maxAttempts) {
    const err = new Error(`Maximum allowed attempts (${assessment.maxAttempts}) reached for this assessment`);
    err.statusCode = 400;
    throw err;
  }

  // 3. Create server-authoritative timer deadline
  const startedAt = new Date();
  const expiresAt = assessment.timeLimitMinutes > 0
    ? new Date(startedAt.getTime() + assessment.timeLimitMinutes * 60 * 1000)
    : null;

  const newAttempt = new AssessmentAttempt({
    assessmentId,
    userId: studentId,
    courseId,
    topicId: assessment.type === 'topic' ? assessment.topicId : null,
    attemptNumber: finalizedAttemptsCount + 1,
    status: 'in_progress',
    startedAt,
    expiresAt,
    totalQuestions: assessment.questions ? assessment.questions.length : 0,
    answers: [],
  });

  await newAttempt.save();

  return {
    attempt: formatSafeAttempt(newAttempt),
    isResumed: false,
  };
};

/**
 * Submit answers for an active attempt.
 * Server evaluates correctness, calculates scores, and finalizes the attempt.
 */
export const submitAssessmentAttempt = async (courseId, assessmentId, studentId, submissionData) => {
  await verifyActiveEnrollment(courseId, studentId);

  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    const err = new Error('Invalid assessment ID format');
    err.statusCode = 400;
    throw err;
  }

  const assessment = await Assessment.findOne({
    _id: assessmentId,
    courseId,
    status: 'published',
  });

  if (!assessment) {
    const err = new Error('Published assessment not found');
    err.statusCode = 404;
    throw err;
  }

  // 1. Locate the active in_progress attempt
  const attempt = await AssessmentAttempt.findOne({
    assessmentId,
    userId: studentId,
    status: 'in_progress',
  });

  if (!attempt) {
    // Check if the most recent attempt is already completed or timed out
    const latestAttempt = await AssessmentAttempt.findOne({
      assessmentId,
      userId: studentId,
    }).sort({ attemptNumber: -1 });

    if (latestAttempt && (latestAttempt.status === 'completed' || latestAttempt.status === 'timed_out')) {
      const err = new Error('This assessment attempt has already been finalized');
      err.statusCode = 409;
      throw err;
    }

    const err = new Error('No active assessment attempt in progress to submit');
    err.statusCode = 400;
    throw err;
  }

  // 2. Server-side timer deadline check
  const now = Date.now();
  const isTimedOut = attempt.expiresAt && now > attempt.expiresAt.getTime() + TIMER_GRACE_PERIOD_MS;

  // 3. Validate answers array
  const rawAnswers = Array.isArray(submissionData.answers) ? submissionData.answers : [];
  const questionMap = new Map();
  (assessment.questions || []).forEach((q) => {
    questionMap.set(q._id.toString(), q);
  });

  // Track answered questions to prevent duplicate answer submission
  const processedAnswersMap = new Map();

  for (const ans of rawAnswers) {
    if (!ans || typeof ans !== 'object') continue;

    const qIdStr = ans.questionId ? ans.questionId.toString() : '';
    if (!qIdStr || !mongoose.Types.ObjectId.isValid(qIdStr)) {
      const err = new Error('Each submitted answer must include a valid questionId');
      err.statusCode = 400;
      throw err;
    }

    if (!questionMap.has(qIdStr)) {
      const err = new Error(`Question ID ${qIdStr} does not belong to this assessment`);
      err.statusCode = 400;
      throw err;
    }

    if (processedAnswersMap.has(qIdStr)) {
      const err = new Error(`Duplicate answer submitted for question ID ${qIdStr}`);
      err.statusCode = 400;
      throw err;
    }

    const question = questionMap.get(qIdStr);
    let selectedOptionId = null;

    if (ans.selectedOptionId) {
      const optIdStr = ans.selectedOptionId.toString();
      if (!mongoose.Types.ObjectId.isValid(optIdStr)) {
        const err = new Error(`Invalid selectedOptionId format for question ${qIdStr}`);
        err.statusCode = 400;
        throw err;
      }

      const validOption = (question.options || []).some((o) => o._id.toString() === optIdStr);
      if (!validOption) {
        const err = new Error(`selectedOptionId ${optIdStr} is not a valid option for question ${qIdStr}`);
        err.statusCode = 400;
        throw err;
      }
      selectedOptionId = new mongoose.Types.ObjectId(optIdStr);
    }

    processedAnswersMap.set(qIdStr, selectedOptionId);
  }

  // 4. Server evaluates correctness and calculates scores
  let correctAnswersCount = 0;
  const evaluatedAnswers = [];

  for (const question of assessment.questions || []) {
    const qIdStr = question._id.toString();
    const selectedOptionId = processedAnswersMap.get(qIdStr) || null;
    const isCorrect = Boolean(
      selectedOptionId &&
      question.correctOptionId &&
      selectedOptionId.toString() === question.correctOptionId.toString()
    );

    if (isCorrect) {
      correctAnswersCount += 1;
    }

    evaluatedAnswers.push({
      questionId: question._id,
      selectedOptionId,
      isCorrect,
    });
  }

  const totalQuestions = (assessment.questions || []).length;
  const score = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
  const isPassed = score >= assessment.passingScore;

  // 5. Finalize attempt
  attempt.answers = evaluatedAnswers;
  attempt.totalQuestions = totalQuestions;
  attempt.correctAnswersCount = correctAnswersCount;
  attempt.score = score;
  attempt.isPassed = isPassed;
  attempt.submittedAt = new Date();
  attempt.status = isTimedOut ? 'timed_out' : 'completed';

  await attempt.save();

  // If the attempt was passed, evaluate and synchronize course completion
  if (isPassed) {
    try {
      await studentProgressService.checkAndSyncCourseCompletion({
        userId: studentId,
        courseId,
      });
    } catch {
      // Non-blocking completion synchronization
    }
  }

  // 6. Return finalized review
  const reviewQuestions = (assessment.questions || []).map((q) => {
    const evalAns = evaluatedAnswers.find((a) => a.questionId.toString() === q._id.toString());
    return {
      id: q._id.toString(),
      prompt: q.prompt,
      codeSnippet: q.codeSnippet || '',
      order: q.order,
      options: (q.options || []).map((o) => ({
        id: o._id.toString(),
        text: o.text,
        order: o.order,
      })),
      selectedOptionId: evalAns?.selectedOptionId ? evalAns.selectedOptionId.toString() : null,
      correctOptionId: q.correctOptionId ? q.correctOptionId.toString() : null,
      isCorrect: Boolean(evalAns?.isCorrect),
      explanation: q.explanation || '',
    };
  });

  return {
    attempt: formatSafeAttempt(attempt),
    results: {
      totalQuestions,
      correctAnswersCount,
      score,
      passingScore: assessment.passingScore,
      isPassed,
      status: attempt.status,
      review: reviewQuestions,
    },
  };
};

/**
 * Get all attempts for the authenticated student on a specific assessment.
 */
export const getStudentAttempts = async (courseId, assessmentId, studentId) => {
  await verifyActiveEnrollment(courseId, studentId);

  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    const err = new Error('Invalid assessment ID format');
    err.statusCode = 400;
    throw err;
  }

  const attempts = await AssessmentAttempt.find({
    assessmentId,
    userId: studentId,
  }).sort({ attemptNumber: 1 });

  return attempts.map(formatSafeAttempt);
};

/**
 * Get detailed review of a specific completed attempt.
 * STRICT: Only accessible to the student who took the attempt, and only when finalized.
 */
export const getStudentAttemptReview = async (courseId, assessmentId, attemptId, studentId) => {
  await verifyActiveEnrollment(courseId, studentId);

  if (!mongoose.Types.ObjectId.isValid(assessmentId) || !mongoose.Types.ObjectId.isValid(attemptId)) {
    const err = new Error('Invalid ID format');
    err.statusCode = 400;
    throw err;
  }

  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    const err = new Error('Assessment attempt not found');
    err.statusCode = 404;
    throw err;
  }

  // Cross-student access control
  if (attempt.userId.toString() !== studentId.toString()) {
    const err = new Error('Forbidden: You can only view your own assessment attempts');
    err.statusCode = 403;
    throw err;
  }

  if (attempt.assessmentId.toString() !== assessmentId.toString()) {
    const err = new Error('Attempt does not belong to the specified assessment');
    err.statusCode = 400;
    throw err;
  }

  if (attempt.status === 'in_progress') {
    const err = new Error('Detailed review is not available while an attempt is still in progress');
    err.statusCode = 400;
    throw err;
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    const err = new Error('Assessment not found');
    err.statusCode = 404;
    throw err;
  }

  const reviewQuestions = (assessment.questions || []).map((q) => {
    const evalAns = (attempt.answers || []).find((a) => a.questionId.toString() === q._id.toString());
    return {
      id: q._id.toString(),
      prompt: q.prompt,
      codeSnippet: q.codeSnippet || '',
      order: q.order,
      options: (q.options || []).map((o) => ({
        id: o._id.toString(),
        text: o.text,
        order: o.order,
      })),
      selectedOptionId: evalAns?.selectedOptionId ? evalAns.selectedOptionId.toString() : null,
      correctOptionId: q.correctOptionId ? q.correctOptionId.toString() : null,
      isCorrect: Boolean(evalAns?.isCorrect),
      explanation: q.explanation || '',
    };
  });

  return {
    attempt: formatSafeAttempt(attempt),
    results: {
      totalQuestions: attempt.totalQuestions,
      correctAnswersCount: attempt.correctAnswersCount,
      score: attempt.score,
      passingScore: assessment.passingScore,
      isPassed: attempt.isPassed,
      status: attempt.status,
      review: reviewQuestions,
    },
  };
};

/**
 * Get all published assessments for a course with the authenticated student's attempt overview.
 * STRICT SECURITY: Never leaks correctOptionId or explanation.
 */
export const getCourseAssessmentsForStudent = async (courseId, studentId) => {
  await verifyActiveEnrollment(courseId, studentId);

  const assessments = await Assessment.find({
    courseId,
    status: 'published',
  }).sort({ type: 1, createdAt: 1 });

  if (assessments.length === 0) {
    return { assessments: [] };
  }

  const assessmentIds = assessments.map((a) => a._id);

  const finalizedAttempts = await AssessmentAttempt.find({
    assessmentId: { $in: assessmentIds },
    userId: studentId,
    status: { $in: ['completed', 'timed_out'] },
  }).sort({ submittedAt: -1, createdAt: -1 });

  // Check for active in_progress attempts
  const activeAttempts = await AssessmentAttempt.find({
    assessmentId: { $in: assessmentIds },
    userId: studentId,
    status: 'in_progress',
  });

  const attemptsByAssessmentId = new Map();
  for (const att of finalizedAttempts) {
    const aIdStr = att.assessmentId.toString();
    if (!attemptsByAssessmentId.has(aIdStr)) {
      attemptsByAssessmentId.set(aIdStr, []);
    }
    attemptsByAssessmentId.get(aIdStr).push(att);
  }

  const activeAttemptByAssessmentId = new Map();
  for (const att of activeAttempts) {
    activeAttemptByAssessmentId.set(att.assessmentId.toString(), att);
  }

  const formattedAssessments = assessments.map((assessment) => {
    const aIdStr = assessment._id.toString();
    const attempts = attemptsByAssessmentId.get(aIdStr) || [];
    const hasPassed = attempts.some((att) => att.isPassed === true);
    const activeAtt = activeAttemptByAssessmentId.get(aIdStr);

    const bestScore = attempts.reduce(
      (max, att) => (typeof att.score === 'number' && att.score > max ? att.score : max),
      0
    );
    const latestAttempt = attempts[0] || null;

    let status = 'not_started';
    if (hasPassed) {
      status = 'passed';
    } else if (activeAtt) {
      status = 'in_progress';
    } else if (attempts.length > 0) {
      status = 'failed';
    }

    return {
      id: aIdStr,
      assessmentId: aIdStr,
      title: assessment.title,
      description: assessment.description || '',
      type: assessment.type,
      moduleId: assessment.moduleId ? assessment.moduleId.toString() : null,
      topicId: assessment.topicId ? assessment.topicId.toString() : null,
      passingScore: assessment.passingScore,
      timeLimitMinutes: assessment.timeLimitMinutes,
      maxAttempts: assessment.maxAttempts,
      totalQuestions: assessment.questions ? assessment.questions.length : 0,
      attemptsCount: attempts.length,
      bestScore,
      latestScore: latestAttempt ? latestAttempt.score : null,
      isPassed: hasPassed,
      status,
      lastAttemptAt: latestAttempt?.submittedAt || null,
      createdAt: assessment.createdAt,
    };
  });

  return { assessments: formattedAssessments };
};

export default {
  verifyActiveEnrollment,
  formatSafeAttempt,
  getAssessmentForStudent,
  getCourseAssessmentsForStudent,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  getStudentAttempts,
  getStudentAttemptReview,
};
