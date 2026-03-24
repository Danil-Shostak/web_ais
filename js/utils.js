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

// Показать уведомление
function showNotification(type, message) {
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
function navigateTo(page) {
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
        { id: 'dashboard', icon: '📊', label: 'Главная', roles: ['admin', 'editor', 'user'] },
        { id: 'institutions', icon: '🏫', label: 'Учреждения', roles: ['admin', 'editor', 'user'] },
        { id: 'students', icon: '👨‍🎓', label: 'Учащиеся', roles: ['admin', 'editor', 'user'] },
        { id: 'staff', icon: '👨‍🏫', label: 'Работники', roles: ['admin', 'editor', 'user'] },
        { id: 'statistics', icon: '📈', label: 'Статистика', roles: ['admin', 'editor', 'user'] },
        { id: 'reports', icon: '📄', label: 'Отчеты', roles: ['admin', 'editor'] },
        { id: 'import', icon: '📥', label: 'Импорт', roles: ['admin', 'editor'] },
        { id: 'settings', icon: '⚙️', label: 'Настройки', roles: ['admin', 'editor', 'user'] }
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

// Уведомления
async function showNotifications() {
    if (!currentUser) return;
    
    try {
        const notifications = await api.getNotifications(currentUser.id);
        
        const content = notifications.length > 0 ? `
            <ul class="activity-list">
                ${notifications.map(n => `
                    <li>
                        <div class="activity-icon">🔔</div>
                        <div class="activity-info">
                            <p>${n.message}</p>
                            <span>${formatDate(n.created_at, 'datetime')}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        ` : '<p class="text-center text-muted">Уведомлений нет</p>';
        
        showModal('Уведомления', content, [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ]);
        
        // Обновить счетчик уведомлений
        updateNotificationBadge(0);
        
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// Обновление бейджа уведомлений
function updateNotificationBadge(count) {
    document.getElementById('notificationBadge').textContent = count;
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