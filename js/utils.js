// ========================================
// Утилиты и вспомогательные функции
// ========================================

// Форматирование даты
function formatDate(dateStr, format = 'display') {
    if (!dateStr) return '-';
    
    const date = new Date(dateStr);
    
    if (format === 'display') {
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    if (format === 'time') {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    if (format === 'datetime') {
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    return dateStr;
}

// Форматирование телефона
function formatPhone(phone) {
    if (!phone) return '-';
    
    // Удаление всех не цифр
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 9) {
        return `+375 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7)}`;
    }
    
    if (digits.length === 11) {
        return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
    }
    
    return phone;
}

// Обрезание текста
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Генерация ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Получение инициалов из ФИО
function getInitials(fullName) {
    if (!fullName) return '-';
    
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Загрузка - показать
function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

// Загрузка - скрыть
function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

// ========================================
// Система уведомлений (in-app)
// ========================================
const appNotifications = [];

function showNotification(type, message) {
    // Добавляем в хранилище
    const notif = {
        id: Date.now(),
        type: type,
        message: message,
        time: new Date(),
        read: false
    };
    appNotifications.unshift(notif);
    if (appNotifications.length > 50) appNotifications.pop();
    
    // Обновляем badge
    const unread = appNotifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unread > 99 ? '99+' : unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
    }
    
    // Показываем toast уведомление
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <span style="font-size: 18px;">${icons[type]}</span>
        <p style="flex: 1;">${message}</p>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

async function showNotifications() {
    const typeLabels = { success: 'Успех', error: 'Ошибка', warning: 'Предупреждение', info: 'Информация' };
    
    // Загружаем уведомления из БД
    let dbNotifications = [];
    if (currentUser?.id) {
        try {
            dbNotifications = await api.getNotifications(currentUser.id);
        } catch (e) {
            console.error('Error loading notifications:', e);
        }
    }
    
    const typeColors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#06b6d4' };
    const typeIcons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    
    let content = '<div style="max-height: 400px; overflow-y: auto;">';
    
    // Показываем уведомления из БД
    if (dbNotifications && dbNotifications.length > 0) {
        content += '<div style="padding: 8px; background: var(--bg-secondary); font-size: 12px; color: var(--text-secondary);">Системные уведомления</div>';
        dbNotifications.forEach(function(n) {
            const nType = n.type || 'info';
            const icon = typeIcons[nType] || 'ℹ';
            const color = typeColors[nType] || '#64748b';
            const label = typeLabels[nType] || nType;
            const timeStr = n.created_at ? formatDate(n.created_at, 'datetime') : '';
            const isRead = n.is_read || false;
            const opacity = isRead ? 'opacity: 0.6;' : '';
            const dot = isRead ? '' : '<span style="width:8px;height:8px;border-radius:50%;background:var(--primary-color);flex-shrink:0;margin-top:4px;"></span>';
            
            content += '<div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px; align-items: flex-start; ' + opacity + '">';
            content += '<span style="color: ' + color + '; font-size: 18px; flex-shrink: 0;">' + icon + '</span>';
            content += '<div style="flex: 1;">';
            content += '<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 2px;">' + label + ' · ' + timeStr + '</div>';
            content += '<div><strong>' + (n.title || '') + '</strong></div>';
            content += '<div style="font-size: 13px;">' + (n.message || '') + '</div>';
            content += '</div>';
            content += dot;
            content += '</div>';
        });
    }
    
    // Показываем временные уведомления
    if (appNotifications && appNotifications.length > 0) {
        content += '<div style="padding: 8px; background: var(--bg-secondary); font-size: 12px; color: var(--text-secondary);">Временные уведомления</div>';
        appNotifications.forEach(function(n) {
            const icon = typeIcons[n.type] || 'ℹ';
            const color = typeColors[n.type] || '#64748b';
            const label = typeLabels[n.type] || n.type;
            const timeStr = formatNotifTime(n.time);
            const opacity = n.read ? 'opacity: 0.6;' : '';
            const dot = n.read ? '' : '<span style="width:8px;height:8px;border-radius:50%;background:var(--primary-color);flex-shrink:0;margin-top:4px;"></span>';
            
            content += '<div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px; align-items: flex-start; ' + opacity + '">';
            content += '<span style="color: ' + color + '; font-size: 18px; flex-shrink: 0;">' + icon + '</span>';
            content += '<div style="flex: 1;">';
            content += '<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 2px;">' + label + ' · ' + timeStr + '</div>';
            content += '<div>' + n.message + '</div>';
            content += '</div>';
            content += dot;
            content += '</div>';
        });
    }
    
    if ((!dbNotifications || dbNotifications.length === 0) && (!appNotifications || appNotifications.length === 0)) {
        content = '<p class="text-muted text-center" style="padding: 24px;">Нет уведомлений</p>';
    } else {
        content += '</div>';
    }
    
    // Помечаем все как прочитанные
    if (dbNotifications && dbNotifications.length > 0) {
        dbNotifications.forEach(async function(n) {
            if (!n.is_read) await api.markNotificationRead(n.id);
        });
    }
    if (appNotifications && appNotifications.length > 0) {
        appNotifications.forEach(function(n) { n.read = true; });
    }
    const badge = document.getElementById('notificationBadge');
    if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
    
    showModal('Уведомления', content, [
        { label: 'Очистить все', onclick: 'clearAllNotifications(); closeModal();', class: 'btn-secondary' },
        { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
    ]);
}

function formatNotifTime(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff/60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ч. назад`;
    return date.toLocaleDateString('ru-RU');
}

function clearAllNotifications() {
    appNotifications.length = 0;
    const badge = document.getElementById('notificationBadge');
    if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
}

// Показать модальное окно
function showModal(title, content, buttons = []) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    
    const footer = document.getElementById('modalFooter');
    footer.innerHTML = buttons.map(btn => 
        `<button class="${btn.class || 'btn-secondary'}" onclick="${btn.onclick}">${btn.label}</button>`
    ).join('');
    
    document.getElementById('modal').classList.add('active');
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Показать ошибку в поле
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

// Очистить ошибки
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}

// Переключение сайдбара на мобильных
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Навигация по страницам
async function navigateTo(page) {
    // Проверка валидности сессии перед навигацией
    if (currentUser?.id) {
        try {
            const profile = await api.getProfile(currentUser.id);
            if (profile && profile.session_invalidated_at) {
                const invalidatedAt = new Date(profile.session_invalidated_at);
                const sessionStoredAt = currentUser.session_created_at ? new Date(currentUser.session_created_at) : new Date(0);
                if (invalidatedAt > sessionStoredAt) {
                    localStorage.removeItem('current_user');
                    localStorage.removeItem('authToken');
                    await supabase.auth.signOut();
                    showLogin();
                    showNotification('error', 'Сессия завершена. Войдите в систему снова.');
                    return;
                }
            }
            if (profile && profile.is_blocked) {
                localStorage.removeItem('current_user');
                localStorage.removeItem('authToken');
                showLogin();
                showNotification('error', 'Ваш аккаунт заблокирован. Обратитесь к администратору.');
                return;
            }
        } catch (e) {
            console.error('Session check error:', e);
        }
    }
    
    // Обновление активного пункта меню
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // Загрузка страницы
    loadPage(page);
}

// Загрузка навигации
function loadNavigation() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;
    
    const menuItems = [
        { id: 'dashboard', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`, label: 'Главная', roles: ['admin', 'editor', 'user'] },
        { id: 'institutions', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path></svg>`, label: 'Учреждения', roles: ['admin', 'editor', 'user'] },
        { id: 'students', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`, label: 'Учащиеся', roles: ['admin', 'editor', 'user'] },
        { id: 'staff', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>`, label: 'Работники', roles: ['admin', 'editor', 'user'] },
        { id: 'statistics', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`, label: 'Статистика', roles: ['admin', 'editor', 'user'] },
        { id: 'reports', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`, label: 'Отчеты', roles: ['admin', 'editor'] },
        { id: 'import', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`, label: 'Импорт', roles: ['admin', 'editor'] },
        { id: 'admin', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`, label: 'Администрирование', roles: ['admin'] },
        { id: 'settings', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`, label: 'Настройки', roles: ['admin', 'editor', 'user'] }
    ];
    
    const userRole = currentUser?.role || 'user';
    
    const html = menuItems
        .filter(item => item.roles.includes(userRole))
        .map(item => `
            <li>
                <a href="#" data-page="${item.id}" onclick="event.preventDefault(); navigateTo('${item.id}')">
                    <span class="nav-icon">${item.icon}</span>
                    <span class="nav-label">${item.label}</span>
                </a>
            </li>
        `).join('');
    
    navMenu.innerHTML = html;
}

// Загрузка страницы
async function loadPage(page) {
    showLoader();
    
    try {
        // Вызов соответствующей функции загрузки страницы
        const pageLoader = window[page + 'Page'];
        
        if (pageLoader && typeof pageLoader.load === 'function') {
            await pageLoader.load();
        } else {
            // Страница не найдена - показываем заглушку
            document.getElementById('pageContent').innerHTML = `
                <div class="empty-state">
                    <h2>Страница в разработке</h2>
                    <p>Страница "${page}" скоро будет доступна.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading page:', error);
        showNotification('error', 'Ошибка загрузки страницы');
    }
    
    hideLoader();
    
    // Закрыть сайдбар на мобильных после навигации
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

// Глобальный поиск
function handleGlobalSearch(event) {
    if (event.key === 'Enter') {
        performGlobalSearch();
    }
}

async function performGlobalSearch() {
    const query = document.getElementById('globalSearch').value.trim();
    
    if (!query) {
        showNotification('warning', 'Введите запрос для поиска');
        return;
    }
    
    showLoader();
    
    try {
        // Поиск по учреждениям
        const institutions = await api.getInstitutions({ search: query });
        
        // Поиск по учащимся
        const students = await api.getStudents({ search: query });
        
        // Поиск по работникам
        const staff = await api.getStaff({ search: query });
        
        // Отображение результатов
        showSearchResults(query, {
            institutions: institutions,
            students: students,
            staff: staff
        });
        
    } catch (error) {
        console.error('Search error:', error);
        showNotification('error', 'Ошибка поиска');
    }
    
    hideLoader();
}

// Показать результаты поиска
function showSearchResults(query, results) {
    const total = results.institutions.length + results.students.length + results.staff.length;
    
    if (total === 0) {
        showNotification('info', 'По запросу ничего не найдено');
        return;
    }
    
    let content = `
        <div class="search-results">
            <h2>Результаты поиска: "${query}"</h2>
            <p class="text-muted">Найдено: ${total} результатов</p>
    `;
    
    if (results.institutions.length > 0) {
        content += `
            <div class="result-section">
                <h3>Учреждения (${results.institutions.length})</h3>
                <ul>
                    ${results.institutions.map(inst => `
                        <li><a href="#" onclick="viewInstitution(${inst.id})">${inst.name}</a></li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    if (results.students.length > 0) {
        content += `
            <div class="result-section">
                <h3>Учащиеся (${results.students.length})</h3>
                <ul>
                    ${results.students.map(student => `
                        <li><a href="#" onclick="viewStudent(${student.id})">${student.full_name}</a></li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    if (results.staff.length > 0) {
        content += `
            <div class="result-section">
                <h3>Работники (${results.staff.length})</h3>
                <ul>
                    ${results.staff.map(s => `
                        <li><a href="#" onclick="viewStaff(${s.id})">${s.full_name}</a></li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    content += '</div>';
    
    document.getElementById('pageContent').innerHTML = `
        <div class="page-header">
            <h1>Поиск</h1>
        </div>
        ${content}
    `;
}

// Обновление бейджа уведомлений
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Экспорт в CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showNotification('warning', 'Нет данных для экспорта');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename + '.csv');
    
    showNotification('success', 'Данные экспортированы в CSV');
}

// Скачивание файла
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type: type });
    saveAs(blob, filename);
}

// Получение случайного цвета
function getRandomColor() {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Debounce функция
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Класс для пагинации
class Paginator {
    constructor(total, pageSize, onPageChange) {
        this.total = total;
        this.pageSize = pageSize;
        this.currentPage = 1;
        this.onPageChange = onPageChange;
    }
    
    get totalPages() {
        return Math.ceil(this.total / this.pageSize);
    }
    
    get offset() {
        return (this.currentPage - 1) * this.pageSize;
    }
    
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.onPageChange(page, this.offset, this.pageSize);
        }
    }
    
    next() {
        this.goToPage(this.currentPage + 1);
    }
    
    prev() {
        this.goToPage(this.currentPage - 1);
    }
    
    render(containerId) {
        const container = document.getElementById(containerId);
        
        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = `
            <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="paginator.prev()">Предыдущая</button>
        `;
        
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" onclick="paginator.goToPage(${i})">${i}</button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<span>...</span>';
            }
        }
        
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} onclick="paginator.next()">Следующая</button>
        `;
        
        container.innerHTML = html;
    }
}

// Глобальный paginator
let paginator = null;

// Экспорт утилит
window.utils = {
    formatDate: formatDate,
    formatPhone: formatPhone,
    truncateText: truncateText,
    generateId: generateId,
    getInitials: getInitials,
    showLoader: showLoader,
    hideLoader: hideLoader,
    showNotification: showNotification,
    showModal: showModal,
    closeModal: closeModal,
    showError: showError,
    clearErrors: clearErrors,
    toggleSidebar: toggleSidebar,
    navigateTo: navigateTo,
    loadNavigation: loadNavigation,
    loadPage: loadPage,
    exportToCSV: exportToCSV,
    showProfileSettings: showProfileSettings
};

// Показать настройки профиля
function showProfileSettings() {
    const content = `
        <div class="settings-section">
            <h3>Профиль пользователя</h3>
            <div class="form-group">
                <label>Email</label>
                <input type="email" value="${currentUser?.email || ''}" disabled>
            </div>
            <div class="form-group">
                <label>Имя</label>
                <input type="text" id="profileName" value="${currentUser?.full_name || ''}">
            </div>
            <button class="btn-primary" onclick="saveProfileSettings()">Сохранить</button>
        </div>
        <div class="settings-section">
            <h3>Изменение пароля</h3>
            <div class="form-group">
                <label>Текущий пароль</label>
                <input type="password" id="currentPassword">
            </div>
            <div class="form-group">
                <label>Новый пароль</label>
                <input type="password" id="newPassword">
            </div>
            <div class="form-group">
                <label>Подтверждение пароля</label>
                <input type="password" id="confirmNewPassword">
            </div>
            <button class="btn-primary" onclick="changePassword()">Изменить пароль</button>
        </div>
    `;
    
    showModal('Настройки профиля', content, [
        { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
    ]);
}

// Сохранение настроек профиля
async function saveProfileSettings() {
    const name = document.getElementById('profileName').value;
    
    try {
        await api.updateProfile(currentUser.id, { full_name: name });
        currentUser.full_name = name;
        localStorage.setItem('current_user', JSON.stringify(currentUser));
        updateUserInfo();
        showNotification('success', 'Профиль обновлен');
        closeModal();
    } catch (error) {
        showNotification('error', 'Ошибка сохранения профиля');
    }
}

// Изменение пароля
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('error', 'Пароли не совпадают');
        return;
    }
    
    const success = await updatePassword(currentPassword, newPassword);
    if (success) {
        closeModal();
    }
}

// Экспорт функций в глобальную область
window.loadNavigation = loadNavigation;
window.loadPage = loadPage;
window.navigateTo = navigateTo;
window.showProfileSettings = showProfileSettings;
window.saveProfileSettings = saveProfileSettings;
window.changePassword = changePassword;

// Функция проверки роли (дублируем для совместимости)
function hasRole(role) {
    const userRole = window.currentUser?.role || window.currentUser?.profile?.role;
    return userRole === role || userRole === 'admin';
}
window.hasRole = hasRole;