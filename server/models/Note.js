import mongoose from 'mongoose';

/**
 * Note Schema for LearnSphere
 *
 * Represents a personalized student note.
 * Supports:
 *  1. Standalone personal note (independent student thought/summary).
 *  2. Highlight/source-based note (references specific Course -> Module -> Topic
 *     with plain selected text and separate student commentary).
 *
 * Ownership is strictly server-authoritative and bound to the authenticated student's userId.
 */
const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    noteType: {
      type: String,
      enum: ['standalone', 'highlight'],
      default: 'standalone',
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Note title cannot exceed 200 characters'],
      default: '',
    },
    // Student's personal explanation, analysis, or comment (plain text)
    content: {
      type: String,
      trim: true,
      maxlength: [10000, 'Note content cannot exceed 10000 characters'],
      default: '',
    },
    // The exact text highlighted / selected from the topic (plain text only)
    selectedText: {
      type: String,
      trim: true,
      maxlength: [5000, 'Selected text cannot exceed 5000 characters'],
      default: '',
    },
    // Stable Source References (Course -> Module -> Topic)
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
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
    // Title snapshots to allow breadcrumbs & navigation without expensive N+1 joins
    courseTitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Course title snapshot cannot exceed 200 characters'],
      default: '',
    },
    moduleTitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Module title snapshot cannot exceed 200 characters'],
      default: '',
    },
    topicTitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Topic title snapshot cannot exceed 200 characters'],
      default: '',
    },
    // Optional tags for student organization & revision categorizing
    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [50, 'Tag name cannot exceed 50 characters'],
        },
      ],
      default: [],
    },
    // Optional visual accent color for student note card styling in revision area
    color: {
      type: String,
      trim: true,
      enum: ['default', 'amber', 'emerald', 'sky', 'indigo', 'rose', 'purple'],
      default: 'default',
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

// Indexes tailored for student notes queries
// 1. List student's notes newest first
noteSchema.index({ userId: 1, createdAt: -1 });

// 2. List student's notes by last updated (revision flow)
noteSchema.index({ userId: 1, updatedAt: -1 });

// 3. Query notes for a specific topic while inside TopicReader
noteSchema.index({ userId: 1, courseId: 1, topicId: 1 });

// 4. Query notes filtered by noteType (e.g. only highlights or only standalone)
noteSchema.index({ userId: 1, noteType: 1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
