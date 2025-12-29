// src/models/survey.model.ts
import { Pool } from 'pg';
import db from '../utils/db';
import { Survey } from '../types/survey.types';
import { DB_SCHEMA } from '../config/db.config';
import { Question } from '../types/question.types';

// Создание новой анкеты
export const createSurvey = async (
  title: string,
  description: string | undefined,
  structure: any,
  expires_at: Date | undefined,
  is_anonymous: boolean,
  created_by: string
): Promise<Survey> => {
  const query = `
    INSERT INTO ${DB_SCHEMA}.surveys (
      title, description, structure, expires_at, is_anonymous, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    title,
    description ?? null,               // ← исправлено: undefined → null
    JSON.stringify(structure),
    expires_at ?? null,                 // ← исправлено: undefined → null
    is_anonymous,
    created_by
  ];

  const result = await db.query(query, values);
  if (!result.rows || result.rows.length === 0) {
    throw new Error('Survey creation failed: no rows returned from database');
  }
  return result.rows[0] as Survey;
};

// Получение анкеты по ID
export const getSurveyById = async (id: string): Promise<Survey | null> => {
  const query = `SELECT * FROM ${DB_SCHEMA}.surveys WHERE id = $1::uuid`; // ← явный ::uuid
  const result = await db.query(query, [id]);
  return result.rows.length > 0 ? result.rows[0] as Survey : null;
};

// Получение анкет пользователя
export const getSurveysByUser = async (userId: string): Promise<Survey[]> => {
  const query = `
    SELECT * FROM ${DB_SCHEMA}.surveys
    WHERE created_by = $1::uuid
    ORDER BY created_at DESC
  `;
  const result = await db.query(query, [userId]);
  return result.rows.map(row => {
    let structure: Question[] = [];
    if (typeof row.structure === 'string') {
      try {
        structure = JSON.parse(row.structure);
      } catch (e) {
        console.warn('Failed to parse structure for survey', row.id, e);
        structure = [];
      }
    } else {
      structure = row.structure || [];
    }

    return {
      ...row,
      structure,
      expires_at: row.expires_at ? new Date(row.expires_at) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    } as Survey;
  });
};

// Обновление анкеты
export const updateSurvey = async (
  id: string,
  userId: string,
  updates: Partial<Survey>
): Promise<Survey | null> => {
  if (Object.keys(updates).length === 0) {
    throw new Error('No updates provided');
  }

  // Фильтруем undefined значения — они ломают типизацию в pg
  const filteredEntries = Object.entries(updates).filter(([_, v]) => v !== undefined);
  if (filteredEntries.length === 0) {
    throw new Error('No valid updates after filtering undefined values');
  }

  const setClause = filteredEntries
    .map(([key], index) => `"${key}" = $${index + 1}`)
    .join(', ');

  // Заменяем undefined → null
  const values = filteredEntries.map(([, v]) => v ?? null);

  // Позиции параметров для WHERE
  const idParamIndex = values.length + 1;
  const userIdParamIndex = values.length + 2;

  const query = `
    UPDATE ${DB_SCHEMA}.surveys
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${idParamIndex}::uuid 
      AND created_by = $${userIdParamIndex}::uuid
    RETURNING *
  `;

  values.push(id, userId);

  const result = await db.query(query, values);
  if (result.rows.length === 0) return null;
const row = result.rows[0];

// Parse JSON fields
let structure: Question[] = [];
if (typeof row.structure === 'string') {
  try {
    structure = JSON.parse(row.structure);
  } catch (e) {
    console.warn('Failed to parse structure for survey', row.id, e);
    structure = [];
  }
} else {
  structure = row.structure || [];
}

// Parse dates if needed (optional but recommended)
const expires_at = row.expires_at ? new Date(row.expires_at) : undefined;
const created_at = new Date(row.created_at);
const updated_at = new Date(row.updated_at);

return {
  ...row,
  structure,
  expires_at,
  created_at,
  updated_at
} as Survey;
};

// Удаление анкеты
export const deleteSurvey = async (id: string, userId: string): Promise<boolean> => {
  const query = `
    DELETE FROM ${DB_SCHEMA}.surveys 
    WHERE id = $1::uuid AND created_by = $2::uuid
  `;
  const result = await db.query(query, [id, userId]);
  return result.rowCount !== null && result.rowCount > 0;
};

// Активация/деактивация анкеты
export const toggleSurveyActive = async (
  id: string,
  userId: string,
  is_active: boolean
): Promise<Survey | null> => {
  const query = `
    UPDATE ${DB_SCHEMA}.surveys
    SET is_active = $1, updated_at = NOW()
    WHERE id = $2::uuid AND created_by = $3::uuid
    RETURNING *
  `;
  const result = await db.query(query, [is_active, id, userId]);
  return result.rows.length > 0 ? result.rows[0] as Survey : null;
};

export interface SurveyResponsesResponse {
  surveyId: string;
  responses: SurveyResponseRaw[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// "сырой" ответ от бэкенда
export interface SurveyResponseRaw {
  id: string;
  survey_id: string;
  data: Record<string, any>;
  ip?: string | null;
  submitted_at: string; // ← snake_case
}