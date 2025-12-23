// src/utils/validation/survey.validation.ts

import { Question, QuestionType } from '../../types/question.types';

interface ValidationResult {
  success: boolean;
  errors?: string[];
}

/**
 * Валидация ответов анкеты на основе структуры вопросов
 */
export const validateSurveyResponse = (
  surveyStructure: Question[],
  responseData: Record<string, any>
): ValidationResult => {
  const errors: string[] = [];

  // Проверяем, что все обязательные поля присутствуют и валидны
  for (const question of surveyStructure) {
    const userAnswer = responseData[question.id];

    // Проверка обязательных полей
    if (question.required && (userAnswer === undefined || userAnswer === null || userAnswer === '')) {
      errors.push(`Обязательный вопрос "${question.label}" не заполнен`);
      continue;
    }

    // Пропускаем валидацию, если поле необязательное и не заполнено
    if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
      continue;
    }

    // Валидация по типу вопроса
    switch (question.type) {
      case 'text':
      case 'textarea':
        if (typeof userAnswer !== 'string') {
          errors.push(`Ответ на вопрос "${question.label}" должен быть текстом`);
        }
        break;

      case 'email':
        if (typeof userAnswer !== 'string' || !isValidEmail(userAnswer)) {
          errors.push(`Ответ на вопрос "${question.label}" должен быть корректным email`);
        }
        break;

      case 'phone':
        if (typeof userAnswer !== 'string' || !isValidPhone(userAnswer)) {
          errors.push(`Ответ на вопрос "${question.label}" должен быть корректным номером телефона`);
        }
        break;

      case 'date':
        if (typeof userAnswer !== 'string' || !isValidDate(userAnswer)) {
          errors.push(`Ответ на вопрос "${question.label}" должен быть корректной датой (ГГГГ-ММ-ДД)`);
        }
        break;

      case 'datetime':
        if (typeof userAnswer !== 'string' || !isValidDateTime(userAnswer)) {
          errors.push(`Ответ на вопрос "${question.label}" должен быть корректной датой и временем`);
        }
        break;

      case 'radio':
      case 'select':
        if (typeof userAnswer !== 'string') {
          errors.push(`Ответ на вопрос "${question.label}" должен быть строкой (id выбранного варианта)`);
        } else if (question.options && !question.options.some(opt => opt.id === userAnswer)) {
          errors.push(`Ответ на вопрос "${question.label}" не соответствует допустимым вариантам`);
        }
        break;

      case 'checkbox':
        if (!Array.isArray(userAnswer)) {
          errors.push(`Ответ на вопрос "${question.label}" должен быть массивом (выбранные варианты)`);
        } else if (question.options) {
          const invalidOptions = userAnswer.filter((value: string) => 
            !question.options!.some(opt => opt.id === value)
          );
          if (invalidOptions.length > 0) {
            errors.push(`Некоторые ответы на вопрос "${question.label}" не соответствуют допустимым вариантам`);
          }
        }
        break;

      case 'scale':
        if (typeof userAnswer !== 'number' || !Number.isInteger(userAnswer)) {
          errors.push(`Ответ на вопрос "${question.label}" должен быть целым числом`);
        } else {
          const min = question.min ?? 1;
          const max = question.max ?? 5;
          if (userAnswer < min || userAnswer > max) {
            errors.push(`Ответ на вопрос "${question.label}" должен быть в диапазоне ${min}-${max}`);
          }
        }
        break;

      default:
        errors.push(`Неизвестный тип вопроса: ${question.type}`);
    }
  }

  // Проверяем, что в ответах нет лишних полей, которых нет в структуре
  const allowedKeys = new Set(surveyStructure.map(q => q.id));
  for (const key in responseData) {
    if (!allowedKeys.has(key)) {
      errors.push(`Поле "${key}" не является частью анкеты`);
    }
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

// Вспомогательные функции валидации

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  // Простая проверка: может содержать цифры, плюс, тире, скобки, пробелы
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone);
};

const isValidDate = (dateString: string): boolean => {
  // Проверка формата ГГГГ-ММ-ДД
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

const isValidDateTime = (dateTimeString: string): boolean => {
  // Проверка формата ISO или ГГГГ-ММ-ДДTЧЧ:ММ:СС
  const date = new Date(dateTimeString);
  return date instanceof Date && !isNaN(date.getTime());
};