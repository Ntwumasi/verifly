import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { testConnection } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { 
  generalRateLimit, 
  speedLimiter, 
  sanitizeInput, 
  securityHeaders, 
  corsOptions, 
  requestLogger 
} from './middleware/security.middleware';

const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Basic security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We set this manually in securityHeaders
  crossOriginEmbedderPolicy: false, // Allow file uploads
}));

app.use(securityHeaders);

// CORS
app.use(cors(corsOptions));

// Request logging
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting and speed limiting
app.use(generalRateLimit);
app.use(speedLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Raw body for webhooks (before other body parsers)
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

// Input sanitization
app.use(sanitizeInput);

// Routes
app.use('/api', routes);

// Serve uploaded files in development
if (config.server.nodeEnv === 'development') {
  app.use('/uploads', express.static('uploads'));
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    const port = config.server.port;
    app.listen(port, () => {
      console.log(`🚀 Verifly API server running on port ${port}`);
      console.log(`📚 Environment: ${config.server.nodeEnv}`);
      console.log(`🏥 Health check: http://localhost:${port}/api/health`);
      
      if (config.server.nodeEnv === 'development') {
        console.log(`📁 Uploads: http://localhost:${port}/uploads`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();