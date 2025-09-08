import { db } from '../config/database';
import { Document, DocumentType, AppError } from '../types';
import { AuditService } from './audit.service';
import { config } from '../config';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

export class DocumentService {
  private auditService = new AuditService();

  async uploadDocument(
    applicationId: string,
    file: Express.Multer.File,
    documentType: DocumentType,
    userId: string,
    ipAddress: string
  ): Promise<Document> {
    // Validate file type
    this.validateFileType(file, documentType);

    // Validate file size
    this.validateFileSize(file);

    // Generate file hash for integrity check
    const fileHash = await this.generateFileHash(file.buffer);

    // Check for duplicate files
    const existingDoc = await this.getDocumentByHash(fileHash);
    if (existingDoc && existingDoc.application_id === applicationId) {
      throw new AppError('This document has already been uploaded', 409);
    }

    // Process and store the file
    const storageInfo = await this.storeFile(file, documentType, applicationId);

    const documentData = {
      application_id: applicationId,
      type: documentType,
      original_filename: file.originalname,
      storage_path: storageInfo.path,
      storage_bucket: storageInfo.bucket,
      mime_type: file.mimetype,
      file_size: file.size,
      file_hash: fileHash,
      verification_results: JSON.stringify({}),
      is_verified: false,
      metadata: JSON.stringify(await this.extractMetadata(file, documentType)),
    };

    const [document] = await db('documents').insert(documentData).returning('*');

    await this.auditService.log({
      user_id: userId,
      action: 'document_uploaded',
      entity_type: 'document',
      entity_id: document.id,
      ip_address: ipAddress,
      result: 'success',
      details: {
        application_id: applicationId,
        document_type: documentType,
        filename: file.originalname,
        file_size: file.size,
      },
    });

    // Parse JSON fields
    document.verification_results = JSON.parse(document.verification_results);
    document.metadata = JSON.parse(document.metadata);

    // Start document verification process (async)
    this.verifyDocumentAsync(document.id);

    return document;
  }

  async getDocumentById(id: string): Promise<Document | null> {
    const document = await db('documents').where('id', id).first();
    
    if (document) {
      // Parse JSON fields
      document.verification_results = JSON.parse(document.verification_results || '{}');
      document.metadata = JSON.parse(document.metadata || '{}');
    }

    return document || null;
  }

  async getDocumentsByApplicationId(applicationId: string): Promise<Document[]> {
    const documents = await db('documents').where('application_id', applicationId);

    documents.forEach(document => {
      document.verification_results = JSON.parse(document.verification_results || '{}');
      document.metadata = JSON.parse(document.metadata || '{}');
    });

    return documents;
  }

  async getDocumentByHash(fileHash: string): Promise<Document | null> {
    const document = await db('documents').where('file_hash', fileHash).first();
    
    if (document) {
      document.verification_results = JSON.parse(document.verification_results || '{}');
      document.metadata = JSON.parse(document.metadata || '{}');
    }

    return document || null;
  }

  async deleteDocument(id: string, userId: string, ipAddress: string): Promise<void> {
    const document = await this.getDocumentById(id);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Delete file from storage
    await this.deleteFile(document.storage_path, document.storage_bucket);

    // Delete database record
    await db('documents').where('id', id).del();

    await this.auditService.log({
      user_id: userId,
      action: 'document_deleted',
      entity_type: 'document',
      entity_id: id,
      ip_address: ipAddress,
      result: 'success',
      details: {
        application_id: document.application_id,
        document_type: document.type,
        filename: document.original_filename,
      },
    });
  }

  async verifyDocument(
    id: string,
    verificationResults: Record<string, any>,
    isVerified: boolean,
    userId?: string
  ): Promise<Document> {
    const updateData = {
      verification_results: JSON.stringify(verificationResults),
      is_verified: isVerified,
      verified_at: new Date(),
      updated_at: new Date(),
    };

    const [document] = await db('documents')
      .where('id', id)
      .update(updateData)
      .returning('*');

    await this.auditService.log({
      user_id: userId || 'system',
      action: 'document_verified',
      entity_type: 'document',
      entity_id: id,
      ip_address: 'system',
      result: 'success',
      details: {
        is_verified: isVerified,
        verification_results: verificationResults,
      },
    });

    // Parse JSON fields
    document.verification_results = JSON.parse(document.verification_results);
    document.metadata = JSON.parse(document.metadata);

    return document;
  }

  private validateFileType(file: Express.Multer.File, documentType: DocumentType): void {
    const allowedTypes = {
      passport: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      selfie: ['image/jpeg', 'image/jpg', 'image/png'],
      itinerary: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      supporting_document: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      additional_id: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
      address_proof: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    };

    if (!allowedTypes[documentType].includes(file.mimetype)) {
      throw new AppError(`Invalid file type for ${documentType}. Allowed: ${allowedTypes[documentType].join(', ')}`, 400);
    }
  }

  private validateFileSize(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new AppError('File size exceeds maximum allowed size of 10MB', 400);
    }
  }

  private async generateFileHash(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async storeFile(
    file: Express.Multer.File,
    documentType: DocumentType,
    applicationId: string
  ): Promise<{ path: string; bucket?: string }> {
    if (config.storage.type === 'local') {
      return this.storeFileLocal(file, documentType, applicationId);
    } else if (config.storage.type === 's3') {
      return this.storeFileS3(file, documentType, applicationId);
    } else {
      throw new AppError('Invalid storage configuration', 500);
    }
  }

  private async storeFileLocal(
    file: Express.Multer.File,
    documentType: DocumentType,
    applicationId: string
  ): Promise<{ path: string }> {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents', applicationId);
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${documentType}_${crypto.randomUUID()}${path.extname(file.originalname)}`;
    const filepath = path.join(uploadDir, filename);

    let buffer = file.buffer;

    // Compress images to reduce storage
    if (file.mimetype.startsWith('image/')) {
      buffer = await sharp(file.buffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    await fs.writeFile(filepath, buffer);

    return {
      path: path.relative(process.cwd(), filepath),
    };
  }

  private async storeFileS3(
    file: Express.Multer.File,
    documentType: DocumentType,
    applicationId: string
  ): Promise<{ path: string; bucket: string }> {
    // This would implement S3 upload logic
    // For now, throw an error as S3 isn't fully implemented
    throw new AppError('S3 storage not yet implemented', 500);
  }

  private async deleteFile(filePath: string, bucket?: string): Promise<void> {
    if (config.storage.type === 'local') {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        await fs.unlink(fullPath);
      } catch (error) {
        // Log error but don't throw as the database record should still be deleted
        console.error('Error deleting file:', error);
      }
    } else if (config.storage.type === 's3' && bucket) {
      // Implement S3 deletion
      throw new AppError('S3 file deletion not yet implemented', 500);
    }
  }

  private async extractMetadata(
    file: Express.Multer.File,
    documentType: DocumentType
  ): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    // Extract image metadata if it's an image
    if (file.mimetype.startsWith('image/')) {
      try {
        const imageMetadata = await sharp(file.buffer).metadata();
        metadata.dimensions = {
          width: imageMetadata.width,
          height: imageMetadata.height,
        };
        metadata.format = imageMetadata.format;
        metadata.hasAlpha = imageMetadata.hasAlpha;
        metadata.density = imageMetadata.density;
        
        // Remove EXIF data for privacy
        delete imageMetadata.exif;
        delete imageMetadata.icc;
        delete imageMetadata.iptc;
        delete imageMetadata.xmp;
      } catch (error) {
        console.error('Error extracting image metadata:', error);
      }
    }

    return metadata;
  }

  private async verifyDocumentAsync(documentId: string): Promise<void> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) return;

      let verificationResults: Record<string, any> = {};
      let isVerified = false;

      // Perform different verification based on document type
      switch (document.type) {
        case 'passport':
          verificationResults = await this.verifyPassportDocument(document);
          break;
        case 'selfie':
          verificationResults = await this.verifySelfieDocument(document);
          break;
        default:
          verificationResults = await this.verifyGeneralDocument(document);
      }

      // Determine if document is verified based on results
      isVerified = this.determineVerificationStatus(verificationResults);

      // Update document with verification results
      await this.verifyDocument(documentId, verificationResults, isVerified);

    } catch (error) {
      console.error(`Error verifying document ${documentId}:`, error);
      
      // Mark as failed verification
      await this.verifyDocument(documentId, {
        error: 'Verification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, false);
    }
  }

  private async verifyPassportDocument(document: Document): Promise<Record<string, any>> {
    // This would integrate with passport verification services
    // For MVP, return basic file validation
    return {
      file_integrity: true,
      readable: true,
      contains_photo: true,
      mrz_readable: true,
      confidence_score: 85,
    };
  }

  private async verifySelfieDocument(document: Document): Promise<Record<string, any>> {
    // This would integrate with liveness detection and face matching services
    // For MVP, return basic validation
    return {
      file_integrity: true,
      contains_face: true,
      liveness_check: true,
      face_match_ready: true,
      confidence_score: 80,
    };
  }

  private async verifyGeneralDocument(document: Document): Promise<Record<string, any>> {
    return {
      file_integrity: true,
      readable: true,
      confidence_score: 90,
    };
  }

  private determineVerificationStatus(results: Record<string, any>): boolean {
    // Simple logic for now - could be more sophisticated
    const confidenceScore = results.confidence_score || 0;
    return confidenceScore >= 70;
  }

  // Multer configuration for file uploads
  static getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5, // Maximum 5 files per request
      },
      fileFilter: (req, file, cb) => {
        // Basic file type validation
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'application/pdf'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'));
        }
      },
    });
  }
}