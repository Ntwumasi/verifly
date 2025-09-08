import { db } from '../config/database';
import { config } from '../config';
import { Notification, NotificationType, AppError } from '../types';
import { AuditService } from './audit.service';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

export class NotificationService {
  private auditService = new AuditService();
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: any;

  constructor() {
    this.setupEmailTransporter();
    this.setupSMSClient();
  }

  private setupEmailTransporter() {
    if (config.email.service === 'sendgrid' && config.email.apiKey) {
      this.emailTransporter = nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: config.email.apiKey,
        },
      });
    } else {
      // Fallback to SMTP for development
      this.emailTransporter = nodemailer.createTransporter({
        host: 'localhost',
        port: 1025, // MailHog port for development
        ignoreTLS: true,
      });
    }
  }

  private setupSMSClient() {
    if (config.sms.twilioAccountSid && config.sms.twilioAuthToken) {
      this.twilioClient = twilio(config.sms.twilioAccountSid, config.sms.twilioAuthToken);
    }
  }

  async sendNotification(
    userId: string,
    applicationId: string,
    type: NotificationType,
    channel: 'email' | 'sms' | 'in_app',
    templateData: Record<string, any> = {}
  ): Promise<Notification> {
    const template = await this.getNotificationTemplate(type, channel);
    const message = this.renderTemplate(template.message, templateData);
    const subject = template.subject ? this.renderTemplate(template.subject, templateData) : undefined;

    const notificationData = {
      user_id: userId,
      application_id: applicationId,
      type,
      channel,
      subject,
      message,
      template_data: JSON.stringify(templateData),
      status: 'pending' as const,
      retry_count: 0,
    };

    const [notification] = await db('notifications').insert(notificationData).returning('*');

    // Send notification asynchronously
    this.sendNotificationAsync(notification.id);

    // Parse JSON fields
    notification.template_data = JSON.parse(notification.template_data);

    return notification;
  }

  async sendVerificationCompleteNotification(
    applicationId: string,
    decision: 'clear' | 'review' | 'not_clear'
  ): Promise<void> {
    try {
      // Get application and user details
      const application = await db('applications')
        .leftJoin('applicants', 'applications.applicant_id', 'applicants.id')
        .leftJoin('users', 'applicants.user_id', 'users.id')
        .select(
          'applications.*',
          'applicants.first_name',
          'applicants.last_name',
          'users.id as user_id',
          'users.email',
          'users.phone'
        )
        .where('applications.id', applicationId)
        .first();

      if (!application) {
        throw new Error('Application not found');
      }

      const templateData = {
        applicant_name: `${application.first_name} ${application.last_name}`,
        application_id: application.id,
        destination_country: application.destination_country,
        decision: decision,
        decision_text: this.getDecisionText(decision),
        status_url: `https://app.verifly.com/applications/${application.id}/status`,
      };

      // Send email notification
      if (application.email) {
        await this.sendNotification(
          application.user_id,
          applicationId,
          'verification_completed',
          'email',
          templateData
        );
      }

      // Send SMS notification if phone number available
      if (application.phone) {
        await this.sendNotification(
          application.user_id,
          applicationId,
          'verification_completed',
          'sms',
          templateData
        );
      }

      // Always create in-app notification
      await this.sendNotification(
        application.user_id,
        applicationId,
        'verification_completed',
        'in_app',
        templateData
      );

    } catch (error) {
      console.error('Failed to send verification complete notification:', error);
    }
  }

  private async sendNotificationAsync(notificationId: string): Promise<void> {
    try {
      const notification = await this.getNotificationById(notificationId);
      if (!notification) return;

      let result: any = { success: false };

      switch (notification.channel) {
        case 'email':
          result = await this.sendEmailNotification(notification);
          break;
        case 'sms':
          result = await this.sendSMSNotification(notification);
          break;
        case 'in_app':
          result = { success: true, message: 'In-app notification stored' };
          break;
      }

      if (result.success) {
        await this.updateNotificationStatus(
          notificationId,
          'sent',
          result.external_id,
          undefined,
          new Date()
        );
      } else {
        await this.updateNotificationStatus(
          notificationId,
          'failed',
          undefined,
          result.error || 'Unknown error'
        );
      }

    } catch (error) {
      console.error(`Failed to send notification ${notificationId}:`, error);
      
      await this.updateNotificationStatus(
        notificationId,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Retry logic could be implemented here
      await this.scheduleRetry(notificationId);
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<any> {
    try {
      const user = await db('users').where('id', notification.user_id).first();
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      const mailOptions = {
        from: `${config.email.fromName} <${config.email.fromEmail}>`,
        to: user.email,
        subject: notification.subject || 'Verifly Notification',
        html: notification.message,
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      return {
        success: true,
        external_id: result.messageId,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed',
      };
    }
  }

  private async sendSMSNotification(notification: Notification): Promise<any> {
    try {
      if (!this.twilioClient) {
        throw new Error('SMS service not configured');
      }

      const user = await db('users').where('id', notification.user_id).first();
      if (!user || !user.phone) {
        throw new Error('User phone number not found');
      }

      const message = await this.twilioClient.messages.create({
        body: this.stripHTML(notification.message),
        from: config.sms.twilioPhoneNumber,
        to: user.phone,
      });

      return {
        success: true,
        external_id: message.sid,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed',
      };
    }
  }

  private async getNotificationById(id: string): Promise<Notification | null> {
    const notification = await db('notifications').where('id', id).first();
    
    if (notification) {
      notification.template_data = JSON.parse(notification.template_data || '{}');
    }

    return notification || null;
  }

  private async updateNotificationStatus(
    id: string,
    status: Notification['status'],
    externalId?: string,
    failureReason?: string,
    sentAt?: Date,
    deliveredAt?: Date
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (externalId) updateData.external_id = externalId;
    if (failureReason) updateData.failure_reason = failureReason;
    if (sentAt) updateData.sent_at = sentAt;
    if (deliveredAt) updateData.delivered_at = deliveredAt;

    await db('notifications').where('id', id).update(updateData);

    await this.auditService.log({
      action: 'notification_status_updated',
      entity_type: 'notification',
      entity_id: id,
      ip_address: 'system',
      result: 'success',
      details: {
        status,
        external_id: externalId,
        failure_reason: failureReason,
      },
    });
  }

  private async scheduleRetry(notificationId: string): Promise<void> {
    const notification = await this.getNotificationById(notificationId);
    if (!notification) return;

    // Only retry up to 3 times
    if (notification.retry_count >= 3) return;

    // Exponential backoff: 5min, 30min, 2hours
    const delays = [5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000];
    const delay = delays[notification.retry_count] || delays[delays.length - 1];

    await db('notifications')
      .where('id', notificationId)
      .update({
        retry_count: notification.retry_count + 1,
        status: 'pending',
        updated_at: new Date(),
      });

    // In production, you would use a proper job queue like Bull or Agenda
    setTimeout(() => {
      this.sendNotificationAsync(notificationId);
    }, delay);
  }

  private getNotificationTemplate(type: NotificationType, channel: string): any {
    const templates = {
      verification_completed: {
        email: {
          subject: 'Your Verifly Application Status - {{decision_text}}',
          message: `
            <h2>Application Status Update</h2>
            <p>Dear {{applicant_name}},</p>
            <p>Your travel verification application ({{application_id}}) for {{destination_country}} has been processed.</p>
            <p><strong>Status: {{decision_text}}</strong></p>
            {{#if clear}}
            <p>Congratulations! Your application has been cleared. You can proceed with your travel plans.</p>
            {{/if}}
            {{#if review}}
            <p>Your application requires additional review. Our team will contact you if additional information is needed.</p>
            {{/if}}
            {{#if not_clear}}
            <p>Unfortunately, your application could not be cleared at this time. Please contact support for more information.</p>
            {{/if}}
            <p>You can view your full application status at: <a href="{{status_url}}">{{status_url}}</a></p>
            <p>Best regards,<br>The Verifly Team</p>
          `,
        },
        sms: {
          message: 'Verifly: Your application {{application_id}} status: {{decision_text}}. Check {{status_url}} for details.',
        },
        in_app: {
          message: 'Your verification has been completed with status: {{decision_text}}',
        },
      },
      application_submitted: {
        email: {
          subject: 'Application Submitted Successfully',
          message: `
            <h2>Application Submitted</h2>
            <p>Dear {{applicant_name}},</p>
            <p>Your application {{application_id}} has been submitted successfully.</p>
            <p>We will send you updates as your application progresses.</p>
          `,
        },
      },
      payment_received: {
        email: {
          subject: 'Payment Received - Verification Starting',
          message: `
            <h2>Payment Confirmed</h2>
            <p>Dear {{applicant_name}},</p>
            <p>We have received your payment. Your verification is now starting.</p>
            <p>Application ID: {{application_id}}</p>
          `,
        },
      },
    };

    return templates[type]?.[channel] || { message: 'Notification' };
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    // Simple template rendering (in production, use a proper template engine)
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(data[key] || ''));
    });

    // Handle conditional blocks
    if (data.decision === 'clear') {
      rendered = rendered.replace(/{{#if clear}}(.*?){{\/if}}/g, '$1');
    } else {
      rendered = rendered.replace(/{{#if clear}}(.*?){{\/if}}/g, '');
    }

    if (data.decision === 'review') {
      rendered = rendered.replace(/{{#if review}}(.*?){{\/if}}/g, '$1');
    } else {
      rendered = rendered.replace(/{{#if review}}(.*?){{\/if}}/g, '');
    }

    if (data.decision === 'not_clear') {
      rendered = rendered.replace(/{{#if not_clear}}(.*?){{\/if}}/g, '$1');
    } else {
      rendered = rendered.replace(/{{#if not_clear}}(.*?){{\/if}}/g, '');
    }

    return rendered;
  }

  private getDecisionText(decision: string): string {
    const texts = {
      clear: 'Approved',
      review: 'Under Review',
      not_clear: 'Not Approved',
    };
    return texts[decision as keyof typeof texts] || 'Unknown';
  }

  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Admin functions
  async getNotifications(
    userId?: string,
    applicationId?: string,
    type?: NotificationType,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = db('notifications').select('*');

    if (userId) query = query.where('user_id', userId);
    if (applicationId) query = query.where('application_id', applicationId);
    if (type) query = query.where('type', type);

    const total = await query.clone().count('id as count').first();
    const notifications = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    notifications.forEach(notification => {
      notification.template_data = JSON.parse(notification.template_data || '{}');
    });

    return {
      notifications,
      total: parseInt(total?.count as string) || 0,
    };
  }

  async resendNotification(notificationId: string): Promise<void> {
    const notification = await this.getNotificationById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await db('notifications')
      .where('id', notificationId)
      .update({
        status: 'pending',
        retry_count: 0,
        failure_reason: null,
        updated_at: new Date(),
      });

    this.sendNotificationAsync(notificationId);
  }
}