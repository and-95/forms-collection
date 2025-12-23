export interface Survey {
  id: string;
  title: string;
  description?: string;
  structure: Question[];
  expires_at?: Date;
  is_active: boolean;
  is_anonymous: boolean;
  qr_code?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// Question, QuestionType — уже есть в src/types/index.ts