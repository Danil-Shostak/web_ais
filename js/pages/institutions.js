// ========================================
// Страница учреждений образования
// ========================================

const institutionsPage = {
    data: [],
    currentPage: 1,
    pageSize: 20,
    editingId: null,
    
    // Загрузка страницы
    load: async function() {
        await this.loadData();
        this.render();
    },
    
    // Загрузка данных
    loadData: async function() {
        try {
            this.data = await api.getInstitutions({ limit: 1000 });
        } catch (error) {
            console.error('Error loading institutions:', error);
            this.data = [];
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
                        <h1>Учреждения образования</h1>
                        <p>Управление базой учреждений образования РБ</p>
                    </div>
                    ${canAccess('institutions.edit') ? `
                        <button class="btn-primary" onclick="institutionsPage.showAddForm()">
                            + Добавить учреждение
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Фильтры -->
            <div class="filters-bar">
                <div class="filter-group">
                    <label>Поиск</label>
                    <input type="text" id="searchInput" placeholder="Название, адрес..." 
                           value="${this.filters.search || ''}" 
                           onchange="institutionsPage.applyFilters()">
                </div>
                <div class="filter-group">
                    <label>Тип</label>
                    <select id="typeFilter" onchange="institutionsPage.applyFilters()">
                        <option value="">Все типы</option>
                        ${CONFIG.institutionTypes.map(type => `
                            <option value="${type}" ${this.filters.type === type ? 'selected' : ''}>${type}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Регион</label>
                    <select id="regionFilter" onchange="institutionsPage.applyFilters()">
                        <option value="">Все регионы</option>
                        <option value="Минск" ${this.filters.region === 'Минск' ? 'selected' : ''}>Минск</option>
                        <option value="Минская область" ${this.filters.region === 'Минская область' ? 'selected' : ''}>Минская область</option>
                        <option value="Брестская область" ${this.filters.region === 'Брестская область' ? 'selected' : ''}>Брестская область</option>
                        <option value="Гомельская область" ${this.filters.region === 'Гомельская область' ? 'selected' : ''}>Гомельская область</option>
                        <option value="Гродненская область" ${this.filters.region === 'Гродненская область' ? 'selected' : ''}>Гродненская область</option>
                        <option value="Могилевская область" ${this.filters.region === 'Могилевская область' ? 'selected' : ''}>Могилевская область</option>
                        <option value="Витебская область" ${this.filters.region === 'Витебская область' ? 'selected' : ''}>Витебская область</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Сортировка</label>
                    <select id="sortFilter" onchange="institutionsPage.applyFilters()">
                        <option value="name" ${this.filters.sortBy === 'name' ? 'selected' : ''}>По названию</option>
                        <option value="type" ${this.filters.sortBy === 'type' ? 'selected' : ''}>По типу</option>
                        <option value="created_at" ${this.filters.sortBy === 'created_at' ? 'selected' : ''}>По дате создания</option>
                    </select>
                </div>
            </div>
            
            <!-- Таблица -->
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Тип</th>
                                <th>Регион</th>
                                <th>Адрес</th>
                                <th>Телефон</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageData.length > 0 ? pageData.map(inst => `
                                <tr>
                                    <td>
                                        <strong>${inst.name}</strong>
                                        ${inst.email ? `<br><small class="text-muted">${inst.email}</small>` : ''}
                                    </td>
                                    <td>${inst.type}</td>
                                    <td>${inst.region || '-'}</td>
                                    <td>${truncateText(inst.address, 30)}</td>
                                    <td>${inst.phone ? formatPhone(inst.phone) : '-'}</td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="btn-icon" onclick="viewInstitution(${inst.id})" title="Просмотр">
                                                
                                            </button>
                                            ${canAccess('institutions.edit') ? `
                                                <button class="btn-icon" onclick="institutionsPage.edit(${inst.id})" title="Редактировать">
                                                    
                                                </button>
                                            ` : ''}
                                            ${canAccess('institutions.delete') ? `
                                                <button class="btn-icon" onclick="institutionsPage.delete(${inst.id})" title="Удалить">
                                                    
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="6" class="text-center text-muted">
                                        Учреждения не найдены
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
                        <h2 id="formModalTitle">Добавить учреждение</h2>
                        <button class="modal-close" onclick="institutionsPage.closeForm()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="institutionForm" onsubmit="institutionsPage.submitForm(event)">
                            <input type="hidden" id="institutionId">
                            
                            <div class="form-group">
                                <label for="name">Название *</label>
                                <input type="text" id="name" required placeholder="Полное название учреждения">
                                <span class="error-message" id="nameError"></span>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="type">Тип учреждения *</label>
                                    <select id="type" required>
                                        <option value="">Выберите тип</option>
                                        ${CONFIG.institutionTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                                    </select>
                                    <span class="error-message" id="typeError"></span>
                                </div>
                                <div class="form-group">
                                    <label for="region">Регион *</label>
                                    <select id="region" required>
                                        <option value="">Выберите регион</option>
                                        <option value="Минск">Минск</option>
                                        <option value="Минская область">Минская область</option>
                                        <option value="Брестская область">Брестская область</option>
                                        <option value="Гомельская область">Гомельская область</option>
                                        <option value="Гродненская область">Гродненская область</option>
                                        <option value="Могилевская область">Могилевская область</option>
                                        <option value="Витебская область">Витебская область</option>
                                    </select>
                                    <span class="error-message" id="regionError"></span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="address">Адрес *</label>
                                <input type="text" id="address" required placeholder="Улица, дом">
                                <span class="error-message" id="addressError"></span>
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
                                    <span class="error-message" id="emailError"></span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="website">Сайт</label>
                                <input type="text" id="website" placeholder="https://example.com">
                            </div>
                            
                            <div class="form-group">
                                <label for="description">Описание</label>
                                <textarea id="description" rows="3" placeholder="Краткое описание учреждения"></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="institutionsPage.closeForm()">Отмена</button>
                                <button type="submit" class="btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('pageContent').innerHTML = html;
        
        // Инициализация пагинации
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
            filtered = filtered.filter(inst => 
                inst.name.toLowerCase().includes(search) ||
                (inst.address && inst.address.toLowerCase().includes(search))
            );
        }
        
        if (this.filters.type) {
            filtered = filtered.filter(inst => inst.type === this.filters.type);
        }
        
        if (this.filters.region) {
            filtered = filtered.filter(inst => inst.region === this.filters.region);
        }
        
        if (this.filters.sortBy) {
            const sortAsc = this.filters.sortAsc !== false;
            filtered.sort((a, b) => {
                const aVal = a[this.filters.sortBy] || '';
                const bVal = b[this.filters.sortBy] || '';
                return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            });
        }
        
        return filtered;
    },
    
    // Применение фильтров
    applyFilters: function() {
        this.filters = {
            search: document.getElementById('searchInput').value,
            type: document.getElementById('typeFilter').value,
            region: document.getElementById('regionFilter').value,
            sortBy: document.getElementById('sortFilter').value,
            sortAsc: true
        };
        this.currentPage = 1;
        this.render();
    },
    
    // Показать форму добавления
    showAddForm: function() {
        this.editingId = null;
        document.getElementById('formModalTitle').textContent = 'Добавить учреждение';
        document.getElementById('institutionForm').reset();
        document.getElementById('institutionId').value = '';
        document.getElementById('formModal').classList.add('active');
        clearValidationStyles();
    },
    
    // Редактирование
    edit: function(id) {
        const institution = this.data.find(i => i.id === id);
        if (!institution) return;
        
        this.editingId = id;
        document.getElementById('formModalTitle').textContent = 'Редактировать учреждение';
        
        document.getElementById('institutionId').value = id;
        document.getElementById('name').value = institution.name || '';
        document.getElementById('type').value = institution.type || '';
        document.getElementById('region').value = institution.region || '';
        document.getElementById('address').value = institution.address || '';
        document.getElementById('phone').value = institution.phone || '';
        document.getElementById('email').value = institution.email || '';
        document.getElementById('website').value = institution.website || '';
        document.getElementById('description').value = institution.description || '';
        
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
        const institution = this.data.find(i => i.id === id);
        if (!institution) return;
        
        if (!confirm(`Вы уверены, что хотите удалить учреждение "${institution.name}"?`)) {
            return;
        }
        
        try {
            await api.deleteInstitution(id);
            
            // Логирование
            await api.createLog({
                user_id: currentUser.id,
                action: 'delete',
                details: `Удалено учреждение: ${institution.name}`
            });
            
            showNotification('success', 'Учреждение удалено');
            await this.loadData();
            this.render();
            
        } catch (error) {
            console.error('Error deleting institution:', error);
            showNotification('error', 'Ошибка удаления учреждения');
        }
    },
    
    // Отправка формы
    submitForm: async function(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            type: document.getElementById('type').value,
            region: document.getElementById('region').value,
            address: document.getElementById('address').value.trim(),
            phone: document.getElementById('phone').value.trim() || null,
            email: document.getElementById('email').value.trim() || null,
            website: document.getElementById('website').value.trim() || null,
            description: document.getElementById('description').value.trim() || null
        };
        
        // Валидация
        const validation = validateInstitutionForm(formData);
        if (!validation.valid) {
            displayValidationErrors(validation.errors);
            return;
        }
        
        try {
            if (this.editingId) {
                await api.updateInstitution(this.editingId, formData);
                showNotification('success', 'Учреждение обновлено');
                
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'update',
                    details: `Обновлено учреждение: ${formData.name}`
                });
            } else {
                await api.createInstitution(formData);
                showNotification('success', 'Учреждение добавлено');
                
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'create',
                    details: `Добавлено учреждение: ${formData.name}`
                });
            }
            
            this.closeForm();
            await this.loadData();
            this.render();
            
        } catch (error) {
            console.error('Error saving institution:', error);
            showNotification('error', 'Ошибка сохранения учреждения');
        }
    },
    
    filters: {}
};

// Экспорт
window.institutionsPage = institutionsPage;