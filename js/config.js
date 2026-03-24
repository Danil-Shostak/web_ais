// ========================================
// Конфигурация приложения
// ========================================

const CONFIG = {
    // Настройки Supabase
    supabase: {
        url: 'https://ohjftdvryldrdkerxvsa.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oamZ0ZHZyeWxkcmRrZXJ4dnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODE0MTcsImV4cCI6MjA4OTk1NzQxN30.3WZ-_GMNTnrUOcWJpwcgcvVrWG-ZgwHopVEMLRrq9TQ'
    },
    
    // Настройки приложения
    app: {
        name: 'АИИО РБ',
        fullName: 'Автоматизация аналитической информации учреждений образования',
        version: '1.0.0'
    },
    
    // Настройки пагинации
    pagination: {
        defaultPageSize: 20,
        pageSizeOptions: [10, 20, 50, 100]
    },
    
    // Настройки даты
    dateFormat: {
        display: 'DD.MM.YYYY',
        storage: 'YYYY-MM-DD'
    },
    
    // Типы учреждений образования
    institutionTypes: [
        'Дошкольное',
        'Общее среднее',
        'Профессионально-техническое',
        'Среднее специальное',
        'Высшее',
        'Дополнительное'
    ],
    
    // Роли пользователей
    userRoles: {
        admin: 'Администратор',
        user: 'Пользователь',
        editor: 'Редактор'
    },
    
    // Типы отчетов
    reportTypes: [
        { id: 'institution', name: 'Отчет по учреждению', format: ['pdf', 'doc', 'xlsx'] },
        { id: 'students', name: 'Отчет по учащимся', format: ['pdf', 'xlsx'] },
        { id: 'staff', name: 'Отчет по работникам', format: ['pdf', 'xlsx'] },
        { id: 'statistics', name: 'Статистический отчет', format: ['pdf', 'xlsx'] }
    ],
    
    // Категории статистики
    statisticsCategories: [
        'Количество учащихся',
        'Количество работников',
        'Успеваемость',
        'Посещаемость',
        'Достижения',
        'Нарушения'
    ]
};

// Инициализация Supabase клиента (исправлено)
if (typeof supabase !== 'undefined' && supabase.createClient) {
    window.supabaseClient = supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
    );
    console.log('Supabase клиент инициализирован');
    console.log('Supabase URL:', CONFIG.supabase.url);
} else {
    console.error('Supabase SDK не загружен! Проверьте подключение скрипта.');
}

// Функция для получения базового URL API
const API_URL = CONFIG.supabase.url + '/rest/v1';

// Настройки для fetch
const API_OPTIONS = {
    headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.supabase.anonKey,
        'Prefer': 'return=representation'
    }
};

// Вспомогательная функция для проверки подключения
async function testSupabaseConnection() {
    try {
        const { data, error } = await window.supabaseClient
            .from('your_table_name')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('Ошибка подключения к Supabase:', error);
            return false;
        }
        
        console.log('Supabase подключен успешно');
        return true;
    } catch (error) {
        console.error('Ошибка подключения к Supabase:', error);
        return false;
    }
}

// Экспортируем глобальные переменные
window.CONFIG = CONFIG;
window.API_URL = API_URL;
window.API_OPTIONS = API_OPTIONS;