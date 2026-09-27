import mongoose from 'mongoose';

/**
 * Question Option Sub-Schema
 */
const questionOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
      minlength: [1, 'Option text must be at least 1 character long'],
      maxlength: [1000, 'Option text cannot exceed 1000 characters'],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

/**
 * Question Sub-Schema
 */
const assessmentQuestionSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: [true, 'Question prompt is required'],
      trim: true,
      minlength: [3, 'Question prompt must be at least 3 characters long'],
      maxlength: [5000, 'Question prompt cannot exceed 5000 characters'],
    },
    codeSnippet: {
      type: String,
      trim: true,
      maxlength: [10000, 'Code snippet cannot exceed 10000 characters'],
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    options: {
      type: [questionOptionSchema],
      validate: [
        {
          validator: function (val) {
            return Array.isArray(val) && val.length >= 2;
          },
          message: 'Each question must have at least 2 options',
        },
      ],
    },
    correctOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Correct option ID is required'],
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [2000, 'Explanation cannot exceed 2000 characters'],
      default: '',
    },
  },
  { _id: true }
);

/**
 * Assessment Schema for LearnSphere
 */
const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
      minlength: [3, 'Assessment title must be at least 3 characters long'],
      maxlength: [200, 'Assessment title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Assessment description cannot exceed 2000 characters'],
      default: '',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['topic', 'course'],
      required: [true, 'Assessment type is required'],
      default: 'topic',
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    passingScore: {
      type: Number,
      required: [true, 'Passing score is required'],
      min: [0, 'Passing score cannot be less than 0'],
      max: [100, 'Passing score cannot exceed 100'],
      default: 70,
    },
    timeLimitMinutes: {
      type: Number,
      min: [0, 'Time limit cannot be less than 0'],
      max: [300, 'Time limit cannot exceed 300 minutes'],
      default: 0, // 0 = untimed
    },
    maxAttempts: {
      type: Number,
      min: [0, 'Maximum attempts cannot be less than 0'],
      max: [100, 'Maximum attempts cannot exceed 100'],
      default: function () {
        return this.type === 'course' ? 3 : 0; // 0 = unlimited for topic
      },
    },
    questions: {
      type: [assessmentQuestionSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries
assessmentSchema.index({ courseId: 1, type: 1, status: 1 });
assessmentSchema.index({ courseId: 1, topicId: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;
