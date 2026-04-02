-- Миграция: добавление полей координат для учреждений
-- Дата: 2026-04-02

-- Добавляем колонки latitude и longitude, если их нет
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

-- Создаем индекс для оптимизации запросов с координатами
CREATE INDEX IF NOT EXISTS idx_institutions_coords ON institutions(latitude, longitude);
