/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Initial Administrator Provisioning Script
 *
 * Secure, operator-controlled one-time provisioning mechanism to create the
 * initial LearnSphere platform administrator when the database contains zero admins.
 *
 * Security Guarantees:
 * 1. CLI/Operator only — NOT exposed via any public HTTP or unauthenticated route.
 * 2. Idempotent & Non-Destructive — If ANY admin account already exists in MongoDB,
 *    provisioning is strictly refused. Never overwrites existing credentials.
 * 3. Bcrypt Password Hashing — Raw password is never stored; delegates to User
 *    model pre-save hook for 10-round salted bcrypt hashing.
 * 4. Zero Credential Leakage — Passwords, password hashes, secrets, JWTs, and
 *    MongoDB connection URIs are NEVER logged, printed, or exposed.
 * 5. Input Sanitization & Validation — Enforces strict email syntax, name bounds,
 *    and strong password policy (min 10 chars, uppercase, lowercase, digit, symbol,
 *    rejecting common trivial passwords).
 * 6. Server-Authoritative Role Assignment — Binds role strictly to 'admin' server-side.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';

// Password complexity rules
const MIN_PASSWORD_LENGTH = 10;
const TRIVIAL_PASSWORDS = new Set([
  'admin',
  'admin123',
  'admin1234',
  'password',
  'password123',
  'Password123',
  'Password123!',
  'changeme',
  'learnsphere',
  'administrator',
]);

/**
 * Parses CLI arguments in the format --key=value or --key value
 */
function parseCliArgs() {
  const args = {};
  const rawArgs = process.argv.slice(2);
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx).trim();
        const value = arg.slice(eqIdx + 1).trim();
        args[key] = value;
      } else if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('--')) {
        const key = arg.slice(2).trim();
        args[key] = rawArgs[i + 1].trim();
        i++;
      } else {
        const key = arg.slice(2).trim();
        args[key] = 'true';
      }
    }
  }
  return args;
}

/**
 * Validates candidate administrator credentials against security policy
 */
function validateCredentials(email, password, name) {
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Admin name must be between 2 and 100 characters.');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid administrator email address is required.');
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('A valid administrator password is required.');
  } else {
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z).');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z).');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one numeric digit (0-9).');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character symbol.');
    }
    if (TRIVIAL_PASSWORDS.has(password.trim().toLowerCase()) || TRIVIAL_PASSWORDS.has(password.trim())) {
      errors.push('Trivial or common default passwords are strictly prohibited.');
    }
  }

  return errors;
}

export async function provisionInitialAdmin(options = {}) {
  const cliArgs = parseCliArgs();

  // Operator-provided credentials:
  // Precedence: options object > environment variables > CLI arguments
  const rawEmail = options.email || process.env.INITIAL_ADMIN_EMAIL || cliArgs.email;
  const rawPassword = options.password || process.env.INITIAL_ADMIN_PASSWORD || cliArgs.password;
  const rawName = options.name || process.env.INITIAL_ADMIN_NAME || cliArgs.name || 'System Administrator';

  const validationErrors = validateCredentials(rawEmail, rawPassword, rawName);
  if (validationErrors.length > 0) {
    console.error('\nPROVISIONING REJECTED — Invalid Configuration:');
    for (const err of validationErrors) {
      console.error(`  ✗ ${err}`);
    }
    console.error('\nUsage:');
    console.error('  INITIAL_ADMIN_EMAIL="admin@domain.com" INITIAL_ADMIN_PASSWORD="<secure-pw>" npm run provision-admin');
    console.error('  OR: npm run provision-admin -- --email="admin@domain.com" --password="<secure-pw>" --name="Admin Name"');
    console.error('\nNo changes were made.');
    return { success: false, reason: 'VALIDATION_FAILED', errors: validationErrors };
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  const normalizedName = rawName.trim();

  try {
    // 1. Establish connection to existing MongoDB
    if (!isDbConnected()) {
      await connectDB();
    }

    if (!isDbConnected()) {
      console.error('ERROR: Could not establish connection to the database.');
      return { success: false, reason: 'DB_CONNECTION_FAILED' };
    }

    // 2. Authoritative Check: Does ANY Admin already exist in the database?
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('\n======================================================');
      console.log('PROVISIONING REFUSED — Administrator Already Exists');
      console.log('======================================================');
      console.log('LearnSphere already contains an active platform Administrator.');
      console.log('Initial provisioning is strictly a one-time onboarding mechanism');
      console.log('and will not overwrite or duplicate existing administrator accounts.');
      console.log('Existing Admin Email: ' + existingAdmin.email);
      console.log('======================================================\n');
      return {
        success: false,
        reason: 'ADMIN_ALREADY_EXISTS',
        adminId: existingAdmin._id.toString(),
        adminEmail: existingAdmin.email,
      };
    }

    // 3. Email collision check across all roles
    const existingUserWithEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserWithEmail) {
      console.error(`\nPROVISIONING REFUSED: An account with email "${normalizedEmail}" already exists with role "${existingUserWithEmail.role}".`);
      return { success: false, reason: 'EMAIL_COLLISION' };
    }

    // 4. Create the authoritative initial administrator
    // Note: User model pre-save hook handles salted bcrypt password hashing
    const adminUser = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: rawPassword,
      role: 'admin',
      status: 'active',
      isTemporary: false,
      expiresAt: null,
    });

    console.log('\n======================================================');
    console.log('LEARNSPHERE INITIAL ADMINISTRATOR PROVISIONED');
    console.log('======================================================');
    console.log(`Status:      SUCCESS (Account Active)`);
    console.log(`Admin ID:    ${adminUser._id}`);
    console.log(`Name:        ${adminUser.name}`);
    console.log(`Email:       ${adminUser.email}`);
    console.log(`Role:        ${adminUser.role}`);
    console.log(`Created At:  ${adminUser.createdAt?.toISOString()}`);
    console.log('======================================================');
    console.log('The administrator may now log in via the platform login page');
    console.log('or POST /api/auth/login using standard authentication.\n');

    return {
      success: true,
      user: {
        id: adminUser._id.toString(),
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
      },
    };
  } catch (err) {
    console.error('Fatal error during administrator provisioning:', err.message);
    return { success: false, reason: 'INTERNAL_ERROR', error: err.message };
  }
}

// Execute standalone CLI invocation
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  provisionInitialAdmin()
    .then(async (result) => {
      try {
        await mongoose.disconnect();
      } catch {}
      if (!result.success && result.reason !== 'ADMIN_ALREADY_EXISTS') {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch(async (err) => {
      console.error('Fatal CLI execution error:', err.message);
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(1);
    });
}
