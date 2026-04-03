-- ========================================
-- Реляционная схема базы данных для АИИО РБ
-- ========================================
-- 11 таблиц с полными связями и ограничениями целостности

-- 1. ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
-- Хранит данные о пользователях системы
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    blocked_by UUID REFERENCES profiles(id),
    session_invalidated_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. УЧРЕЖДЕНИЯ ОБРАЗОВАНИЯ
-- Основные учреждения (школы, колледжи, техникумы)
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('Дошкольное', 'Общее среднее', 'Среднее специальное', 'Профессиональное')),
    region TEXT NOT NULL,
    city TEXT NOT NULL,
    street TEXT,
    house_number TEXT,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone TEXT,
    email TEXT,
    website TEXT,
    description TEXT,
    license_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. УЧАЩИЕСЯ
-- Связана с учреждениями через institution_id
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    grade TEXT NOT NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    address TEXT,
    parent_phone TEXT,
    parent_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. РАБОТНИКИ
-- Связана с учреждениями через institution_id
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    department TEXT,
    hire_date DATE,
    education TEXT,
    specialty TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. СТАТИСТИКА (статистика)
-- Связана с учреждениями для хранения агрегированных данных
CREATE TABLE IF NOT EXISTS statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('students', 'staff', 'performance', 'attendance', 'financial')),
    metric_name TEXT NOT NULL,
    value INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    calculated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ОТЧЕТЫ (отчеты)
-- Связана с пользователями (who created) и учреждениями (for what)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('institution', 'students', 'staff', 'statistics', 'summary')),
    title TEXT NOT NULL,
    format TEXT CHECK (format IN ('pdf', 'xlsx', 'doc', 'csv')),
    data JSONB,
    file_path TEXT,
    filters JSONB,
    is_generated BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ШАБЛОНЫ ОТЧЕТОВ
-- Связана с профилем создателя
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL,
    config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. УВЕДОМЛЕНИЯ (уведомления)
-- Связана с пользователями (получатель) и отчетами (связанный отчет)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('system', 'report', 'alert', 'reminder', 'info')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 9. НАСТРОЙКИ УВЕДОМЛЕНИЙ
-- Связана с профилями пользователей (one-to-one)
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    report_ready_notifications BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT FALSE,
    reminder_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ЛОГИ СИСТЕМЫ
-- Связана с профилями пользователей
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. СЕССИИ ПОЛЬЗОВАТЕЛЕЙ
-- Связана с профилями пользователей
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_info TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    geo_location JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ========================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- ========================================

-- Учреждения
CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(type);
CREATE INDEX IF NOT EXISTS idx_institutions_region ON institutions(region);
CREATE INDEX IF NOT EXISTS idx_institutions_city ON institutions(city);
CREATE INDEX IF NOT EXISTS idx_institutions_active ON institutions(is_active);

-- Учащиеся
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_gender ON students(gender);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(full_name);

-- Работники
CREATE INDEX IF NOT EXISTS idx_staff_institution ON staff(institution_id);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(full_name);

-- Статистика
CREATE INDEX IF NOT EXISTS idx_statistics_institution ON statistics(institution_id);
CREATE INDEX IF NOT EXISTS idx_statistics_category ON statistics(category);
CREATE INDEX IF NOT EXISTS idx_statistics_period ON statistics(period_start, period_end);

-- Отчеты
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_institution ON reports(institution_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

-- Уведомления
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- Логи
CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at);

-- Сессии
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- ========================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS)
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Institutions policies
CREATE POLICY "institutions_select" ON institutions FOR SELECT USING (true);
CREATE POLICY "institutions_insert" ON institutions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "institutions_update" ON institutions FOR UPDATE USING (auth.role() = 'authenticated');

-- Students policies
CREATE POLICY "students_select" ON students FOR SELECT USING (true);
CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "students_update" ON students FOR UPDATE USING (auth.role() = 'authenticated');

-- Staff policies
CREATE POLICY "staff_select" ON staff FOR SELECT USING (true);
CREATE POLICY "staff_insert" ON staff FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "staff_update" ON staff FOR UPDATE USING (auth.role() = 'authenticated');

-- Statistics policies
CREATE POLICY "statistics_select" ON statistics FOR SELECT USING (true);
CREATE POLICY "statistics_insert" ON statistics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "statistics_update" ON statistics FOR UPDATE USING (auth.role() = 'authenticated');

-- Reports policies
CREATE POLICY "reports_select" ON reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Report templates policies
CREATE POLICY "report_templates_select" ON report_templates FOR SELECT USING (true);
CREATE POLICY "report_templates_insert" ON report_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications policies
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Notification settings policies
CREATE POLICY "notification_settings_select" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_insert" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings_update" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- Logs policies
CREATE POLICY "logs_insert" ON logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "logs_select" ON logs FOR SELECT USING (auth.role() = 'authenticated');

-- User sessions policies
CREATE POLICY "user_sessions_select" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_sessions_insert" ON user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_sessions_update" ON user_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ========================================

-- Автоматическое создание профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Автоматическое создание настроек уведомлений
CREATE OR REPLACE FUNCTION create_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_settings (user_id)
    VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_notification_settings();

-- Обновление времени последней активности сессии
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_activity_update
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();

-- ========================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS) ДЛЯ УДОБНЫХ ЗАПРОСОВ
-- ========================================

-- Статистика по учреждениям (активно использует таблицу statistics)
CREATE OR REPLACE VIEW v_institution_statistics AS
SELECT 
    i.name AS institution_name,
    i.type AS institution_type,
    i.region,
    i.city,
    s.category,
    s.metric_name,
    s.value,
    s.period_start,
    s.period_end
FROM statistics s
JOIN institutions i ON s.institution_id = i.id;

-- Активные уведомления пользователя (активно использует таблицу notifications)
CREATE OR REPLACE VIEW v_user_notifications AS
SELECT 
    n.id,
    n.user_id,
    n.type,
    n.priority,
    n.title,
    n.message,
    n.is_read,
    n.created_at,
    r.title AS report_title
FROM notifications n
LEFT JOIN reports r ON n.report_id = r.id;

-- Сводка по учащимся и работникам (JOIN всех основных таблиц)
CREATE OR REPLACE VIEW v_institution_summary AS
SELECT 
    i.id AS institution_id,
    i.name AS institution_name,
    i.type AS institution_type,
    COUNT(DISTINCT st.id)::INTEGER AS students_count,
    COUNT(DISTINCT sf.id)::INTEGER AS staff_count,
    COUNT(DISTINCT CASE WHEN st.gender = 'male' THEN st.id END)::INTEGER AS male_students,
    COUNT(DISTINCT CASE WHEN st.gender = 'female' THEN st.id END)::INTEGER AS female_students
FROM institutions i
LEFT JOIN students st ON st.institution_id = i.id AND st.is_active = TRUE
LEFT JOIN staff sf ON sf.institution_id = i.id AND sf.is_active = TRUE
GROUP BY i.id, i.name, i.type;