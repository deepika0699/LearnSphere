import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import courseCreatorRouter from './routes/courseCreator.js';
import coursesRouter from './routes/courses.js';
import studentRouter from './routes/student.js';
import { connectDB } from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB database
connectDB();

const app = express();
// Enable trust proxy for reverse proxy environments (Vite dev proxy and container ingress)
app.set('trust proxy', 1);

// Default to port 5000 for the backend (avoiding container-internal port 8080 or Vite dev server port 3000)
const PORT = process.env.BACKEND_PORT || (process.env.PORT && process.env.PORT !== '8080' ? process.env.PORT : 5000);


// Security: Apply Helmet standard secure headers
app.use(helmet());

// Logging: Safe operational request logging
app.use(requestLogger);

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// CORS configuration: Safely allow credentials and prevent wildcard origins
const configuredClientUrl = process.env.CLIENT_URL;
const configuredAppUrl = process.env.APP_URL;

const allowedOrigins = [
  ...(configuredClientUrl ? configuredClientUrl.split(',').map((u) => u.trim()).filter(Boolean) : []),
  ...(configuredAppUrl ? [configuredAppUrl.trim()].filter(Boolean) : []),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser agents, curl, or same-origin requests where Origin header is omitted
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS request blocked: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting: General limiter applied to all /api endpoints
app.use('/api', apiLimiter);

// API Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/creator', courseCreatorRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/student', studentRouter);

// 404 Catch-All Handler
app.use(notFoundHandler);

// Centralized Error Handler - sanitizes errors to avoid leaking stack traces or credentials
app.use(errorHandler);

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LearnSphere backend running on port ${PORT}`);
});

export default app;
