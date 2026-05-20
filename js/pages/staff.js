// ========================================
// Страница работников
// ========================================

const staffPage = {
    data: [],
    institutions: [],
    currentPage: 1,
    pageSize: 20,
    editingId: null,
    paginator: null,
    isLoading: false, // Флаг для предотвращения множественных вызовов
    
    // Загрузка страницы
    load: async function() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            const [staff, institutions] = await Promise.all([
                api.getStaff({ limit: 1000 }),
                api.getInstitutions({ limit: 1000 })
            ]);
            this.data = staff || [];
            this.institutions = institutions || [];
            this.currentPage = 1;
            this.filters = {}; // Сброс фильтров
            this.render();
        } catch (error) {
            console.error('Error loading staff:', error);
            this.data = [];
            this.institutions = [];
            this.render();
        } finally {
            this.isLoading = false;
        }
    },
    
    // Рендер страницы
    render: function() {
        const filteredData = this.filterData();
        const totalPages = Math.ceil(filteredData.length / this.pageSize);
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const pageData = filteredData.slice(startIndex, startIndex + this.pageSize);
        
        const html = `
            <div class="page-header">
                <div class="flex flex-between">
                    <div>
                        <h1>Работники</h1>
                        <p>Управление списком работников учреждений образования</p>
                    </div>
                    ${window.canAccess && canAccess('staff.edit') ? `
                        <button class="btn-primary" onclick="staffPage.showAddForm()">
                            + Добавить работника
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Фильтры -->
            <div class="filters-bar">
                <div class="filter-group">
                    <label>Поиск</label>
                    <input type="text" id="searchInput" placeholder="ФИО работника..." 
                           value="${this.escapeHtml(this.filters.search || '')}" 
                           onchange="staffPage.applyFilters()">
                </div>
                <div class="filter-group">
                    <label>Учреждение</label>
                    <select id="institutionFilter" onchange="staffPage.applyFilters()">
                        <option value="">Все учреждения</option>
                        ${this.institutions.map(inst => `
                            <option value="${inst.id}" ${this.filters.institution_id == inst.id ? 'selected' : ''}>${this.escapeHtml(inst.name)}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Должность</label>
                    <select id="positionFilter" onchange="staffPage.applyFilters()">
                        <option value="">Все должности</option>
                        <option value="Директор" ${this.filters.position === 'Директор' ? 'selected' : ''}>Директор</option>
                        <option value="Зам. директора" ${this.filters.position === 'Зам. директора' ? 'selected' : ''}>Зам. директора</option>
                        <option value="Учитель" ${this.filters.position === 'Учитель' ? 'selected' : ''}>Учитель</option>
                        <option value="Воспитатель" ${this.filters.position === 'Воспитатель' ? 'selected' : ''}>Воспитатель</option>
                        <option value="Педагог" ${this.filters.position === 'Педагог' ? 'selected' : ''}>Педагог</option>
                        <option value="Психолог" ${this.filters.position === 'Психолог' ? 'selected' : ''}>Психолог</option>
                        <option value="Администратор" ${this.filters.position === 'Администратор' ? 'selected' : ''}>Администратор</option>
                    </select>
                </div>
            </div>
            
            <!-- Таблица -->
            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ФИО</th>
                                <th>Должность</th>
                                <th>Учреждение</th>
                                <th>Дата приема</th>
                                <th>Телефон</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageData.length > 0 ? pageData.map(staff => {
                                const institution = this.institutions.find(i => i.id === staff.institution_id);
                                return `
                                    <tr>
                                        <td>
                                            <strong>${this.escapeHtml(staff.full_name)}</strong>
                                        </td>
                                        <td>${this.escapeHtml(staff.position)}</td>
                                        <td>${institution ? this.truncateText(institution.name, 25) : '-'}</td>
                                        <td>${this.formatDate(staff.hire_date)}</td>
                                        <td>${staff.phone ? this.formatPhone(staff.phone) : '-'}</td>
                                        <td>
                                            <div class="table-actions">
                                                <button class="btn-icon" onclick="staffPage.viewStaff('${staff.id}')" title="Просмотр">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                </button>
                                                ${window.canAccess && canAccess('staff.edit') ? `
                                                    <button class="btn-icon" onclick="staffPage.edit('${staff.id}')" title="Редактировать">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button class="btn-icon" onclick="staffPage.delete('${staff.id}')" title="Удалить">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr>
                                    <td colspan="6" class="text-center text-muted">
                                        Работники не найдены
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                
                <!-- Пагинация -->
                <div class="pagination" id="paginationContainer"></div>
            </div>
            
            <!-- Модальное окно формы -->
            <div id="formModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="formModalTitle">Добавить работника</h2>
                        <button class="modal-close" onclick="staffPage.closeForm()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="staffForm" onsubmit="staffPage.submitForm(event)">
                            <input type="hidden" id="staffId">
                            
                            <div class="form-group">
                                <label for="full_name">ФИО *</label>
                                <input type="text" id="full_name" required placeholder="Иванов Иван Иванович">
                                <span class="error-message" id="full_nameError"></span>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="position">Должность *</label>
                                    <select id="position" required>
                                        <option value="">Выберите должность</option>
                                        <option value="Директор">Директор</option>
                                        <option value="Зам. директора">Зам. директора</option>
                                        <option value="Учитель">Учитель</option>
                                        <option value="Воспитатель">Воспитатель</option>
                                        <option value="Педагог">Педагог</option>
                                        <option value="Психолог">Психолог</option>
                                        <option value="Администратор">Администратор</option>
                                        <option value="Другое">Другое</option>
                                    </select>
                                    <span class="error-message" id="positionError"></span>
                                </div>
                                <div class="form-group">
                                    <label for="institution_id">Учреждение *</label>
                                    <select id="institution_id" required>
                                        <option value="">Выберите учреждение</option>
                                        ${this.institutions.map(i => `<option value="${i.id}">${this.escapeHtml(i.name)}</option>`).join('')}
                                    </select>
                                    <span class="error-message" id="institution_idError"></span>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="hire_date">Дата приема *</label>
                                    <input type="date" id="hire_date" required>
                                    <span class="error-message" id="hire_dateError"></span>
                                </div>
                                <div class="form-group">
                                    <label for="education">Образование</label>
                                    <input type="text" id="education" placeholder="Название учебного заведения">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="specialty">Специальность</label>
                                <input type="text" id="specialty" placeholder="По диплому">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="phone">Телефон</label>
                                    <input type="text" id="phone" placeholder="+375 (XX) XXX-XX-XX">
                                    <span class="error-message" id="phoneError"></span>
                                </div>
                                <div class="form-group">
                                    <label for="email">Email</label>
                                    <input type="email" id="email" placeholder="email@example.com">
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="staffPage.closeForm()">Отмена</button>
                                <button type="submit" class="btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('pageContent').innerHTML = html;
        
        // Создаем пагинатор только если страниц больше 1
        if (totalPages > 1) {
            this.renderPagination(filteredData.length);
        } else {
            const paginationContainer = document.getElementById('paginationContainer');
            if (paginationContainer) paginationContainer.innerHTML = '';
            this.paginator = null;
        }
    },
    
    // Рендер пагинации (без вызова render)
    renderPagination: function(totalCount) {
        const self = this;
        const paginationContainer = document.getElementById('paginationContainer');
        
        if (!paginationContainer) return;
        
        // Создаем HTML пагинации вручную, чтобы избежать рекурсии
        const totalPages = Math.ceil(totalCount / this.pageSize);
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        let paginationHtml = '<div class="pagination-controls">';
        
        // Кнопка "Первая"
        paginationHtml += `<button class="page-btn" onclick="staffPage.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>«</button>`;
        
        // Кнопка "Предыдущая"
        paginationHtml += `<button class="page-btn" onclick="staffPage.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>`;
        
        // Номера страниц
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="staffPage.goToPage(${i})">${i}</button>`;
        }
        
        // Кнопка "Следующая"
        paginationHtml += `<button class="page-btn" onclick="staffPage.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        
        // Кнопка "Последняя"
        paginationHtml += `<button class="page-btn" onclick="staffPage.goToPage(${totalPages})" ${this.currentPage === totalPages ? 'disabled' : ''}>»</button>`;
        
        paginationHtml += '</div>';
        
        paginationContainer.innerHTML = paginationHtml;
    },
    
    // Переход на страницу
    goToPage: function(page) {
        const filteredData = this.filterData();
        const totalPages = Math.ceil(filteredData.length / this.pageSize);
        
        if (page < 1 || page > totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.render(); // Только один вызов render
    },
    
    // Фильтрация данных
    filterData: function() {
        let filtered = [...this.data];
        
        if (this.filters && this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(s => s.full_name && s.full_name.toLowerCase().includes(search));
        }
        
        if (this.filters && this.filters.institution_id) {
            filtered = filtered.filter(s => s.institution_id == this.filters.institution_id);
        }
        
        if (this.filters && this.filters.position) {
            filtered = filtered.filter(s => s.position === this.filters.position);
        }
        
        return filtered;
    },
    
    // Применение фильтров
    applyFilters: function() {
        this.filters = {
            search: document.getElementById('searchInput') ? document.getElementById('searchInput').value : '',
            institution_id: document.getElementById('institutionFilter') ? document.getElementById('institutionFilter').value : '',
            position: document.getElementById('positionFilter') ? document.getElementById('positionFilter').value : ''
        };
        this.currentPage = 1;
        this.render();
    },
    
    // Показать форму добавления
    showAddForm: function() {
        this.editingId = null;
        const titleEl = document.getElementById('formModalTitle');
        const formEl = document.getElementById('staffForm');
        const idEl = document.getElementById('staffId');
        const modalEl = document.getElementById('formModal');
        
        if (titleEl) titleEl.textContent = 'Добавить работника';
        if (formEl) formEl.reset();
        if (idEl) idEl.value = '';
        if (modalEl) modalEl.classList.add('active');
        this.clearValidationStyles();
    },
    
    // Редактирование
    edit: function(id) {
        const staff = this.data.find(s => s.id === id);
        if (!staff) return;
        
        this.editingId = id;
        const titleEl = document.getElementById('formModalTitle');
        const idEl = document.getElementById('staffId');
        const modalEl = document.getElementById('formModal');
        
        if (titleEl) titleEl.textContent = 'Редактировать работника';
        if (idEl) idEl.value = id;
        
        const fullNameEl = document.getElementById('full_name');
        const positionEl = document.getElementById('position');
        const institutionIdEl = document.getElementById('institution_id');
        const hireDateEl = document.getElementById('hire_date');
        const educationEl = document.getElementById('education');
        const specialtyEl = document.getElementById('specialty');
        const phoneEl = document.getElementById('phone');
        const emailEl = document.getElementById('email');
        
        if (fullNameEl) fullNameEl.value = staff.full_name || '';
        if (positionEl) positionEl.value = staff.position || '';
        if (institutionIdEl) institutionIdEl.value = staff.institution_id || '';
        if (hireDateEl) hireDateEl.value = staff.hire_date || '';
        if (educationEl) educationEl.value = staff.education || '';
        if (specialtyEl) specialtyEl.value = staff.specialty || '';
        if (phoneEl) phoneEl.value = staff.phone || '';
        if (emailEl) emailEl.value = staff.email || '';
        
        if (modalEl) modalEl.classList.add('active');
        this.clearValidationStyles();
    },
    
    // Закрыть форму
    closeForm: function() {
        const modal = document.getElementById('formModal');
        if (modal) modal.classList.remove('active');
        this.editingId = null;
    },
    
    // Удаление
    delete: async function(id) {
        const staff = this.data.find(s => s.id === id);
        if (!staff) return;
        
        if (!confirm(`Вы уверены, что хотите удалить работника "${staff.full_name}"?`)) {
            return;
        }
        
        try {
            await api.deleteStaff(id);
            if (window.showNotification) {
                showNotification('success', 'Работник удален');
            }
            
            if (window.api && window.api.createLog && window.currentUser) {
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'delete',
                    details: `Удален работник: ${staff.full_name}`
                });
            }
            
            await this.load();
        } catch (error) {
            console.error('Error deleting staff:', error);
            if (window.showNotification) {
                showNotification('error', 'Ошибка удаления работника');
            }
        }
    },
    
    // Отправка формы
    submitForm: async function(event) {
        event.preventDefault();
        
        const formData = {
            full_name: document.getElementById('full_name') ? document.getElementById('full_name').value.trim() : '',
            position: document.getElementById('position') ? document.getElementById('position').value : '',
            institution_id: document.getElementById('institution_id') ? document.getElementById('institution_id').value : '',
            hire_date: document.getElementById('hire_date') ? document.getElementById('hire_date').value : '',
            education: document.getElementById('education') ? document.getElementById('education').value.trim() || null : null,
            specialty: document.getElementById('specialty') ? document.getElementById('specialty').value.trim() || null : null,
            phone: document.getElementById('phone') ? document.getElementById('phone').value.trim() || null : null,
            email: document.getElementById('email') ? document.getElementById('email').value.trim() || null : null
        };
        
        const validation = this.validateStaffForm(formData);
        if (!validation.valid) {
            this.displayValidationErrors(validation.errors);
            return;
        }
        
        try {
            if (this.editingId) {
                await api.updateStaff(this.editingId, formData);
                if (window.showNotification) showNotification('success', 'Работник обновлен');
                
                if (window.api && window.api.createLog && window.currentUser) {
                    await api.createLog({
                        user_id: currentUser.id,
                        action: 'update',
                        details: `Обновлен работник: ${formData.full_name}`
                    });
                }
            } else {
                await api.createStaff(formData);
                if (window.showNotification) showNotification('success', 'Работник добавлен');
                
                if (window.api && window.api.createLog && window.currentUser) {
                    await api.createLog({
                        user_id: currentUser.id,
                        action: 'create',
                        details: `Добавлен работник: ${formData.full_name}`
                    });
                }
            }
            
            this.closeForm();
            await this.load();
            
        } catch (error) {
            console.error('Error saving staff:', error);
            if (window.showNotification) showNotification('error', 'Ошибка сохранения работника');
        }
    },
    
    filters: {},
    
    // Просмотр работника
    viewStaff: async function(id) {
        const staff = this.data.find(s => s.id === id);
        if (!staff) {
            if (window.showNotification) showNotification('error', 'Работник не найден');
            return;
        }
        
        const institution = this.institutions.find(i => i.id === staff.institution_id);
        
        const content = `
            <div class="detail-section">
                <h3>Основная информация</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>ФИО</label>
                        <span>${this.escapeHtml(staff.full_name)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Должность</label>
                        <span>${this.escapeHtml(staff.position)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Учреждение</label>
                        <span>${institution ? this.escapeHtml(institution.name) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Дата приема</label>
                        <span>${this.formatDate(staff.hire_date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Образование</label>
                        <span>${this.escapeHtml(staff.education || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Специальность</label>
                        <span>${this.escapeHtml(staff.specialty || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Телефон</label>
                        <span>${staff.phone ? this.formatPhone(staff.phone) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <span>${this.escapeHtml(staff.email || '-')}</span>
                    </div>
                </div>
            </div>
        `;
        
        const buttons = [
            { label: 'Закрыть', onclick: 'window.closeModal && closeModal()', class: 'btn-secondary' }
        ];
        
        if (window.canAccess && canAccess('staff.edit')) {
            buttons.unshift({
                label: 'Редактировать',
                onclick: `staffPage.edit('${id}'); window.closeModal && closeModal();`,
                class: 'btn-primary'
            });
        }
        
        if (window.showModal) {
            showModal(staff.full_name, content, buttons);
        }
    },
    
    // Форматирование даты
    formatDate: function(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ru-RU');
        } catch (e) {
            return dateStr;
        }
    },
    
    // Вспомогательные методы
    escapeHtml: function(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    
    truncateText: function(str, length) {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    },
    
    formatPhone: function(phone) {
        if (!phone) return '';
        return phone;
    },
    
    validateStaffForm: function(data) {
        const errors = {};
        
        if (!data.full_name || data.full_name.trim() === '') {
            errors.full_name = 'ФИО обязательно для заполнения';
        } else if (data.full_name.length < 3) {
            errors.full_name = 'ФИО должно содержать минимум 3 символа';
        }
        
        if (!data.position) {
            errors.position = 'Выберите должность';
        }
        
        if (!data.institution_id) {
            errors.institution_id = 'Выберите учреждение';
        }
        
        if (!data.hire_date) {
            errors.hire_date = 'Дата приема обязательна';
        }
        
        if (data.phone) {
            const phoneRegex = /^[\+\d\s\-\(\)]+$/;
            if (!phoneRegex.test(data.phone)) {
                errors.phone = 'Введите корректный номер телефона';
            }
        }
        
        if (data.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                errors.email = 'Введите корректный email адрес';
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    },
    
    displayValidationErrors: function(errors) {
        this.clearValidationStyles();
        
        for (const [field, message] of Object.entries(errors)) {
            const errorSpan = document.getElementById(`${field}Error`);
            const input = document.getElementById(field);
            
            if (errorSpan) {
                errorSpan.textContent = message;
            }
            if (input) {
                input.classList.add('error');
            }
        }
    },
    
    clearValidationStyles: function() {
        const errorSpans = document.querySelectorAll('.error-message');
        errorSpans.forEach(span => span.textContent = '');
        
        const errorInputs = document.querySelectorAll('.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }
};

// Экспорт
window.staffPage = staffPage;