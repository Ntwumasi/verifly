import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'verifly_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  email: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@verifly.com',
    fromName: process.env.FROM_NAME || 'Verifly',
  },

  sms: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  apis: {
    sanctionsApiKey: process.env.SANCTIONS_API_KEY,
    pepApiKey: process.env.PEP_API_KEY,
    documentVerificationApiKey: process.env.DOCUMENT_VERIFICATION_API_KEY,
  },

  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  application: {
    defaultFee: parseFloat(process.env.DEFAULT_APPLICATION_FEE || '15.00'),
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    defaultRetentionDays: parseInt(process.env.DEFAULT_RETENTION_DAYS || '180'),
    supportedCountries: process.env.SUPPORTED_COUNTRIES?.split(',') || ['GH', 'NG', 'SN', 'CI'],
  },
};