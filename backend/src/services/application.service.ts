import { db } from '../config/database';
import { Application, CreateApplicationRequest, ApplicationStatus, AppError } from '../types';
import { AuditService } from './audit.service';
import { ApplicantService } from './applicant.service';
import { validateApplicationData } from '../utils/validation';
import { config } from '../config';

export class ApplicationService {
  private auditService = new AuditService();
  private applicantService = new ApplicantService();

  async createApplication(
    userId: string,
    data: CreateApplicationRequest,
    ipAddress: string,
    userAgent: string
  ): Promise<Application> {
    // Validate input data
    const validationErrors = validateApplicationData(data);
    if (validationErrors.length > 0) {
      throw new AppError('Validation failed', 400);
    }

    // Get applicant for this user
    const applicant = await this.applicantService.getApplicantByUserId(userId);
    if (!applicant) {
      throw new AppError('Applicant profile required before creating application', 400);
    }

    // Check if user already has a pending application
    const existingApplication = await this.getPendingApplicationByUserId(userId);
    if (existingApplication) {
      throw new AppError('You already have a pending application. Complete or cancel it first.', 409);
    }

    // Validate destination country is supported
    if (!config.application.supportedCountries.includes(data.destination_country.toUpperCase())) {
      throw new AppError('Destination country is not supported', 400);
    }

    const applicationData = {
      applicant_id: applicant.id,
      destination_country: data.destination_country.toUpperCase(),
      intended_arrival_date: new Date(data.intended_arrival_date),
      intended_departure_date: data.intended_departure_date ? new Date(data.intended_departure_date) : null,
      intended_address: data.intended_address,
      intended_city: data.intended_city,
      purpose_of_visit: data.purpose_of_visit,
      travel_itinerary: data.travel_itinerary ? JSON.stringify(data.travel_itinerary) : null,
      status: 'draft' as ApplicationStatus,
      fee_amount: config.application.defaultFee,
      currency: config.application.defaultCurrency,
      metadata: JSON.stringify({}),
    };

    const [application] = await db('applications').insert(applicationData).returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'application_created',
      entity_type: 'application',
      entity_id: application.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      result: 'success',
      details: {
        destination_country: data.destination_country,
        intended_arrival_date: data.intended_arrival_date,
        purpose_of_visit: data.purpose_of_visit,
      },
    });

    // Parse JSON fields back to objects for return
    application.travel_itinerary = application.travel_itinerary ? JSON.parse(application.travel_itinerary) : null;
    application.metadata = JSON.parse(application.metadata);

    return application;
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const application = await db('applications').where('id', id).first();
    
    if (application) {
      // Parse JSON fields
      application.travel_itinerary = application.travel_itinerary ? JSON.parse(application.travel_itinerary) : null;
      application.metadata = JSON.parse(application.metadata || '{}');
    }

    return application || null;
  }

  async getApplicationsByUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ applications: Application[]; total: number }> {
    // Get applicant first
    const applicant = await this.applicantService.getApplicantByUserId(userId);
    if (!applicant) {
      return { applications: [], total: 0 };
    }

    const total = await db('applications')
      .where('applicant_id', applicant.id)
      .count('id as count')
      .first();

    const applications = await db('applications')
      .where('applicant_id', applicant.id)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    applications.forEach(application => {
      application.travel_itinerary = application.travel_itinerary ? JSON.parse(application.travel_itinerary) : null;
      application.metadata = JSON.parse(application.metadata || '{}');
    });

    return {
      applications,
      total: parseInt(total?.count as string) || 0,
    };
  }

  async getPendingApplicationByUserId(userId: string): Promise<Application | null> {
    const applicant = await this.applicantService.getApplicantByUserId(userId);
    if (!applicant) {
      return null;
    }

    const application = await db('applications')
      .where('applicant_id', applicant.id)
      .whereNotIn('status', ['clear', 'not_clear', 'cancelled'])
      .orderBy('created_at', 'desc')
      .first();

    if (application) {
      application.travel_itinerary = application.travel_itinerary ? JSON.parse(application.travel_itinerary) : null;
      application.metadata = JSON.parse(application.metadata || '{}');
    }

    return application || null;
  }

  async updateApplication(
    id: string,
    data: Partial<CreateApplicationRequest>,
    userId: string,
    ipAddress: string
  ): Promise<Application> {
    const existingApplication = await this.getApplicationById(id);
    if (!existingApplication) {
      throw new AppError('Application not found', 404);
    }

    // Only allow updates to draft applications
    if (existingApplication.status !== 'draft') {
      throw new AppError('Can only update draft applications', 400);
    }

    // Validate updated data
    const validationErrors = validateApplicationData({ ...existingApplication, ...data });
    if (validationErrors.length > 0) {
      throw new AppError('Validation failed', 400);
    }

    const updateData: any = {};
    const allowedFields = [
      'intended_arrival_date', 'intended_departure_date', 'intended_address',
      'intended_city', 'purpose_of_visit', 'travel_itinerary'
    ];

    // Only update allowed fields that were provided
    allowedFields.forEach(field => {
      if (data[field as keyof CreateApplicationRequest] !== undefined) {
        if (field === 'travel_itinerary') {
          updateData[field] = data[field] ? JSON.stringify(data[field]) : null;
        } else if (field.includes('date')) {
          updateData[field] = new Date(data[field as keyof CreateApplicationRequest] as string);
        } else {
          updateData[field] = data[field as keyof CreateApplicationRequest];
        }
      }
    });

    updateData.updated_at = new Date();

    const [updatedApplication] = await db('applications')
      .where('id', id)
      .update(updateData)
      .returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'application_updated',
      entity_type: 'application',
      entity_id: id,
      ip_address: ipAddress,
      result: 'success',
      previous_values: existingApplication,
      new_values: updateData,
    });

    // Parse JSON fields back to objects for return
    updatedApplication.travel_itinerary = updatedApplication.travel_itinerary ? JSON.parse(updatedApplication.travel_itinerary) : null;
    updatedApplication.metadata = JSON.parse(updatedApplication.metadata);

    return updatedApplication;
  }

  async submitApplication(
    id: string,
    userId: string,
    ipAddress: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== 'draft') {
      throw new AppError('Can only submit draft applications', 400);
    }

    // Check if required documents are uploaded
    const requiredDocuments = await db('documents')
      .where('application_id', id)
      .whereIn('type', ['passport', 'selfie'])
      .where('is_verified', true);

    if (requiredDocuments.length < 2) {
      throw new AppError('Required documents (passport and selfie) must be uploaded and verified before submission', 400);
    }

    const [updatedApplication] = await db('applications')
      .where('id', id)
      .update({
        status: 'submitted',
        submitted_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'application_submitted',
      entity_type: 'application',
      entity_id: id,
      ip_address: ipAddress,
      result: 'success',
    });

    // Parse JSON fields
    updatedApplication.travel_itinerary = updatedApplication.travel_itinerary ? JSON.parse(updatedApplication.travel_itinerary) : null;
    updatedApplication.metadata = JSON.parse(updatedApplication.metadata);

    return updatedApplication;
  }

  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    userId: string,
    ipAddress: string,
    notes?: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (status === 'clear' || status === 'not_clear') {
      updateData.completed_at = new Date();
    }

    const [updatedApplication] = await db('applications')
      .where('id', id)
      .update(updateData)
      .returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'application_status_updated',
      entity_type: 'application',
      entity_id: id,
      ip_address: ipAddress,
      result: 'success',
      previous_values: { status: application.status },
      new_values: { status },
      details: { notes },
    });

    // Parse JSON fields
    updatedApplication.travel_itinerary = updatedApplication.travel_itinerary ? JSON.parse(updatedApplication.travel_itinerary) : null;
    updatedApplication.metadata = JSON.parse(updatedApplication.metadata);

    return updatedApplication;
  }

  async cancelApplication(
    id: string,
    userId: string,
    ipAddress: string,
    reason?: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Don't allow cancellation of completed applications
    if (['clear', 'not_clear'].includes(application.status)) {
      throw new AppError('Cannot cancel completed applications', 400);
    }

    const [updatedApplication] = await db('applications')
      .where('id', id)
      .update({
        status: 'cancelled',
        updated_at: new Date(),
      })
      .returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'application_cancelled',
      entity_type: 'application',
      entity_id: id,
      ip_address: ipAddress,
      result: 'success',
      details: { reason, previous_status: application.status },
    });

    // Parse JSON fields
    updatedApplication.travel_itinerary = updatedApplication.travel_itinerary ? JSON.parse(updatedApplication.travel_itinerary) : null;
    updatedApplication.metadata = JSON.parse(updatedApplication.metadata);

    return updatedApplication;
  }

  async searchApplications(
    filters: {
      status?: ApplicationStatus;
      destination_country?: string;
      start_date?: Date;
      end_date?: Date;
      search_term?: string;
    },
    limit: number = 50,
    offset: number = 0
  ): Promise<{ applications: any[]; total: number }> {
    let query = db('applications')
      .leftJoin('applicants', 'applications.applicant_id', 'applicants.id')
      .leftJoin('users', 'applicants.user_id', 'users.id')
      .select(
        'applications.*',
        'applicants.first_name',
        'applicants.last_name',
        'applicants.passport_number',
        'users.email'
      );

    if (filters.status) {
      query = query.where('applications.status', filters.status);
    }

    if (filters.destination_country) {
      query = query.where('applications.destination_country', filters.destination_country.toUpperCase());
    }

    if (filters.start_date) {
      query = query.where('applications.created_at', '>=', filters.start_date);
    }

    if (filters.end_date) {
      query = query.where('applications.created_at', '<=', filters.end_date);
    }

    if (filters.search_term) {
      query = query.where((builder) => {
        builder
          .where('applicants.first_name', 'ilike', `%${filters.search_term}%`)
          .orWhere('applicants.last_name', 'ilike', `%${filters.search_term}%`)
          .orWhere('applicants.passport_number', 'ilike', `%${filters.search_term}%`)
          .orWhere('users.email', 'ilike', `%${filters.search_term}%`);
      });
    }

    const total = await query.clone().count('applications.id as count').first();
    const applications = await query
      .orderBy('applications.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    applications.forEach(application => {
      application.travel_itinerary = application.travel_itinerary ? JSON.parse(application.travel_itinerary) : null;
      application.metadata = JSON.parse(application.metadata || '{}');
    });

    return {
      applications,
      total: parseInt(total?.count as string) || 0,
    };
  }

  async getApplicationStats(destinationCountry?: string): Promise<any> {
    let query = db('applications');

    if (destinationCountry) {
      query = query.where('destination_country', destinationCountry.toUpperCase());
    }

    const stats = await query
      .select('status')
      .count('* as count')
      .groupBy('status');

    const totalApplications = stats.reduce((sum, stat) => sum + parseInt(stat.count as string), 0);
    
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count as string);
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalApplications,
      by_status: statusStats,
    };
  }
}