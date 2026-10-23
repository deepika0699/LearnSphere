import mongoose from 'mongoose';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import studentProgressService from './studentProgressService.js';

/**
 * Formats a Certificate document into a safe, client-facing representation.
 * Omits internal Mongoose flags (__v) and sensitive account details.
 *
 * @param {Object} certDoc - Certificate Mongoose document or lean object.
 * @returns {Object|null} Sanitized student certificate representation.
 */
export const formatSafeCertificate = (certDoc) => {
  if (!certDoc) return null;
  const raw = typeof certDoc.toObject === 'function' ? certDoc.toObject() : certDoc;

  return {
    id: raw._id ? raw._id.toString() : raw.id,
    certificateId: raw.certificateId,
    userId: raw.userId ? raw.userId.toString() : undefined,
    courseId: raw.courseId ? raw.courseId.toString() : undefined,
    studentName: raw.studentName,
    courseTitle: raw.courseTitle,
    issueDate: raw.issueDate ? new Date(raw.issueDate).toISOString() : new Date().toISOString(),
    completedAt: raw.completedAt ? new Date(raw.completedAt).toISOString() : null,
    status: raw.status || 'valid',
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
  };
};

/**
 * Formats a Certificate document for public verification.
 * Strictly whitelists non-sensitive academic credentials.
 * Never leaks student email, user ID, tokens, or database internals.
 *
 * @param {Object} certDoc - Certificate Mongoose document or lean object.
 * @returns {Object|null} Sanitized public verification record.
 */
export const formatSafePublicCertificate = (certDoc) => {
  if (!certDoc) return null;
  const raw = typeof certDoc.toObject === 'function' ? certDoc.toObject() : certDoc;

  return {
    certificateId: raw.certificateId,
    studentName: raw.studentName,
    courseTitle: raw.courseTitle,
    issueDate: raw.issueDate ? new Date(raw.issueDate).toISOString() : new Date().toISOString(),
    completedAt: raw.completedAt ? new Date(raw.completedAt).toISOString() : null,
    status: raw.status || 'valid',
    isValid: raw.status === 'valid',
  };
};

/**
 * Student Certificate Service
 *
 * Encapsulates business logic for claiming, issuing, and retrieving student certificates.
 * Relies strictly on Phase 9 authoritative course-completion rules without duplicating
 * completion logic or trusting client state.
 */
export class StudentCertificateService {
  /**
   * Claims or generates an authoritative certificate for an authenticated student.
   *
   * Idempotent & Concurrency-Safe:
   * - If a certificate already exists for (userId, courseId), returns the canonical existing certificate.
   * - Handles concurrent claim duplicate-key races (E11000) gracefully by returning the winning certificate.
   * - Validates completion strictly against studentProgressService.checkAndSyncCourseCompletion.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID (server-derived).
   * @param {string|mongoose.Types.ObjectId} params.courseId - Course ID to claim certificate for.
   * @returns {Promise<Object>} Formatted safe certificate document.
   */
  async claimOrGenerateCertificate({ userId, courseId }) {
    // 1. Validate parameter format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Invalid student ID format');
      err.statusCode = 400;
      throw err;
    }
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      const err = new Error('Invalid course ID format');
      err.statusCode = 400;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const courseObjId = new mongoose.Types.ObjectId(courseId);

    // 2. Idempotency Check: Return existing certificate if already issued
    const existingCertificate = await Certificate.findOne({
      userId: userObjId,
      courseId: courseObjId,
    });

    if (existingCertificate) {
      return formatSafeCertificate(existingCertificate);
    }

    // 3. Verify student existence and active status
    const student = await User.findById(userObjId).select('name status isDeleted');
    if (!student || student.isDeleted || student.status === 'inactive') {
      const err = new Error('Student account not found or inactive');
      err.statusCode = 404;
      throw err;
    }

    // 4. Verify target course exists and is published
    const course = await Course.findById(courseObjId).select('title status');
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    if (course.status !== 'published') {
      const err = new Error('Certificates are only issued for published courses');
      err.statusCode = 400;
      throw err;
    }

    // 5. Authoritative Phase 9 Course Completion Evaluation
    // Relies directly on existing checkAndSyncCourseCompletion as single source of truth.
    const syncResult = await studentProgressService.checkAndSyncCourseCompletion({
      userId: userObjId,
      courseId: courseObjId,
    });

    if (!syncResult || !syncResult.isCompleted) {
      const err = new Error('Course completion requirements have not been satisfied');
      err.statusCode = 400;
      throw err;
    }

    // 6. Verify enrollment integrity and obtain authoritative completion timestamp
    const enrollment = await Enrollment.findOne({
      userId: userObjId,
      courseId: courseObjId,
    }).select('status completedAt');

    if (!enrollment || enrollment.status === 'withdrawn') {
      const err = new Error('Enrollment is withdrawn or not found');
      err.statusCode = 403;
      throw err;
    }

    if (enrollment.status !== 'completed') {
      const err = new Error('Course completion requirements have not been satisfied');
      err.statusCode = 400;
      throw err;
    }

    const completedAt = enrollment.completedAt || new Date();

    // 7. Prepare immutable historical snapshots
    const studentName = student.name ? student.name.trim() : 'Learner';
    const courseTitle = course.title ? course.title.trim() : 'Completed Course';

    // 8. Atomic insertion with concurrent race-condition handling
    try {
      const newCertificate = await Certificate.create({
        userId: userObjId,
        courseId: courseObjId,
        studentName,
        courseTitle,
        completedAt,
        issueDate: new Date(),
        status: 'valid',
      });

      return formatSafeCertificate(newCertificate);
    } catch (createErr) {
      // Handle concurrent insert duplicate-key error (MongoDB code 11000)
      if (
        createErr &&
        (createErr.code === 11000 ||
          (createErr.message && createErr.message.includes('E11000')))
      ) {
        const canonical = await Certificate.findOne({
          userId: userObjId,
          courseId: courseObjId,
        });
        if (canonical) {
          return formatSafeCertificate(canonical);
        }
      }
      throw createErr;
    }
  }

  /**
   * Retrieves all certificates belonging to the authenticated student.
   * Ordered by newest first. Strict ownership isolation enforced.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID (server-derived).
   * @returns {Promise<Array<Object>>} List of safe student certificates.
   */
  async getStudentCertificates({ userId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Invalid student ID format');
      err.statusCode = 400;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    const certificates = await Certificate.find({ userId: userObjId })
      .sort({ createdAt: -1 })
      .lean();

    return certificates.map(formatSafeCertificate);
  }

  /**
   * Retrieves a single certificate by ID with strict ownership validation.
   * Accepts either public certificateId (e.g. 'LS-XXXX-XXXX-XXXX') or MongoDB _id.
   * Returns 404 for nonexistent certificates or cross-student access attempts.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID (server-derived).
   * @param {string} params.certificateId - Public certificate ID or MongoDB document ID.
   * @returns {Promise<Object>} Formatted safe certificate document.
   */
  async getStudentCertificateById({ userId, certificateId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Invalid student ID format');
      err.statusCode = 400;
      throw err;
    }
    if (!certificateId || typeof certificateId !== 'string' || !certificateId.trim()) {
      const err = new Error('Certificate ID is required');
      err.statusCode = 400;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const trimmedId = certificateId.trim();

    // Query filter enforces strict student ownership
    const query = { userId: userObjId };
    if (mongoose.Types.ObjectId.isValid(trimmedId)) {
      query.$or = [{ _id: new mongoose.Types.ObjectId(trimmedId) }, { certificateId: trimmedId }];
    } else {
      query.certificateId = trimmedId;
    }

    const certificate = await Certificate.findOne(query);

    if (!certificate) {
      const err = new Error('Certificate not found');
      err.statusCode = 404;
      throw err;
    }

    return formatSafeCertificate(certificate);
  }

  /**
   * Public verification lookup for an academic certificate by public certificateId.
   * Returns whitelisted public information. Does not leak student email, tokens, or IDs.
   * Returns 404 for invalid or nonexistent certificate IDs.
   *
   * @param {Object} params
   * @param {string} params.certificateId - Public certificate ID (e.g. 'LS-XXXX-XXXX-XXXX').
   * @returns {Promise<Object>} Public verification details.
   */
  async verifyCertificatePublic({ certificateId }) {
    if (!certificateId || typeof certificateId !== 'string' || !certificateId.trim()) {
      const err = new Error('Certificate ID is required');
      err.statusCode = 400;
      throw err;
    }

    const trimmedId = certificateId.trim();

    // Format validation: must match expected LS- prefix or alphanumeric format
    const certIdRegex = /^LS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i;
    if (!certIdRegex.test(trimmedId)) {
      const err = new Error('Certificate not found or invalid format');
      err.statusCode = 404;
      throw err;
    }

    const certificate = await Certificate.findOne({
      certificateId: trimmedId.toUpperCase(),
    }).lean();

    if (!certificate) {
      const err = new Error('Certificate not found or invalid');
      err.statusCode = 404;
      throw err;
    }

    return formatSafePublicCertificate(certificate);
  }
}

const studentCertificateService = new StudentCertificateService();
export default studentCertificateService;
