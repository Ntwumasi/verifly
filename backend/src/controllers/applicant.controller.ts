import { Request, Response } from 'express';
import { ApplicantService } from '../services/applicant.service';
import { AppError, ApiResponse } from '../types';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export class ApplicantController {
  private applicantService = new ApplicantService();

  createApplicant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applicantData = req.body;
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.get('User-Agent') || '';

      const applicant = await this.applicantService.createApplicant(
        userId,
        applicantData,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: {
          applicant: {
            id: applicant.id,
            first_name: applicant.first_name,
            middle_name: applicant.middle_name,
            last_name: applicant.last_name,
            date_of_birth: applicant.date_of_birth,
            nationality: applicant.nationality,
            passport_number: applicant.passport_number,
            passport_country: applicant.passport_country,
            current_address: applicant.current_address,
            current_city: applicant.current_city,
            current_country: applicant.current_country,
            created_at: applicant.created_at,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to create applicant profile',
          code: 'APPLICANT_CREATION_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  getApplicant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applicant = await this.applicantService.getApplicantByUserId(userId);

      if (!applicant) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Applicant profile not found',
            code: 'APPLICANT_NOT_FOUND',
          },
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          applicant: {
            id: applicant.id,
            first_name: applicant.first_name,
            middle_name: applicant.middle_name,
            last_name: applicant.last_name,
            date_of_birth: applicant.date_of_birth,
            nationality: applicant.nationality,
            passport_number: applicant.passport_number,
            passport_country: applicant.passport_country,
            passport_expiry: applicant.passport_expiry,
            current_address: applicant.current_address,
            current_city: applicant.current_city,
            current_country: applicant.current_country,
            current_postal_code: applicant.current_postal_code,
            address_history: applicant.address_history,
            created_at: applicant.created_at,
            updated_at: applicant.updated_at,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get applicant profile',
          code: 'APPLICANT_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  updateApplicant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applicantId = req.params.id;
      const updateData = req.body;
      const ipAddress = req.ip || 'unknown';

      // Verify the applicant belongs to the authenticated user
      const existingApplicant = await this.applicantService.getApplicantByUserId(userId);
      if (!existingApplicant || existingApplicant.id !== applicantId) {
        throw new AppError('Unauthorized to update this applicant profile', 403);
      }

      const applicant = await this.applicantService.updateApplicant(
        applicantId,
        updateData,
        userId,
        ipAddress
      );

      const response: ApiResponse = {
        success: true,
        data: {
          applicant: {
            id: applicant.id,
            first_name: applicant.first_name,
            middle_name: applicant.middle_name,
            last_name: applicant.last_name,
            date_of_birth: applicant.date_of_birth,
            nationality: applicant.nationality,
            passport_number: applicant.passport_number,
            passport_country: applicant.passport_country,
            current_address: applicant.current_address,
            current_city: applicant.current_city,
            current_country: applicant.current_country,
            current_postal_code: applicant.current_postal_code,
            address_history: applicant.address_history,
            updated_at: applicant.updated_at,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to update applicant profile',
          code: 'APPLICANT_UPDATE_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  searchApplicants = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const searchTerm = req.query.search as string || '';
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.applicantService.searchApplicants(searchTerm, limit, offset);

      const response: ApiResponse = {
        success: true,
        data: {
          applicants: result.applicants.map(applicant => ({
            id: applicant.id,
            first_name: applicant.first_name,
            middle_name: applicant.middle_name,
            last_name: applicant.last_name,
            passport_number: applicant.passport_number,
            passport_country: applicant.passport_country,
            nationality: applicant.nationality,
            email: applicant.email,
            phone: applicant.phone,
            created_at: applicant.created_at,
          })),
        },
        meta: {
          pagination: {
            page: Math.floor(offset / limit) + 1,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to search applicants',
          code: 'APPLICANT_SEARCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  getApplicantById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const applicantId = req.params.id;
      const applicant = await this.applicantService.getApplicantById(applicantId);

      if (!applicant) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Applicant not found',
            code: 'APPLICANT_NOT_FOUND',
          },
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          applicant,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get applicant',
          code: 'APPLICANT_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  checkPassportDuplicate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { passport_number, passport_country } = req.body;

      if (!passport_number || !passport_country) {
        throw new AppError('Passport number and passport country are required', 400);
      }

      const isDuplicate = await this.applicantService.checkDuplicatePassport(
        passport_number,
        passport_country
      );

      const response: ApiResponse = {
        success: true,
        data: {
          is_duplicate: isDuplicate,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to check passport duplicate',
          code: 'PASSPORT_CHECK_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };
}