import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuditService } from '../services/audit.service';
import { AppError, User } from '../types';

interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export class AuthMiddleware {
  private authService = new AuthService();
  private auditService = new AuditService();

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = this.extractToken(req);
      if (!token) {
        throw new AppError('Authentication token required', 401);
      }

      const decoded = this.authService.verifyToken(token);
      const user = await this.authService.getUserById(decoded.userId);

      if (!user || !user.is_active) {
        throw new AppError('Invalid or deactivated user', 401);
      }

      req.user = user;
      req.userId = user.id;

      next();
    } catch (error) {
      await this.auditService.log({
        action: 'authentication_failed',
        ip_address: req.ip || 'unknown',
        user_agent: req.get('User-Agent'),
        result: 'failure',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          path: req.path,
          method: req.method,
        },
      });

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: 'AUTHENTICATION_FAILED',
          },
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication failed',
          code: 'AUTHENTICATION_FAILED',
        },
      });
    }
  };

  requireRole = (roles: User['role'][]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED',
          },
        });
      }

      if (!roles.includes(req.user.role)) {
        this.auditService.log({
          user_id: req.user.id,
          action: 'authorization_failed',
          ip_address: req.ip || 'unknown',
          user_agent: req.get('User-Agent'),
          result: 'failure',
          error_message: 'Insufficient permissions',
          details: {
            required_roles: roles,
            user_role: req.user.role,
            path: req.path,
            method: req.method,
          },
        });

        return res.status(403).json({
          success: false,
          error: {
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
          },
        });
      }

      next();
    };
  };

  requireApplicant = this.requireRole(['applicant']);
  requireAdmin = this.requireRole(['admin', 'reviewer', 'finance', 'support', 'auditor']);
  requireReviewer = this.requireRole(['admin', 'reviewer']);
  requireFinance = this.requireRole(['admin', 'finance']);
  requireSupport = this.requireRole(['admin', 'support']);
  requireAuditor = this.requireRole(['admin', 'auditor']);

  optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = this.extractToken(req);
      if (token) {
        const decoded = this.authService.verifyToken(token);
        const user = await this.authService.getUserById(decoded.userId);
        
        if (user && user.is_active) {
          req.user = user;
          req.userId = user.id;
        }
      }
    } catch (error) {
      // Ignore authentication errors for optional auth
    }
    
    next();
  };

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check for token in cookies (for admin interface)
    const cookieToken = req.cookies?.token;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }
}

export const authMiddleware = new AuthMiddleware();