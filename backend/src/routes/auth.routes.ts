import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/consent/template', authController.getConsentTemplate);

// Protected routes (require authentication)
router.get('/profile', authMiddleware.authenticate, authController.getProfile);
router.put('/password', authMiddleware.authenticate, authController.updatePassword);
router.post('/consent', authMiddleware.authenticate, authController.recordConsent);
router.get('/consent/history', authMiddleware.authenticate, authController.getConsentHistory);
router.post('/consent/withdraw', authMiddleware.authenticate, authController.withdrawConsent);

export default router;