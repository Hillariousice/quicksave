import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.router';
import groupRoutes from './routes/group.router';
import walletRoutes from './routes/wallet.router';
import webhookRoutes from './routes/webhook.router';
import userRoutes from './routes/user.router';
import adminRoutes from './routes/admin.router';
import { apiLimiter } from './middleware/rateLimiter';
import { performanceTracker } from './utils/performance';
import * as Sentry from '@sentry/node';

const app = express();
// Note: PORT logic is usually handled in server.ts, but keeping it here as per your snippet
const PORT = process.env.PORT || 3000;

// 1. Initialize Sentry (Must be first)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

app.use(helmet()); 
app.use(cors({
  origin: [
    'http://localhost:3001', 
    'http://localhost:8081', 
    'https://quicksave-red.vercel.app', 
    '*'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
})); 

app.use(express.json()); 



app.use(morgan('dev')); 
app.use(performanceTracker);

app.use('/api/', apiLimiter); 
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Quicksave API is running smoothly! 🚀' });
});

// 👉 Mount the routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

// 2. 👉 NEW: Sentry Error Handler for version 8
// This must be called AFTER your routes but BEFORE your custom errorHandler
Sentry.setupExpressErrorHandler(app);

// 3. Your custom Global Error Handler (Keep this last)
app.use(errorHandler); 

export default app;