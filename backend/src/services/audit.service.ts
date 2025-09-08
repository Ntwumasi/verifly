import { db } from '../config/database';
import { AuditLog } from '../types';

interface AuditLogData {
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address: string;
  user_agent?: string;
  details?: Record<string, any>;
  previous_values?: Record<string, any>;
  new_values?: Record<string, any>;
  result: 'success' | 'failure' | 'error';
  error_message?: string;
}

export class AuditService {
  async log(data: AuditLogData): Promise<void> {
    try {
      await db('audit_logs').insert({
        ...data,
        details: data.details || {},
        previous_values: data.previous_values || {},
        new_values: data.new_values || {},
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async getAuditTrail(
    entityType?: string,
    entityId?: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    let query = db('audit_logs').select('*');

    if (entityType) {
      query = query.where('entity_type', entityType);
    }

    if (entityId) {
      query = query.where('entity_id', entityId);
    }

    if (userId) {
      query = query.where('user_id', userId);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }

    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    const logs = await query
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    return logs;
  }

  async getUserActivity(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLog[]> {
    const logs = await db('audit_logs')
      .where('user_id', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    return logs;
  }

  async getApplicationAuditTrail(applicationId: string): Promise<AuditLog[]> {
    const logs = await db('audit_logs')
      .where('entity_type', 'application')
      .where('entity_id', applicationId)
      .orderBy('timestamp', 'desc');

    return logs;
  }
}