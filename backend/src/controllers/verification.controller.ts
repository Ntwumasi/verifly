import { Request, Response } from 'express';
import { VerificationService } from '../services/verification.service';
import { AppError, ApiResponse } from '../types';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export class VerificationController {
  private verificationService = new VerificationService();

  startVerification = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { application_id } = req.body;
      const userId = req.userId;
      const ipAddress = req.ip || 'unknown';

      if (!application_id) {
        throw new AppError('Application ID is required', 400);
      }

      const verificationRun = await this.verificationService.startVerification(
        application_id,
        userId,
        ipAddress
      );

      const response: ApiResponse = {
        success: true,
        data: {
          verification_run: {
            id: verificationRun.id,
            application_id: verificationRun.application_id,
            status: verificationRun.status,
            policy_version: verificationRun.policy_version,
            started_at: verificationRun.started_at,
            created_at: verificationRun.created_at,
          },
          message: 'Verification started successfully',
        },
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to start verification',
          code: 'VERIFICATION_START_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  getVerificationRun = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const verificationId = req.params.id;
      const verificationRun = await this.verificationService.getVerificationRun(verificationId);

      if (!verificationRun) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Verification run not found',
            code: 'VERIFICATION_NOT_FOUND',
          },
        };
        return res.status(404).json(response);
      }

      // Get source hits
      const sourceHits = await this.verificationService.getSourceHits(verificationId);

      const response: ApiResponse = {
        success: true,
        data: {
          verification_run: verificationRun,
          source_hits: sourceHits.map(hit => ({
            id: hit.id,
            source_name: hit.source_name,
            source_type: hit.source_type,
            match_confidence: hit.match_confidence,
            match_type: hit.match_type,
            severity: hit.severity,
            jurisdiction: hit.jurisdiction,
            record_date: hit.record_date,
            record_data: hit.record_data,
            created_at: hit.created_at,
          })),
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get verification run',
          code: 'VERIFICATION_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  getVerificationsByApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const applicationId = req.params.applicationId;
      const verificationRuns = await this.verificationService.getVerificationRunsByApplicationId(applicationId);

      const response: ApiResponse = {
        success: true,
        data: {
          verification_runs: verificationRuns,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get verification runs',
          code: 'VERIFICATION_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  // Admin endpoints
  retryVerification = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const verificationId = req.params.id;
      const userId = req.userId!;
      const ipAddress = req.ip || 'unknown';

      await this.verificationService.retryVerification(verificationId, userId, ipAddress);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Verification retry initiated successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to retry verification',
          code: 'VERIFICATION_RETRY_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };
}