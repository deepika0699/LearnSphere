import mongoose from 'mongoose';

/**
 * Answer Record Sub-Schema
 */
const attemptAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Question ID is required'],
    },
    selectedOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Assessment Attempt Schema for LearnSphere
 */
const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Assessment ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: [true, 'Attempt number is required'],
      min: [1, 'Attempt number must be at least 1'],
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    startedAt: {
      type: Date,
      required: [true, 'Started at timestamp is required'],
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    answers: {
      type: [attemptAnswerSchema],
      default: [],
    },
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctAnswersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, attemptNumber: 1 }, { unique: true });
assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, status: 1 });
assessmentAttemptSchema.index({ userId: 1, courseId: 1 });
assessmentAttemptSchema.index({ assessmentId: 1, status: 1 });

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

export default AssessmentAttempt;
