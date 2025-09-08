import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Payment routes (require authentication)
router.post('/intent', authMiddleware.authenticate, paymentController.createPaymentIntent);
router.get('/:id', authMiddleware.authenticate, paymentController.getPayment);
router.get('/application/:applicationId', authMiddleware.authenticate, paymentController.getPaymentByApplication);

// Webhook route (no authentication required, signature validation instead)
router.post('/webhook', paymentController.handleWebhook);

// Admin routes
router.post('/:id/refund', authMiddleware.requireFinance, paymentController.refundPayment);
router.get('/admin/list', authMiddleware.requireFinance, paymentController.getPayments);
router.get('/admin/stats', authMiddleware.requireFinance, paymentController.getPaymentStats);

export default router;