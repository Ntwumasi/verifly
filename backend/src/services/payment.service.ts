import Stripe from 'stripe';
import { db } from '../config/database';
import { config } from '../config';
import { Payment, PaymentStatus, AppError } from '../types';
import { AuditService } from './audit.service';
import { ApplicationService } from './application.service';

export class PaymentService {
  private stripe: Stripe;
  private auditService = new AuditService();
  private applicationService = new ApplicationService();

  constructor() {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key is required');
    }
    this.stripe = new Stripe(config.stripe.secretKey);
  }

  async createPaymentIntent(
    applicationId: string,
    userId: string,
    ipAddress: string
  ): Promise<{ payment: Payment; clientSecret: string }> {
    // Get application details
    const application = await this.applicationService.getApplicationById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== 'submitted') {
      throw new AppError('Application must be submitted before payment', 400);
    }

    // Check if payment already exists
    const existingPayment = await this.getPaymentByApplicationId(applicationId);
    if (existingPayment && ['completed', 'processing'].includes(existingPayment.status)) {
      throw new AppError('Payment already exists for this application', 409);
    }

    const amount = application.fee_amount || config.application.defaultFee;
    const currency = application.currency || config.application.defaultCurrency;

    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        application_id: applicationId,
        user_id: userId,
      },
      description: `Verifly verification fee for application ${applicationId}`,
    });

    // Create payment record
    const paymentData = {
      application_id: applicationId,
      amount,
      currency: currency.toUpperCase(),
      status: 'pending' as PaymentStatus,
      payment_method: 'card',
      processor: 'stripe',
      processor_payment_id: paymentIntent.id,
      processor_metadata: JSON.stringify({
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
      }),
    };

    const [payment] = await db('payments').insert(paymentData).returning('*');

    // Update application status
    await this.applicationService.updateApplicationStatus(
      applicationId,
      'payment_pending',
      userId,
      ipAddress
    );

    await this.auditService.log({
      user_id: userId,
      action: 'payment_intent_created',
      entity_type: 'payment',
      entity_id: payment.id,
      ip_address: ipAddress,
      result: 'success',
      details: {
        application_id: applicationId,
        amount,
        currency,
        stripe_payment_intent_id: paymentIntent.id,
      },
    });

    // Parse JSON fields
    payment.processor_metadata = JSON.parse(payment.processor_metadata);

    return {
      payment,
      clientSecret: paymentIntent.client_secret!,
    };
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const payment = await db('payments').where('id', id).first();
    
    if (payment) {
      payment.processor_metadata = JSON.parse(payment.processor_metadata || '{}');
    }

    return payment || null;
  }

  async getPaymentByApplicationId(applicationId: string): Promise<Payment | null> {
    const payment = await db('payments').where('application_id', applicationId).first();
    
    if (payment) {
      payment.processor_metadata = JSON.parse(payment.processor_metadata || '{}');
    }

    return payment || null;
  }

  async getPaymentByProcessorId(processorPaymentId: string): Promise<Payment | null> {
    const payment = await db('payments').where('processor_payment_id', processorPaymentId).first();
    
    if (payment) {
      payment.processor_metadata = JSON.parse(payment.processor_metadata || '{}');
    }

    return payment || null;
  }

  async handleWebhook(
    event: Stripe.Event,
    ipAddress: string
  ): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, ipAddress);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent, ipAddress);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent, ipAddress);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    ipAddress: string
  ): Promise<void> {
    const payment = await this.getPaymentByProcessorId(paymentIntent.id);
    if (!payment) {
      console.error(`Payment not found for Stripe payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    const updatedPayment = await this.updatePaymentStatus(
      payment.id,
      'completed',
      'system',
      ipAddress,
      {
        stripe_status: paymentIntent.status,
        charges: paymentIntent.charges,
      }
    );

    // Update application status
    await this.applicationService.updateApplicationStatus(
      payment.application_id,
      'payment_completed',
      'system',
      ipAddress,
      'Payment completed successfully'
    );

    // TODO: Trigger verification process
    // await this.triggerVerification(payment.application_id);
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
    ipAddress: string
  ): Promise<void> {
    const payment = await this.getPaymentByProcessorId(paymentIntent.id);
    if (!payment) {
      console.error(`Payment not found for Stripe payment intent: ${paymentIntent.id}`);
      return;
    }

    const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    await this.updatePaymentStatus(
      payment.id,
      'failed',
      'system',
      ipAddress,
      {
        failure_reason: failureReason,
        stripe_status: paymentIntent.status,
        last_payment_error: paymentIntent.last_payment_error,
      }
    );

    // Update application status back to submitted
    await this.applicationService.updateApplicationStatus(
      payment.application_id,
      'submitted',
      'system',
      ipAddress,
      `Payment failed: ${failureReason}`
    );
  }

  private async handlePaymentCanceled(
    paymentIntent: Stripe.PaymentIntent,
    ipAddress: string
  ): Promise<void> {
    const payment = await this.getPaymentByProcessorId(paymentIntent.id);
    if (!payment) {
      console.error(`Payment not found for Stripe payment intent: ${paymentIntent.id}`);
      return;
    }

    await this.updatePaymentStatus(
      payment.id,
      'cancelled',
      'system',
      ipAddress,
      {
        stripe_status: paymentIntent.status,
        cancellation_reason: paymentIntent.cancellation_reason,
      }
    );

    // Update application status back to submitted
    await this.applicationService.updateApplicationStatus(
      payment.application_id,
      'submitted',
      'system',
      ipAddress,
      'Payment was cancelled'
    );
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    userId: string,
    ipAddress: string,
    metadata?: Record<string, any>
  ): Promise<Payment> {
    const existingPayment = await this.getPaymentById(id);
    if (!existingPayment) {
      throw new AppError('Payment not found', 404);
    }

    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (status === 'completed') {
      updateData.processed_at = new Date();
    }

    if (metadata?.failure_reason) {
      updateData.failure_reason = metadata.failure_reason;
    }

    if (metadata) {
      const existingMetadata = existingPayment.processor_metadata || {};
      updateData.processor_metadata = JSON.stringify({
        ...existingMetadata,
        ...metadata,
      });
    }

    const [payment] = await db('payments')
      .where('id', id)
      .update(updateData)
      .returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'payment_status_updated',
      entity_type: 'payment',
      entity_id: id,
      ip_address: ipAddress,
      result: 'success',
      previous_values: { status: existingPayment.status },
      new_values: { status },
      details: metadata,
    });

    payment.processor_metadata = JSON.parse(payment.processor_metadata);
    return payment;
  }

  async refundPayment(
    id: string,
    amount?: number,
    reason?: string,
    userId?: string,
    ipAddress?: string
  ): Promise<Payment> {
    const payment = await this.getPaymentById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== 'completed') {
      throw new AppError('Can only refund completed payments', 400);
    }

    if (!payment.processor_payment_id) {
      throw new AppError('Cannot refund payment without processor payment ID', 400);
    }

    const refundAmount = amount || payment.amount;
    
    if (refundAmount > (payment.amount - payment.refunded_amount)) {
      throw new AppError('Refund amount exceeds available refundable amount', 400);
    }

    // Create refund with Stripe
    const refund = await this.stripe.refunds.create({
      payment_intent: payment.processor_payment_id,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: reason as any || 'requested_by_customer',
      metadata: {
        refund_reason: reason || 'Manual refund',
        refunded_by: userId || 'system',
      },
    });

    // Update payment record
    const newRefundedAmount = payment.refunded_amount + refundAmount;
    const newStatus = newRefundedAmount >= payment.amount ? 'refunded' : 'partially_refunded';

    const [updatedPayment] = await db('payments')
      .where('id', id)
      .update({
        refunded_amount: newRefundedAmount,
        status: newStatus,
        processor_metadata: JSON.stringify({
          ...payment.processor_metadata,
          refunds: [...(payment.processor_metadata.refunds || []), refund],
        }),
        updated_at: new Date(),
      })
      .returning('*');

    await this.auditService.log({
      user_id: userId || 'system',
      action: 'payment_refunded',
      entity_type: 'payment',
      entity_id: id,
      ip_address: ipAddress || 'system',
      result: 'success',
      details: {
        refund_amount: refundAmount,
        total_refunded: newRefundedAmount,
        reason,
        stripe_refund_id: refund.id,
      },
    });

    updatedPayment.processor_metadata = JSON.parse(updatedPayment.processor_metadata);
    return updatedPayment;
  }

  async getPaymentsByDateRange(
    startDate: Date,
    endDate: Date,
    status?: PaymentStatus,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ payments: Payment[]; total: number }> {
    let query = db('payments')
      .leftJoin('applications', 'payments.application_id', 'applications.id')
      .leftJoin('applicants', 'applications.applicant_id', 'applicants.id')
      .select(
        'payments.*',
        'applications.destination_country',
        'applicants.first_name',
        'applicants.last_name'
      )
      .where('payments.created_at', '>=', startDate)
      .where('payments.created_at', '<=', endDate);

    if (status) {
      query = query.where('payments.status', status);
    }

    const total = await query.clone().count('payments.id as count').first();
    const payments = await query
      .orderBy('payments.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    payments.forEach(payment => {
      payment.processor_metadata = JSON.parse(payment.processor_metadata || '{}');
    });

    return {
      payments,
      total: parseInt(total?.count as string) || 0,
    };
  }

  async getPaymentStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    let query = db('payments');

    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }

    const stats = await query
      .select('status')
      .sum('amount as total_amount')
      .count('* as count')
      .groupBy('status');

    const totalStats = await query.clone()
      .select()
      .sum('amount as total_revenue')
      .sum('refunded_amount as total_refunded')
      .count('* as total_transactions')
      .first();

    return {
      by_status: stats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: parseInt(stat.count as string),
          total_amount: parseFloat(stat.total_amount as string) || 0,
        };
        return acc;
      }, {} as Record<string, any>),
      totals: {
        revenue: parseFloat(totalStats?.total_revenue as string) || 0,
        refunded: parseFloat(totalStats?.total_refunded as string) || 0,
        transactions: parseInt(totalStats?.total_transactions as string) || 0,
      },
    };
  }

  async validateWebhookSignature(
    payload: string,
    signature: string
  ): Promise<Stripe.Event> {
    if (!config.stripe.webhookSecret) {
      throw new Error('Stripe webhook secret is required');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      throw new AppError('Invalid webhook signature', 400);
    }
  }
}