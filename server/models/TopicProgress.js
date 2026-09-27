import mongoose from 'mongoose';

/**
 * TopicProgress Schema for LearnSphere
 * Records a student's completion of an individual educational topic within a course.
 */
const topicProgressSchema = new mongoose.Schema(
  {
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
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module ID is required'],
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic ID is required'],
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Completion date is required'],
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

// Unique compound index preventing duplicate user-topic progress records
topicProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

// Useful indexes for querying student progress across courses and modules
topicProgressSchema.index({ userId: 1, courseId: 1 });
topicProgressSchema.index({ userId: 1, moduleId: 1 });
topicProgressSchema.index({ courseId: 1, topicId: 1 });
topicProgressSchema.index({ completedAt: -1 });
topicProgressSchema.index({ createdAt: -1 });

// Pre-save validation: enforce strict course -> module -> topic hierarchy
topicProgressSchema.pre('save', async function () {
  if (
    this.isNew ||
    this.isModified('topicId') ||
    this.isModified('moduleId') ||
    this.isModified('courseId')
  ) {
    const Topic = mongoose.model('Topic');
    const topic = await Topic.findById(this.topicId).select('moduleId courseId');
    if (!topic) {
      const err = new Error('Topic not found');
      err.statusCode = 404;
      throw err;
    }
    if (topic.moduleId.toString() !== this.moduleId.toString()) {
      const err = new Error('Topic does not belong to the specified module');
      err.statusCode = 400;
      throw err;
    }
    if (topic.courseId.toString() !== this.courseId.toString()) {
      const err = new Error('Topic does not belong to the specified course');
      err.statusCode = 400;
      throw err;
    }
  }
});

const TopicProgress = mongoose.model('TopicProgress', topicProgressSchema);

export default TopicProgress;
