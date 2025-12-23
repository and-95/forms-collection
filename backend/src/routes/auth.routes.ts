// src/routes/auth.routes.ts

import { Router } from 'express';
import { login, refresh, changePassword } from '../controllers/auth.controller';
import { authGuard, refreshGuard } from '../middleware/authGuard';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshGuard, refresh);
router.post('/change-password', authGuard, changePassword);

export default router;