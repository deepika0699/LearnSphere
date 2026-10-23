import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Canonical statuses for academic certificates.
 */
export const CERTIFICATE_STATUSES = Object.freeze(['valid', 'revoked']);

/**
 * Generates a cryptographically secure, non-predictable certificate identifier.
 * Format: LS-XXXX-XXXX-XXXX (uppercase hexadecimal entropy)
 * Provides 48 bits of cryptographic randomness across 12 characters.
 *
 * @returns {string} Formatted certificate ID (e.g., 'LS-A4B7-C9E2-F1D0')
 */
export const generateCertificateId = () => {
  const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `LS-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
};

/**
 * Certificate Schema for LearnSphere
 *
 * Represents an authoritative, immutable academic credential awarded to a student
 * upon fulfilling all server-evaluated course completion criteria.
 */
const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: [true, 'Certificate ID is required'],
      unique: true,
      trim: true,
      maxlength: [32, 'Certificate ID cannot exceed 32 characters'],
      immutable: true,
      default: generateCertificateId,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      immutable: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      immutable: true,
      index: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name snapshot is required'],
      trim: true,
      minlength: [1, 'Student name cannot be empty'],
      maxlength: [200, 'Student name cannot exceed 200 characters'],
      immutable: true,
    },
    courseTitle: {
      type: String,
      required: [true, 'Course title snapshot is required'],
      trim: true,
      minlength: [1, 'Course title cannot be empty'],
      maxlength: [300, 'Course title cannot exceed 300 characters'],
      immutable: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
      immutable: true,
    },
    completedAt: {
      type: Date,
      required: [true, 'Authoritative completion timestamp is required'],
      immutable: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: CERTIFICATE_STATUSES,
        message: 'Status must be valid or revoked',
      },
      default: 'valid',
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

// CRITICAL UNIQUE CONSTRAINT: Exactly one canonical certificate per student per course
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Performance index for student credential listing ordered by creation
certificateSchema.index({ userId: 1, createdAt: -1 });

const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

export default Certificate;
