import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { DocumentService } from '../services/document.service';

const router = Router();
const applicationController = new ApplicationController();
const upload = DocumentService.getMulterConfig();

// Application routes (require authentication)
router.post('/', authMiddleware.authenticate, applicationController.createApplication);
router.get('/', authMiddleware.authenticate, applicationController.getApplications);
router.get('/:id', authMiddleware.authenticate, applicationController.getApplication);
router.put('/:id', authMiddleware.authenticate, applicationController.updateApplication);
router.post('/:id/submit', authMiddleware.authenticate, applicationController.submitApplication);
router.post('/:id/cancel', authMiddleware.authenticate, applicationController.cancelApplication);

// Document routes
router.post('/:id/documents', 
  authMiddleware.authenticate, 
  upload.single('document'), 
  applicationController.uploadDocument
);
router.delete('/:id/documents/:documentId', 
  authMiddleware.authenticate, 
  applicationController.deleteDocument
);

// Status check route (public with application ID)
router.get('/:id/status', applicationController.getApplicationStatus);

// Admin routes
router.get('/admin/search', authMiddleware.requireAdmin, applicationController.searchApplications);
router.get('/admin/stats', authMiddleware.requireAdmin, applicationController.getApplicationStats);

export default router;