import { Request, Response } from 'express';
import { ApplicantService } from '../services/applicant.service';
import { ApplicationService } from '../services/application.service';
import { PaymentService } from '../services/payment.service';
import { VerificationService } from '../services/verification.service';
import { NotificationService } from '../services/notification.service';
import { AuditService } from '../services/audit.service';
import { AppError, ApiResponse } from '../types';
import { db } from '../config/database';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export class AdminController {
  private applicantService = new ApplicantService();
  private applicationService = new ApplicationService();
  private paymentService = new PaymentService();
  private verificationService = new VerificationService();
  private notificationService = new NotificationService();
  private auditService = new AuditService();

  // Dashboard
  getDashboard = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [
        applicationStats,
        paymentStats,
        recentApplications,
        pendingReviews,
        systemHealth
      ] = await Promise.all([
        this.getApplicationStats(),
        this.getPaymentStats(),
        this.getRecentApplications(),
        this.getPendingReviews(),
        this.getSystemHealth(),
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          dashboard: {
            application_stats: applicationStats,
            payment_stats: paymentStats,
            recent_applications: recentApplications,
            pending_reviews: pendingReviews,
            system_health: systemHealth,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to load dashboard',
          code: 'DASHBOARD_LOAD_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  // Case Management
  getCaseDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const applicationId = req.params.id;
      
      // Get application with related data
      const [
        application,
        applicant,
        user,
        documents,
        payments,
        verificationRuns,
        adminDecisions,
        auditTrail
      ] = await Promise.all([
        db('applications').where('id', applicationId).first(),
        db('applicants').leftJoin('applications', 'applicants.id', 'applications.applicant_id')
          .where('applications.id', applicationId).select('applicants.*').first(),
        db('users').leftJoin('applicants', 'users.id', 'applicants.user_id')
          .leftJoin('applications', 'applicants.id', 'applications.applicant_id')
          .where('applications.id', applicationId).select('users.*').first(),
        db('documents').where('application_id', applicationId),
        db('payments').where('application_id', applicationId),
        this.verificationService.getVerificationRunsByApplicationId(applicationId),
        db('admin_decisions').leftJoin('users', 'admin_decisions.admin_user_id', 'users.id')
          .where('admin_decisions.application_id', applicationId)
          .select('admin_decisions.*', 'users.email as admin_email'),
        this.auditService.getApplicationAuditTrail(applicationId),
      ]);

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

      // Parse JSON fields
      if (applicant) {
        applicant.address_history = JSON.parse(applicant.address_history || '[]');
      }

      documents.forEach(doc => {
        doc.verification_results = JSON.parse(doc.verification_results || '{}');
        doc.metadata = JSON.parse(doc.metadata || '{}');
      });

      payments.forEach(payment => {
        payment.processor_metadata = JSON.parse(payment.processor_metadata || '{}');
      });

      adminDecisions.forEach(decision => {
        decision.reason_codes = JSON.parse(decision.reason_codes || '[]');
        decision.additional_requirements = JSON.parse(decision.additional_requirements || '[]');
      });

      const response: ApiResponse = {
        success: true,
        data: {
          case: {
            application,
            applicant,
            user: {
              id: user?.id,
              email: user?.email,
              phone: user?.phone,
              email_verified: user?.email_verified,
              phone_verified: user?.phone_verified,
            },
            documents,
            payments,
            verification_runs: verificationRuns,
            admin_decisions: adminDecisions,
            audit_trail: auditTrail,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to load case details',
          code: 'CASE_LOAD_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  makeDecision = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const applicationId = req.params.id;
      const { decision, notes, reason_codes, additional_requirements } = req.body;
      const adminUserId = req.userId!;
      const ipAddress = req.ip || 'unknown';

      if (!decision || !notes) {
        throw new AppError('Decision and notes are required', 400);
      }

      if (!['approve', 'deny', 'request_more_info'].includes(decision)) {
        throw new AppError('Invalid decision type', 400);
      }

      const decisionData = {
        application_id: applicationId,
        admin_user_id: adminUserId,
        decision,
        notes,
        reason_codes: JSON.stringify(reason_codes || []),
        additional_requirements: JSON.stringify(additional_requirements || []),
        decision_date: new Date(),
      };

      const [adminDecision] = await db('admin_decisions').insert(decisionData).returning('*');

      // Update application status based on decision
      let newStatus;
      switch (decision) {
        case 'approve':
          newStatus = 'clear';
          break;
        case 'deny':
          newStatus = 'not_clear';
          break;
        case 'request_more_info':
          newStatus = 'additional_info_required';
          break;
      }

      await this.applicationService.updateApplicationStatus(
        applicationId,
        newStatus as any,
        adminUserId,
        ipAddress,
        notes
      );

      // Send notification to applicant
      const notificationType = decision === 'request_more_info' ? 
        'additional_info_required' : 'decision_made';
      
      const application = await db('applications').where('id', applicationId).first();
      const applicant = await db('applicants').where('id', application.applicant_id).first();
      const user = await db('users').where('id', applicant.user_id).first();

      if (user) {
        await this.notificationService.sendNotification(
          user.id,
          applicationId,
          notificationType,
          'email',
          {
            decision,
            notes,
            additional_requirements: additional_requirements || [],
          }
        );
      }

      const response: ApiResponse = {
        success: true,
        data: {
          decision: {
            ...adminDecision,
            reason_codes: JSON.parse(adminDecision.reason_codes),
            additional_requirements: JSON.parse(adminDecision.additional_requirements),
          },
          message: 'Decision recorded successfully',
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Failed to record decision',
          code: 'DECISION_FAILED',
        },
      };

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json(response);
    }
  };

  // Analytics and Reporting
  getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();
      const destinationCountry = req.query.destination_country as string;

      const [
        applicationTrends,
        decisionBreakdown,
        processingTimes,
        sourceHitStats,
        revenueTrends
      ] = await Promise.all([
        this.getApplicationTrends(startDate, endDate, destinationCountry),
        this.getDecisionBreakdown(startDate, endDate, destinationCountry),
        this.getProcessingTimes(startDate, endDate),
        this.getSourceHitStats(startDate, endDate),
        this.getRevenueTrends(startDate, endDate),
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          analytics: {
            period: {
              start_date: startDate,
              end_date: endDate,
              destination_country: destinationCountry || 'all',
            },
            application_trends: applicationTrends,
            decision_breakdown: decisionBreakdown,
            processing_times: processingTimes,
            source_hit_stats: sourceHitStats,
            revenue_trends: revenueTrends,
          },
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to load analytics',
          code: 'ANALYTICS_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  // Export functionality
  exportCases = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = {
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
        status: req.query.status as any,
        destination_country: req.query.destination_country as string,
      };

      const format = req.query.format as string || 'csv';

      // Get applications with related data
      let query = db('applications')
        .leftJoin('applicants', 'applications.applicant_id', 'applicants.id')
        .leftJoin('users', 'applicants.user_id', 'users.id')
        .select(
          'applications.id',
          'applications.status',
          'applications.destination_country',
          'applications.submitted_at',
          'applications.completed_at',
          'applications.fee_amount',
          'applications.currency',
          'applicants.first_name',
          'applicants.last_name',
          'applicants.nationality',
          'applicants.passport_number',
          'users.email'
        );

      if (filters.start_date) {
        query = query.where('applications.created_at', '>=', filters.start_date);
      }
      if (filters.end_date) {
        query = query.where('applications.created_at', '<=', filters.end_date);
      }
      if (filters.status) {
        query = query.where('applications.status', filters.status);
      }
      if (filters.destination_country) {
        query = query.where('applications.destination_country', filters.destination_country);
      }

      const cases = await query.orderBy('applications.created_at', 'desc');

      if (format === 'csv') {
        const csv = this.generateCSV(cases);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="verifly-cases.csv"');
        res.send(csv);
      } else {
        const response: ApiResponse = {
          success: true,
          data: {
            cases,
            total: cases.length,
            exported_at: new Date(),
            filters,
          },
        };
        res.json(response);
      }
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to export cases',
          code: 'EXPORT_FAILED',
        },
      };

      res.status(500).json(response);
    }
  };

  // Helper methods
  private async getApplicationStats(): Promise<any> {
    const today = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalStats, monthlyStats, statusStats] = await Promise.all([
      db('applications').count('* as count').first(),
      db('applications').where('created_at', '>=', thirtyDaysAgo).count('* as count').first(),
      db('applications').select('status').count('* as count').groupBy('status'),
    ]);

    return {
      total: parseInt(totalStats?.count as string) || 0,
      this_month: parseInt(monthlyStats?.count as string) || 0,
      by_status: statusStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count as string);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async getPaymentStats(): Promise<any> {
    const today = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalRevenue, monthlyRevenue, completedCount] = await Promise.all([
      db('payments').where('status', 'completed').sum('amount as total').first(),
      db('payments').where('status', 'completed').where('created_at', '>=', thirtyDaysAgo).sum('amount as total').first(),
      db('payments').where('status', 'completed').count('* as count').first(),
    ]);

    return {
      total_revenue: parseFloat(totalRevenue?.total as string) || 0,
      monthly_revenue: parseFloat(monthlyRevenue?.total as string) || 0,
      completed_payments: parseInt(completedCount?.count as string) || 0,
    };
  }

  private async getRecentApplications(): Promise<any> {
    return await db('applications')
      .leftJoin('applicants', 'applications.applicant_id', 'applicants.id')
      .select(
        'applications.id',
        'applications.status',
        'applications.destination_country',
        'applications.created_at',
        'applicants.first_name',
        'applicants.last_name'
      )
      .orderBy('applications.created_at', 'desc')
      .limit(10);
  }

  private async getPendingReviews(): Promise<any> {
    return await db('applications')
      .leftJoin('applicants', 'applications.applicant_id', 'applicants.id')
      .where('applications.status', 'under_review')
      .select(
        'applications.id',
        'applications.destination_country',
        'applications.submitted_at',
        'applicants.first_name',
        'applicants.last_name'
      )
      .orderBy('applications.submitted_at', 'asc')
      .limit(20);
  }

  private async getSystemHealth(): Promise<any> {
    const [dbHealth, queueHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkQueueHealth(),
    ]);

    return {
      database: dbHealth,
      queue: queueHealth,
      timestamp: new Date(),
    };
  }

  private async checkDatabaseHealth(): Promise<any> {
    try {
      await db.raw('SELECT 1');
      return { status: 'healthy', response_time: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkQueueHealth(): Promise<any> {
    // In a real implementation, you would check your queue system (Bull, Agenda, etc.)
    return { status: 'healthy', pending_jobs: 0 };
  }

  private async getApplicationTrends(startDate: Date, endDate: Date, country?: string): Promise<any> {
    let query = db('applications')
      .select(db.raw('DATE(created_at) as date'))
      .count('* as applications')
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date');

    if (country) {
      query = query.where('destination_country', country);
    }

    return await query;
  }

  private async getDecisionBreakdown(startDate: Date, endDate: Date, country?: string): Promise<any> {
    let query = db('applications')
      .select('status')
      .count('* as count')
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .groupBy('status');

    if (country) {
      query = query.where('destination_country', country);
    }

    const results = await query;
    return results.reduce((acc, result) => {
      acc[result.status] = parseInt(result.count as string);
      return acc;
    }, {} as Record<string, number>);
  }

  private async getProcessingTimes(startDate: Date, endDate: Date): Promise<any> {
    const results = await db('applications')
      .select(db.raw(`
        AVG(EXTRACT(EPOCH FROM (completed_at - submitted_at)) / 3600) as avg_hours,
        MIN(EXTRACT(EPOCH FROM (completed_at - submitted_at)) / 3600) as min_hours,
        MAX(EXTRACT(EPOCH FROM (completed_at - submitted_at)) / 3600) as max_hours
      `))
      .where('submitted_at', '>=', startDate)
      .where('submitted_at', '<=', endDate)
      .whereNotNull('completed_at')
      .first();

    return {
      average_hours: parseFloat(results?.avg_hours) || 0,
      minimum_hours: parseFloat(results?.min_hours) || 0,
      maximum_hours: parseFloat(results?.max_hours) || 0,
    };
  }

  private async getSourceHitStats(startDate: Date, endDate: Date): Promise<any> {
    const results = await db('source_hits')
      .leftJoin('verification_runs', 'source_hits.verification_run_id', 'verification_runs.id')
      .leftJoin('applications', 'verification_runs.application_id', 'applications.id')
      .select('source_hits.source_name', 'source_hits.severity')
      .count('* as count')
      .where('applications.created_at', '>=', startDate)
      .where('applications.created_at', '<=', endDate)
      .groupBy('source_hits.source_name', 'source_hits.severity');

    return results;
  }

  private async getRevenueTrends(startDate: Date, endDate: Date): Promise<any> {
    return await db('payments')
      .select(db.raw('DATE(processed_at) as date'))
      .sum('amount as revenue')
      .count('* as transactions')
      .where('status', 'completed')
      .where('processed_at', '>=', startDate)
      .where('processed_at', '<=', endDate)
      .groupBy(db.raw('DATE(processed_at)'))
      .orderBy('date');
  }

  private generateCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : String(value)
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
}