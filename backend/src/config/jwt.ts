// src/config/jwt.ts

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'fallback_secret_123',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_456',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
} as const;