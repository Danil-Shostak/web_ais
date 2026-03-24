-- ========================================
-- Схема базы данных для АИИО РБ
-- Автоматизация аналитической информации учреждений образования
-- ========================================

-- Таблица профилей пользователей (расширение auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица учреждений образования
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Дошкольное', 'Общее среднее', 'Профессионально-техническое', 'Среднее специальное', 'Высшее', 'Дополнительное')),
    region TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица учащихся
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    grade INTEGER CHECK (grade BETWEEN 1 AND 11),
    address TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица работников
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    hire_date DATE,
    education TEXT,
    specialty TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица статистики
CREATE TABLE IF NOT EXISTS statistics (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    value NUMERIC NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица отчетов
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT,
    format TEXT,
    data JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Таблица логов действий
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица настроек
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица связей (many-to-many для учреждений)
CREATE TABLE IF NOT EXISTS institution_contacts (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL,
    contact_value TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(type);
CREATE INDEX IF NOT EXISTS idx_institutions_region ON institutions(region);
CREATE INDEX IF NOT EXISTS idx_students_institution_id ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_staff_institution_id ON staff(institution_id);
CREATE INDEX IF NOT EXISTS idx_staff_position ON staff(position);
CREATE INDEX IF NOT EXISTS idx_statistics_institution_id ON statistics(institution_id);
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Политики RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_contacts ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Profiles are viewable by authenticated users" 
    ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" 
    ON profiles FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
    );

-- Политики для institutions
CREATE POLICY "Institutions are viewable by authenticated users" 
    ON institutions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can insert institutions" 
    ON institutions FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'editor'))
    );

CREATE POLICY "Editors can update institutions" 
    ON institutions FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'editor'))
    );

CREATE POLICY "Admins can delete institutions" 
    ON institutions FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
    );

-- Политики для students
CREATE POLICY "Students are viewable by authenticated users" 
    ON students FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can manage students" 
    ON students FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'editor'))
    );

-- Политики для staff
CREATE POLICY "Staff is viewable by authenticated users" 
    ON staff FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can manage staff" 
    ON staff FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'editor'))
    );

-- Политики для statistics
CREATE POLICY "Statistics is viewable by authenticated users" 
    ON statistics FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can manage statistics" 
    ON statistics FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'editor'))
    );

-- Политики для logs (только чтение для админов)
CREATE POLICY "Logs are viewable by admins" 
    ON logs FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Users can insert their own logs" 
    ON logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики для notifications
CREATE POLICY "Users can view own notifications" 
    ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
    ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Триггер для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создание триггера
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Функция для логирования действий
CREATE OR REPLACE FUNCTION public.log_action(
    action TEXT,
    details TEXT
)
RETURNS void AS $$
BEGIN
    INSERT INTO logs (user_id, action, details)
    VALUES (auth.uid(), action, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пример начальных данных для тестирования
INSERT INTO institutions (name, type, region, address, phone, email, description) VALUES
('Гимназия №1 г. Минска', 'Общее среднее', 'Минск', 'ул. Ленина, 1', '+375171100000', 'gymnasium1@minsk.edu.by', 'Гимназия с углубленным изучением иностранных языков'),
('Средняя школа №25 г. Бреста', 'Общее среднее', 'Брестская область', 'ул. Советская, 15', '+375162200000', 'school25@brest.edu.by', 'Общеобразовательная школа'),
('Детский сад №10 г. Гомеля', 'Дошкольное', 'Гомельская область', 'ул. Пушкина, 5', '+37523250000', 'sad10@gomel.edu.by', 'Дошкольное образовательное учреждение'),
('Белорусский государственный университет', 'Высшее', 'Минск', 'пр. Независимости, 4', '+37517200000', 'bsu@bsu.by', 'Ведущий университет Беларуси'),
('Колледж связи г. Минска', 'Среднее специальное', 'Минск', 'ул. Козлова, 5', '+37517290000', 'college@minsksvyaz.by', 'Среднее специальное учебное заведение');

-- Начальные данные для тестирования (после создания пользователей)
-- INSERT INTO profiles (user_id, full_name, role) VALUES 
-- ('uuid-пользователя', 'Администратор', 'admin');