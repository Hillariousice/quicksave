import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.router';
import groupRoutes from './routes/group.router';
import walletRoutes from './routes/wallet.router';
import webhookRoutes from './routes/webhook.router';
import { apiLimiter } from './middleware/rateLimiter';

const app = express();

app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 
app.use(morgan('dev')); 

app.use('/api/', apiLimiter); 
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Quicksave API is running smoothly! 🚀' });
});

// 👉 Mount the routers here!
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Global Error Handler MUST be last
app.use(errorHandler);

export default app;