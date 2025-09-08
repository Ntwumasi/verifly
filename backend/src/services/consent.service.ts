import { db } from '../config/database';
import { ConsentRecord, ConsentData, AppError } from '../types';
import { AuditService } from './audit.service';

export class ConsentService {
  private auditService = new AuditService();

  async recordConsent(
    userId: string,
    consentData: ConsentData,
    ipAddress: string,
    userAgent: string
  ): Promise<ConsentRecord> {
    const consentRecord: ConsentRecord = {
      version: consentData.version,
      consented_at: new Date(),
      ip_address: ipAddress,
      user_agent: userAgent,
      purposes: consentData.purposes,
      data_categories: consentData.data_categories,
      retention_period: consentData.retention_period,
      can_withdraw: true,
    };

    // Get current applicant record to update consent
    const applicant = await db('applicants').where('user_id', userId).first();
    if (!applicant) {
      throw new AppError('Applicant not found', 404);
    }

    // Add to existing consent records
    const currentConsents = applicant.consent_records || [];
    const updatedConsents = [...currentConsents, consentRecord];

    await db('applicants')
      .where('user_id', userId)
      .update({
        consent_records: JSON.stringify(updatedConsents),
        updated_at: new Date(),
      });

    await this.auditService.log({
      user_id: userId,
      action: 'consent_recorded',
      entity_type: 'applicant',
      entity_id: applicant.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      result: 'success',
      details: {
        consent_version: consentData.version,
        purposes: consentData.purposes,
        data_categories: consentData.data_categories,
      },
    });

    return consentRecord;
  }

  async withdrawConsent(
    userId: string,
    consentVersion: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const applicant = await db('applicants').where('user_id', userId).first();
    if (!applicant) {
      throw new AppError('Applicant not found', 404);
    }

    const currentConsents = applicant.consent_records || [];
    const updatedConsents = currentConsents.map((consent: ConsentRecord) => {
      if (consent.version === consentVersion) {
        return {
          ...consent,
          can_withdraw: false,
          withdrawn_at: new Date(),
        };
      }
      return consent;
    });

    await db('applicants')
      .where('user_id', userId)
      .update({
        consent_records: JSON.stringify(updatedConsents),
        updated_at: new Date(),
      });

    await this.auditService.log({
      user_id: userId,
      action: 'consent_withdrawn',
      entity_type: 'applicant',
      entity_id: applicant.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      result: 'success',
      details: {
        consent_version: consentVersion,
      },
    });
  }

  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    const applicant = await db('applicants').where('user_id', userId).first();
    if (!applicant) {
      return [];
    }

    return applicant.consent_records || [];
  }

  async hasValidConsent(userId: string, purposes: string[]): Promise<boolean> {
    const consentHistory = await this.getConsentHistory(userId);
    
    // Find the most recent consent
    const latestConsent = consentHistory
      .filter(consent => consent.can_withdraw !== false)
      .sort((a, b) => new Date(b.consented_at).getTime() - new Date(a.consented_at).getTime())[0];

    if (!latestConsent) {
      return false;
    }

    // Check if all required purposes are covered
    return purposes.every(purpose => latestConsent.purposes.includes(purpose));
  }

  async getCurrentConsentVersion(): Promise<string> {
    // This would typically come from a configuration or policy table
    // For now, return a static version
    return '1.0.0';
  }

  async getConsentTemplate(version?: string): Promise<any> {
    const currentVersion = version || await this.getCurrentConsentVersion();
    
    // This would typically be stored in the database or loaded from a file
    return {
      version: currentVersion,
      purposes: [
        {
          id: 'background_verification',
          name: 'Background Verification',
          description: 'Processing personal data for travel background verification',
          required: true,
        },
        {
          id: 'document_verification',
          name: 'Document Verification',
          description: 'Verifying identity documents and travel documents',
          required: true,
        },
        {
          id: 'communications',
          name: 'Communications',
          description: 'Sending notifications about application status',
          required: true,
        },
        {
          id: 'analytics',
          name: 'Analytics and Improvement',
          description: 'Using anonymized data to improve our services',
          required: false,
        },
      ],
      data_categories: [
        'Personal identifiers',
        'Biometric data',
        'Travel information',
        'Contact information',
        'Payment information',
      ],
      retention_period: 180, // days
      rights: [
        'Right to access your data',
        'Right to rectify incorrect data',
        'Right to delete your data (subject to legal requirements)',
        'Right to restrict processing',
        'Right to data portability',
        'Right to withdraw consent',
      ],
      legal_basis: 'Consent and legitimate interests',
      data_transfers: {
        countries: ['Ghana', 'Nigeria', 'Senegal', 'Ivory Coast'],
        safeguards: 'Standard Contractual Clauses (SCCs)',
      },
      contact: {
        dpo_email: 'privacy@verifly.com',
        support_email: 'support@verifly.com',
      },
    };
  }
}