// src/controllers/admin.controller.ts

import { Request, Response } from 'express';
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../models/user.model';
import { hashPassword, validatePassword } from '../services/password.service';
import { logUserAction, logError } from '../utils/logger.utils';

export const createNewUser = async (req: Request, res: Response) => {
  try {
    const { login, password, role } = req.body;
    const createdBy = req.user!.sub;

    if (!login || !password || !role) {
      logUserAction('CREATE_USER_FAILED', req, { 
        reason: 'Missing required fields',
        login,
        role,
        createdBy
      });
      return res.status(400).json({ error: 'Login, password and role are required' });
    }

    if (!validatePassword(password)) {
      logUserAction('CREATE_USER_FAILED', req, { 
        reason: 'Invalid password format',
        login,
        createdBy
      });
      return res.status(400).json({
        error: 'Password must be ≥8 chars, contain A-Z, a-z, 0-9, and !@#$%^&*'
      });
    }

    // Проверяем, что роль допустима
    if (!['admin', 'superadmin'].includes(role)) {
      logUserAction('CREATE_USER_FAILED', req, { 
        reason: 'Invalid role',
        login,
        role,
        createdBy
      });
      return res.status(400).json({ error: 'Role must be "admin" or "superadmin"' });
    }

    // Проверяем, что создается только админ (суперадмина можно создать только вручную в БД)
    if (role === 'superadmin' && req.user!.role !== 'superadmin') {
      logUserAction('CREATE_USER_FAILED', req, { 
        reason: 'Permission denied - only superadmin can create superadmin',
        login,
        role,
        createdBy
      });
      return res.status(403).json({ error: 'Only superadmin can create another superadmin' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await createUser(login, hashedPassword, role as 'admin' | 'superadmin');

    logUserAction('CREATE_USER', req, { 
      userId: user.id, 
      login: user.login, 
      role: user.role,
      createdBy
    }, user.id, 'user');

    res.status(201).json({
      id: user.id,
      login: user.login,
      role: user.role,
      createdAt: user.created_at
    });
  } catch (error) {
    logError('CREATE_USER', req, error as Error, { 
      login: req.body.login,
      role: req.body.role,
      createdBy: req.user!.sub
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();

    res.status(200).json(users.map(user => ({
      id: user.id,
      login: user.login,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    })));
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      login: user.login,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updatedBy = req.user!.sub;

    if (req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can update user profiles' });
    }

    // Проверяем, что обновляемый пользователь существует
    const user = await getUserById(id);
    if (!user) {
      logUserAction('UPDATE_USER_FAILED', req, { 
        reason: 'User not found',
        userId: id,
        updatedBy
      });
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем, что роль допустима
    if (role && !['admin', 'superadmin'].includes(role)) {
      logUserAction('UPDATE_USER_FAILED', req, { 
        reason: 'Invalid role',
        userId: id,
        role,
        updatedBy
      });
      return res.status(400).json({ error: 'Role must be "admin" or "superadmin"' });
    }

    // Не позволяем обычному админу обновлять суперадмина
    if (req.user!.role !== 'superadmin' && user.role === 'superadmin') {
      logUserAction('UPDATE_USER_FAILED', req, { 
        reason: 'Permission denied - cannot update superadmin',
        userId: id,
        updatedBy
      });
      return res.status(403).json({ error: 'Cannot update superadmin account' });
    }

    const updates: Partial<any> = {};
    if (role) updates.role = role;

    const updatedUser = await updateUser(id, updates);

    if (!updatedUser) {
      logUserAction('UPDATE_USER_FAILED', req, { 
        reason: 'Failed to update user',
        userId: id,
        updatedBy
      });
      return res.status(400).json({ error: 'Failed to update user' });
    }

    logUserAction('UPDATE_USER', req, { 
      userId: id,
      updates,
      updatedBy
    }, id, 'user');

    res.status(200).json({
      id: updatedUser.id,
      login: updatedUser.login,
      role: updatedUser.role,
      updatedAt: updatedUser.updated_at
    });
  } catch (error) {
    logError('UPDATE_USER', req, error as Error, { 
      userId: req.params.id,
      updatedBy: req.user!.sub
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUserAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user!.sub;

    if (req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can delete user accounts' });
    }

    // Не позволяем удалять самого себя
    if (id === deletedBy) {
      logUserAction('DELETE_USER_FAILED', req, { 
        reason: 'Cannot delete own account',
        userId: id,
        deletedBy
      });
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Проверяем, что удаляемый пользователь существует
    const user = await getUserById(id);
    if (!user) {
      logUserAction('DELETE_USER_FAILED', req, { 
        reason: 'User not found',
        userId: id,
        deletedBy
      });
      return res.status(404).json({ error: 'User not found' });
    }

    // Не позволяем обычному админу удалять суперадмина
    if (user.role === 'superadmin') {
      logUserAction('DELETE_USER_FAILED', req, { 
        reason: 'Permission denied - cannot delete superadmin',
        userId: id,
        deletedBy
      });
      return res.status(403).json({ error: 'Cannot delete superadmin account' });
    }

    const success = await deleteUser(id);

    if (!success) {
      logUserAction('DELETE_USER_FAILED', req, { 
        reason: 'Failed to delete user',
        userId: id,
        deletedBy
      });
      return res.status(400).json({ error: 'Failed to delete user' });
    }

    logUserAction('DELETE_USER', req, { 
      userId: id,
      deletedBy
    }, id, 'user');

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logError('DELETE_USER', req, error as Error, { 
      userId: req.params.id,
      deletedBy: req.user!.sub
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};