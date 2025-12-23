// src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { findUserById, findUserByLogin, updateUserPassword } from '../models/user.model';
import { hashPassword, verifyPassword, validatePassword } from '../services/password.service';
import { signAccessToken, signRefreshToken } from '../utils/jwt.utils';
import { JWTPayload } from '../types';
import { logUserAction, logError } from '../utils/logger.utils';

// src/controllers/auth.controller.ts

export const login = async (req: Request, res: Response) => {
  const { login, password } = req.body;

  if (!login || !password) {
    logUserAction('LOGIN_FAILED', req, { reason: 'Missing credentials' });
    return res.status(400).json({ error: 'Login and password are required' });
  }

  const user = await findUserByLogin(login);
  if (!user) {
    logUserAction('LOGIN_FAILED', req, { reason: 'Invalid credentials', login });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    logUserAction('LOGIN_FAILED', req, { reason: 'Invalid credentials', login });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // ✅ Здесь НЕЛЬЗЯ использовать req.user — его ещё нет!
  const payload: JWTPayload = { sub: user.id, role: user.role }; // ← user.id, НЕ req.user.sub!

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  logUserAction('LOGIN_SUCCESS', req, { userId: user.id, login: user.login, role: user.role });
  
  return res.status(200).json({
    mustChangePassword: user.must_change_password,
    user: {
      id: user.id,
      login: user.login,
      role: user.role,
    },
  });
};

export const refresh = (req: Request, res: Response) => {
  // req.user уже заполнен в refreshGuard
  const payload: JWTPayload = { sub: req.user!.sub, role: req.user!.role };

  const accessToken = signAccessToken(payload);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  return res.status(200).json({ message: 'Token refreshed' });
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.sub;

  if (!currentPassword || !newPassword) {
    logUserAction('CHANGE_PASSWORD_FAILED', req, { reason: 'Missing passwords' });
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  if (!validatePassword(newPassword)) {
    logUserAction('CHANGE_PASSWORD_FAILED', req, { reason: 'Invalid new password format' });
    return res.status(400).json({
      error: 'Password must be ≥8 chars, contain A-Z, a-z, 0-9, and !@#$%^&*',
    });
  }

  const user = await findUserByLogin(req.user!.sub); // можно и по ID — для MVP ок
  if (!user) {
    logUserAction('CHANGE_PASSWORD_FAILED', req, { reason: 'User not found', userId });
    return res.status(404).json({ error: 'User not found' });
  }

  const isValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    logUserAction('CHANGE_PASSWORD_FAILED', req, { reason: 'Current password incorrect', userId });
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = await hashPassword(newPassword);
  await updateUserPassword(userId, newHash, false); // сброс флага

  logUserAction('CHANGE_PASSWORD_SUCCESS', req, { userId, login: user.login });
  
  return res.status(200).json({ message: 'Password changed successfully' });
};

export const logout = (req: Request, res: Response) => {
  // Clear the authentication cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  return res.status(200).json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // Get user from database to have full user information
  const user = await findUserById(req.user.sub);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json({
    id: user.id,
    login: user.login,
    role: user.role,
  });
};