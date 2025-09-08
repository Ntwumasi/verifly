import { Router } from 'express';
import authRoutes from './auth.routes';
import applicantRoutes from './applicant.routes';
import applicationRoutes from './application.routes';
import paymentRoutes from './payment.routes';
import verificationRoutes from './verification.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// API routes
router.use('/v1/auth', authRoutes);
router.use('/v1/applicants', applicantRoutes);
router.use('/v1/applications', applicationRoutes);
router.use('/v1/payments', paymentRoutes);
router.use('/v1/verification', verificationRoutes);
router.use('/v1/admin', adminRoutes);

export default router;