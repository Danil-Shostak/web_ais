// ========================================
// Инициализация Supabase клиента
// ========================================

// Создаем Supabase клиент с использованием конфигурации
const supabase = window.supabase.createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey
);

console.log('Supabase клиент инициализирован');
console.log('Supabase URL:', CONFIG.supabase.url);