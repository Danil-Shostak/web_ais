// ========================================
// Страница учащихся
// ========================================

const studentsPage = {
    data: [],
    institutions: [],
    currentPage: 1,
    pageSize: 20,
    editingId: null,
    
    // Загрузка страницы
    load: async function() {
        try {
            const [students, institutions] = await Promise.all([
                api.getStudents({ limit: 1000 }),
                api.getInstitutions({ limit: 1000 })
            ]);
            this.data = students;
            this.institutions = institutions;
            this.render();
        } catch (error) {
            console.error('Error loading students:', error);
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
                        <h1>Учащиеся</h1>
                        <p>Управление списком учащихся</p>
                    </div>
                    ${canAccess('students.edit') ? `
                        <button class="btn-primary" onclick="studentsPage.showAddForm()">
                            + Добавить учащегося
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Фильтры -->
            <div class="filters-bar">
                <div class="filter-group">
                    <label>Поиск</label>
                    <input type="text" id="searchInput" placeholder="ФИО учащегося..." 
                           value="${this.filters.search || ''}" 
                           onchange="studentsPage.applyFilters()">
                </div>
                <div class="filter-group">
                    <label>Учреждение</label>
                    <select id="institutionFilter" onchange="studentsPage.applyFilters()">
                        <option value="">Все учреждения</option>
                        ${this.institutions.map(inst => `
                            <option value="${inst.id}" ${this.filters.institution_id == inst.id ? 'selected' : ''}>${inst.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Класс</label>
                    <select id="gradeFilter" onchange="studentsPage.applyFilters()">
                        <option value="">Все классы</option>
                        ${[1,2,3,4,5,6,7,8,9,10,11].map(g => `
                            <option value="${g}" ${this.filters.grade == g ? 'selected' : ''}>${g} класс</option>
                        `).join('')}
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
                                <th>Дата рождения</th>
                                <th>Учреждение</th>
                                <th>Класс/Курс</th>
                                <th>Адрес</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageData.length > 0 ? pageData.map(student => {
                                const institution = this.institutions.find(i => i.id === student.institution_id);
                                // Форматируем отображение класса/курса
                                let gradeDisplay;
                                if (typeof student.grade === 'string' && student.grade.includes('курс')) {
                                    gradeDisplay = student.grade;
                                } else {
                                    const gradeNum = parseInt(student.grade);
                                    gradeDisplay = gradeNum ? `${gradeNum} класс` : student.grade;
                                }
                                return `
                                    <tr>
                                        <td>
                                            <strong>${student.full_name}</strong>
                                        </td>
                                        <td>${formatDate(student.birth_date)}</td>
                                        <td>${institution ? truncateText(institution.name, 25) : '-'}</td>
                                        <td>${gradeDisplay}</td>
                                        <td>${truncateText(student.address, 25) || '-'}</td>
                                        <td>
                                            <div class="table-actions">
                                                <button class="btn-icon" onclick="studentsPage.viewStudent('${student.id}')" title="Просмотр">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                </button>
                                                ${canAccess('students.edit') ? `
                                                    <button class="btn-icon" onclick="studentsPage.edit('${student.id}')" title="Редактировать">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button class="btn-icon" onclick="studentsPage.delete('${student.id}')" title="Удалить">
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
                                        Учащиеся не найдены
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
                        <h2 id="formModalTitle">Добавить учащегося</h2>
                        <button class="modal-close" onclick="studentsPage.closeForm()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="studentForm" onsubmit="studentsPage.submitForm(event)">
                            <input type="hidden" id="studentId">
                            
                            <div class="form-group">
                                <label for="full_name">ФИО *</label>
                                <input type="text" id="full_name" required placeholder="Иванов Иван Иванович">
                                <span class="error-message" id="full_nameError"></span>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="birth_date">Дата рождения *</label>
                                    <input type="date" id="birth_date" required>
                                    <span class="error-message" id="birth_dateError"></span>
                                </div>
                                <div class="form-group">
                                    <label for="gender">Пол *</label>
                                    <select id="gender" required>
                                        <option value="">Выберите пол</option>
                                        <option value="male">Мужской</option>
                                        <option value="female">Женский</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="institution_id">Учреждение *</label>
                                    <select id="institution_id" required onchange="studentsPage.updateGradeField()">
                                        <option value="">Выберите учреждение</option>
                                        ${this.institutions.map(i => `<option value="${i.id}" data-type="${i.type || ''}">${i.name}</option>`).join('')}
                                    </select>
                                    <span class="error-message" id="institution_idError"></span>
                                </div>
                                <div class="form-group">
                                    <label id="gradeLabel" for="grade">Класс/Курс *</label>
                                    <select id="grade" required>
                                        <option value="">Выберите класс</option>
                                        ${[1,2,3,4,5,6,7,8,9,10,11].map(g => `<option value="${g}">${g} класс</option>`).join('')}
                                    </select>
                                    <span class="error-message" id="gradeError"></span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="address">Адрес проживания</label>
                                <input type="text" id="address" placeholder="Улица, дом, квартира">
                            </div>
                            
                            <div class="form-group">
                                <label for="parent_phone">Телефон родителя</label>
                                <input type="text" id="parent_phone" placeholder="+375 (XX) XXX-XX-XX">
                                <span class="error-message" id="parent_phoneError"></span>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="studentsPage.closeForm()">Отмена</button>
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
        
        if (this.filters.grade) {
            filtered = filtered.filter(s => s.grade == this.filters.grade);
        }
        
        return filtered;
    },
    
    // Применение фильтров
    applyFilters: function() {
        this.filters = {
            search: document.getElementById('searchInput').value,
            institution_id: document.getElementById('institutionFilter').value,
            grade: document.getElementById('gradeFilter').value
        };
        this.currentPage = 1;
        this.render();
    },
    
    // Показать форму добавления
    showAddForm: function() {
        this.editingId = null;
        document.getElementById('formModalTitle').textContent = 'Добавить учащегося';
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
        document.getElementById('formModal').classList.add('active');
        clearValidationStyles();
    },
    
    // Редактирование
    edit: function(id) {
        const student = this.data.find(s => s.id === id);
        if (!student) return;
        
        this.editingId = id;
        document.getElementById('formModalTitle').textContent = 'Редактировать учащегося';
        
        document.getElementById('studentId').value = id;
        document.getElementById('full_name').value = student.full_name || '';
        document.getElementById('birth_date').value = student.birth_date || '';
        document.getElementById('gender').value = student.gender || '';
        document.getElementById('institution_id').value = student.institution_id || '';
        document.getElementById('address').value = student.address || '';
        document.getElementById('parent_phone').value = student.parent_phone || '';
        
        // Сначала обновляем поле класса/курса на основе учреждения
        this.updateGradeField();
        
        // Затем устанавливаем значение
        document.getElementById('grade').value = student.grade || '';
        
        document.getElementById('formModal').classList.add('active');
        clearValidationStyles();
    },
    
    // Закрыть форму
    closeForm: function() {
        document.getElementById('formModal').classList.remove('active');
        this.editingId = null;
    },
    
    // Обновление поля класса/курса при выборе учреждения
    updateGradeField: function() {
        const institutionSelect = document.getElementById('institution_id');
        const selectedOption = institutionSelect.options[institutionSelect.selectedIndex];
        const institutionType = selectedOption.getAttribute('data-type') || '';
        
        const gradeSelect = document.getElementById('grade');
        const gradeLabel = document.getElementById('gradeLabel');
        
        // Типы учреждений, где используются курсы вместо классов
        const courseTypes = ['Среднее специальное', 'Профессионально-техническое', 'Высшее'];
        const isCourseInstitution = courseTypes.includes(institutionType);
        
        if (isCourseInstitution) {
            // Показываем курсы
            gradeLabel.textContent = 'Курс *';
            gradeSelect.innerHTML = `
                <option value="">Выберите курс</option>
                <option value="1 курс">1 курс</option>
                <option value="2 курс">2 курс</option>
                <option value="3 курс">3 курс</option>
                <option value="4 курс">4 курс</option>
                <option value="5 курс">5 курс</option>
            `;
        } else {
            // Показываем классы
            gradeLabel.textContent = 'Класс *';
            gradeSelect.innerHTML = `
                <option value="">Выберите класс</option>
                ${[1,2,3,4,5,6,7,8,9,10,11].map(g => `<option value="${g}">${g} класс</option>`).join('')}
            `;
        }
    },
    
    // Удаление
    delete: async function(id) {
        const student = this.data.find(s => s.id === id);
        if (!student) return;
        
        if (!confirm(`Вы уверены, что хотите удалить учащегося "${student.full_name}"?`)) {
            return;
        }
        
        try {
            await api.deleteStudent(id);
            showNotification('success', 'Учащийся удален');
            
            await api.createLog({
                user_id: currentUser.id,
                action: 'delete',
                details: `Удален учащийся: ${student.full_name}`
            });
            
            await this.load();
        } catch (error) {
            console.error('Error deleting student:', error);
            showNotification('error', 'Ошибка удаления учащегося');
        }
    },
    
    // Отправка формы
    submitForm: async function(event) {
        event.preventDefault();
        
        const gradeValue = document.getElementById('grade').value;
        // Для курсов значение уже содержит "курс", для классов - число
        const grade = gradeValue.includes('курс') ? gradeValue : parseInt(gradeValue);
        
        const formData = {
            full_name: document.getElementById('full_name').value.trim(),
            birth_date: document.getElementById('birth_date').value,
            gender: document.getElementById('gender').value,
            institution_id: document.getElementById('institution_id').value,
            grade: grade,
            address: document.getElementById('address').value.trim() || null,
            parent_phone: document.getElementById('parent_phone').value.trim() || null
        };
        
        const validation = validateStudentForm(formData);
        if (!validation.valid) {
            displayValidationErrors(validation.errors);
            return;
        }
        
        try {
            if (this.editingId) {
                await api.updateStudent(this.editingId, formData);
                showNotification('success', 'Учащийся обновлен');
                
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'update',
                    details: `Обновлен учащийся: ${formData.full_name}`
                });
            } else {
                await api.createStudent(formData);
                showNotification('success', 'Учащийся добавлен');
                
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'create',
                    details: `Добавлен учащийся: ${formData.full_name}`
                });
            }
            
            this.closeForm();
            await this.load();
            
        } catch (error) {
            console.error('Error saving student:', error);
            showNotification('error', 'Ошибка сохранения учащегося');
        }
    },
    
    filters: {},
    
    // Просмотр учащегося
    viewStudent: async function(id) {
        const student = this.data.find(s => s.id === id);
        if (!student) {
            showNotification('error', 'Учащийся не найден');
            return;
        }
        
        const institution = this.institutions.find(i => i.id === student.institution_id);
        
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
                        <span>${institution ? escapeHtml(institution.name) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Адрес</label>
                        <span>${escapeHtml(student.address || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Телефон родителя</label>
                        <span>${student.parent_phone ? formatPhone(student.parent_phone) : '-'}</span>
                    </div>
                </div>
            </div>
        `;
        
        const buttons = [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ];
        
        if (canAccess('students.edit')) {
            buttons.unshift({
                label: 'Редактировать',
                onclick: `studentsPage.edit('${id}')`,
                class: 'btn-primary'
            });
        }
        
        showModal(student.full_name, content, buttons);
    }
};

// Экспорт
window.studentsPage = studentsPage;