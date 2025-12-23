// src/routes/survey.routes.ts

import { Router } from 'express';
import { 
  createSurvey, 
  getSurvey, 
  getSurveys, 
  updateSurvey, 
  deleteSurvey, 
  toggleSurveyActive,
  submitSurvey,
  getSurveyResponses,
  getSurveyStats
} from '../controllers/survey.controller';
import { authGuard } from '../middleware/authGuard';
import { roleGuard } from '../middleware/roleGuard';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// CRUD для анкет (только для авторизованных пользователей)
router.post('/', authGuard, roleGuard('admin', 'superadmin'), createSurvey);
router.get('/', authGuard, roleGuard('admin', 'superadmin'), getSurveys);
router.get('/:id', authGuard, roleGuard('admin', 'superadmin'), getSurvey);
router.patch('/:id', authGuard, roleGuard('admin', 'superadmin'), updateSurvey);
router.delete('/:id', authGuard, roleGuard('admin', 'superadmin'), deleteSurvey);
router.post('/:id/activate', authGuard, roleGuard('admin', 'superadmin'), toggleSurveyActive);

// Публичный эндпоинт для отправки ответов
router.post('/:id/submit', rateLimiter, submitSurvey);

// Получение ответов и статистики (доступно только админу анкеты или суперадмину)
router.get('/:id/responses', authGuard, roleGuard('admin', 'superadmin'), getSurveyResponses);
router.get('/:id/stats', authGuard, roleGuard('admin', 'superadmin'), getSurveyStats);

export default router;