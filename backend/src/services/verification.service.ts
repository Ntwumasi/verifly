import { db } from '../config/database';
import { VerificationRun, SourceHit, Application, Applicant, AppError } from '../types';
import { AuditService } from './audit.service';
import { ApplicationService } from './application.service';
import { SanctionsService } from './sources/sanctions.service';
import { PEPService } from './sources/pep.service';
import { DocumentVerificationService } from './sources/document-verification.service';
import { NotificationService } from './notification.service';

export class VerificationService {
  private auditService = new AuditService();
  private applicationService = new ApplicationService();
  private sanctionsService = new SanctionsService();
  private pepService = new PEPService();
  private documentService = new DocumentVerificationService();
  private notificationService = new NotificationService();

  async startVerification(
    applicationId: string,
    userId?: string,
    ipAddress: string = 'system'
  ): Promise<VerificationRun> {
    const application = await this.applicationService.getApplicationById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== 'payment_completed') {
      throw new AppError('Application must have completed payment before verification', 400);
    }

    // Check if verification is already running
    const existingRun = await this.getActiveVerificationRun(applicationId);
    if (existingRun) {
      throw new AppError('Verification is already in progress for this application', 409);
    }

    // Get current policy version
    const policyVersion = await this.getCurrentPolicyVersion();

    // Create verification run
    const verificationData = {
      application_id: applicationId,
      status: 'queued' as const,
      policy_version: policyVersion,
      source_results: JSON.stringify({}),
      scoring_breakdown: JSON.stringify({}),
      reason_codes: JSON.stringify([]),
    };

    const [verificationRun] = await db('verification_runs')
      .insert(verificationData)
      .returning('*');

    // Update application status
    await this.applicationService.updateApplicationStatus(
      applicationId,
      'in_progress',
      userId || 'system',
      ipAddress,
      'Background verification started'
    );

    await this.auditService.log({
      user_id: userId,
      action: 'verification_started',
      entity_type: 'verification_run',
      entity_id: verificationRun.id,
      ip_address: ipAddress,
      result: 'success',
      details: {
        application_id: applicationId,
        policy_version: policyVersion,
      },
    });

    // Start async verification process
    this.processVerificationAsync(verificationRun.id);

    // Parse JSON fields
    verificationRun.source_results = JSON.parse(verificationRun.source_results);
    verificationRun.scoring_breakdown = JSON.parse(verificationRun.scoring_breakdown);
    verificationRun.reason_codes = JSON.parse(verificationRun.reason_codes);

    return verificationRun;
  }

  async getVerificationRun(id: string): Promise<VerificationRun | null> {
    const run = await db('verification_runs').where('id', id).first();
    
    if (run) {
      run.source_results = JSON.parse(run.source_results || '{}');
      run.scoring_breakdown = JSON.parse(run.scoring_breakdown || '{}');
      run.reason_codes = JSON.parse(run.reason_codes || '[]');
    }

    return run || null;
  }

  async getVerificationRunsByApplicationId(applicationId: string): Promise<VerificationRun[]> {
    const runs = await db('verification_runs')
      .where('application_id', applicationId)
      .orderBy('created_at', 'desc');

    runs.forEach(run => {
      run.source_results = JSON.parse(run.source_results || '{}');
      run.scoring_breakdown = JSON.parse(run.scoring_breakdown || '{}');
      run.reason_codes = JSON.parse(run.reason_codes || '[]');
    });

    return runs;
  }

  async getActiveVerificationRun(applicationId: string): Promise<VerificationRun | null> {
    const run = await db('verification_runs')
      .where('application_id', applicationId)
      .whereIn('status', ['queued', 'in_progress'])
      .first();

    if (run) {
      run.source_results = JSON.parse(run.source_results || '{}');
      run.scoring_breakdown = JSON.parse(run.scoring_breakdown || '{}');
      run.reason_codes = JSON.parse(run.reason_codes || '[]');
    }

    return run || null;
  }

  async getSourceHits(verificationRunId: string): Promise<SourceHit[]> {
    const hits = await db('source_hits')
      .where('verification_run_id', verificationRunId)
      .orderBy('match_confidence', 'desc');

    hits.forEach(hit => {
      hit.query_terms = JSON.parse(hit.query_terms || '{}');
      hit.record_data = JSON.parse(hit.record_data || '{}');
      hit.metadata = JSON.parse(hit.metadata || '{}');
    });

    return hits;
  }

  private async processVerificationAsync(verificationRunId: string): Promise<void> {
    try {
      const verificationRun = await this.getVerificationRun(verificationRunId);
      if (!verificationRun) {
        throw new Error('Verification run not found');
      }

      // Update status to in_progress
      await this.updateVerificationStatus(verificationRunId, 'in_progress');

      // Get application and applicant data
      const application = await this.applicationService.getApplicationById(verificationRun.application_id);
      if (!application) {
        throw new Error('Application not found');
      }

      const applicant = await db('applicants').where('id', application.applicant_id).first();
      if (!applicant) {
        throw new Error('Applicant not found');
      }

      // Parse applicant data
      applicant.address_history = JSON.parse(applicant.address_history || '[]');

      // Run verification checks in parallel
      const verificationPromises = [
        this.runSanctionsCheck(verificationRunId, applicant),
        this.runPEPCheck(verificationRunId, applicant),
        this.runDocumentCheck(verificationRunId, application.id),
      ];

      await Promise.allSettled(verificationPromises);

      // Calculate risk score and make decision
      const decision = await this.calculateRiskAndDecision(verificationRunId);

      // Update verification run with final results
      await this.completeVerification(verificationRunId, decision);

      // Update application status
      await this.applicationService.updateApplicationStatus(
        application.id,
        decision.decision === 'clear' ? 'clear' : 
        decision.decision === 'not_clear' ? 'not_clear' : 'under_review',
        'system',
        'system',
        `Verification completed: ${decision.decision}`
      );

      // Send notification to applicant
      await this.notificationService.sendVerificationCompleteNotification(
        application.id,
        decision.decision
      );

    } catch (error) {
      console.error(`Verification processing failed for run ${verificationRunId}:`, error);
      
      // Mark verification as failed
      await this.updateVerificationStatus(verificationRunId, 'failed');
      
      await this.auditService.log({
        action: 'verification_failed',
        entity_type: 'verification_run',
        entity_id: verificationRunId,
        ip_address: 'system',
        result: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async runSanctionsCheck(verificationRunId: string, applicant: any): Promise<void> {
    try {
      const results = await this.sanctionsService.checkSanctions(applicant);
      
      for (const hit of results.hits) {
        await this.recordSourceHit(verificationRunId, 'sanctions', hit);
      }

      // Update source results
      await this.updateSourceResults(verificationRunId, 'sanctions', results);
    } catch (error) {
      console.error('Sanctions check failed:', error);
      await this.updateSourceResults(verificationRunId, 'sanctions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        hits: [],
        checked_at: new Date(),
      });
    }
  }

  private async runPEPCheck(verificationRunId: string, applicant: any): Promise<void> {
    try {
      const results = await this.pepService.checkPEP(applicant);
      
      for (const hit of results.hits) {
        await this.recordSourceHit(verificationRunId, 'pep', hit);
      }

      await this.updateSourceResults(verificationRunId, 'pep', results);
    } catch (error) {
      console.error('PEP check failed:', error);
      await this.updateSourceResults(verificationRunId, 'pep', {
        error: error instanceof Error ? error.message : 'Unknown error',
        hits: [],
        checked_at: new Date(),
      });
    }
  }

  private async runDocumentCheck(verificationRunId: string, applicationId: string): Promise<void> {
    try {
      const results = await this.documentService.verifyApplicationDocuments(applicationId);
      await this.updateSourceResults(verificationRunId, 'documents', results);
    } catch (error) {
      console.error('Document check failed:', error);
      await this.updateSourceResults(verificationRunId, 'documents', {
        error: error instanceof Error ? error.message : 'Unknown error',
        verified: false,
        checked_at: new Date(),
      });
    }
  }

  private async recordSourceHit(
    verificationRunId: string, 
    sourceName: string, 
    hitData: any
  ): Promise<void> {
    const sourceHitData = {
      verification_run_id: verificationRunId,
      source_name: sourceName,
      source_type: hitData.source_type || 'database',
      query_terms: JSON.stringify(hitData.query_terms || {}),
      match_confidence: hitData.match_confidence || 0,
      match_type: hitData.match_type || 'fuzzy',
      record_data: JSON.stringify(hitData.record_data || {}),
      record_url: hitData.record_url,
      jurisdiction: hitData.jurisdiction,
      severity: hitData.severity || 'low',
      record_date: hitData.record_date,
      metadata: JSON.stringify(hitData.metadata || {}),
    };

    await db('source_hits').insert(sourceHitData);
  }

  private async updateSourceResults(
    verificationRunId: string,
    sourceName: string,
    results: any
  ): Promise<void> {
    const currentRun = await this.getVerificationRun(verificationRunId);
    if (!currentRun) return;

    const updatedResults = {
      ...currentRun.source_results,
      [sourceName]: results,
    };

    await db('verification_runs')
      .where('id', verificationRunId)
      .update({
        source_results: JSON.stringify(updatedResults),
        updated_at: new Date(),
      });
  }

  private async updateVerificationStatus(
    verificationRunId: string,
    status: VerificationRun['status']
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (status === 'in_progress') {
      updateData.started_at = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date();
    }

    await db('verification_runs')
      .where('id', verificationRunId)
      .update(updateData);
  }

  private async calculateRiskAndDecision(verificationRunId: string): Promise<any> {
    const hits = await this.getSourceHits(verificationRunId);
    const verificationRun = await this.getVerificationRun(verificationRunId);
    
    if (!verificationRun) {
      throw new Error('Verification run not found');
    }

    let riskScore = 0;
    let reasonCodes: string[] = [];
    let scoringBreakdown: any = {
      sanctions: 0,
      pep: 0,
      documents: 0,
      total: 0,
    };

    // Calculate sanctions risk
    const sanctionsHits = hits.filter(hit => hit.source_name === 'sanctions');
    if (sanctionsHits.length > 0) {
      const highConfidenceHits = sanctionsHits.filter(hit => hit.match_confidence > 80);
      if (highConfidenceHits.length > 0) {
        riskScore += 70;
        reasonCodes.push('SANCTIONS_MATCH');
        scoringBreakdown.sanctions = 70;
      } else {
        riskScore += 30;
        reasonCodes.push('POTENTIAL_SANCTIONS_MATCH');
        scoringBreakdown.sanctions = 30;
      }
    }

    // Calculate PEP risk
    const pepHits = hits.filter(hit => hit.source_name === 'pep');
    if (pepHits.length > 0) {
      const highConfidenceHits = pepHits.filter(hit => hit.match_confidence > 80);
      if (highConfidenceHits.length > 0) {
        riskScore += 40;
        reasonCodes.push('PEP_MATCH');
        scoringBreakdown.pep = 40;
      } else {
        riskScore += 20;
        reasonCodes.push('POTENTIAL_PEP_MATCH');
        scoringBreakdown.pep = 20;
      }
    }

    // Calculate document verification score
    const documentResults = verificationRun.source_results.documents;
    if (!documentResults?.verified || documentResults?.error) {
      riskScore += 25;
      reasonCodes.push('DOCUMENT_VERIFICATION_FAILED');
      scoringBreakdown.documents = 25;
    } else if (documentResults?.confidence_score < 70) {
      riskScore += 15;
      reasonCodes.push('LOW_DOCUMENT_CONFIDENCE');
      scoringBreakdown.documents = 15;
    }

    scoringBreakdown.total = riskScore;

    // Determine decision based on risk score
    let decision: 'clear' | 'review' | 'not_clear';
    if (riskScore >= 60) {
      decision = 'not_clear';
    } else if (riskScore >= 30) {
      decision = 'review';
    } else {
      decision = 'clear';
    }

    return {
      decision,
      risk_score: riskScore,
      reason_codes: reasonCodes,
      scoring_breakdown: scoringBreakdown,
    };
  }

  private async completeVerification(verificationRunId: string, decision: any): Promise<void> {
    await db('verification_runs')
      .where('id', verificationRunId)
      .update({
        status: 'completed',
        decision: decision.decision,
        risk_score: decision.risk_score,
        reason_codes: JSON.stringify(decision.reason_codes),
        scoring_breakdown: JSON.stringify(decision.scoring_breakdown),
        completed_at: new Date(),
        updated_at: new Date(),
      });

    await this.auditService.log({
      action: 'verification_completed',
      entity_type: 'verification_run',
      entity_id: verificationRunId,
      ip_address: 'system',
      result: 'success',
      details: {
        decision: decision.decision,
        risk_score: decision.risk_score,
        reason_codes: decision.reason_codes,
      },
    });
  }

  private async getCurrentPolicyVersion(): Promise<string> {
    const activePolicy = await db('policies')
      .where('is_active', true)
      .where('effective_from', '<=', new Date())
      .where((builder) => {
        builder.whereNull('effective_until').orWhere('effective_until', '>', new Date());
      })
      .orderBy('effective_from', 'desc')
      .first();

    return activePolicy?.version || '1.0.0';
  }

  // Admin functions
  async retryVerification(verificationRunId: string, userId: string, ipAddress: string): Promise<void> {
    const verificationRun = await this.getVerificationRun(verificationRunId);
    if (!verificationRun) {
      throw new AppError('Verification run not found', 404);
    }

    if (verificationRun.status === 'in_progress') {
      throw new AppError('Verification is already in progress', 400);
    }

    // Reset verification status
    await db('verification_runs')
      .where('id', verificationRunId)
      .update({
        status: 'queued',
        started_at: null,
        completed_at: null,
        updated_at: new Date(),
      });

    // Clear existing source hits
    await db('source_hits').where('verification_run_id', verificationRunId).del();

    await this.auditService.log({
      user_id: userId,
      action: 'verification_retried',
      entity_type: 'verification_run',
      entity_id: verificationRunId,
      ip_address: ipAddress,
      result: 'success',
    });

    // Restart verification process
    this.processVerificationAsync(verificationRunId);
  }
}