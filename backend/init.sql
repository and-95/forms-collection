-- init.sql — точная модель из ТЗ + best practices

-- Расширения (для UUID, генерации и т.д.)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  login VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'superadmin')),
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица анкет
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL,  -- см. пример в ТЗ
  expires_at TIMESTAMPTZ,    -- NULL = бессрочно
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  qr_code TEXT,               -- base64 PNG
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица ответов
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  ip INET,                    -- NULL если is_anonymous = true
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица аудита
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(32) NOT NULL,
  target_type VARCHAR(16),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- === Индексы по ТЗ (п. VI) ===

-- Быстрый поиск своих анкет
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by);

-- Быстрый поиск активных анкет по сроку (для /submit валидации)
CREATE INDEX IF NOT EXISTS idx_surveys_active_expires
  ON surveys(is_active, expires_at)
  WHERE is_active = true;

-- Для аналитики: фильтр по конкретному вопросу в JSONB (например, "q2")
-- Можно добавлять по мере необходимости — пока база
-- CREATE INDEX idx_responses_data_q2 ON responses USING GIN ((data -> 'q2'));

-- === Функция и триггеры для updated_at ===

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_surveys_updated_at ON surveys;
CREATE TRIGGER trigger_update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();