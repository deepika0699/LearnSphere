import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';
import { jwtConfig, cookieConfig } from '../config/auth.js';
import {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
} from '../services/tokenService.js';

/**
 * Controller for Student Registration
 * POST /api/auth/register
 *
 * Security & Design:
 * - Only extracts `name`, `email`, and `password` from the request body to prevent mass-assignment.
 * - Forces role to 'student', preventing privilege escalation attempts (admin/course_creator).
 * - Checks if email already exists and responds with HTTP 409 Conflict.
 * - Relies on Mongoose User model pre-save hook for bcrypt password hashing.
 * - Never returns password or internal credentials in the response.
 * - Forwards unexpected errors to next(err) for centralized sanitized handling.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if an account already exists with this normalized email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists.',
      });
    }

    // Create student account - explicitly setting role to 'student'
    const newUser = await User.create({
      name: (name || '').trim(),
      email: normalizedEmail,
      password,
      role: 'student',
    });

    // Return safe user payload (password excluded by User model toJSON and select: false)
    return res.status(201).json({
      status: 'success',
      message: 'Student registered successfully',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      },
    });
  } catch (err) {
    // Handle duplicate key error code 11000 from MongoDB unique index race conditions
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists.',
      });
    }
    return next(err);
  }
};

/**
 * Controller for User Login
 * POST /api/auth/login
 *
 * Security & Design:
 * - Accepts only `email` and `password` from the request body.
 * - Normalizes the email address before querying.
 * - Selects `+password` specifically for verification via comparePassword().
 * - Returns a generic HTTP 401 error without revealing whether email or password was invalid.
 * - Issues a signed JWT access token containing only minimal non-sensitive identity (userId, role).
 * - Excludes password and password hash completely from the response.
 * - Client cannot specify or modify role through login.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Query user by normalized email, explicitly including password field only for verification
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Generic rejection if user does not exist
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Verify candidate password against the stored bcrypt hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid || user.status === 'inactive') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Server-side check for temporary account expiration
    if (user.isExpired && user.isExpired()) {
      await RefreshSession.updateMany(
        { userId: user._id, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
      user.status = 'inactive';
      await user.save();
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT access token containing only minimal identity claims (sub, jti, exp, role)
    const accessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
    });

    // Generate signed refresh token
    const refreshToken = generateRefreshToken({
      userId: user._id,
      role: user.role,
    });

    // Hash refresh token using secure one-way cryptographic hash
    const tokenHash = hashToken(refreshToken);

    // Determine expiration timestamp from token payload
    const decodedRefresh = jwt.decode(refreshToken);
    const expiresAt = decodedRefresh?.exp
      ? new Date(decodedRefresh.exp * 1000)
      : new Date(Date.now() + (cookieConfig.refreshToken.options.maxAge || 7 * 24 * 60 * 60 * 1000));

    // Persist refresh session containing only the token hash
    try {
      await RefreshSession.create({
        userId: user._id,
        tokenHash,
        expiresAt,
      });
    } catch (sessionErr) {
      // Do not issue a refresh-token cookie if session creation fails
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while establishing your session.',
      });
    }

    // Deliver actual refresh token ONLY via secure HttpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    // Return access token and safe sanitized user info
    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Controller for Token Refresh
 * POST /api/auth/refresh
 *
 * Security & Design:
 * - Reads the refresh token exclusively from the HttpOnly cookie via tokenService.
 * - Verifies the token using JWT_REFRESH_SECRET.
 * - Computes one-way cryptographic SHA-256 hash using hashToken().
 * - Atomically finds and revokes the active RefreshSession in MongoDB.
 * - Enforces race-condition protection: two simultaneous refresh calls cannot rotate the same session.
 * - Prevents token reuse: attempting to use a revoked session rejects immediately with HTTP 401.
 * - Loads authoritative user role directly from MongoDB (never trusts client claims).
 * - Rotates the refresh session: generates a new refresh token, saves a new RefreshSession, and sets new HttpOnly cookie.
 * - Returns a new short-lived access token and sanitized user profile.
 * - Clears refresh cookie on invalid, expired, or revoked attempts.
 * - Never returns or logs plaintext tokens or secrets.
 */
export const refresh = async (req, res, next) => {
  try {
    // 1. Read refresh token from the HttpOnly cookie
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    // 2. Verify token against JWT_REFRESH_SECRET
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    // 3. Extract verified userId (supporting both standard sub and userId claims)
    const userId = decoded?.userId || decoded?.sub;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    // 4. Hash presented token
    const oldTokenHash = hashToken(refreshToken);

    // 5. Atomically revoke old active session (Race-condition & reuse protection)
    // Ensures only one concurrent request can successfully claim and rotate this session
    const oldSession = await RefreshSession.findOneAndUpdate(
      {
        tokenHash: oldTokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
        userId: userId,
      },
      {
        $set: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        },
      },
      { returnDocument: 'before' }
    );

    // If no active session matched, token is non-existent, expired, or already revoked (reuse attempt)
    if (!oldSession) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    // 6. Verify that the referenced user still exists in MongoDB and load authoritative role
    const user = await User.findById(userId).select('role email name status createdAt isTemporary expiresAt');
    if (!user || user.status === 'inactive' || (user.isExpired && user.isExpired())) {
      if (user && user.isExpired && user.isExpired()) {
        await RefreshSession.updateMany(
          { userId: user._id, revokedAt: null },
          { $set: { revokedAt: new Date() } }
        );
        user.status = 'inactive';
        await user.save();
      }
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication session is invalid or expired',
      });
    }

    // 7. Generate a completely new refresh token using authoritative DB role
    const newRefreshToken = generateRefreshToken({
      userId: user._id,
      role: user.role,
    });
    const newTokenHash = hashToken(newRefreshToken);

    const decodedNewRefresh = jwt.decode(newRefreshToken);
    const newExpiresAt = decodedNewRefresh?.exp
      ? new Date(decodedNewRefresh.exp * 1000)
      : new Date(Date.now() + (cookieConfig.refreshToken.options.maxAge || 7 * 24 * 60 * 60 * 1000));

    // 8. Create new RefreshSession document for the rotated token
    try {
      await RefreshSession.create({
        userId: user._id,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      });
    } catch (sessionErr) {
      clearRefreshTokenCookie(res);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while refreshing your session.',
      });
    }

    // 9. Generate a new short-lived access token using authoritative DB role and standard claims
    const accessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
    });

    // 10. Set new refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, newRefreshToken);

    // 11. Return only the new access token and safe user information
    return res.status(200).json({
      status: 'success',
      message: 'Access token refreshed successfully',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Controller for User Logout
 * POST /api/auth/logout
 *
 * Security & Design:
 * - When a valid refreshToken cookie is present, hashes the token and marks the session revoked in MongoDB.
 * - Clears the HttpOnly refreshToken cookie.
 * - Safely clears cookie and returns success even if cookie is missing or invalid.
 * - Never reveals token values or hashes.
 * - Never logs sensitive credentials.
 */
export const logout = async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);

    if (refreshToken && typeof refreshToken === 'string') {
      try {
        const tokenHash = hashToken(refreshToken);
        await RefreshSession.updateOne(
          { tokenHash, revokedAt: null },
          { $set: { revokedAt: new Date() } }
        );
      } catch {
        // Silently handle any token hashing or DB errors; ensure cookie is still cleared
      }
    }

    // Clear the HttpOnly refresh token cookie
    clearRefreshTokenCookie(res);

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Controller for Getting Current Authenticated User Profile
 * GET /api/auth/me
 *
 * Security & Design:
 * - Protected by authenticate middleware.
 * - Identifies user exclusively from verified `req.user.userId`.
 * - Fetches user from MongoDB, explicitly excluding password and password hash.
 * - Returns only safe user fields: id, name, email, role, createdAt.
 * - Completely ignores client-supplied input in request body, query params, or URL.
 * - Returns a generic HTTP 401 if the user no longer exists in the database.
 * - Does not expose database errors or internal details.
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Explicitly exclude password and retrieve only existing user
    const user = await User.findById(userId).select('-password');

    if (!user || user.status === 'inactive') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  getMe,
};
