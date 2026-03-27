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

// Функция просмотра учреждения
async function viewInstitution(id) {
    try {
        // Проверяем наличие API
        if (typeof api === 'undefined' || !api.getInstitutionById) {
            throw new Error('API не инициализирован');
        }
        
        const institution = await api.getInstitutionById(id);
        
        if (!institution) {
            showNotification('error', 'Учреждение не найдено');
            return;
        }
        
        const content = `
            <div class="detail-section">
                <h3>Основная информация</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Название</label>
                        <span>${escapeHtml(institution.name)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Тип</label>
                        <span>${escapeHtml(institution.type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Регион</label>
                        <span>${escapeHtml(institution.region || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Адрес</label>
                        <span>${escapeHtml(institution.address || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Телефон</label>
                        <span>${institution.phone ? formatPhone(institution.phone) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <span>${escapeHtml(institution.email || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Сайт</label>
                        <span>${escapeHtml(institution.website || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Дата создания</label>
                        <span>${formatDate(institution.created_at)}</span>
                    </div>
                </div>
            </div>
            ${institution.description ? `
                <div class="detail-section">
                    <h3>Описание</h3>
                    <p>${escapeHtml(institution.description)}</p>
                </div>
            ` : ''}
        `;
        
        const buttons = [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ];
        
        if (typeof canAccess === 'function' && canAccess('institutions.edit')) {
            buttons.unshift({
                label: 'Редактировать',
                onclick: `editInstitution(${id})`,
                class: 'btn-primary'
            });
        }
        
        if (typeof showModal === 'function') {
            showModal(institution.name, content, buttons);
        }
        
    } catch (error) {
        console.error('Error viewing institution:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Ошибка загрузки данных учреждения');
        }
    }
}

// Функция просмотра учащегося
async function viewStudent(id) {
    try {
        if (typeof api === 'undefined' || !api.getStudentById) {
            throw new Error('API не инициализирован');
        }
        
        const student = await api.getStudentById(id);
        
        if (!student) {
            showNotification('error', 'Учащийся не найден');
            return;
        }
        
        let institutionName = '-';
        if (student.institution_id && typeof api.getInstitutionById === 'function') {
            try {
                const institution = await api.getInstitutionById(student.institution_id);
                institutionName = institution ? institution.name : '-';
            } catch (e) {
                console.warn('Failed to load institution:', e);
            }
        }
        
        const content = `
            <div class="detail-section">
                <h3>Основная информация</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>ФИО</label>
                        <span>${escapeHtml(student.full_name)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Дата рождения</label>
                        <span>${formatDate(student.birth_date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Пол</label>
                        <span>${student.gender === 'male' ? 'Мужской' : 'Женский'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Класс</label>
                        <span>${escapeHtml(student.grade)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Учреждение</label>
                        <span>${escapeHtml(institutionName)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Адрес</label>
                        <span>${escapeHtml(student.address || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Телефон родителей</label>
                        <span>${student.parent_phone ? formatPhone(student.parent_phone) : '-'}</span>
                    </div>
                </div>
            </div>
        `;
        
        const buttons = [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ];
        
        if (typeof showModal === 'function') {
            showModal(student.full_name, content, buttons);
        }
        
    } catch (error) {
        console.error('Error viewing student:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Ошибка загрузки данных учащегося');
        }
    }
}

// Функция просмотра работника
async function viewStaff(id) {
    try {
        if (typeof api === 'undefined' || !api.getStaffById) {
            throw new Error('API не инициализирован');
        }
        
        const staff = await api.getStaffById(id);
        
        if (!staff) {
            showNotification('error', 'Работник не найден');
            return;
        }
        
        let institutionName = '-';
        if (staff.institution_id && typeof api.getInstitutionById === 'function') {
            try {
                const institution = await api.getInstitutionById(staff.institution_id);
                institutionName = institution ? institution.name : '-';
            } catch (e) {
                console.warn('Failed to load institution:', e);
            }
        }
        
        const content = `
            <div class="detail-section">
                <h3>Основная информация</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>ФИО</label>
                        <span>${escapeHtml(staff.full_name)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Должность</label>
                        <span>${escapeHtml(staff.position)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Учреждение</label>
                        <span>${escapeHtml(institutionName)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Дата приема</label>
                        <span>${formatDate(staff.hire_date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Образование</label>
                        <span>${escapeHtml(staff.education || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Специальность</label>
                        <span>${escapeHtml(staff.specialty || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Телефон</label>
                        <span>${staff.phone ? formatPhone(staff.phone) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <span>${escapeHtml(staff.email || '-')}</span>
                    </div>
                </div>
            </div>
        `;
        
        const buttons = [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ];
        
        if (typeof showModal === 'function') {
            showModal(staff.full_name, content, buttons);
        }
        
    } catch (error) {
        console.error('Error viewing staff:', error);
        if (typeof showNotification === 'function') {
            showNotification('error', 'Ошибка загрузки данных работника');
        }
    }
}

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
window.viewInstitution = viewInstitution;
window.viewStudent = viewStudent;
window.viewStaff = viewStaff;
window.editInstitution = editInstitution;