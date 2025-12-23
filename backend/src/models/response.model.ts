// src/models/response.model.ts

import { Pool } from 'pg';
import db from '../utils/db';
import { DB_SCHEMA } from '../config/db.config';
import { Question } from '../types/question.types';

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

// Получение базовой статистики по анкете
export const getSurveyStats = async (surveyId: string): Promise<any> => {
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

// Получение детальной статистики по каждому вопросу анкеты
export const getDetailedStatsBySurveyId = async (surveyId: string, surveyStructure: Question[]): Promise<any> => {
  // Запрос для получения всех ответов для данной анкеты
  const query = `SELECT data FROM ${DB_SCHEMA}.responses WHERE survey_id = $1`;
  const result = await db.query(query, [surveyId]);
  const responses = result.rows;

  if (responses.length === 0) {
    return {};
  }

  const detailedStats: any = {};

  // Для каждого вопроса в структуре анкеты
  for (const question of surveyStructure) {
    const questionId = question.id;
    const questionType = question.type;
    
    // Собираем все ответы на этот вопрос
    const answers: any[] = [];
    for (const response of responses) {
      if (response.data && response.data[questionId] !== undefined) {
        answers.push(response.data[questionId]);
      }
    }

    // Вычисляем статистику в зависимости от типа вопроса
    switch (questionType) {
      case 'radio':
      case 'select':
      case 'checkbox':
        // Для этих типов подсчитываем количество каждого варианта
        if (question.options) {
          const optionStats: any = {};
          
          // Инициализируем все возможные варианты нулями
          for (const option of question.options) {
            optionStats[option.id] = {
              id: option.id,
              label: option.label,
              count: 0,
              percentage: 0
            };
          }
          
          // Подсчитываем ответы
          for (const answer of answers) {
            if (questionType === 'checkbox' && Array.isArray(answer)) {
              // Для чекбоксов ответ - массив
              for (const selectedOption of answer) {
                if (optionStats[selectedOption]) {
                  optionStats[selectedOption].count++;
                }
              }
            } else {
              // Для radio и select ответ - один элемент
              if (optionStats[answer]) {
                optionStats[answer].count++;
              }
            }
          }
          
          // Вычисляем проценты
          for (const optionId in optionStats) {
            optionStats[optionId].percentage = answers.length > 0 
              ? parseFloat(((optionStats[optionId].count / answers.length) * 100).toFixed(2))
              : 0;
          }
          
          detailedStats[questionId] = {
            questionLabel: question.label,
            type: questionType,
            options: Object.values(optionStats),
            totalAnswers: answers.length
          };
        }
        break;

      case 'scale':
        // Для шкалы вычисляем среднее, мин, макс
        if (answers.length > 0) {
          const numericAnswers = answers.filter(a => typeof a === 'number' && !isNaN(a));
          if (numericAnswers.length > 0) {
            const sum = numericAnswers.reduce((acc, val) => acc + val, 0);
            const avg = sum / numericAnswers.length;
            const min = Math.min(...numericAnswers);
            const max = Math.max(...numericAnswers);
            
            detailedStats[questionId] = {
              questionLabel: question.label,
              type: questionType,
              average: parseFloat(avg.toFixed(2)),
              min,
              max,
              totalAnswers: numericAnswers.length
            };
          }
        }
        break;

      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'date':
      case 'datetime':
        // Для текстовых типов просто подсчитываем количество ответов
        detailedStats[questionId] = {
          questionLabel: question.label,
          type: questionType,
          totalAnswers: answers.length,
          filledPercentage: parseFloat(((answers.length / responses.length) * 100).toFixed(2))
        };
        break;

      default:
        // Для неизвестных типов просто сохраняем количество ответов
        detailedStats[questionId] = {
          questionLabel: question.label,
          type: questionType,
          totalAnswers: answers.length
        };
    }
  }

  return detailedStats;
};