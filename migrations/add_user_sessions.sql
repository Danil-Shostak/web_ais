-- Миграция: отслеживание сессий и email в профилях
-- Выполните в SQL Editor Supabase

-- Добавляем email в profiles (если ещё нет)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_invalidated_at TIMESTAMPTZ;

-- Таблица активных сессий
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    session_token TEXT,
    device_info TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active);

-- RLS для user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Пользователи видят свои сессии, админы видят все
CREATE POLICY "Сессии: пользователи видят свои, админы все" ON user_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "Сессии: пользователи создают свои" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Сессии: пользователи обновляют свои, админы все" ON user_sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "Сессии: админы могут удалять" ON user_sessions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
    );

-- Обновляем RLS для profiles - разрешаем админам обновлять все профили
DROP POLICY IF EXISTS "Профили могут обновлять свои" ON profiles;
CREATE POLICY "Профили могут обновлять свои или админы" ON profiles
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
    );
