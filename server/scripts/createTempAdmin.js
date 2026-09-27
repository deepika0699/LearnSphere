import 'dotenv/config';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';

const TEMP_ADMIN_EMAIL = 'temp-admin@learnsphere.local';
const EXPIRATION_MINUTES = 30;
const EXPIRATION_MS = EXPIRATION_MINUTES * 60 * 1000;

/**
 * Generates a cryptographically strong random password
 * containing uppercase, lowercase, numbers, and special characters.
 */
const generateSecureTempPassword = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const specials = '!@#$%^&*';
  let rand = '';
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 14; i++) {
    rand += chars[bytes[i] % chars.length];
  }
  const specialChar = specials[bytes[14] % specials.length];
  const num = (bytes[15] % 9) + 1;
  return `Adm#${rand}${num}${specialChar}`;
};

async function run() {
  // 1. Refuse execution in production
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Temporary admin creation is strictly forbidden in production.');
    process.exit(1);
  }

  try {
    // 2. Connect to existing MongoDB
    await connectDB();
    if (!isDbConnected()) {
      console.error('ERROR: Could not establish connection to MongoDB database.');
      process.exit(1);
    }

    // 3. Generate secure high-entropy random password
    const rawPassword = generateSecureTempPassword();
    const expiresAt = new Date(Date.now() + EXPIRATION_MS);

    // 4. Create or update the temporary admin user
    let user = await User.findOne({ email: TEMP_ADMIN_EMAIL });

    if (!user) {
      user = new User({
        name: 'Temporary Admin (Dev)',
        email: TEMP_ADMIN_EMAIL,
        password: rawPassword,
        role: 'admin',
        status: 'active',
        isTemporary: true,
        expiresAt: expiresAt,
      });
    } else {
      user.name = 'Temporary Admin (Dev)';
      user.password = rawPassword;
      user.role = 'admin';
      user.status = 'active';
      user.isTemporary = true;
      user.expiresAt = expiresAt;
    }

    // Saving triggers the User model's pre-save hook which securely bcrypt-hashes the password
    await user.save();

    // 5. Revoke any previous refresh sessions for this temporary account
    await RefreshSession.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    // 6. Print credentials ONCE in the terminal for the developer
    console.log('\n======================================================');
    console.log('       LEARNSPHERE TEMPORARY ADMIN CREATED');
    console.log('======================================================');
    console.log(`Email:       ${user.email}`);
    console.log(`Password:    ${rawPassword}`);
    console.log(`Role:        ${user.role}`);
    console.log(`Valid For:   ${EXPIRATION_MINUTES} minutes`);
    console.log(`Expires At:  ${expiresAt.toISOString()}`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('Failed to create temporary admin user:', error.message);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch {}
  }
}

run();
