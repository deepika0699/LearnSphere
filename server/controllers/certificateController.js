import studentCertificateService from '../services/studentCertificateService.js';

/**
 * GET /api/certificates/verify/:certificateId
 * Public verification endpoint for academic certificates.
 * Returns only safe, whitelisted verification data.
 */
export const verifyCertificateHandler = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const verification = await studentCertificateService.verifyCertificatePublic({
      certificateId,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        certificate: verification,
      },
    });
  } catch (err) {
    return next(err);
  }
};
