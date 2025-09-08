import { Request, Response } from 'express';
import { ApplicationService } from '../services/application.service';
import { DocumentService } from '../services/document.service';
import { AppError, ApiResponse, DocumentType } from '../types';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export class ApplicationController {
  private applicationService = new ApplicationService();
  private documentService = new DocumentService();

  createApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applicationData = req.body;
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.get('User-Agent') || '';

      const application = await this.applicationService.createApplication(
        userId,
        applicationData,
        ipAddress,
        userAgent
      );

      const response: ApiResponse = {
        success: true,
        data: {
          application: {
            id: application.id,
            destination_country: application.destination_country,
            intended_arrival_date: application.intended_arrival_date,
            intended_departure_date: application.intended_departure_date,
            intended_address: application.intended_address,
            intended_city: application.intended_city,
            purpose_of_visit: application.purpose_of_visit,
            status: application.status,
            fee_amount: application.fee_amount,
            currency: application.currency,
            created_at: application.created_at,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to create application',
          code: 'APPLICATION_CREATION_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  getApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.applicationService.getApplicationsByUserId(userId, limit, offset);

      const response: ApiResponse = {
        success: true,
        data: {
          applications: result.applications,
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
          message: 'Failed to get applications',
          code: 'APPLICATION_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  getApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const applicationId = req.params.id;
      const application = await this.applicationService.getApplicationById(applicationId);

      if (!application) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Application not found',
            code: 'APPLICATION_NOT_FOUND',
          },
        };
        return res.status(404).json(response);
      }

      // Get associated documents
      const documents = await this.documentService.getDocumentsByApplicationId(applicationId);

      const response: ApiResponse = {
        success: true,
        data: {
          application,
          documents: documents.map(doc => ({
            id: doc.id,
            type: doc.type,
            original_filename: doc.original_filename,
            is_verified: doc.is_verified,
            verification_results: doc.verification_results,
            created_at: doc.created_at,
          })),
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get application',
          code: 'APPLICATION_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  updateApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applicationId = req.params.id;
      const updateData = req.body;
      const ipAddress = req.ip || 'unknown';

      const application = await this.applicationService.updateApplication(
        applicationId,
        updateData,
        userId,
        ipAddress
      );

      const response: ApiResponse = {
        success: true,
        data: {
          application,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to update application',
          code: 'APPLICATION_UPDATE_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  submitApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applicationId = req.params.id;
      const ipAddress = req.ip || 'unknown';

      const application = await this.applicationService.submitApplication(
        applicationId,
        userId,
        ipAddress
      );

      const response: ApiResponse = {
        success: true,
        data: {
          application,
          message: 'Application submitted successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to submit application',
          code: 'APPLICATION_SUBMIT_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  cancelApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applicationId = req.params.id;
      const { reason } = req.body;
      const ipAddress = req.ip || 'unknown';

      const application = await this.applicationService.cancelApplication(
        applicationId,
        userId,
        ipAddress,
        reason
      );

      const response: ApiResponse = {
        success: true,
        data: {
          application,
          message: 'Application cancelled successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to cancel application',
          code: 'APPLICATION_CANCEL_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applicationId = req.params.id;
      const documentType = req.body.document_type as DocumentType;
      const ipAddress = req.ip || 'unknown';

      if (!req.file) {
        throw new AppError('File is required', 400);
      }

      if (!documentType) {
        throw new AppError('Document type is required', 400);
      }

      const document = await this.documentService.uploadDocument(
        applicationId,
        req.file,
        documentType,
        userId,
        ipAddress
      );

      const response: ApiResponse = {
        success: true,
        data: {
          document: {
            id: document.id,
            type: document.type,
            original_filename: document.original_filename,
            file_size: document.file_size,
            is_verified: document.is_verified,
            created_at: document.created_at,
          },
          message: 'Document uploaded successfully',
        },
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to upload document',
          code: 'DOCUMENT_UPLOAD_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const documentId = req.params.documentId;
      const ipAddress = req.ip || 'unknown';

      await this.documentService.deleteDocument(documentId, userId, ipAddress);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Document deleted successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to delete document',
          code: 'DOCUMENT_DELETE_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  getApplicationStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const applicationId = req.params.id;
      const application = await this.applicationService.getApplicationById(applicationId);

      if (!application) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Application not found',
            code: 'APPLICATION_NOT_FOUND',
          },
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          application: {
            id: application.id,
            status: application.status,
            submitted_at: application.submitted_at,
            completed_at: application.completed_at,
          },
          // TODO: Add verification results when verification service is implemented
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get application status',
          code: 'APPLICATION_STATUS_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  // Admin endpoints
  searchApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = {
        status: req.query.status as any,
        destination_country: req.query.destination_country as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        search_term: req.query.search as string,
      };

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.applicationService.searchApplications(filters, limit, offset);

      const response: ApiResponse = {
        success: true,
        data: {
          applications: result.applications,
        },
        meta: {
          pagination: {
            page: Math.floor(offset / limit) + 1,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
          filters,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to search applications',
          code: 'APPLICATION_SEARCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  getApplicationStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const destinationCountry = req.query.destination_country as string;
      const stats = await this.applicationService.getApplicationStats(destinationCountry);

      const response: ApiResponse = {
        success: true,
        data: {
          stats,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get application statistics',
          code: 'APPLICATION_STATS_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };
}