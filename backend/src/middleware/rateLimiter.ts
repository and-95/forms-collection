// src/middleware/rateLimiter.ts

import { Request, Response, NextFunction } from 'express';
import { logUserAction } from '../utils/logger.utils';

// Простая реализация рейт-лимитера
interface ClientRecord {
  count: number;
  resetTime: number;
}

const clientMap = new Map<string, ClientRecord>();

// 10 запросов в минуту на IP
const WINDOW_MS = 60 * 1000; // 1 минута
const MAX_REQUESTS = 10;

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || 'unknown';
  
  const now = Date.now();
  const record = clientMap.get(clientIP) || { count: 0, resetTime: now + WINDOW_MS };
  
  if (now > record.resetTime) {
    // Сброс окна
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
  } else {
    record.count++;
  }
  
  clientMap.set(clientIP, record);
  
  if (record.count > MAX_REQUESTS) {
    logUserAction('RATE_LIMIT_EXCEEDED', req, { 
      ip: clientIP,
      count: record.count,
      windowMs: WINDOW_MS
    });
    
    return res.status(429).json({ 
      error: 'Too many requests', 
      message: `Rate limit exceeded. Maximum ${MAX_REQUESTS} requests per ${WINDOW_MS/1000} seconds.` 
    });
  }
  
  next();
};