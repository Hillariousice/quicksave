import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';

// Import your new auth router
import authRoutes from './routes/auth.router'; 
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

// 👉 Mount the Auth router here!
app.use('/api/v1/auth', authRoutes);

// Global Error Handler MUST be last
app.use(errorHandler);

export default app;