import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Canonical LearnSphere platform roles.
 */
export const CANONICAL_ROLES = Object.freeze(['student', 'courseCreator', 'admin']);

/**
 * Normalizes any recognized role variant to the canonical role name.
 * Maps legacy 'course_creator' to 'courseCreator'.
 *
 * @param {string} role - The raw role string.
 * @returns {string|null} Normalized canonical role or null if invalid/unrecognized.
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return null;
  const trimmed = role.trim();
  if (trimmed === 'courseCreator' || trimmed === 'course_creator') {
    return 'courseCreator';
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'student') return 'student';
  if (lower === 'admin') return 'admin';
  return null;
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Prevents password from being returned in queries by default
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['student', 'courseCreator', 'admin'],
        message: 'Role must be student, courseCreator, or admin',
      },
      default: 'student',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be active or inactive',
      },
      default: 'active',
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre('validate', function () {
  if (this.role) {
    this.role = normalizeRole(this.role) || this.role;
  }
});

/**
 * Pre-save hook:
 * 1. Normalizes role to canonical LearnSphere role (e.g. course_creator -> courseCreator)
 * 2. Hashes password securely using bcrypt before saving.
 * Ensures plaintext passwords are never stored in the database.
 */
userSchema.pre('save', async function (next) {
  if (this.role) {
    this.role = normalizeRole(this.role) || this.role;
  }

  if (!this.isModified('password')) {
    if (typeof next === 'function') return next();
    return;
  }

  try {
    // Avoid double-hashing if already a bcrypt hash
    const isBcryptHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password);
    if (!isBcryptHash) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    if (typeof next === 'function') next();
  } catch (err) {
    if (typeof next === 'function') return next(err);
    throw err;
  }
});

/**
 * Helper instance method to securely compare a candidate password
 * with the hashed password when authentication is implemented.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Helper instance method to determine if a temporary user account has expired.
 * Compares current system time against expiresAt timestamp.
 */
userSchema.methods.isExpired = function () {
  if (this.isTemporary && this.expiresAt) {
    return new Date() > new Date(this.expiresAt);
  }
  return false;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
