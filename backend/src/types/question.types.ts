// src/types/question.types.ts

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'select'
  | 'checkbox'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'scale';

export interface Question {
  id: string; // UUIDv4 или nanoid()
  type: QuestionType;
  label: string;       // "Ваше имя?"
  description?: string; // "Пожалуйста, укажите полностью"
  required: boolean;
  // Опционально, по типу:
  options?: { id: string; label: string }[]; // для radio/select/checkbox
  min?: number;   // для scale
  max?: number;   // для scale (default 5)
  step?: number;  // для scale (default 1)
}