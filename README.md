# Verifly - Travel Verification System

Verifly is a comprehensive pre-arrival background verification system for travelers entering West African countries. The system provides standardized pre-screening before arrival while reducing manual workload for border officials.

## Features

- **Traveler Application Portal**: Easy-to-use interface for submitting verification applications
- **Document Verification**: Automated passport and document validation
- **Background Checks**: Integration with public databases and watchlists
- **Payment Processing**: Secure payment handling with multiple payment methods
- **Admin Console**: Comprehensive case management and decision-making tools
- **Notifications**: Multi-channel notifications (email, SMS) for status updates
- **Compliance**: GDPR/privacy-compliant with audit trails and data retention policies

## Architecture

### Frontend (Next.js)
- Traveler application portal
- Admin dashboard
- Multi-language support (EN, FR)
- Responsive design with accessibility features

### Backend (Node.js/Express)
- RESTful API with authentication
- Background verification pipeline
- Payment processing integration
- Admin case management
- Audit logging and compliance

### Database (PostgreSQL)
- Applicant and application data
- Document storage references
- Audit trails
- Policy configuration

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (for job queues)

### Installation

1. Clone the repository and install dependencies:
```bash
npm run setup
```

2. Set up environment variables:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. Set up the database:
```bash
npm run db:migrate
npm run db:seed
```

4. Start the development servers:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:5000`.

## Environment Configuration

### Backend Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/verifly
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
EMAIL_SERVICE_API_KEY=your-email-key
SMS_SERVICE_API_KEY=your-sms-key
STORAGE_BUCKET=your-s3-bucket
```

## API Documentation

The API follows REST conventions with the following main endpoints:

- `POST /v1/applicants` - Create applicant
- `POST /v1/applications` - Start application
- `POST /v1/applications/:id/documents` - Upload documents
- `POST /v1/applications/:id/verify` - Start verification
- `GET /v1/applications/:id/status` - Check status

Admin endpoints require authentication and appropriate permissions.

## Development

### Project Structure
```
verifly/
├── frontend/          # Next.js application
├── backend/           # Express.js API
├── database/          # Database migrations and seeds
└── docs/             # Documentation
```

### Testing
```bash
npm test                # Run all tests
npm run test:frontend   # Frontend tests only
npm run test:backend    # Backend tests only
```

### Database Operations
```bash
npm run db:migrate      # Run migrations
npm run db:rollback     # Rollback last migration
npm run db:seed         # Seed database
npm run db:reset        # Reset and reseed database
```

## Deployment

The application is containerized and can be deployed to any cloud provider. See the deployment documentation in `/docs/deployment.md` for specific instructions.

## Security

- All communications use TLS 1.2+
- PII is encrypted at rest
- Admin access requires MFA
- Rate limiting and DDoS protection
- Regular security audits and penetration testing

## Compliance

- GDPR/UK GDPR compliant
- Data retention policies
- Audit trails for all actions
- Right to access/delete personal data
- Consent management

## Support

For technical support or questions, please refer to the documentation or contact the development team.

## License

This project is proprietary and confidential.