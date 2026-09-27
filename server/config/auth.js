import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables from root .env are loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Authentication and JWT Configuration Foundation
 *
 * Securely exposes configuration values for JWT access and refresh tokens.
 * All secret keys are strictly retrieved from process.env and never hard-coded,
 * logged, or returned in API responses.
 */
export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || '',
  refreshSecret: process.env.JWT_REFRESH_SECRET || '',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Security Check: Verify that access and refresh secrets are not identical if both are defined
if (
  jwtConfig.accessSecret &&
  jwtConfig.refreshSecret &&
  jwtConfig.accessSecret === jwtConfig.refreshSecret
) {
  console.error('SECURITY WARNING: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical.');
}

export const cookieConfig = {
  refreshToken: {
    name: 'refreshToken',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds matching refresh token expiry
    },
  },
};

export const authConfig = {
  jwt: jwtConfig,
  cookie: cookieConfig,
};

export default authConfig;
