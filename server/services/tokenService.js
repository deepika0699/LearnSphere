import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { jwtConfig, cookieConfig } from '../config/auth.js';

/**
 * Token Service Foundation
 *
 * Provides secure generation, verification, and HttpOnly cookie management
 * for JWT refresh tokens.
 *
 * Security Principles:
 * - Refresh tokens are signed with JWT_REFRESH_SECRET loaded exclusively from process.env.
 * - Refresh tokens must NOT be stored in client-side storage (localStorage, sessionStorage)
 *   or exposed unnecessarily to client-side scripts.
 * - Prepared for delivery via HttpOnly, Secure, SameSite cookies scoped strictly to /api/auth.
 * - Tokens, secrets, and credentials are never logged or exposed.
 * - Only one-way cryptographic hashes of refresh tokens are stored in database sessions.
 */

/**
 * One-way cryptographic hash of a refresh token.
 * Uses SHA-256 to produce a fixed-length hexadecimal digest.
 * Allows deterministic session lookups without storing plaintext tokens.
 *
 * @param {string} token - Plaintext refresh token string.
 * @returns {string} SHA-256 hexadecimal hash digest.
 */
export const hashToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token string is required for hashing');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Securely generate a signed JWT access token.
 *
 * @param {Object} payload - Minimal identity claims.
 * @param {string} payload.userId - User identifier.
 * @param {string} payload.role - User role.
 * @returns {string} Signed JWT access token.
 */
export const generateAccessToken = (payload) => {
  if (!payload || !payload.userId) {
    throw new Error('User ID is required to generate an access token');
  }

  const accessSecret = jwtConfig.accessSecret;
  if (!accessSecret) {
    throw new Error('JWT access secret configuration is missing');
  }

  if (jwtConfig.refreshSecret && accessSecret === jwtConfig.refreshSecret) {
    throw new Error('Security violation: Access and refresh secrets must be distinct');
  }

  const userIdStr = payload.userId.toString();
  const tokenPayload = {
    userId: userIdStr,
    role: payload.role || 'student',
  };

  return jwt.sign(tokenPayload, accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
    algorithm: 'HS256',
    subject: userIdStr,
    jwtid: crypto.randomUUID(),
  });
};

/**
 * Securely generate a signed refresh token.
 *
 * @param {Object} payload - Token claims containing minimal identity.
 * @param {string} payload.userId - User identifier.
 * @param {string} payload.role - User role.
 * @returns {string} Signed JWT refresh token.
 */
export const generateRefreshToken = (payload) => {
  if (!payload || !payload.userId) {
    throw new Error('User ID is required to generate a refresh token');
  }

  const refreshSecret = jwtConfig.refreshSecret;
  if (!refreshSecret) {
    throw new Error('JWT refresh secret configuration is missing');
  }

  if (jwtConfig.accessSecret && refreshSecret === jwtConfig.accessSecret) {
    throw new Error('Security violation: Access and refresh secrets must be distinct');
  }

  const userIdStr = payload.userId.toString();
  const tokenPayload = {
    userId: userIdStr,
    role: payload.role || 'student',
  };

  return jwt.sign(tokenPayload, refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    algorithm: 'HS256',
    subject: userIdStr,
    jwtid: crypto.randomUUID(),
  });
};

/**
 * Securely verify a refresh token.
 * Explicitly restricts verification algorithms to HS256 to prevent algorithm confusion attacks.
 *
 * @param {string} token - Signed JWT refresh token.
 * @returns {Object} Decoded token payload.
 * @throws {Error} If token is invalid or expired.
 */
export const verifyRefreshToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Refresh token is required for verification');
  }

  const refreshSecret = jwtConfig.refreshSecret;
  if (!refreshSecret) {
    throw new Error('JWT refresh secret configuration is missing');
  }

  return jwt.verify(token, refreshSecret, {
    algorithms: ['HS256'],
  });
};

/**
 * Helper to set the refresh token as a secure HttpOnly cookie on an Express response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {string} refreshToken - Signed refresh token.
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
  const { name, options } = cookieConfig.refreshToken;
  res.cookie(name, refreshToken, options);
};

/**
 * Helper to clear the refresh token HttpOnly cookie.
 *
 * @param {import('express').Response} res - Express response object.
 */
export const clearRefreshTokenCookie = (res) => {
  const { name, options } = cookieConfig.refreshToken;
  res.clearCookie(name, {
    ...options,
    maxAge: 0,
  });
};

/**
 * Helper to extract the refresh token from an incoming Express request.
 * Safely parses either req.cookies (if cookie-parser is active) or the Cookie header.
 *
 * @param {import('express').Request} req - Express request object.
 * @returns {string|null} The refresh token if found, null otherwise.
 */
export const getRefreshTokenFromRequest = (req) => {
  if (!req) return null;

  const cookieName = cookieConfig.refreshToken.name;

  // 1. Check req.cookies
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }

  // 2. Fallback: Parse Cookie header directly
  const cookieHeader = req.headers?.cookie;
  if (typeof cookieHeader === 'string' && cookieHeader.length > 0) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, ...valParts] = cookie.trim().split('=');
      if (name === cookieName) {
        return decodeURIComponent(valParts.join('='));
      }
    }
  }

  return null;
};

export default {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
};
