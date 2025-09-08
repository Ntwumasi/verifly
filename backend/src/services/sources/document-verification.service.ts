import axios from 'axios';
import { db } from '../../config/database';
import { config } from '../../config';

export class DocumentVerificationService {
  private readonly baseURL = 'https://api.document-verify.com/v1'; // Example API

  async verifyApplicationDocuments(applicationId: string): Promise<any> {
    try {
      // Get all documents for the application
      const documents = await db('documents')
        .where('application_id', applicationId)
        .where('is_verified', true); // Only check already uploaded and basic-verified documents

      const results = {
        verified: true,
        confidence_score: 100,
        checked_at: new Date(),
        document_results: {} as any,
        overall_status: 'verified',
      };

      // Verify each document type
      for (const document of documents) {
        const docResult = await this.verifyDocument(document);
        results.document_results[document.type] = docResult;
        
        // Update overall verification status
        if (!docResult.verified) {
          results.verified = false;
          results.overall_status = 'failed';
        }
        
        // Update overall confidence score (take the minimum)
        if (docResult.confidence_score < results.confidence_score) {
          results.confidence_score = docResult.confidence_score;
        }
      }

      // Special handling for passport + selfie face matching
      if (results.document_results.passport && results.document_results.selfie) {
        const faceMatchResult = await this.performFaceMatch(
          results.document_results.passport,
          results.document_results.selfie
        );
        
        results.document_results.face_match = faceMatchResult;
        
        if (!faceMatchResult.verified) {
          results.verified = false;
          results.overall_status = 'face_match_failed';
        }
      }

      return results;

    } catch (error) {
      console.error('Document verification failed:', error);
      throw error;
    }
  }

  private async verifyDocument(document: any): Promise<any> {
    switch (document.type) {
      case 'passport':
        return await this.verifyPassport(document);
      case 'selfie':
        return await this.verifySelfie(document);
      case 'itinerary':
        return await this.verifyItinerary(document);
      default:
        return await this.verifyGenericDocument(document);
    }
  }

  private async verifyPassport(document: any): Promise<any> {
    // For MVP, simulate passport verification
    // In production, this would use OCR and passport validation services
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock verification results
    const mockResult = {
      verified: true,
      confidence_score: 92,
      document_type: 'passport',
      extracted_data: {
        document_number: 'A12345678',
        given_names: 'JOHN MICHAEL',
        surname: 'SMITH',
        date_of_birth: '1990-01-15',
        nationality: 'USA',
        issuing_country: 'USA',
        expiry_date: '2030-01-15',
        machine_readable_zone: true,
        photo_present: true,
      },
      security_features: {
        hologram_present: true,
        rfid_chip_present: true,
        biodata_page_genuine: true,
        tamper_evident: false,
      },
      validation_checks: {
        format_valid: true,
        checksum_valid: true,
        expiry_valid: true,
        blacklist_checked: true,
        blacklisted: false,
      },
      metadata: {
        processing_time_ms: 2000,
        api_version: '1.0.0',
        processed_at: new Date(),
      },
    };

    // Introduce some randomness for demo purposes
    if (Math.random() < 0.1) { // 10% chance of issues
      mockResult.verified = false;
      mockResult.confidence_score = 45;
      mockResult.validation_checks.format_valid = false;
    }

    return mockResult;
  }

  private async verifySelfie(document: any): Promise<any> {
    // Simulate selfie verification (liveness detection)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockResult = {
      verified: true,
      confidence_score: 88,
      document_type: 'selfie',
      liveness_checks: {
        real_person: true,
        not_screenshot: true,
        not_video_replay: true,
        face_detected: true,
        eyes_open: true,
        face_orientation_good: true,
      },
      quality_checks: {
        brightness_good: true,
        contrast_good: true,
        focus_sharp: true,
        face_size_adequate: true,
        no_sunglasses: true,
        no_hat: true,
      },
      biometric_data: {
        face_landmarks_extracted: true,
        face_encoding_generated: true,
        ready_for_matching: true,
      },
      metadata: {
        processing_time_ms: 1500,
        processed_at: new Date(),
      },
    };

    // Random chance of liveness failure
    if (Math.random() < 0.05) { // 5% chance
      mockResult.verified = false;
      mockResult.confidence_score = 35;
      mockResult.liveness_checks.real_person = false;
    }

    return mockResult;
  }

  private async verifyItinerary(document: any): Promise<any> {
    // Basic document verification
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      verified: true,
      confidence_score: 85,
      document_type: 'itinerary',
      extracted_data: {
        readable: true,
        contains_dates: true,
        contains_destinations: true,
        airline_identifiable: true,
      },
      metadata: {
        processing_time_ms: 1000,
        processed_at: new Date(),
      },
    };
  }

  private async verifyGenericDocument(document: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      verified: true,
      confidence_score: 80,
      document_type: document.type,
      basic_checks: {
        readable: true,
        not_corrupted: true,
        appropriate_size: true,
      },
      metadata: {
        processing_time_ms: 800,
        processed_at: new Date(),
      },
    };
  }

  private async performFaceMatch(passportResult: any, selfieResult: any): Promise<any> {
    // Simulate face matching between passport photo and selfie
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockResult = {
      verified: true,
      confidence_score: 91,
      match_score: 0.91,
      threshold: 0.7,
      decision: 'match',
      processing_details: {
        passport_face_extracted: passportResult.extracted_data?.photo_present || false,
        selfie_face_extracted: selfieResult.biometric_data?.face_encoding_generated || false,
        faces_aligned: true,
        similarity_computed: true,
      },
      metadata: {
        algorithm_version: '2.1.0',
        processing_time_ms: 3000,
        processed_at: new Date(),
      },
    };

    // Random chance of face match failure
    if (Math.random() < 0.08) { // 8% chance
      mockResult.verified = false;
      mockResult.match_score = 0.45;
      mockResult.confidence_score = 45;
      mockResult.decision = 'no_match';
    }

    return mockResult;
  }

  // Real API implementation template
  private async realDocumentAPI(document: any): Promise<any> {
    if (!config.apis.documentVerificationApiKey) {
      throw new Error('Document verification API key not configured');
    }

    const formData = new FormData();
    
    // This would read the actual file from storage
    // formData.append('document', fs.createReadStream(document.storage_path));
    formData.append('document_type', document.type);
    formData.append('perform_ocr', 'true');
    formData.append('verify_security_features', 'true');

    const response = await axios.post(`${this.baseURL}/verify`, formData, {
      headers: {
        'Authorization': `Bearer ${config.apis.documentVerificationApiKey}`,
        'Content-Type': 'multipart/form-data',
        ...formData.getHeaders?.(),
      },
      timeout: 60000, // Document processing can take longer
    });

    return response.data;
  }
}