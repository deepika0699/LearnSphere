import studentCertificateService from '../services/studentCertificateService.js';

/**
 * GET /api/student/certificates
 * Retrieves all certificates belonging to the authenticated student.
 */
export const getStudentCertificatesHandler = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    const certificates = await studentCertificateService.getStudentCertificates({
      userId,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        certificates,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/student/certificates/claim/:courseId
 * Claims or generates an authoritative certificate for a completed course.
 * All eligibility checks and completion rules are enforced server-side.
 */
export const claimCertificateHandler = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { courseId } = req.params;

    const certificate = await studentCertificateService.claimOrGenerateCertificate({
      userId,
      courseId,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Certificate issued successfully',
      data: {
        certificate,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/student/certificates/:certificateId
 * Retrieves a single certificate by public certificateId belonging to the authenticated student.
 * Cross-student access returns 404 to avoid leaking credential existence.
 */
export const getStudentCertificateByIdHandler = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { certificateId } = req.params;

    const certificate = await studentCertificateService.getStudentCertificateById({
      userId,
      certificateId,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        certificate,
      },
    });
  } catch (err) {
    return next(err);
  }
};
