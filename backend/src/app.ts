// src/app.ts

import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import pool from './utils/db';
import { loggingMiddleware } from './middleware/logging.middleware';
import authRoutes from './routes/auth.routes';
import surveyRoutes from './routes/survey.routes';
import adminRoutes from './routes/admin.routes';
import { initializeSuperAdmin } from './initializeSuperAdmin';
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(loggingMiddleware);
app.use(cors({
  origin: 'http://localhost:4200', // или true для разработки
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use((req, res, next) => {
  // Разрешаем только наш фронтенд
  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:4200',  // Angular dev server
    'http://localhost:4200',  // Angular dev server (duplicate to be sure)
    'http://127.0.0.1:4200',  // Angular dev server on 127.0.0.1
    'http://localhost:3000'   // для локального тестирования
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    // If origin is not in the allowed list, still allow localhost:4200 by default for development
    if (origin && (origin.includes('localhost:4200') || origin.includes('127.0.0.1:4200'))) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Обрабатываем preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/surveys', surveyRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check (для readiness/liveness probe)
app.get('/.well-known/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('❌ Health check failed:', err);
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Initialize superadmin user on startup
const initializeApp = async () => {
  try {
    await initializeSuperAdmin();
    console.log('✅ Application initialization completed');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    process.exit(1);
  }
};

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT} | env: ${process.env.NODE_ENV || 'development'}`);
  await initializeApp();
});