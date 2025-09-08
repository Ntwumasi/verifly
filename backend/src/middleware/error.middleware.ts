import { Request, Response, NextFunction } from 'express';
import { AppError, ApiResponse } from '../types';
import { AuditService } from '../services/audit.service';

const auditService = new AuditService();

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Log error
  console.error('Error:', error);

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = 'APP_ERROR';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error: ' + error.message;
    code = 'FILE_UPLOAD_ERROR';
  }

  // Log error to audit service
  auditService.log({
    user_id: (req as any).userId,
    action: 'error_occurred',
    entity_type: 'error',
    ip_address: req.ip || 'unknown',
    user_agent: req.get('User-Agent'),
    result: 'error',
    error_message: error.message,
    details: {
      path: req.path,
      method: req.method,
      statusCode,
      stack: error.stack,
    },
  });

  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (response.error as any).stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response: ApiResponse = {
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
  };

  res.status(404).json(response);
};