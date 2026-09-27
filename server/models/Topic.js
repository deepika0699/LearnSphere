import mongoose from 'mongoose';

/**
 * Section sub-schema for granular topic explanations and article breakdowns.
 */
const sectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      trim: true,
      maxlength: [200, 'Section heading cannot exceed 200 characters'],
      default: '',
    },
    body: {
      type: String,
      trim: true,
      maxlength: [20000, 'Section body cannot exceed 20000 characters'],
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
 * Structured content sub-schema (GFG / W3Schools style).
 */
const topicContentSchema = new mongoose.Schema(
  {
    explanation: {
      type: String,
      trim: true,
      maxlength: [50000, 'Detailed explanation cannot exceed 50000 characters'],
      default: '',
    },
    sections: {
      type: [sectionSchema],
      default: [],
    },
  },
  { _id: false }
);

/**
 * Code Example sub-schema.
 */
const codeExampleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Code example title cannot exceed 200 characters'],
      default: '',
    },
    language: {
      type: String,
      trim: true,
      maxlength: [50, 'Language cannot exceed 50 characters'],
      default: 'c',
    },
    code: {
      type: String,
      required: [true, 'Code snippet is required'],
      maxlength: [30000, 'Code snippet cannot exceed 30000 characters'],
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [5000, 'Code explanation cannot exceed 5000 characters'],
      default: '',
    },
  },
  { _id: true }
);

/**
 * Image / Diagram sub-schema.
 * Stores safe URL references and captions; binary image blobs are not stored in MongoDB.
 */
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
      maxlength: [1000, 'Image URL cannot exceed 1000 characters'],
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [500, 'Image caption cannot exceed 500 characters'],
      default: '',
    },
    altText: {
      type: String,
      trim: true,
      maxlength: [200, 'Alt text cannot exceed 200 characters'],
      default: '',
    },
  },
  { _id: true }
);

/**
 * Multi-language video references sub-schema.
 * Supports optional YouTube / educational video references in English, Telugu, and Hindi.
 */
const videoReferencesSchema = new mongoose.Schema(
  {
    english: {
      type: String,
      trim: true,
      maxlength: [1000, 'Video URL cannot exceed 1000 characters'],
      default: null,
    },
    telugu: {
      type: String,
      trim: true,
      maxlength: [1000, 'Video URL cannot exceed 1000 characters'],
      default: null,
    },
    hindi: {
      type: String,
      trim: true,
      maxlength: [1000, 'Video URL cannot exceed 1000 characters'],
      default: null,
    },
  },
  { _id: false }
);

/**
 * External educational references sub-schema.
 * Stores curated external links (e.g. documentation, articles) to guide learners toward additional resources.
 * Only URLs and metadata are stored; external pages are never scraped or downloaded.
 */
const externalReferenceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Reference title is required'],
      trim: true,
      maxlength: [200, 'Reference title cannot exceed 200 characters'],
    },
    url: {
      type: String,
      required: [true, 'Reference URL is required'],
      trim: true,
      maxlength: [1000, 'Reference URL cannot exceed 1000 characters'],
    },
    source: {
      type: String,
      trim: true,
      maxlength: [100, 'Source name cannot exceed 100 characters'],
      default: '',
    },
  },
  { _id: true }
);

/**
 * Topic Schema for LearnSphere
 * Represents an individual learning unit (e.g. "Variables in C") belonging strictly to a Module.
 */
const topicSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module ID is required'],
      index: true,
    },
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
      maxlength: [200, 'Title cannot exceed 200 characters'],
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
    content: {
      type: topicContentSchema,
      default: () => ({ explanation: '', sections: [] }),
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    codeExamples: {
      type: [codeExampleSchema],
      default: [],
    },
    importantPoints: {
      type: [String],
      default: [],
    },
    videos: {
      type: videoReferencesSchema,
      default: () => ({ english: null, telugu: null, hindi: null }),
    },
    externalReferences: {
      type: [externalReferenceSchema],
      default: [],
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

// Compound indexes for fast ordered queries
topicSchema.index({ moduleId: 1, order: 1 });
topicSchema.index({ courseId: 1, order: 1 });
topicSchema.index({ createdAt: -1 });

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
