// ========================================
// Страница администрирования
// ========================================

const adminPage = {
    users: [],
    logs: [],
    
    // Загрузка страницы
    load: async function() {
        if (!hasRole('admin')) {
            document.getElementById('pageContent').innerHTML = `
                <div class="empty-state">
                    <h2>Доступ запрещен</h2>
                    <p>У вас нет прав для просмотра этой страницы</p>
                </div>
            `;
            return;
        }
        
        try {
            const [users, logs] = await Promise.all([
                api.getUsers(),
                api.getLogs({ limit: 100 })
            ]);
            this.users = users;
            this.logs = logs;
            this.render();
        } catch (error) {
            console.error('Error loading admin:', error);
            this.render();
        }
    },
    
    // Рендер страницы
    render: function() {
        const html = `
            <div class="page-header">
                <h1>Администрирование</h1>
                <p>Управление пользователями и системой</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h4>${this.users.length}</h4>
                        <p>Пользователей</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h4>${this.logs.length}</h4>
                        <p>Записей логов</p>
                    </div>
                </div>
            </div>
            
            <div class="grid-2">
                <!-- Управление пользователями -->
                <div class="card">
                    <div class="card-header">
                        <h3>Пользователи системы</h3>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.users.length > 0 ? this.users.map(user => `
                                    <tr>
                                        <td>${user.email}</td>
                                        <td>${CONFIG.userRoles[user.role] || user.role || 'Пользователь'}</td>
                                        <td>
                                            <div class="table-actions">
                                                <button class="btn-icon" onclick="adminPage.editUserRole(${user.id})" title="Изменить роль">
                                                    ⚙️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="3" class="text-center text-muted">Нет пользователей</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Системные логи -->
                <div class="card">
                    <div class="card-header">
                        <h3>Системные логи</h3>
                        <button class="btn-secondary btn-sm" onclick="adminPage.exportLogs()">
                            Экспорт
                        </button>
                    </div>
                    <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Пользователь</th>
                                    <th>Действие</th>
                                    <th>Детали</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.logs.length > 0 ? this.logs.map(log => `
                                    <tr>
                                        <td>${formatDate(log.created_at, 'datetime')}</td>
                                        <td>${log.user_id ? truncateText(log.user_id, 8) : '-'}</td>
                                        <td>${log.action}</td>
                                        <td>${truncateText(log.details || '-', 30)}</td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="4" class="text-center text-muted">Нет записей</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Дополнительные настройки -->
            <div class="card mt-3">
                <div class="card-header">
                    <h3>Дополнительные функции</h3>
                </div>
                <div class="card-body">
                    <div class="flex flex-gap">
                        <button class="btn-secondary" onclick="adminPage.clearCache()">
                            🗑️ Очистить кэш
                        </button>
                        <button class="btn-secondary" onclick="adminPage.backupData()">
                            💾 Создать резервную копию
                        </button>
                        <button class="btn-secondary" onclick="adminPage.showSystemInfo()">
                            ℹ️ Системная информация
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('pageContent').innerHTML = html;
    },
    
    // Изменить роль пользователя
    editUserRole: function(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const content = `
            <form onsubmit="adminPage.saveUserRole(event, ${userId})">
                <div class="form-group">
                    <label for="userRole">Роль пользователя</label>
                    <select id="userRole" required>
                        <option value="user" ${(user.role || 'user') === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Редактор</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
                    <button type="submit" class="btn-primary">Сохранить</button>
                </div>
            </form>
        `;
        
        showModal('Изменить роль пользователя', content, []);
    },
    
    // Сохранить роль пользователя
    saveUserRole: async function(event, userId) {
        event.preventDefault();
        
        const role = document.getElementById('userRole').value;
        
        try {
            // В реальном приложении здесь будет API вызов
            // await api.updateUserRole(userId, role);
            
            showNotification('success', 'Роль пользователя обновлена');
            closeModal();
            await this.load();
            
        } catch (error) {
            console.error('Error saving role:', error);
            showNotification('error', 'Ошибка сохранения роли');
        }
    },
    
    // Экспорт логов
    exportLogs: function() {
        if (this.logs.length === 0) {
            showNotification('warning', 'Нет данных для экспорта');
            return;
        }
        
        const data = this.logs.map(log => ({
            Дата: log.created_at,
            Пользователь: log.user_id,
            Действие: log.action,
            Детали: log.details
        }));
        
        exportToCSV(data, 'system_logs');
    },
    
    // Очистить кэш
    clearCache: function() {
        if (!confirm('Вы уверены, что хотите очистить кэш?')) return;
        
        // Очистка локального хранилища
        localStorage.clear();
        
        showNotification('success', 'Кэш очищен');
    },
    
    // Создать резервную копию
    backupData: async function() {
        showLoader();
        
        try {
            const [institutions, students, staff] = await Promise.all([
                api.getInstitutions({ limit: 1000 }),
                api.getStudents({ limit: 1000 }),
                api.getStaff({ limit: 1000 })
            ]);
            
            const backup = {
                timestamp: new Date().toISOString(),
                institutions: institutions,
                students: students,
                staff: staff
            };
            
            // Скачивание файла
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            saveAs(blob, `backup_${new Date().toISOString().slice(0, 10)}.json`);
            
            showNotification('success', 'Резервная копия создана');
            
        } catch (error) {
            console.error('Backup error:', error);
            showNotification('error', 'Ошибка создания резервной копии');
        }
        
        hideLoader();
    },
    
    // Показать системную информацию
    showSystemInfo: function() {
        const content = `
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Версия приложения</label>
                    <span>${CONFIG.app.version}</span>
                </div>
                <div class="detail-item">
                    <label>Название</label>
                    <span>${CONFIG.app.name}</span>
                </div>
                <div class="detail-item">
                    <label>Supabase URL</label>
                    <span>${CONFIG.supabase.url}</span>
                </div>
                <div class="detail-item">
                    <label>Текущий пользователь</label>
                    <span>${currentUser?.email || '-'}</span>
                </div>
                <div class="detail-item">
                    <label>Роль</label>
                    <span>${CONFIG.userRoles[currentUser?.profile?.role] || 'Пользователь'}</span>
                </div>
                <div class="detail-item">
                    <label>Время</label>
                    <span>${new Date().toLocaleString('ru-RU')}</span>
                </div>
            </div>
        `;
        
        showModal('Системная информация', content, [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ]);
    }
};

// Экспорт
window.adminPage = adminPage;