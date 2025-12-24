// src/models/survey.model.ts
import { Pool } from 'pg';
import db from '../utils/db';
import { Survey } from '../types/survey.types';
import { DB_SCHEMA } from '../config/db.config';

// Создание новой анкеты
export const createSurvey = async (
  title: string,
  description: string | undefined,
  structure: any,
  expiresAt: Date | undefined,
  isAnonymous: boolean,
  createdBy: string
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
    expiresAt ?? null,                 // ← исправлено: undefined → null
    isAnonymous,
    createdBy
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
  return result.rows as Survey[];
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
  return result.rows.length > 0 ? result.rows[0] as Survey : null;
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
  isActive: boolean
): Promise<Survey | null> => {
  const query = `
    UPDATE ${DB_SCHEMA}.surveys
    SET is_active = $1, updated_at = NOW()
    WHERE id = $2::uuid AND created_by = $3::uuid
    RETURNING *
  `;
  const result = await db.query(query, [isActive, id, userId]);
  return result.rows.length > 0 ? result.rows[0] as Survey : null;
};