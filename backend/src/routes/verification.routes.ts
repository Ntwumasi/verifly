import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const verificationController = new VerificationController();

// Verification routes (require authentication)
router.post('/start', authMiddleware.authenticate, verificationController.startVerification);
router.get('/:id', authMiddleware.authenticate, verificationController.getVerificationRun);
router.get('/application/:applicationId', authMiddleware.authenticate, verificationController.getVerificationsByApplication);

// Admin routes
router.post('/:id/retry', authMiddleware.requireReviewer, verificationController.retryVerification);

export default router;