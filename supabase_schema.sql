-- ========================================
-- Схема базы данных для АИИО РБ (Supabase)
-- ========================================

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица учреждений образования
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    region TEXT,
    city TEXT,
    street TEXT,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone TEXT,
    email TEXT,
    website TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица учащихся
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    grade TEXT,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    address TEXT,
    parent_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица работников
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    position TEXT,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    hire_date DATE,
    education TEXT,
    specialty TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица статистики
CREATE TABLE IF NOT EXISTS statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    category TEXT,
    value INTEGER,
    date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица отчетов
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    type TEXT,
    title TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица логов
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title TEXT,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Политики безопасности (Row Level Security)
-- ========================================

-- Профили - все авторизованные пользователи могут читать, редактировать свой профиль
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Профили могут читать все" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Профили могут обновять свои" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Профили могут создавать свои" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Учреждения - все авторизованные пользователи могут читать
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Учреждения могут читать все" ON institutions
    FOR SELECT USING (true);

CREATE POLICY "Учреждения могут создавать авторизованные" ON institutions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Учреждения могут обновлять авторизованные" ON institutions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Учреждения могут удалять авторизованные" ON institutions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Аналогичные политики для остальных таблиц
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Учащиеся могут читать все" ON students FOR SELECT USING (true);
CREATE POLICY "Учащиеся могут создавать авторизованные" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Учащиеся могут обновлять авторизованные" ON students FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Учащиеся могут удалять авторизованные" ON students FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Работники могут читать все" ON staff FOR SELECT USING (true);
CREATE POLICY "Работники могут создавать авторизованные" ON staff FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Работники могут обновлять авторизованные" ON staff FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Работники могут удалять авторизованные" ON staff FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Статистика может читать все" ON statistics FOR SELECT USING (true);
CREATE POLICY "Статистика может создавать авторизованные" ON statistics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Статистика может обновлять авторизованные" ON statistics FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Статистика может удалять авторизованные" ON statistics FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Отчеты могут читать авторизованные" ON reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Отчеты могут создавать авторизованные" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Отчеты могут удалять свои" ON reports FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Логи могут создавать авторизованные" ON logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Логи могут читать админы" ON logs FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Уведомления могут читать свои" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Уведомления могут создавать авторизованные" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Уведомления могут обновять свои" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- Создание индексов для оптимизации
-- ========================================

CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(type);
CREATE INDEX IF NOT EXISTS idx_institutions_region ON institutions(region);
CREATE INDEX IF NOT EXISTS idx_institutions_coords ON institutions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_staff_institution ON staff(institution_id);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);
CREATE INDEX IF NOT EXISTS idx_statistics_institution ON statistics(institution_id);
CREATE INDEX IF NOT EXISTS idx_statistics_category ON statistics(category);
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);