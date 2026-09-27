import mongoose from 'mongoose';

/**
 * RefreshSession Mongoose Schema
 *
 * Security & Design:
 * - Stores only a one-way cryptographic hash of the refresh token (never the plain token).
 * - References the User model via `userId` for session management and user revocation.
 * - Enforces automatic document cleanup via MongoDB TTL index on `expiresAt`.
 * - Tracks session lifecycle timestamps (`createdAt`, `lastUsedAt`, `revokedAt`).
 * - Never stores passwords, secrets, tokens, or credential data.
 */
const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// TTL Index: MongoDB automatically purges expired sessions when expiresAt is reached
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for querying active sessions for a specific user
refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);

export default RefreshSession;
