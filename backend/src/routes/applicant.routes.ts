import { Router } from 'express';
import { ApplicantController } from '../controllers/applicant.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const applicantController = new ApplicantController();

// Applicant routes (require authentication)
router.post('/', authMiddleware.authenticate, applicantController.createApplicant);
router.get('/', authMiddleware.authenticate, applicantController.getApplicant);
router.put('/:id', authMiddleware.authenticate, applicantController.updateApplicant);

// Utility routes
router.post('/passport/check', authMiddleware.authenticate, applicantController.checkPassportDuplicate);

// Admin routes
router.get('/search', authMiddleware.requireAdmin, applicantController.searchApplicants);
router.get('/:id/admin', authMiddleware.requireAdmin, applicantController.getApplicantById);

export default router;