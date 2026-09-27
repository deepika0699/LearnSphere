import mongoose from 'mongoose';

/**
 * Syllabus item sub-schema suitable for modular course structures and future expansions.
 */
const syllabusItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Syllabus item title is required'],
      trim: true,
      maxlength: [200, 'Syllabus item title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Syllabus item description cannot exceed 1000 characters'],
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

/**
 * Course Schema for LearnSphere
 */
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters long'],
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    courseCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course creator is required'],
    },
    thumbnail: {
      type: String,
      trim: true,
      maxlength: [500, 'Thumbnail URL cannot exceed 500 characters'],
      default: '',
    },
    syllabus: {
      type: [syllabusItemSchema],
      default: [],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['draft', 'published', 'archived'],
        message: 'Status must be draft, published, or archived',
      },
      default: 'draft',
      index: true,
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

courseSchema.index({ category: 1 });
courseSchema.index({ courseCreator: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ status: 1, category: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
