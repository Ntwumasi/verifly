import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const adminController = new AdminController();

// All admin routes require admin authentication
router.use(authMiddleware.requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Case Management
router.get('/cases/:id', adminController.getCaseDetails);
router.post('/cases/:id/decision', adminController.makeDecision);

// Analytics and Reporting
router.get('/analytics', adminController.getAnalytics);
router.get('/export/cases', adminController.exportCases);

export default router;