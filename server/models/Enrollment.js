import mongoose from 'mongoose';

/**
 * Restricted enumeration of supported enrollment statuses.
 */
export const ENROLLMENT_STATUSES = Object.freeze(['active', 'completed', 'withdrawn']);

/**
 * Enrollment Schema for LearnSphere
 * Represents a student's enrollment record for an educational course.
 */
const enrollmentSchema = new mongoose.Schema(
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
    enrolledAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Enrolled date is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ENROLLMENT_STATUSES,
        message: 'Status must be active, completed, or withdrawn',
      },
      default: 'active',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
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

// Unique compound index preventing duplicate user-course enrollments
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Performance indexes for student dashboard queries and course rosters
enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ createdAt: -1 });

// Pre-save validation: only published courses permit enrollment
enrollmentSchema.pre('save', async function () {
  if (this.isNew || this.isModified('courseId')) {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.courseId).select('status');
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    if (course.status !== 'published') {
      const err = new Error(
        `Cannot enroll in course with status '${course.status}'. Only published courses allow enrollment.`
      );
      err.statusCode = 400;
      throw err;
    }
  }
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
