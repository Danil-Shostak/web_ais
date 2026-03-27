// ========================================
// Основной файл приложения
// ========================================

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация приложения...');
    
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
