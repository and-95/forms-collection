// shared/models/survey.model.ts
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

export interface Survey {
  id: string;
  title: string;
  description?: string;
  structure: Question[];
  expires_at?: string;     // null = forever
  is_anonymous: boolean;
  qr_code?: string;        // base64
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  responseCount?: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  data: Record<string, any>; // {q1: "text", q2: ["opt1", "opt2"], ...}
  ip?: string;               // null if is_anonymous
  submitted_at: string;
}

export interface SurveySubmission {
  [questionId: string]: string | string[] | number | boolean;
}

export interface User {
  id: string;
  login: string;
  role: 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  mustChangePassword?: boolean;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

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