// ========================================
// Инициализация Supabase клиента
// ========================================

// Проверяем, загружен ли Supabase SDK
if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    // Создаем клиент и присваиваем в глобальную переменную supabase
    window.supabaseClient = window.supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
    );
    
    // Создаем глобальную ссылку для обратной совместимости
    window.supabase = window.supabaseClient;
    
    console.log('Supabase клиент инициализирован');
    console.log('Supabase URL:', CONFIG.supabase.url);
} else {
    console.error('Supabase SDK не загружен или не поддерживает createClient');
}