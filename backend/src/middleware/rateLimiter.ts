import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config';

// General rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS as string),
  max: parseInt(config.RATE_LIMIT_MAX_REQUESTS as string),
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter for login attempts)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts per window (increased for testing)
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiter for data endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'API rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});