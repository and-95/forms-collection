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
  expiresAt?: string;     // null = forever
  isAnonymous: boolean;
  qrCode?: string;        // base64
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  data: Record<string, any>; // {q1: "text", q2: ["opt1", "opt2"], ...}
  ip?: string;               // null if is_anonymous
  submittedAt: string;
}

export interface SurveySubmission {
  [questionId: string]: string | string[] | number | boolean;
}

export interface User {
  id: string;
  login: string;
  role: 'admin' | 'superadmin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}