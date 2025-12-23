// src/routes/admin.routes.ts

import { Router } from 'express';
import { 
  createNewUser, 
  getUsers, 
  getUser, 
  updateUserProfile, 
  deleteUserAccount 
} from '../controllers/admin.controller';
import { authGuard } from '../middleware/authGuard';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

// Управление пользователями (только для суперадминов)
router.post('/users', authGuard, roleGuard('superadmin'), createNewUser);
router.get('/users', authGuard, roleGuard('superadmin'), getUsers);
router.get('/users/:id', authGuard, roleGuard('superadmin'), getUser);
router.patch('/users/:id', authGuard, roleGuard('superadmin'), updateUserProfile);
router.delete('/users/:id', authGuard, roleGuard('superadmin'), deleteUserAccount);

export default router;