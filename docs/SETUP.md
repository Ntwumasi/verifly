# Verifly Development Setup Guide

This guide will help you set up the Verifly application for development.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis
- Docker and Docker Compose (recommended)

## Option 1: Docker Development Setup (Recommended)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd verifly
```

### 2. Environment Configuration

Copy the example environment files:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```bash
# Basic settings for Docker development
NODE_ENV=development
PORT=5000

# Database (Docker setup)
DATABASE_URL=postgresql://postgres:password@postgres:5432/verifly_dev

# Redis (Docker setup)  
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# File Storage
STORAGE_TYPE=local

# Payment Processing (for testing)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret

# Email Service (using MailHog for development)
EMAIL_SERVICE=smtp
SMTP_HOST=mailhog
SMTP_PORT=1025

# SMS Service (optional for testing)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Start Services

```bash
# Install dependencies
npm run setup

# Start all services with Docker Compose
docker-compose up -d

# Watch logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec backend npm run db:migrate

# Seed initial data
docker-compose exec backend npm run db:seed
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health
- MailHog UI: http://localhost:8025
- Redis: localhost:6379
- PostgreSQL: localhost:5432

## Option 2: Local Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies  
cd frontend && npm install && cd ..
```

### 2. Setup Local Services

**PostgreSQL:**
```bash
# Create database
createdb verifly_dev
createdb verifly_test
```

**Redis:**
```bash
# Start Redis (macOS with Homebrew)
brew services start redis

# Or start manually
redis-server
```

### 3. Environment Configuration

Copy and configure the backend environment:

```bash
cp backend/.env.example backend/.env
```

Update the database and Redis URLs for local development:

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/verifly_dev
REDIS_URL=redis://localhost:6379
```

### 4. Initialize Database

```bash
cd backend
npm run db:migrate
npm run db:seed
cd ..
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend  # Starts on port 5000
npm run dev:frontend # Starts on port 3000
```

## Testing the Setup

### 1. Test API Health

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Test Database Connection

```bash
# Check if migrations ran successfully
docker-compose exec backend npm run db:migrate
```

### 3. Test Frontend

Visit http://localhost:3000 - you should see the Verifly landing page.

### 4. Test Admin Login

You can log in with the seeded admin account:
- Email: admin@verifly.com
- Password: admin123!

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# All tests
npm test
```

### Database Operations

```bash
# Create new migration
cd backend
npx knex migrate:make migration_name

# Run migrations
npm run db:migrate

# Rollback migration
npm run db:rollback

# Reset database (rollback all + migrate + seed)
npm run db:reset
```

### API Testing

You can test the API using curl, Postman, or any HTTP client:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :5000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**Database connection issues:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres
```

**Redis connection issues:**
```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
redis-cli ping
```

**File upload issues:**
```bash
# Check uploads directory exists
ls backend/uploads

# Create if missing
mkdir -p backend/uploads
```

### Reset Everything

```bash
# Stop all services
docker-compose down

# Remove volumes (this will delete database data)
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

## Next Steps

1. **Configure Payment Processing**: Set up your Stripe account and add the API keys
2. **Configure Email service**: Set up SendGrid or your preferred email provider
3. **Configure SMS service**: Set up Twilio for SMS notifications
4. **Set up external API keys**: Add keys for sanctions/PEP checking services
5. **Customize the frontend**: Update branding, colors, and content
6. **Configure deployment**: Set up CI/CD and production environment

## API Documentation

The API endpoints are documented in the code. Key endpoints:

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get user profile

### Applications
- `POST /api/v1/applications` - Create application
- `GET /api/v1/applications` - Get user applications
- `POST /api/v1/applications/:id/documents` - Upload documents
- `POST /api/v1/applications/:id/submit` - Submit application

### Payments
- `POST /api/v1/payments/intent` - Create payment intent
- `POST /api/v1/payments/webhook` - Stripe webhook

### Admin
- `GET /api/v1/admin/dashboard` - Admin dashboard
- `GET /api/v1/admin/cases/:id` - Get case details
- `POST /api/v1/admin/cases/:id/decision` - Make admin decision

## Support

For development support, check:
1. Application logs: `docker-compose logs`
2. Database logs: `docker-compose logs postgres`
3. API health endpoint: http://localhost:5000/api/health
4. MailHog interface: http://localhost:8025