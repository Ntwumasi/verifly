# Verifly Deployment Guide

This guide covers deploying Verifly to production environments.

## Production Requirements

### Infrastructure
- **Application Server**: Node.js 18+ runtime
- **Database**: PostgreSQL 14+ with connection pooling
- **Cache**: Redis 7+ for sessions and job queues
- **Storage**: AWS S3 or compatible object storage for documents
- **CDN**: CloudFlare or AWS CloudFront for static assets
- **Load Balancer**: Nginx or AWS ALB for SSL termination and load balancing

### Services
- **Email**: SendGrid, AWS SES, or Mailgun
- **SMS**: Twilio or AWS SNS
- **Payment**: Stripe production account
- **Monitoring**: DataDog, New Relic, or AWS CloudWatch
- **Error Tracking**: Sentry or Rollbar

## Environment Setup

### 1. Production Environment Variables

Create production environment files:

**backend/.env.production**
```bash
NODE_ENV=production
PORT=5000

# Database - use connection pooling
DATABASE_URL=postgresql://username:password@db-host:5432/verifly_prod?sslmode=require

# Redis
REDIS_URL=redis://redis-host:6379

# Security
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
BCRYPT_ROUNDS=12

# File Storage - AWS S3
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=verifly-prod-documents

# Stripe Production
STRIPE_SECRET_KEY=sk_live_your-stripe-live-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key
FROM_EMAIL=noreply@verifly.com
FROM_NAME=Verifly

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# External APIs
SANCTIONS_API_KEY=your-production-sanctions-api-key
PEP_API_KEY=your-production-pep-api-key
DOCUMENT_VERIFICATION_API_KEY=your-document-api-key

# Security Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application Settings
DEFAULT_APPLICATION_FEE=15.00
DEFAULT_CURRENCY=USD
DEFAULT_RETENTION_DAYS=180
SUPPORTED_COUNTRIES=GH,NG,SN,CI
```

**frontend/.env.production**
```bash
NEXT_PUBLIC_API_URL=https://api.verifly.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
NEXT_PUBLIC_ENVIRONMENT=production
```

## Docker Production Setup

### 1. Production Dockerfiles

**backend/Dockerfile**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 verifly

# Copy built application
COPY --from=builder --chown=verifly:nodejs /app/dist ./dist
COPY --from=builder --chown=verifly:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=verifly:nodejs /app/package*.json ./
COPY --from=builder --chown=verifly:nodejs /app/knexfile.js ./
COPY --from=builder --chown=verifly:nodejs /app/migrations ./migrations

# Create uploads directory
RUN mkdir uploads && chown verifly:nodejs uploads

USER verifly

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

**frontend/Dockerfile**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
```

### 2. Production Docker Compose

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
    env_file:
      - backend/.env.production
    ports:
      - "5000:5000"
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    networks:
      - verifly-prod

  frontend:
    build:
      context: ./frontend  
      dockerfile: Dockerfile
    env_file:
      - frontend/.env.production
    ports:
      - "3000:3000"
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - verifly-prod

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: verifly_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - verifly-prod

  redis:
    image: redis:7
    restart: unless-stopped
    networks:
      - verifly-prod

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - verifly-prod

volumes:
  postgres_data:

networks:
  verifly-prod:
    driver: bridge
```

## AWS Deployment

### 1. ECS/Fargate Setup

Create ECS task definition:

```json
{
  "family": "verifly-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/veriflyTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-ecr-repo/verifly-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/verifly-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 2. RDS Setup

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier verifly-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.9 \
  --master-username verifly \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 100 \
  --storage-type gp2 \
  --storage-encrypted \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name verifly-subnet-group \
  --backup-retention-period 30 \
  --multi-az
```

### 3. ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id verifly-prod-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-group-name verifly-cache-subnet-group
```

### 4. S3 Bucket

```bash
# Create S3 bucket for documents
aws s3 mb s3://verifly-prod-documents

# Set bucket policy for secure access
aws s3api put-bucket-policy \
  --bucket verifly-prod-documents \
  --policy file://s3-bucket-policy.json
```

**s3-bucket-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::verifly-prod-documents/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

## Database Migration

### 1. Production Migration

```bash
# Backup current database
pg_dump $DATABASE_URL > backup.sql

# Run migrations
NODE_ENV=production npm run db:migrate

# Verify migration
NODE_ENV=production npm run db:migrate -- --dry-run
```

### 2. Zero-Downtime Migration Strategy

```bash
# 1. Deploy new version with backward-compatible schema changes
npm run db:migrate

# 2. Deploy new application version
docker-compose -f docker-compose.prod.yml up -d

# 3. Run cleanup migrations (remove old columns, etc.)
npm run db:migrate:cleanup
```

## SSL/TLS Configuration

### Nginx SSL Configuration

```nginx
server {
    listen 80;
    server_name api.verifly.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.verifly.com;

    ssl_certificate /etc/nginx/ssl/verifly.crt;
    ssl_certificate_key /etc/nginx/ssl/verifly.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name app.verifly.com;

    ssl_certificate /etc/nginx/ssl/verifly.crt;
    ssl_certificate_key /etc/nginx/ssl/verifly.key;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring & Logging

### 1. Application Monitoring

Add monitoring to your application:

```javascript
// backend/src/monitoring.js
const client = require('prom-client');

const register = new client.Registry();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const applicationErrors = new client.Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['error_type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(applicationErrors);

module.exports = { register, httpRequestDuration, applicationErrors };
```

### 2. Health Check Endpoints

```javascript
// Enhanced health check
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      external_apis: await checkExternalAPIs()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json(health);
});
```

### 3. Structured Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

## Security Hardening

### 1. Application Security

```javascript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### 2. Database Security

```sql
-- Create read-only user for reporting
CREATE USER verifly_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE verifly_prod TO verifly_readonly;
GRANT USAGE ON SCHEMA public TO verifly_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO verifly_readonly;

-- Enable row level security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push backend image
        run: |
          docker build -t verifly-backend ./backend
          docker tag verifly-backend:latest $ECR_REPOSITORY/verifly-backend:latest
          docker push $ECR_REPOSITORY/verifly-backend:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster verifly-prod --service verifly-backend --force-new-deployment
```

## Backup and Recovery

### 1. Database Backup

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="verifly_backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://verifly-backups/database/

# Keep only last 30 days of backups
find . -name "verifly_backup_*.sql" -mtime +30 -delete
```

### 2. Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup frequency**: Every 4 hours
4. **Multi-region setup**: Primary (us-east-1), Secondary (us-west-2)

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_applications_status_created ON applications (status, created_at);
CREATE INDEX CONCURRENTLY idx_applicants_passport ON applicants (passport_number, passport_country);
CREATE INDEX CONCURRENTLY idx_source_hits_run_confidence ON source_hits (verification_run_id, match_confidence);

-- Analyze and vacuum regularly
ANALYZE;
VACUUM ANALYZE;
```

### 2. Application Optimization

```javascript
// Connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis caching
const cacheKey = `application:${id}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

const result = await query();
await redis.setex(cacheKey, 300, JSON.stringify(result));
```

## Troubleshooting

### Common Production Issues

1. **High memory usage**: Check for memory leaks, optimize queries
2. **Slow response times**: Add database indexes, implement caching
3. **Failed payments**: Check Stripe webhooks, verify SSL certificates
4. **Document upload failures**: Check S3 permissions, file size limits

### Debugging Tools

```bash
# Check container logs
docker logs verifly-backend

# Database performance
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Redis info
redis-cli info memory

# Application metrics
curl http://localhost:5000/metrics
```

This deployment guide provides a production-ready setup for Verifly with security, monitoring, and scalability considerations.