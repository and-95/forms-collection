// src/utils/jwt.utils.ts

import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { JWT_CONFIG } from '../config/jwt';

export const signAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    algorithm: 'HS256',
  } as SignOptions);
};

export const signRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_CONFIG.refreshSecret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
    algorithm: 'HS512',
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_CONFIG.secret, { algorithms: ['HS256'] }) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_CONFIG.refreshSecret, { algorithms: ['HS512'] }) as JWTPayload;
};