-- ========================================
-- Миграция: Добавление колонок для используемых таблиц
-- ========================================

-- 1. Добавляем недостающие колонки в notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('system', 'report', 'alert', 'reminder', 'info'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;

-- 2. Добавляем недостающие колонки в reports  
ALTER TABLE reports ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

-- 3. Добавляем недостающие колонки в statistics
ALTER TABLE statistics ADD COLUMN IF NOT EXISTS metric_name TEXT;
ALTER TABLE statistics ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE statistics ADD COLUMN IF NOT EXISTS period_end DATE;

-- 4. Добавляем app_user_roles если её нет
CREATE TABLE IF NOT EXISTS app_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'editor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Заполняем статистику данными из существующих таблиц
-- Сначала очистим старые записи
DELETE FROM statistics WHERE true;

-- Добавляем статистику по учреждениям
INSERT INTO statistics (institution_id, category, metric_name, value, period_start, period_end)
SELECT 
    i.id,
    'institutions',
    'total_count',
    1,
    CURRENT_DATE,
    CURRENT_DATE
FROM institutions i WHERE i.is_active = TRUE;

-- Добавляем статистику по учащимся
INSERT INTO statistics (institution_id, category, metric_name, value, period_start, period_end)
SELECT 
    s.institution_id,
    'students',
    'total_count',
    COUNT(*),
    CURRENT_DATE,
    CURRENT_DATE
FROM students s 
WHERE s.is_active = TRUE
GROUP BY s.institution_id;

-- Добавляем статистику по работникам
INSERT INTO statistics (institution_id, category, metric_name, value, period_start, period_end)
SELECT 
    st.institution_id,
    'staff',
    'total_count',
    COUNT(*),
    CURRENT_DATE,
    CURRENT_DATE
FROM staff st 
WHERE st.is_active = TRUE
GROUP BY st.institution_id;

-- 6. Создаем тестовое уведомление для админа
INSERT INTO notifications (user_id, type, title, message)
SELECT 
    p.user_id,
    'info',
    'Добро пожаловать в АИИО РБ!',
    'Система автоматизации учреждений образования готова к использованию.'
FROM profiles p 
WHERE p.role = 'admin'
LIMIT 1;

-- 7. Индексы если ещё не созданы
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_statistics_metric ON statistics(metric_name);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_user ON app_user_roles(user_id);