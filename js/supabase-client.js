// ========================================
// Инициализация Supabase клиента
// ========================================

// Supabase SDK уже создаёт глобальную переменную supabase
// Здесь мы просто убеждаемся, что она доступна
if (typeof window.supabase !== 'undefined') {
    console.log('Supabase клиент инициализирован');
} else {
    console.error('Supabase SDK не загружен');
}