import mongoose from 'mongoose';

/**
 * Normalizes MongoDB connection URI to handle common template quirks (e.g. angle brackets around passwords)
 * and URL-encodes special characters in credentials (such as @ or symbols).
 */
const normalizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return uri;

  const lastAtIndex = uri.lastIndexOf('@');
  if (lastAtIndex === -1) return uri;

  const userInfoPart = uri.slice(0, lastAtIndex);
  const hostAndRest = uri.slice(lastAtIndex + 1);

  const protocolMatch = userInfoPart.match(/^(mongodb(?:\+srv)?:\/\/)/);
  if (!protocolMatch) return uri;

  const protocol = protocolMatch[1];
  const userAndPass = userInfoPart.slice(protocol.length);
  const colonIndex = userAndPass.indexOf(':');
  if (colonIndex === -1) return uri;

  const user = userAndPass.slice(0, colonIndex);
  let pass = userAndPass.slice(colonIndex + 1);

  if (pass.startsWith('<') && pass.endsWith('>')) {
    pass = pass.slice(1, -1);
  }

  let encodedPass;
  try {
    encodedPass = encodeURIComponent(decodeURIComponent(pass));
  } catch {
    encodedPass = encodeURIComponent(pass);
  }

  return `${protocol}${user}:${encodedPass}@${hostAndRest}`;
};

/**
 * Connect to MongoDB using Mongoose.
 * Connection string is read strictly from process.env.MONGODB_URI.
 * Sensitive data such as credentials or connection URIs are never logged or exposed.
 */
export const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    console.warn('MongoDB notice: MONGODB_URI environment variable is not defined.');
    return;
  }

  try {
    const uri = normalizeMongoUri(rawUri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB database successfully.');
  } catch (error) {
    // Generic error message without exposing connection strings, credentials, or stack traces
    console.error('Failed to connect to MongoDB database.');
  }
};

/**
 * Returns current database connection status.
 * Ready states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
