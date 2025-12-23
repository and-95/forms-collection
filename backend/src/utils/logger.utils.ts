// src/utils/logger.utils.ts

import { Request } from 'express';

interface AuditLogEntry {
  timestamp: string;
  level: string;
  action: string;
  userId?: string;
  role?: string;
  targetId?: string;
  targetType?: string;
  details?: any;
  ip: string;
  userAgent?: string;
  message: string;
}

export const logUserAction = (
  action: string,
  req: Request,
  details?: any,
  targetId?: string,
  targetType?: string
): void => {
  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    action,
    userId: (req.user as any)?.sub,
    role: (req.user as any)?.role,
    targetId,
    targetType,
    details,
    ip: req.ip || req.connection.remoteAddress || '',
    userAgent: req.get('User-Agent') || '',
    message: `User ${req.user ? (req.user as any).sub : 'anonymous'} performed action: ${action}`
  };

  console.log(JSON.stringify(logEntry));
};

export const logError = (
  action: string,
  req: Request,
  error: Error | string,
  details?: any
): void => {
  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    action,
    userId: (req.user as any)?.sub,
    role: (req.user as any)?.role,
    details: {
      ...details,
      error: error instanceof Error ? error.message : error
    },
    ip: req.ip || req.connection.remoteAddress || '',
    userAgent: req.get('User-Agent') || '',
    message: `Error in action: ${action}, Error: ${error instanceof Error ? error.message : error}`
  };

  console.error(JSON.stringify(logEntry));
};

export const logSystemEvent = (
  action: string,
  details?: any,
  level: 'info' | 'warn' | 'error' = 'info'
): void => {
  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    action,
    details,
    ip: '',
    userAgent: '',
    message: `System event: ${action}`
  };

  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
};