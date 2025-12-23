// src/middleware/logging.middleware.ts

import { Request, Response, NextFunction } from 'express';

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
}

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original res.end method
  const originalEnd = res.end;
  
  res.end = function(chunk: any, encoding: any, callback: any) {
    // Call the original res.end method
    const result = originalEnd.call(this, chunk, encoding, callback);
    
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: statusCode >= 400 ? 'error' : 'info',
      message: `${req.method} ${req.url} - ${statusCode}`,
      method: req.method,
      url: req.url,
      statusCode: statusCode,
      ip: req.ip || req.connection.remoteAddress || '',
      userAgent: req.get('User-Agent') || ''
    };
    
    // Add user info if available
    if (req.user) {
      logEntry.userId = (req.user as any).sub;
      logEntry.role = (req.user as any).role;
    }
    
    // Add response time to the log entry
    (logEntry as any).responseTime = `${duration}ms`;
    
    console.log(JSON.stringify(logEntry));
    
    return result;
  };
  
  next();
};