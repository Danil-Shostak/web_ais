// ========================================
// Основной файл приложения
// ========================================

// ========================================
// Переключатель темы
// ========================================
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (isDark) {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

function applyStoredTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeIcon(true);
    }
}

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация приложения...');
    
    applyStoredTheme();
    
    try {
        // Инициализация аутентификации (использует Supabase)
        await initAuth();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Ошибка инициализации приложения');
        }
    }
});

// Глобальный обработчик ошибок
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, source, lineno, colno, error);
    
    // Логирование ошибки с проверкой наличия зависимостей
    if (typeof currentUser !== 'undefined' && currentUser && typeof api !== 'undefined') {
        const errorDetails = {
            message: message,
            source: source,
            lineno: lineno,
            colno: colno,
            stack: error?.stack,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        api.createLog({
            user_id: currentUser.id,
            action: 'error',
            details: JSON.stringify(errorDetails)
        }).catch(err => {
            // Используем console.warn, чтобы избежать рекурсии
            console.warn('Failed to log error:', err);
        });
    }
    
    if (typeof showNotification === 'function') {
        showNotification('error', 'Произошла ошибка. Пожалуйста, обновите страницу.');
    }
    
    // Предотвращаем стандартное поведение браузера
    return true;
};

// Обработчик необработанных промисов (исправлен)
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (typeof currentUser !== 'undefined' && currentUser && typeof api !== 'undefined') {
        const errorDetails = {
            type: 'unhandledrejection',
            reason: event.reason?.toString() || 'Unknown',
            stack: event.reason?.stack,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        api.createLog({
            user_id: currentUser.id,
            action: 'error',
            details: JSON.stringify(errorDetails)
        }).catch(err => {
            console.warn('Failed to log unhandled rejection:', err);
        });
    }
    
    if (typeof showNotification === 'function') {
        showNotification('error', 'Произошла ошибка. Пожалуйста, обновите страницу.');
    }
    
    // Предотвращаем стандартное поведение
    event.preventDefault();
});

// Функция редактирования учреждения
function editInstitution(id) {
    if (typeof closeModal === 'function') {
        closeModal();
    }
    
    if (typeof navigateTo === 'function') {
        navigateTo('institutions');
    }
    
    // Через небольшую задержку вызываем функцию редактирования в модуле учреждений
    setTimeout(() => {
        if (window.institutionsPage && typeof window.institutionsPage.edit === 'function') {
            window.institutionsPage.edit(id);
        }
    }, 100);
}

// Вспомогательная функция для экранирования HTML (безопасность)
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Глобальные функции для совместимости
window.editInstitution = editInstitution;
