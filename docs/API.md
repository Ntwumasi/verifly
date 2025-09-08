# Verifly API Documentation

This document provides comprehensive API documentation for the Verifly backend service.

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://api.verifly.com/api` (example)

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "data": { ... },
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

## Authentication Endpoints

### Register User

```http
POST /v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "applicant"
    },
    "token": "jwt_token"
  }
}
```

### Login User

```http
POST /v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Get Profile

```http
GET /v1/auth/profile
```

**Headers:** `Authorization: Bearer <token>`

### Get Consent Template

```http
GET /v1/auth/consent/template
```

### Record Consent

```http
POST /v1/auth/consent
```

**Request Body:**
```json
{
  "version": "1.0.0",
  "purposes": ["background_verification", "document_verification"],
  "data_categories": ["Personal identifiers", "Biometric data"],
  "retention_period": 180,
  "accepted": true
}
```

## Applicant Endpoints

### Create Applicant Profile

```http
POST /v1/applicants
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "Michael",
  "date_of_birth": "1990-01-15",
  "nationality": "US",
  "passport_number": "A12345678",
  "passport_country": "US",
  "passport_expiry": "2030-01-15",
  "current_address": "123 Main St",
  "current_city": "New York",
  "current_country": "US",
  "current_postal_code": "10001",
  "address_history": [
    {
      "address": "456 Previous St",
      "city": "Boston",
      "country": "US",
      "from_date": "2018-01-01",
      "to_date": "2023-01-01"
    }
  ],
  "consent": {
    "version": "1.0.0",
    "purposes": ["background_verification"],
    "data_categories": ["Personal identifiers"],
    "retention_period": 180,
    "accepted": true
  }
}
```

### Get Applicant Profile

```http
GET /v1/applicants
```

**Headers:** `Authorization: Bearer <token>`

## Application Endpoints

### Create Application

```http
POST /v1/applications
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "destination_country": "GH",
  "intended_arrival_date": "2024-06-01",
  "intended_departure_date": "2024-06-15",
  "intended_address": "Hotel Address, Accra",
  "intended_city": "Accra",
  "purpose_of_visit": "Business meetings and conferences"
}
```

### Get Applications

```http
GET /v1/applications?limit=10&offset=0
```

### Get Application

```http
GET /v1/applications/{id}
```

### Update Application

```http
PUT /v1/applications/{id}
```

### Submit Application

```http
POST /v1/applications/{id}/submit
```

### Upload Document

```http
POST /v1/applications/{id}/documents
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `document`: File (required)
- `document_type`: String (passport|selfie|itinerary|supporting_document)

### Get Application Status

```http
GET /v1/applications/{id}/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "uuid",
      "status": "clear|review|not_clear|in_progress",
      "submitted_at": "2024-01-01T00:00:00Z",
      "completed_at": "2024-01-01T12:00:00Z"
    }
  }
}
```

## Payment Endpoints

### Create Payment Intent

```http
POST /v1/payments/intent
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "application_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "uuid",
      "amount": 15.00,
      "currency": "USD",
      "status": "pending"
    },
    "client_secret": "stripe_client_secret"
  }
}
```

### Get Payment

```http
GET /v1/payments/{id}
```

### Webhook (Stripe)

```http
POST /v1/payments/webhook
```

**Headers:** 
- `stripe-signature: <signature>`
- `Content-Type: application/json`

## Verification Endpoints

### Start Verification

```http
POST /v1/verification/start
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "application_id": "uuid"
}
```

### Get Verification Run

```http
GET /v1/verification/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verification_run": {
      "id": "uuid",
      "application_id": "uuid",
      "status": "completed",
      "decision": "clear",
      "risk_score": 15,
      "reason_codes": [],
      "source_results": {
        "sanctions": {...},
        "pep": {...},
        "documents": {...}
      }
    },
    "source_hits": []
  }
}
```

## Admin Endpoints

**Note:** All admin endpoints require authentication with admin role.

### Dashboard

```http
GET /v1/admin/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "application_stats": {
        "total": 1000,
        "this_month": 50,
        "by_status": {
          "clear": 800,
          "review": 150,
          "not_clear": 50
        }
      },
      "payment_stats": {
        "total_revenue": 15000.00,
        "monthly_revenue": 750.00,
        "completed_payments": 1000
      },
      "recent_applications": [...],
      "pending_reviews": [...],
      "system_health": {...}
    }
  }
}
```

### Get Case Details

```http
GET /v1/admin/cases/{id}
```

### Make Decision

```http
POST /v1/admin/cases/{id}/decision
```

**Request Body:**
```json
{
  "decision": "approve|deny|request_more_info",
  "notes": "Detailed explanation of the decision",
  "reason_codes": ["DOCUMENT_ISSUES", "ADDITIONAL_VERIFICATION_NEEDED"],
  "additional_requirements": ["Updated passport copy", "Proof of address"]
}
```

### Analytics

```http
GET /v1/admin/analytics?start_date=2024-01-01&end_date=2024-01-31&destination_country=GH
```

### Export Cases

```http
GET /v1/admin/export/cases?format=csv&start_date=2024-01-01&status=clear
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Application Statuses

- `draft` - Application created but not submitted
- `submitted` - Application submitted, awaiting payment
- `payment_pending` - Payment initiated but not completed
- `payment_completed` - Payment successful, verification queued
- `in_progress` - Background verification in progress
- `under_review` - Manual review required
- `additional_info_required` - More information needed from applicant
- `clear` - Application approved
- `not_clear` - Application denied
- `cancelled` - Application cancelled

## Verification Decisions

- `clear` - No issues found, approved for travel
- `review` - Manual review required
- `not_clear` - Issues found, not approved

## Error Codes

### Authentication
- `AUTHENTICATION_FAILED` - Invalid credentials
- `AUTHENTICATION_REQUIRED` - Token missing
- `TOKEN_EXPIRED` - JWT token expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

### Validation
- `VALIDATION_FAILED` - Request validation failed
- `INVALID_EMAIL` - Email format invalid
- `INVALID_PASSWORD` - Password doesn't meet requirements
- `DUPLICATE_EMAIL` - Email already registered

### Application
- `APPLICATION_NOT_FOUND` - Application doesn't exist
- `APPLICATION_ALREADY_SUBMITTED` - Cannot modify submitted application
- `DOCUMENTS_MISSING` - Required documents not uploaded
- `PAYMENT_REQUIRED` - Payment must be completed first

### Payment
- `PAYMENT_FAILED` - Payment processing failed
- `PAYMENT_NOT_FOUND` - Payment record not found
- `INVALID_PAYMENT_METHOD` - Payment method not supported

## Rate Limits

- General endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per 15 minutes per IP
- Payment endpoints: 5 requests per hour per user

## Webhook Security

Stripe webhooks are secured using webhook signatures. Verify the signature using your webhook secret:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const event = stripe.webhooks.constructEvent(
  request.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

## Testing

### Test Users

The development environment includes test users:

- Admin: `admin@verifly.com` / `admin123!`
- Reviewer: `reviewer@verifly.com` / `admin123!`
- Applicant: `test@example.com` / `admin123!`

### Test Stripe Cards

For testing payments, use Stripe's test card numbers:

- Success: `4242424242424242`
- Declined: `4000000000000002`
- 3D Secure: `4000002500003155`

### Mock Verification Results

The verification service returns mock results in development:

- Names containing "putin" will trigger sanctions hits
- Names containing "smith" will trigger PEP matches
- All documents are verified with 80-95% confidence