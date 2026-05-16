// ========================================
// Инициализация Supabase клиента
// ========================================

// Функция инициализации Supabase клиента
// Задержка для ожидания загрузки CONFIG
let configRetry = 0;
function initSupabaseClient() {
    // Ждем пока загрузится CONFIG
    if (typeof CONFIG === 'undefined') {
        configRetry++;
        if (configRetry > 50) {
            console.error('CONFIG не найден после 5 секунд ожидания. Проверьте js/config.js');
            return;
        }
        console.log('Waiting for CONFIG to load...');
        setTimeout(initSupabaseClient, 100);
        return;
    }
    
    // Валидация конфигурации
    if (!CONFIG.supabase.url || !CONFIG.supabase.anonKey) {
        console.error('Supabase URL или anonKey не настроены. Укажите SB_URL и SB_ANON_KEY в js/config.js');
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
    } else {
        console.error('Supabase SDK не загружен или не поддерживает createClient');
    }
}

// Запускаем инициализацию
initSupabaseClient();