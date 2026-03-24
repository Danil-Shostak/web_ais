// ========================================
// Инициализация Supabase клиента
// ========================================

// Функция инициализации Supabase клиента
function initSupabaseClient() {
    // Ждем пока загрузится CONFIG
    if (typeof CONFIG === 'undefined') {
        console.log('Waiting for CONFIG to load...');
        setTimeout(initSupabaseClient, 100);
        return;
    }
    
    // Проверяем, загружен ли Supabase SDK
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        // Создаем клиент
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
}

// Запускаем инициализацию
initSupabaseClient();