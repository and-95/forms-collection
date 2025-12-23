// src/app.ts

import express, { Request, Response } from 'express';
import pool from './utils/db';

const app = express();

// Middleware
app.use(express.json());

app.use((req, res, next) => {
  // Разрешаем только наш фронтенд
  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Обрабатываем preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // или 204
  }

  next();
});

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

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT} | env: ${process.env.NODE_ENV || 'development'}`);
});

// src/app.ts (дополнение)

import authRoutes from './routes/auth.routes';

// После app.use(express.json())
app.use('/auth', authRoutes);