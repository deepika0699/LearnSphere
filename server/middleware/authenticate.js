import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/auth.js';
import User, { normalizeRole } from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';

/**
 * JWT Access-Token Authentication Middleware
 *
 * Security & Design:
 * - Reads the access token from the HTTP Authorization header using the `Bearer <token>` format.
 * - Verifies the token using the existing JWT_ACCESS_SECRET from jwtConfig.
 * - Rejects missing, malformed, invalid, or expired tokens with HTTP 401.
 * - Returns a single generic error message without exposing verification details.
 * - Validates that the referenced user still exists in MongoDB and obtains their authoritative current role.
 * - Rejects deleted or nonexistent users with HTTP 401 Unauthorized.
 * - Completely ignores client-supplied identity from request body, query params, or URL.
 * - Never logs or exposes access tokens or secrets.
 * - Never echoes back the token in error responses.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Must be in Bearer <token> format
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const accessSecret = jwtConfig.accessSecret;
    if (!accessSecret) {
      throw new Error('JWT access secret configuration is missing');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, accessSecret, {
        algorithms: ['HS256'],
      });
    } catch {
      // Do not disclose whether the token expired, had an invalid signature, or was malformed
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userId = decoded?.userId || decoded?.sub;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check authoritative user status in MongoDB
    const user = await User.findById(userId).select('role status isTemporary expiresAt');
    if (!user || user.status === 'inactive' || (user.isExpired && user.isExpired())) {
      if (user && user.isExpired && user.isExpired()) {
        await RefreshSession.updateMany(
          { userId: user._id, revokedAt: null },
          { $set: { revokedAt: new Date() } }
        );
        user.status = 'inactive';
        await user.save();
      }
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Store verified authoritative identity in req.user with canonical role
    req.user = {
      userId: user._id.toString(),
      id: user._id.toString(),
      role: normalizeRole(user.role) || user.role,
      status: user.status || 'active',
    };

    return next();
  } catch (err) {
    return next(err);
  }
};

export default authenticate;
