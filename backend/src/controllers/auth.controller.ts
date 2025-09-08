import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ConsentService } from '../services/consent.service';
import { AppError, ApiResponse } from '../types';
import { validateEmail, validatePassword } from '../utils/validation';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export class AuthController {
  private authService = new AuthService();
  private consentService = new ConsentService();

  register = async (req: Request, res: Response) => {
    try {
      const { email, phone, password } = req.body;

      // Validation
      if (!email || !validateEmail(email)) {
        throw new AppError('Valid email is required', 400);
      }

      if (password && !validatePassword(password)) {
        throw new AppError('Password must be at least 8 characters with uppercase, lowercase, number, and special character', 400);
      }

      const user = await this.authService.createUser(email, phone, password);
      const token = await this.authService.authenticateUser(email, password || '', req.ip || 'unknown');

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
          },
          token,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Registration failed',
          code: 'REGISTRATION_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const token = await this.authService.authenticateUser(email, password, req.ip || 'unknown');
      const user = await this.authService.getUserByEmail(email);

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user!.id,
            email: user!.email,
            phone: user!.phone,
            role: user!.role,
            email_verified: user!.email_verified,
            phone_verified: user!.phone_verified,
          },
          token,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Login failed',
          code: 'LOGIN_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            preferences: user.preferences,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get profile',
          code: 'PROFILE_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  updatePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.userId!;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      if (!validatePassword(newPassword)) {
        throw new AppError('Password must be at least 8 characters with uppercase, lowercase, number, and special character', 400);
      }

      // Verify current password
      const user = await this.authService.getUserById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await this.authService.authenticateUser(user.email, currentPassword, req.ip || 'unknown');
      await this.authService.updatePassword(userId, newPassword);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Password updated successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Password update failed',
          code: 'PASSWORD_UPDATE_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  getConsentTemplate = async (req: Request, res: Response) => {
    try {
      const template = await this.consentService.getConsentTemplate();

      const response: ApiResponse = {
        success: true,
        data: template,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get consent template',
          code: 'CONSENT_TEMPLATE_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  recordConsent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const consentData = req.body;
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.get('User-Agent') || '';

      if (!consentData.accepted) {
        throw new AppError('Consent must be accepted to proceed', 400);
      }

      const consentRecord = await this.consentService.recordConsent(
        userId,
        consentData,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: {
          consent: consentRecord,
          message: 'Consent recorded successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to record consent',
          code: 'CONSENT_RECORD_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  getConsentHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const consentHistory = await this.consentService.getConsentHistory(userId);

      const response: ApiResponse = {
        success: true,
        data: {
          consents: consentHistory,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get consent history',
          code: 'CONSENT_HISTORY_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  withdrawConsent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { consentVersion } = req.body;
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.get('User-Agent') || '';

      if (!consentVersion) {
        throw new AppError('Consent version is required', 400);
      }

      await this.consentService.withdrawConsent(userId, consentVersion, ipAddress, userAgent);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Consent withdrawn successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to withdraw consent',
          code: 'CONSENT_WITHDRAW_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };
}