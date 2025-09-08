export interface User {
  id: string;
  email: string;
  phone?: string;
  password_hash?: string;
  role: 'applicant' | 'admin' | 'reviewer' | 'finance' | 'support' | 'auditor';
  email_verified: boolean;
  phone_verified: boolean;
  email_verified_at?: Date;
  phone_verified_at?: Date;
  is_active: boolean;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Applicant {
  id: string;
  user_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: Date;
  nationality: string;
  passport_number: string;
  passport_country: string;
  passport_expiry?: Date;
  address_history: AddressHistory[];
  current_address: string;
  current_city: string;
  current_country: string;
  current_postal_code?: string;
  consent_records: ConsentRecord[];
  created_at: Date;
  updated_at: Date;
}

export interface AddressHistory {
  address: string;
  city: string;
  country: string;
  postal_code?: string;
  from_date: string;
  to_date?: string;
}

export interface ConsentRecord {
  version: string;
  consented_at: Date;
  ip_address: string;
  user_agent: string;
  purposes: string[];
  data_categories: string[];
  retention_period: number;
  can_withdraw: boolean;
}

export interface Application {
  id: string;
  applicant_id: string;
  destination_country: string;
  intended_arrival_date: Date;
  intended_departure_date?: Date;
  intended_address: string;
  intended_city: string;
  purpose_of_visit: string;
  travel_itinerary?: any;
  status: ApplicationStatus;
  fee_amount?: number;
  currency: string;
  metadata: Record<string, any>;
  submitted_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'payment_pending'
  | 'payment_completed'
  | 'in_progress'
  | 'under_review'
  | 'additional_info_required'
  | 'clear'
  | 'not_clear'
  | 'cancelled';

export interface Document {
  id: string;
  application_id: string;
  type: DocumentType;
  original_filename: string;
  storage_path: string;
  storage_bucket?: string;
  mime_type: string;
  file_size: number;
  file_hash: string;
  verification_results: Record<string, any>;
  is_verified: boolean;
  metadata: Record<string, any>;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type DocumentType = 
  | 'passport'
  | 'selfie'
  | 'itinerary'
  | 'supporting_document'
  | 'additional_id'
  | 'address_proof';

export interface Payment {
  id: string;
  application_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  processor: string;
  processor_payment_id?: string;
  processor_customer_id?: string;
  processor_metadata: Record<string, any>;
  refunded_amount: number;
  failure_reason?: string;
  receipt_url?: string;
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export interface VerificationRun {
  id: string;
  application_id: string;
  status: VerificationStatus;
  decision?: VerificationDecision;
  risk_score?: number;
  reason_codes: string[];
  policy_version: string;
  source_results: Record<string, any>;
  scoring_breakdown: Record<string, any>;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type VerificationStatus = 
  | 'queued'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type VerificationDecision = 
  | 'clear'
  | 'review'
  | 'not_clear';

export interface SourceHit {
  id: string;
  verification_run_id: string;
  source_name: string;
  source_type: string;
  query_terms: Record<string, any>;
  match_confidence: number;
  match_type: string;
  record_data: Record<string, any>;
  record_url?: string;
  jurisdiction?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  record_date?: Date;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AdminDecision {
  id: string;
  application_id: string;
  admin_user_id: string;
  decision: 'approve' | 'deny' | 'request_more_info';
  notes: string;
  reason_codes: string[];
  override_type?: 'manual_review' | 'policy_override' | 'appeal_decision';
  additional_requirements: string[];
  decision_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address: string;
  user_agent?: string;
  details: Record<string, any>;
  previous_values: Record<string, any>;
  new_values: Record<string, any>;
  result: 'success' | 'failure' | 'error';
  error_message?: string;
  timestamp: Date;
}

export interface Policy {
  id: string;
  name: string;
  version: string;
  description?: string;
  rules: Record<string, any>;
  thresholds: Record<string, any>;
  source_weights: Record<string, any>;
  is_active: boolean;
  destination_country?: string;
  effective_from: Date;
  effective_until?: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  application_id: string;
  type: NotificationType;
  channel: 'email' | 'sms' | 'in_app';
  subject?: string;
  message: string;
  template_data: Record<string, any>;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: Date;
  delivered_at?: Date;
  external_id?: string;
  failure_reason?: string;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export type NotificationType = 
  | 'application_submitted'
  | 'payment_received'
  | 'verification_started'
  | 'verification_completed'
  | 'additional_info_required'
  | 'decision_made'
  | 'admin_note_added';

export interface VerificationToken {
  id: string;
  application_id: string;
  token_hash: string;
  qr_code_url?: string;
  validation_data: Record<string, any>;
  is_active: boolean;
  expires_at: Date;
  validation_count: number;
  last_validated_at?: Date;
  last_validated_by?: string;
  created_at: Date;
  updated_at: Date;
}

// API Request/Response types
export interface CreateApplicationRequest {
  destination_country: string;
  intended_arrival_date: string;
  intended_departure_date?: string;
  intended_address: string;
  intended_city: string;
  purpose_of_visit: string;
  travel_itinerary?: any;
}

export interface CreateApplicantRequest {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  passport_number: string;
  passport_country: string;
  passport_expiry?: string;
  address_history: AddressHistory[];
  current_address: string;
  current_city: string;
  current_country: string;
  current_postal_code?: string;
  consent: ConsentData;
}

export interface ConsentData {
  version: string;
  purposes: string[];
  data_categories: string[];
  retention_period: number;
  accepted: boolean;
}

export interface ApplicationStatusResponse {
  application: {
    id: string;
    status: ApplicationStatus;
    submitted_at?: Date;
    completed_at?: Date;
  };
  verification?: {
    decision?: VerificationDecision;
    risk_score?: number;
    completed_at?: Date;
  };
  token?: {
    token: string;
    qr_code_url?: string;
    expires_at: Date;
  };
}

export interface AdminCaseResponse {
  application: Application & {
    applicant: Applicant;
    user: Pick<User, 'email' | 'phone'>;
  };
  documents: Document[];
  payments: Payment[];
  verification_runs: (VerificationRun & {
    source_hits: SourceHit[];
  })[];
  admin_decisions: (AdminDecision & {
    admin_user: Pick<User, 'email' | 'role'>;
  })[];
  audit_trail: AuditLog[];
}

// Database connection and query types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: ValidationError[];
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    filters?: Record<string, any>;
  };
}