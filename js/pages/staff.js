// ========================================
// Страница работников
// ========================================

const staffPage = {
    data: [],
    institutions: [],
    currentPage: 1,
    pageSize: 20,
    editingId: null,
    
    // Загрузка страницы
    load: async function() {
        try {
            const [staff, institutions] = await Promise.all([
                api.getStaff({ limit: 1000 }),
                api.getInstitutions({ limit: 1000 })
            ]);
            this.data = staff;
            this.institutions = institutions;
            this.render();
        } catch (error) {
            console.error('Error loading staff:', error);
            this.data = [];
            this.institutions = [];
            this.render();
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
                    ${canAccess('staff.edit') ? `
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
                           value="${this.filters.search || ''}" 
                           onchange="staffPage.applyFilters()">
                </div>
                <div class="filter-group">
                    <label>Учреждение</label>
                    <select id="institutionFilter" onchange="staffPage.applyFilters()">
                        <option value="">Все учреждения</option>
                        ${this.institutions.map(inst => `
                            <option value="${inst.id}" ${this.filters.institution_id == inst.id ? 'selected' : ''}>${inst.name}</option>
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
                    <table>
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
                                            <strong>${staff.full_name}</strong>
                                        </td>
                                        <td>${staff.position}</td>
                                        <td>${institution ? truncateText(institution.name, 25) : '-'}</td>
                                        <td>${formatDate(staff.hire_date)}</td>
                                        <td>${staff.phone ? formatPhone(staff.phone) : '-'}</td>
                                        <td>
                                            <div class="table-actions">
                                                <button class="btn-icon" onclick="viewStaff(${staff.id})" title="Просмотр">
                                                    👁️
                                                </button>
                                                ${canAccess('staff.edit') ? `
                                                    <button class="btn-icon" onclick="staffPage.edit(${staff.id})" title="Редактировать">
                                                        ✏️
                                                    </button>
                                                    <button class="btn-icon" onclick="staffPage.delete(${staff.id})" title="Удалить">
                                                        🗑️
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
                ${totalPages > 1 ? `
                    <div class="pagination" id="pagination"></div>
                ` : ''}
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
                                        ${this.institutions.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
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
        
        if (totalPages > 1) {
            paginator = new Paginator(filteredData.length, this.pageSize, (page, offset, limit) => {
                this.currentPage = page;
                this.render();
            });
            paginator.goToPage(this.currentPage);
            paginator.render('pagination');
        }
    },
    
    // Фильтрация данных
    filterData: function() {
        let filtered = [...this.data];
        
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(s => s.full_name.toLowerCase().includes(search));
        }
        
        if (this.filters.institution_id) {
            filtered = filtered.filter(s => s.institution_id == this.filters.institution_id);
        }
        
        if (this.filters.position) {
            filtered = filtered.filter(s => s.position === this.filters.position);
        }
        
        return filtered;
    },
    
    // Применение фильтров
    applyFilters: function() {
        this.filters = {
            search: document.getElementById('searchInput').value,
            institution_id: document.getElementById('institutionFilter').value,
            position: document.getElementById('positionFilter').value
        };
        this.currentPage = 1;
        this.render();
    },
    
    // Показать форму добавления
    showAddForm: function() {
        this.editingId = null;
        document.getElementById('formModalTitle').textContent = 'Добавить работника';
        document.getElementById('staffForm').reset();
        document.getElementById('staffId').value = '';
        document.getElementById('formModal').classList.add('active');
        clearValidationStyles();
    },
    
    // Редактирование
    edit: function(id) {
        const staff = this.data.find(s => s.id === id);
        if (!staff) return;
        
        this.editingId = id;
        document.getElementById('formModalTitle').textContent = 'Редактировать работника';
        
        document.getElementById('staffId').value = id;
        document.getElementById('full_name').value = staff.full_name || '';
        document.getElementById('position').value = staff.position || '';
        document.getElementById('institution_id').value = staff.institution_id || '';
        document.getElementById('hire_date').value = staff.hire_date || '';
        document.getElementById('education').value = staff.education || '';
        document.getElementById('specialty').value = staff.specialty || '';
        document.getElementById('phone').value = staff.phone || '';
        document.getElementById('email').value = staff.email || '';
        
        document.getElementById('formModal').classList.add('active');
        clearValidationStyles();
    },
    
    // Закрыть форму
    closeForm: function() {
        document.getElementById('formModal').classList.remove('active');
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
            showNotification('success', 'Работник удален');
            
            await api.createLog({
                user_id: currentUser.id,
                action: 'delete',
                details: `Удален работник: ${staff.full_name}`
            });
            
            await this.load();
        } catch (error) {
            console.error('Error deleting staff:', error);
            showNotification('error', 'Ошибка удаления работника');
        }
    },
    
    // Отправка формы
    submitForm: async function(event) {
        event.preventDefault();
        
        const formData = {
            full_name: document.getElementById('full_name').value.trim(),
            position: document.getElementById('position').value,
            institution_id: parseInt(document.getElementById('institution_id').value),
            hire_date: document.getElementById('hire_date').value,
            education: document.getElementById('education').value.trim() || null,
            specialty: document.getElementById('specialty').value.trim() || null,
            phone: document.getElementById('phone').value.trim() || null,
            email: document.getElementById('email').value.trim() || null
        };
        
        const validation = validateStaffForm(formData);
        if (!validation.valid) {
            displayValidationErrors(validation.errors);
            return;
        }
        
        try {
            if (this.editingId) {
                await api.updateStaff(this.editingId, formData);
                showNotification('success', 'Работник обновлен');
                
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'update',
                    details: `Обновлен работник: ${formData.full_name}`
                });
            } else {
                await api.createStaff(formData);
                showNotification('success', 'Работник добавлен');
                
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'create',
                    details: `Добавлен работник: ${formData.full_name}`
                });
            }
            
            this.closeForm();
            await this.load();
            
        } catch (error) {
            console.error('Error saving staff:', error);
            showNotification('error', 'Ошибка сохранения работника');
        }
    },
    
    filters: {}
};

// Экспорт
window.staffPage = staffPage;