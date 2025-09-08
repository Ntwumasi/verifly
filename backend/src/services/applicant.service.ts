import { db } from '../config/database';
import { Applicant, CreateApplicantRequest, AppError } from '../types';
import { AuditService } from './audit.service';
import { ConsentService } from './consent.service';
import { validateApplicantData } from '../utils/validation';

export class ApplicantService {
  private auditService = new AuditService();
  private consentService = new ConsentService();

  async createApplicant(
    userId: string,
    data: CreateApplicantRequest,
    ipAddress: string,
    userAgent: string
  ): Promise<Applicant> {
    // Validate input data
    const validationErrors = validateApplicantData(data);
    if (validationErrors.length > 0) {
      throw new AppError('Validation failed', 400);
    }

    // Check if applicant already exists for this user
    const existingApplicant = await this.getApplicantByUserId(userId);
    if (existingApplicant) {
      throw new AppError('Applicant profile already exists for this user', 409);
    }

    // Record consent first
    await this.consentService.recordConsent(userId, data.consent, ipAddress, userAgent);

    // Create applicant record
    const applicantData = {
      user_id: userId,
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      date_of_birth: new Date(data.date_of_birth),
      nationality: data.nationality.toUpperCase(),
      passport_number: data.passport_number.toUpperCase(),
      passport_country: data.passport_country.toUpperCase(),
      passport_expiry: data.passport_expiry ? new Date(data.passport_expiry) : null,
      address_history: JSON.stringify(data.address_history),
      current_address: data.current_address,
      current_city: data.current_city,
      current_country: data.current_country.toUpperCase(),
      current_postal_code: data.current_postal_code,
      consent_records: JSON.stringify([]),
    };

    const [applicant] = await db('applicants').insert(applicantData).returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'applicant_created',
      entity_type: 'applicant',
      entity_id: applicant.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      result: 'success',
      details: {
        first_name: data.first_name,
        last_name: data.last_name,
        nationality: data.nationality,
        passport_country: data.passport_country,
      },
    });

    // Parse JSON fields back to objects for return
    applicant.address_history = JSON.parse(applicant.address_history);
    applicant.consent_records = JSON.parse(applicant.consent_records);

    return applicant;
  }

  async getApplicantByUserId(userId: string): Promise<Applicant | null> {
    const applicant = await db('applicants').where('user_id', userId).first();
    
    if (applicant) {
      // Parse JSON fields
      applicant.address_history = JSON.parse(applicant.address_history || '[]');
      applicant.consent_records = JSON.parse(applicant.consent_records || '[]');
    }

    return applicant || null;
  }

  async getApplicantById(id: string): Promise<Applicant | null> {
    const applicant = await db('applicants').where('id', id).first();
    
    if (applicant) {
      // Parse JSON fields
      applicant.address_history = JSON.parse(applicant.address_history || '[]');
      applicant.consent_records = JSON.parse(applicant.consent_records || '[]');
    }

    return applicant || null;
  }

  async updateApplicant(
    id: string,
    data: Partial<CreateApplicantRequest>,
    userId: string,
    ipAddress: string
  ): Promise<Applicant> {
    const existingApplicant = await this.getApplicantById(id);
    if (!existingApplicant) {
      throw new AppError('Applicant not found', 404);
    }

    // Validate updated data
    const validationErrors = validateApplicantData({ ...existingApplicant, ...data });
    if (validationErrors.length > 0) {
      throw new AppError('Validation failed', 400);
    }

    const updateData: any = {};
    const allowedFields = [
      'first_name', 'middle_name', 'last_name', 'current_address',
      'current_city', 'current_postal_code', 'address_history'
    ];

    // Only update allowed fields that were provided
    allowedFields.forEach(field => {
      if (data[field as keyof CreateApplicantRequest] !== undefined) {
        if (field === 'address_history') {
          updateData[field] = JSON.stringify(data[field]);
        } else {
          updateData[field] = data[field as keyof CreateApplicantRequest];
        }
      }
    });

    updateData.updated_at = new Date();

    const [updatedApplicant] = await db('applicants')
      .where('id', id)
      .update(updateData)
      .returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'applicant_updated',
      entity_type: 'applicant',
      entity_id: id,
      ip_address: ipAddress,
      result: 'success',
      previous_values: existingApplicant,
      new_values: updateData,
    });

    // Parse JSON fields back to objects for return
    updatedApplicant.address_history = JSON.parse(updatedApplicant.address_history);
    updatedApplicant.consent_records = JSON.parse(updatedApplicant.consent_records);

    return updatedApplicant;
  }

  async searchApplicants(
    searchTerm: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ applicants: Applicant[]; total: number }> {
    let query = db('applicants')
      .leftJoin('users', 'applicants.user_id', 'users.id')
      .select(
        'applicants.*',
        'users.email',
        'users.phone'
      );

    if (searchTerm) {
      query = query.where((builder) => {
        builder
          .where('applicants.first_name', 'ilike', `%${searchTerm}%`)
          .orWhere('applicants.last_name', 'ilike', `%${searchTerm}%`)
          .orWhere('applicants.passport_number', 'ilike', `%${searchTerm}%`)
          .orWhere('users.email', 'ilike', `%${searchTerm}%`);
      });
    }

    const total = await query.clone().count('applicants.id as count').first();
    const applicants = await query
      .orderBy('applicants.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    applicants.forEach(applicant => {
      applicant.address_history = JSON.parse(applicant.address_history || '[]');
      applicant.consent_records = JSON.parse(applicant.consent_records || '[]');
    });

    return {
      applicants,
      total: parseInt(total?.count as string) || 0,
    };
  }

  async checkDuplicatePassport(
    passportNumber: string,
    passportCountry: string,
    excludeApplicantId?: string
  ): Promise<boolean> {
    let query = db('applicants')
      .where('passport_number', passportNumber.toUpperCase())
      .where('passport_country', passportCountry.toUpperCase());

    if (excludeApplicantId) {
      query = query.where('id', '!=', excludeApplicantId);
    }

    const existing = await query.first();
    return !!existing;
  }

  async getApplicantByPassport(
    passportNumber: string,
    passportCountry: string
  ): Promise<Applicant | null> {
    const applicant = await db('applicants')
      .where('passport_number', passportNumber.toUpperCase())
      .where('passport_country', passportCountry.toUpperCase())
      .first();

    if (applicant) {
      // Parse JSON fields
      applicant.address_history = JSON.parse(applicant.address_history || '[]');
      applicant.consent_records = JSON.parse(applicant.consent_records || '[]');
    }

    return applicant || null;
  }

  async deleteApplicant(id: string, userId: string, ipAddress: string): Promise<void> {
    const applicant = await this.getApplicantById(id);
    if (!applicant) {
      throw new AppError('Applicant not found', 404);
    }

    // Check if applicant has any active applications
    const activeApplications = await db('applications')
      .where('applicant_id', id)
      .whereNotIn('status', ['cancelled', 'clear', 'not_clear'])
      .count('id as count')
      .first();

    if (activeApplications && parseInt(activeApplications.count as string) > 0) {
      throw new AppError('Cannot delete applicant with active applications', 400);
    }

    await db('applicants').where('id', id).del();

    await this.auditService.log({
      user_id: userId,
      action: 'applicant_deleted',
      entity_type: 'applicant',
      entity_id: id,
      ip_address: ipAddress,
      result: 'success',
      previous_values: applicant,
    });
  }
}