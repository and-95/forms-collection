// src/models/response.model.ts

import { Pool } from 'pg';
import db from '../utils/db';
import { DB_SCHEMA } from '../config/db.config';

// Создание нового ответа
export const createResponse = async (
  surveyId: string,
  data: any,
  ip: string | null
): Promise<any> => {
  const query = `
    INSERT INTO ${DB_SCHEMA}.responses (survey_id, data, ip)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const values = [surveyId, JSON.stringify(data), ip];
  
  const result = await db.query(query, values);
  return result.rows[0];
};

// Получение ответов по ID анкеты
export const getResponsesBySurveyId = async (surveyId: string, limit: number = 20, offset: number = 0): Promise<any[]> => {
  const query = `
    SELECT * FROM ${DB_SCHEMA}.responses 
    WHERE survey_id = $1 
    ORDER BY submitted_at DESC 
    LIMIT $2 OFFSET $3
  `;
  const result = await db.query(query, [surveyId, limit, offset]);
  return result.rows;
};

// Получение количества ответов по ID анкеты
export const getResponseCountBySurveyId = async (surveyId: string): Promise<number> => {
  const query = `SELECT COUNT(*) as count FROM ${DB_SCHEMA}.responses WHERE survey_id = $1`;
  const result = await db.query(query, [surveyId]);
  return parseInt(result.rows[0].count);
};

// Получение статистики по анкете
export const getSurveyStats = async (surveyId: string): Promise<any> => {
  // Заглушка для статистики - в реальности нужно реализовать сложную аналитику
  const query = `
    SELECT 
      COUNT(*) as total_responses,
      MIN(submitted_at) as first_response,
      MAX(submitted_at) as last_response
    FROM ${DB_SCHEMA}.responses 
    WHERE survey_id = $1
  `;
  const result = await db.query(query, [surveyId]);
  return result.rows[0];
};