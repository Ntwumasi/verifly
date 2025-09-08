import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { AppError, ApiResponse } from '../types';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export class PaymentController {
  private paymentService = new PaymentService();

  createPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { application_id } = req.body;
      const ipAddress = req.ip || 'unknown';

      if (!application_id) {
        throw new AppError('Application ID is required', 400);
      }

      const result = await this.paymentService.createPaymentIntent(
        application_id,
        userId,
        ipAddress
      );

      const response: ApiResponse = {
        success: true,
        data: {
          payment: {
            id: result.payment.id,
            application_id: result.payment.application_id,
            amount: result.payment.amount,
            currency: result.payment.currency,
            status: result.payment.status,
          },
          client_secret: result.clientSecret,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to create payment intent',
          code: 'PAYMENT_INTENT_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  getPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentId = req.params.id;
      const payment = await this.paymentService.getPaymentById(paymentId);

      if (!payment) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Payment not found',
            code: 'PAYMENT_NOT_FOUND',
          },
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          payment: {
            id: payment.id,
            application_id: payment.application_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            payment_method: payment.payment_method,
            refunded_amount: payment.refunded_amount,
            processed_at: payment.processed_at,
            created_at: payment.created_at,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get payment',
          code: 'PAYMENT_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  getPaymentByApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const applicationId = req.params.applicationId;
      const payment = await this.paymentService.getPaymentByApplicationId(applicationId);

      if (!payment) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Payment not found for this application',
            code: 'PAYMENT_NOT_FOUND',
          },
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          payment: {
            id: payment.id,
            application_id: payment.application_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            payment_method: payment.payment_method,
            refunded_amount: payment.refunded_amount,
            processed_at: payment.processed_at,
            created_at: payment.created_at,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get payment',
          code: 'PAYMENT_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      if (!signature) {
        throw new AppError('Missing stripe signature', 400);
      }

      // Validate webhook signature and parse event
      const event = await this.paymentService.validateWebhookSignature(
        payload,
        signature
      );

      // Handle the webhook event
      await this.paymentService.handleWebhook(event, req.ip || 'unknown');

      // Return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Webhook processing failed',
          code: 'WEBHOOK_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 400;
      res.status(statusCode).json(response);
    }
  };

  refundPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentId = req.params.id;
      const { amount, reason } = req.body;
      const userId = req.userId!;
      const ipAddress = req.ip || 'unknown';

      const payment = await this.paymentService.refundPayment(
        paymentId,
        amount,
        reason,
        userId,
        ipAddress
      );

      const response: ApiResponse = {
        success: true,
        data: {
          payment: {
            id: payment.id,
            status: payment.status,
            refunded_amount: payment.refunded_amount,
            amount: payment.amount,
          },
          message: 'Payment refunded successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to refund payment',
          code: 'PAYMENT_REFUND_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  // Admin endpoints
  getPayments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      const status = req.query.status as any;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!startDate) {
        // Default to last 30 days
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      if (!endDate) {
        endDate = new Date();
      }

      const result = await this.paymentService.getPaymentsByDateRange(
        startDate,
        endDate,
        status,
        limit,
        offset
      );

      const response: ApiResponse = {
        success: true,
        data: {
          payments: result.payments.map(payment => ({
            id: payment.id,
            application_id: payment.application_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            payment_method: payment.payment_method,
            refunded_amount: payment.refunded_amount,
            processed_at: payment.processed_at,
            created_at: payment.created_at,
            destination_country: payment.destination_country,
            applicant_name: `${payment.first_name} ${payment.last_name}`,
          })),
        },
        meta: {
          pagination: {
            page: Math.floor(offset / limit) + 1,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
          filters: {
            start_date: startDate,
            end_date: endDate,
            status,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get payments',
          code: 'PAYMENTS_FETCH_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  getPaymentStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const stats = await this.paymentService.getPaymentStats(startDate, endDate);

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
          message: 'Failed to get payment statistics',
          code: 'PAYMENT_STATS_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };
}