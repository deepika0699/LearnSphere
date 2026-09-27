import { isDbConnected } from '../config/db.js';

/**
 * Controller for system health status
 * GET /api/health
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'LearnSphere backend is running',
    database: isDbConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};
