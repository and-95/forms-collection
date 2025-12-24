// src/middleware/logging.middleware.ts

import { Request, Response, NextFunction } from 'express';
import onFinished from 'on-finished';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  method: string;
  url: string;
  statusCode: number;
  userId?: string;
  role?: string;
  ip: string;
  userAgent?: string;
  responseTime?: string;
}

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Регистрируем обработчик на завершение ответа
  onFinished(res, (err, res) => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: err ? 'error' : statusCode >= 400 ? 'error' : 'info',
      message: err
        ? `Ошибка: ${err.message}`
        : `${req.method} ${req.url} - ${statusCode}`,
      method: req.method,
      url: req.url,
      statusCode: statusCode,
      ip: req.ip || req.connection.remoteAddress || '',
      userAgent: req.get('User-Agent') || '',
      responseTime: `${duration}ms`,
    };

    // Добавляем информацию о пользователе (если есть)
    if (req.user) {
      logEntry.userId = (req.user as any)?.sub;
      logEntry.role = (req.user as any)?.role;
    }

    // Если была ошибка — добавляем stack trace
    if (err) {
      logEntry.message += ` | ${err.stack}`;
    }

    console.log(JSON.stringify(logEntry));
  });

  next();
};