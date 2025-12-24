// src/controllers/survey.controller.ts

import { Request, Response } from 'express';
import { 
  createSurvey as createSurveyModel, 
  getSurveyById, 
  getSurveysByUser,
  updateSurvey as updateSurveyModel,
  deleteSurvey as deleteSurveyModel,
  toggleSurveyActive as toggleSurveyActiveModel
} from '../models/survey.model';
import { 
  createResponse,
  getResponseCountBySurveyId,
  getResponsesBySurveyId,
  getSurveyStats as getSurveyStatsModel,
  getDetailedStatsBySurveyId
} from '../models/response.model';
import { generateQRCode } from '../services/qr.service';
import { validateSurveyResponse } from '../utils/validation/survey.validation';
import { Survey } from '../types/survey.types';
import { generatePublicUrl } from '../utils/url.utils';
import { logUserAction, logError } from '../utils/logger.utils';



export const createSurvey = async (req: Request, res: Response) => {
  try {
    const { title, description, structure, expiresAt, isAnonymous } = req.body;
    const userId = req.user!.sub;

    // Валидация структуры анкеты
    // Здесь должна быть Zod-валидация, но для упрощения пока пропустим

    const survey = await createSurveyModel(
      title,
      description,
      structure,
      expiresAt ? new Date(expiresAt) : undefined,
      isAnonymous,
      userId
    );

    if (!survey || !survey.id) {
      throw new Error('Survey creation failed: survey object or id is missing');
    }

    // Генерация QR-кода
    const publicUrl = generatePublicUrl(survey.id);
    const qrCode = await generateQRCode(publicUrl);
    
    // Обновление анкеты с QR-кодом
    const updatedSurvey = await updateSurveyModel(survey.id, userId, { qr_code: qrCode });
    
    if (!updatedSurvey) {
      throw new Error('Failed to update survey with QR code');
    }

    logUserAction('CREATE_SURVEY', req, { 
      surveyId: survey.id, 
      title: survey.title,
      isAnonymous: survey.is_anonymous
    }, survey.id, 'survey');

    res.status(201).json({
      id: updatedSurvey.id,
      title: updatedSurvey.title,
      publicUrl,
      qrCode,
      expiresAt: updatedSurvey.expires_at,
      isActive: updatedSurvey.is_active
    });
  } catch (error) {
    logError('CREATE_SURVEY', req, error as Error, { 
      title: req.body.title,
      userId: req.user!.sub,
      error: (error as Error).message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSurveys = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const surveys = await getSurveysByUser(userId);
    
    // Получаем количество ответов для каждой анкеты
    const surveysWithResponseCount = await Promise.all(
      surveys.map(async (survey) => {
        const responseCount = await getResponseCountBySurveyId(survey.id);
        return {
          id: survey.id,
          title: survey.title,
          description: survey.description,
          isActive: survey.is_active,
          expiresAt: survey.expires_at,
          createdAt: survey.created_at,
          updatedAt: survey.updated_at,
          responseCount
        };
      })
    );
    
    res.status(200).json(surveysWithResponseCount);
  } catch (error) {
    console.error('Error getting surveys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    
    const survey = await getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Проверка прав доступа - только владелец или суперадмин
    if (survey.created_by !== userId && req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.status(200).json(survey);
  } catch (error) {
    console.error('Error getting survey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    const { title, description, structure, expiresAt, isAnonymous } = req.body;
    
    const updates: Partial<Survey> = {};
    
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (structure !== undefined) updates.structure = structure;
    if (expiresAt !== undefined) updates.expires_at = expiresAt ? new Date(expiresAt) : undefined;
    if (isAnonymous !== undefined) updates.is_anonymous = isAnonymous;
    
    const updatedSurvey = await updateSurveyModel(id, userId, updates);
    
    if (!updatedSurvey) {
      logUserAction('UPDATE_SURVEY_FAILED', req, { 
        reason: 'Survey not found or access denied',
        surveyId: id 
      }, id, 'survey');
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }
    
    // Если структура изменилась, нужно перегенерировать QR-код
    if (structure !== undefined) {
      const publicUrl = generatePublicUrl(updatedSurvey.id);
      const qrCode = await generateQRCode(publicUrl);
      await updateSurveyModel(updatedSurvey.id, userId, { qr_code: qrCode });
    }
    
    logUserAction('UPDATE_SURVEY', req, { 
      surveyId: id,
      updates: { title, description, structure: structure !== undefined, expiresAt, isAnonymous }
    }, id, 'survey');
    
    res.status(200).json(updatedSurvey);
  } catch (error) {
    logError('UPDATE_SURVEY', req, error as Error, { 
      surveyId: req.params.id,
      userId: req.user!.sub
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    
    const success = await deleteSurveyModel(id, userId);
    
    if (!success) {
      logUserAction('DELETE_SURVEY_FAILED', req, { 
        reason: 'Survey not found or access denied',
        surveyId: id 
      }, id, 'survey');
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }
    
    logUserAction('DELETE_SURVEY', req, { surveyId: id }, id, 'survey');
    
    res.status(200).json({ message: 'Survey deleted successfully' });
  } catch (error) {
    logError('DELETE_SURVEY', req, error as Error, { 
      surveyId: req.params.id,
      userId: req.user!.sub
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleSurveyActive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    
    // Сначала получаем текущую анкету для проверки прав
    const survey = await getSurveyById(id);
    
    if (!survey) {
      logUserAction('TOGGLE_SURVEY_ACTIVE_FAILED', req, { 
        reason: 'Survey not found',
        surveyId: id 
      }, id, 'survey');
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    if (survey.created_by !== userId && req.user!.role !== 'superadmin') {
      logUserAction('TOGGLE_SURVEY_ACTIVE_FAILED', req, { 
        reason: 'Access denied',
        surveyId: id 
      }, id, 'survey');
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const isActive = req.body.active !== undefined ? req.body.active : !survey.is_active;
    const updatedSurvey = await toggleSurveyActiveModel(id, userId, isActive);
    
    if (!updatedSurvey) {
      logUserAction('TOGGLE_SURVEY_ACTIVE_FAILED', req, { 
        reason: 'Failed to update survey status',
        surveyId: id 
      }, id, 'survey');
      return res.status(400).json({ error: 'Failed to update survey status' });
    }
    
    logUserAction(isActive ? 'ACTIVATE_SURVEY' : 'DEACTIVATE_SURVEY', req, { 
      surveyId: id,
      isActive: updatedSurvey.is_active
    }, id, 'survey');
    
    res.status(200).json({
      id: updatedSurvey.id,
      isActive: updatedSurvey.is_active
    });
  } catch (error) {
    logError('TOGGLE_SURVEY_ACTIVE', req, error as Error, { 
      surveyId: req.params.id,
      userId: req.user!.sub
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    
    // Получаем анкету и проверяем, активна ли она и не просрочена ли
    const survey = await getSurveyById(id);
    
    if (!survey) {
      logUserAction('SUBMIT_SURVEY_FAILED', req, { 
        reason: 'Survey not found',
        surveyId: id 
      }, id, 'survey');
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    if (!survey.is_active) {
      logUserAction('SUBMIT_SURVEY_FAILED', req, { 
        reason: 'Survey is not active',
        surveyId: id 
      }, id, 'survey');
      return res.status(400).json({ error: 'Survey is not active' });
    }
    
    if (survey.expires_at && new Date() > new Date(survey.expires_at)) {
      logUserAction('SUBMIT_SURVEY_FAILED', req, { 
        reason: 'Survey has expired',
        surveyId: id 
      }, id, 'survey');
      return res.status(400).json({ error: 'Survey has expired' });
    }
    
    // Валидация ответов
    const validation = validateSurveyResponse(survey.structure, data);
    if (!validation.success) {
      logUserAction('SUBMIT_SURVEY_FAILED', req, { 
        reason: 'Invalid response data',
        surveyId: id,
        validationErrors: validation.errors
      }, id, 'survey');
      return res.status(400).json({ error: 'Invalid response data', details: validation.errors });
    }
    
    // Определяем IP для сохранения (если анкета не анонимная)
    let ip: string | null = null;
    if (!survey.is_anonymous) {
      ip = req.ip || req.connection.remoteAddress || null;
    }
    
    // Сохраняем ответ
    const response = await createResponse(id, data, ip);
    
    logUserAction('SUBMIT_SURVEY', req, { 
      surveyId: id,
      responseId: response.id,
      isAnonymous: survey.is_anonymous,
      ip: survey.is_anonymous ? 'anonymous' : ip
    }, id, 'survey');
    
    res.status(201).json({ message: 'Спасибо за участие!' });
  } catch (error) {
    logError('SUBMIT_SURVEY', req, error as Error, { 
      surveyId: req.params.id
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSurveyResponses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    
    // Проверяем, что пользователь является владельцем анкеты или суперадмином
    const survey = await getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    if (survey.created_by !== userId && req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Получаем параметры пагинации
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    // Получаем ответы из базы данных
    const responses = await getResponsesBySurveyId(id, limit, offset);
    const totalCount = await getResponseCountBySurveyId(id);
    
    res.status(200).json({
      surveyId: id,
      responses,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting survey responses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSurveyStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    
    // Проверяем, что пользователь является владельцем анкеты или суперадмином
    const survey = await getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    if (survey.created_by !== userId && req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Получаем статистику из базы данных
    const stats = await getSurveyStatsModel(id);
    
    // Дополнительно можем получить статистику по каждому вопросу
    const detailedStats = await getDetailedStatsBySurveyId(id, survey.structure);
    
    res.status(200).json({
      surveyId: id,
      basicStats: stats,
      detailedStats
    });
  } catch (error) {
    console.error('Error getting survey stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};