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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet()); 
app.use(cors({
  origin: [
    'http://localhost:3001', // Local Web
    'http://localhost:8081', // Local Mobile
    'https://quicksave-red.vercel.app', // 👉 NEW: Production Web Dashboard!
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

// 👉 Mount the routers here!
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes)


// Global Error Handler MUST be last
app.use(errorHandler);


// Explicitly bind to '0.0.0.0' to allow external network access
// app.listen(Number(PORT), '0.0.0.0', () => {
//   console.log(`🚀 Server ready at http://192.168.1.172:${PORT}`);
//   console.log(`Local access: http://localhost:${PORT}`);
// });

export default app;