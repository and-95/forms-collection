import { Router } from 'express';
import { login, refresh, changePassword, getCurrentUser, logout } from '../controllers/auth.controller';
import { authGuard, refreshGuard } from '../middleware/authGuard';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshGuard, refresh);
router.post('/change-password', authGuard, changePassword);
router.get('/me', authGuard, getCurrentUser);
router.post('/logout', logout);

export default router;