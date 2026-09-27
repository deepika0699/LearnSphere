import mongoose from 'mongoose';

/**
 * Module Schema for LearnSphere
 * A module represents an organized educational unit within a course (e.g., "Module 1: Introduction to C").
 * Strictly normalized: belongs to exactly one Course.
 */
const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [0, 'Order must be a non-negative number'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
  }
);

// Compound index to optimize querying and ordered sorting of modules within a course
moduleSchema.index({ courseId: 1, order: 1 });
moduleSchema.index({ createdAt: -1 });

const Module = mongoose.model('Module', moduleSchema);

export default Module;
