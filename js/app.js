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
        showNotification('error', 'Ошибка инициализации приложения');
    }
});

// Обработчик ошибок
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, source, lineno, colno, error);
    
    // Логирование ошибки
    if (currentUser) {
        api.createLog({
            user_id: currentUser.id,
            action: 'error',
            details: `Ошибка: ${message} в ${source}:${lineno}:${colno}`
        }).catch(console.error);
    }
    
    showNotification('error', 'Произошла ошибка. Пожалуйста, обновите страницу.');
};

// Обработчик необработанных промисов
window.onunhandledrejection = function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (currentUser) {
        api.createLog({
            user_id: currentUser.id,
            action: 'error',
            details: `Необработанная ошибка: ${event.reason}`
        }).catch(console.error);
    }
};

// Функция просмотра учреждения
async function viewInstitution(id) {
    try {
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
                        <span>${institution.name}</span>
                    </div>
                    <div class="detail-item">
                        <label>Тип</label>
                        <span>${institution.type}</span>
                    </div>
                    <div class="detail-item">
                        <label>Регион</label>
                        <span>${institution.region || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Адрес</label>
                        <span>${institution.address || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Телефон</label>
                        <span>${institution.phone ? formatPhone(institution.phone) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <span>${institution.email || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Сайт</label>
                        <span>${institution.website || '-'}</span>
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
                    <p>${institution.description}</p>
                </div>
            ` : ''}
        `;
        
        const buttons = [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ];
        
        if (canAccess('institutions.edit')) {
            buttons.unshift({
                label: 'Редактировать',
                onclick: `editInstitution(${id})`,
                class: 'btn-primary'
            });
        }
        
        showModal(institution.name, content, buttons);
        
    } catch (error) {
        console.error('Error viewing institution:', error);
        showNotification('error', 'Ошибка загрузки данных учреждения');
    }
}

// Функция просмотра учащегося
async function viewStudent(id) {
    try {
        const student = await api.getStudentById(id);
        
        if (!student) {
            showNotification('error', 'Учащийся не найден');
            return;
        }
        
        const institution = await api.getInstitutionById(student.institution_id);
        
        const content = `
            <div class="detail-section">
                <h3>Основная информация</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>ФИО</label>
                        <span>${student.full_name}</span>
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
                        <span>${student.grade}</span>
                    </div>
                    <div class="detail-item">
                        <label>Учреждение</label>
                        <span>${institution ? institution.name : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Адрес</label>
                        <span>${student.address || '-'}</span>
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
        
        showModal(student.full_name, content, buttons);
        
    } catch (error) {
        console.error('Error viewing student:', error);
        showNotification('error', 'Ошибка загрузки данных учащегося');
    }
}

// Функция просмотра работника
async function viewStaff(id) {
    try {
        const staff = await api.getStaffById(id);
        
        if (!staff) {
            showNotification('error', 'Работник не найден');
            return;
        }
        
        const institution = await api.getInstitutionById(staff.institution_id);
        
        const content = `
            <div class="detail-section">
                <h3>Основная информация</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>ФИО</label>
                        <span>${staff.full_name}</span>
                    </div>
                    <div class="detail-item">
                        <label>Должность</label>
                        <span>${staff.position}</span>
                    </div>
                    <div class="detail-item">
                        <label>Учреждение</label>
                        <span>${institution ? institution.name : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Дата приема</label>
                        <span>${formatDate(staff.hire_date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Образование</label>
                        <span>${staff.education || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Специальность</label>
                        <span>${staff.specialty || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Телефон</label>
                        <span>${staff.phone ? formatPhone(staff.phone) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <span>${staff.email || '-'}</span>
                    </div>
                </div>
            </div>
        `;
        
        const buttons = [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ];
        
        showModal(staff.full_name, content, buttons);
        
    } catch (error) {
        console.error('Error viewing staff:', error);
        showNotification('error', 'Ошибка загрузки данных работника');
    }
}

// Функция редактирования учреждения
function editInstitution(id) {
    closeModal();
    navigateTo('institutions');
    
    // Через небольшую задержку вызываем функцию редактирования в модуле учреждений
    setTimeout(() => {
        if (window.institutionsPage && window.institutionsPage.edit) {
            window.institutionsPage.edit(id);
        }
    }, 100);
}

// Глобальные функции для совместимости
window.viewInstitution = viewInstitution;
window.viewStudent = viewStudent;
window.viewStaff = viewStaff;
window.editInstitution = editInstitution;