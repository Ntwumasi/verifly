import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { config } from '../config';

// Rate limiting middleware
export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General rate limit
export const generalRateLimit = createRateLimit(
  config.security.rateLimitWindowMs, 
  config.security.rateLimitMaxRequests
);

// Stricter rate limit for authentication endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes

// Very strict rate limit for payment endpoints
export const paymentRateLimit = createRateLimit(60 * 60 * 1000, 5); // 5 requests per hour

// Slow down middleware for repeated requests
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes, then...
  delayMs: 500, // Begin adding 500ms of delay per request above delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential XSS attempts from query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    }
  }

  // Remove potential XSS attempts from request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

function sanitizeObject(obj: any): void {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  }
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com;"
  );

  next();
};

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://app.verifly.com',
      'https://admin.verifly.com',
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).userId,
    };

    // Log to console in development, could be extended to use proper logging service
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logData));
    }
  });

  next();
};