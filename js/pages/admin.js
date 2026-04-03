// ========================================
// Страница администрирования
// ========================================

const adminPage = {
    users: [],
    logs: [],
    sessions: [],
    
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
            const [users, logs, sessions] = await Promise.all([
                api.getUsers(),
                api.getLogs({ limit: 100 }),
                api.getAllActiveSessions()
            ]);
            this.users = users;
            this.logs = logs;
            this.sessions = sessions;
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
            
            <!-- Управление пользователями и сессиями -->
            <div class="card mt-3">
                <div class="card-header">
                    <h3>Управление пользователями и сессиями</h3>
                    <button class="btn-secondary btn-sm" onclick="adminPage.refreshSessions()">
                        Обновить
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Пользователь</th>
                                <th>Email</th>
                                <th>Роль</th>
                                <th>Активных сессий</th>
                                <th>Последний вход</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.users.length > 0 ? this.users.map(user => {
                                const isBlocked = user.is_blocked === true;
                                const userSessions = this.sessions.filter(s => s.user_id === user.id);
                                const sessionCount = userSessions.length;
                                const lastLogin = user.last_login ? formatDate(user.last_login, 'datetime') : 'Нет данных';
                                const isCurrentUser = currentUser && user.id === currentUser.id;
                                return `
                                    <tr style="${isBlocked ? 'opacity:0.6;background:#fef2f2;' : ''}">
                                        <td>
                                            <strong>${escapeHtml(user.full_name || '—')}</strong>
                                            ${isCurrentUser ? '<span class="badge" style="background:#10b981;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;margin-left:6px;">Вы</span>' : ''}
                                        </td>
                                        <td>${escapeHtml(user.email || '—')}</td>
                                        <td>${CONFIG.userRoles[user.role] || user.role || 'Пользователь'}</td>
                                        <td>
                                            <span style="color:${sessionCount > 0 ? '#10b981' : '#6b7280'};font-weight:500;">
                                                ${sessionCount > 0 ? sessionCount + ' активн.' : 'Нет сессий'}
                                            </span>
                                        </td>
                                        <td style="font-size:12px;color:var(--text-secondary);">${lastLogin}</td>
                                        <td>
                                            ${isBlocked
                                                ? '<span style="color:#ef4444;font-weight:500;">🚫 Заблокирован</span>'
                                                : '<span style="color:#10b981;font-weight:500;">✓ Активен</span>'}
                                        </td>
                                        <td>
                                            <div class="table-actions">
                                                ${!isCurrentUser ? `
                                                    ${isBlocked
                                                        ? `<button class="btn-secondary btn-sm" onclick="adminPage.unblockUser('${user.id}')">Разблокировать</button>`
                                                        : `<button class="btn-secondary btn-sm" style="color:#ef4444;" onclick="adminPage.blockUser('${user.id}')">Заблокировать</button>`
                                                    }
                                                    ${sessionCount > 0 ? `
                                                        <button class="btn-secondary btn-sm" onclick="adminPage.terminateAllUserSessions('${user.id}')" title="Завершить все сессии">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                                            Завершить сессии
                                                        </button>
                                                    ` : ''}
                                                    <button class="btn-icon" onclick="adminPage.editUserRole('${user.id}')" title="Изменить роль">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                                        </svg>
                                                    </button>
                                                ` : '<span class="text-muted" style="font-size:12px;">Текущий сеанс</span>'}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr><td colspan="7" class="text-center text-muted">Нет пользователей</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Пользователь</th>
                                <th>Email</th>
                                <th>Роль</th>
                                <th>Активных сессий</th>
                                <th>Последний вход</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.users.length > 0 ? this.users.map(user => {
                                const isBlocked = user.is_blocked === true;
                                const userSessions = this.sessions.filter(s => s.user_id === user.id);
                                const sessionCount = userSessions.length;
                                const lastLogin = user.last_login ? formatDate(user.last_login, 'datetime') : 'Нет данных';
                                const isCurrentUser = currentUser && user.id === currentUser.id;
                                return `
                                    <tr style="${isBlocked ? 'opacity:0.6;background:#fef2f2;' : ''}">
                                        <td>
                                            <strong>${escapeHtml(user.full_name || '—')}</strong>
                                            ${isCurrentUser ? '<span class="badge" style="background:#10b981;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;margin-left:6px;">Вы</span>' : ''}
                                        </td>
                                        <td>${escapeHtml(user.email || '—')}</td>
                                        <td>${CONFIG.userRoles[user.role] || user.role || 'Пользователь'}</td>
                                        <td>
                                            <span style="color:${sessionCount > 0 ? '#10b981' : '#6b7280'};font-weight:500;">
                                                ${sessionCount > 0 ? sessionCount + ' активн.' : 'Нет сессий'}
                                            </span>
                                        </td>
                                        <td style="font-size:12px;color:var(--text-secondary);">${lastLogin}</td>
                                        <td>
                                            ${isBlocked
                                                ? '<span style="color:#ef4444;font-weight:500;">🚫 Заблокирован</span>'
                                                : '<span style="color:#10b981;font-weight:500;">✓ Активен</span>'}
                                        </td>
                                        <td>
                                            <div class="table-actions">
                                                ${!isCurrentUser ? `
                                                    ${isBlocked
                                                        ? `<button class="btn-secondary btn-sm" onclick="adminPage.unblockUser('${user.id}')">Разблокировать</button>`
                                                        : `<button class="btn-secondary btn-sm" style="color:#ef4444;" onclick="adminPage.blockUser('${user.id}')">Заблокировать</button>`
                                                    }
                                                    ${sessionCount > 0 ? `
                                                        <button class="btn-secondary btn-sm" onclick="adminPage.terminateAllUserSessions('${user.id}')" title="Завершить все сессии">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                                            Завершить сессии
                                                        </button>
                                                    ` : ''}
                                                    <button class="btn-icon" onclick="adminPage.editUserRole('${user.id}')" title="Изменить роль">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                                        </svg>
                                                    </button>
                                                ` : '<span class="text-muted" style="font-size:12px;">Текущий сеанс</span>'}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr><td colspan="7" class="text-center text-muted">Нет пользователей</td></tr>
                            `}
                        </tbody>
                    </table>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Очистить кэш
                        </button>
                        <button class="btn-secondary" onclick="adminPage.backupData()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            Создать резервную копию
                        </button>
                        <button class="btn-secondary" onclick="adminPage.showSystemInfo()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            Системная информация
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
            <form onsubmit="adminPage.saveUserRole(event, '${userId}')">
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
            await api.updateUserRole(userId, role);
            
            showNotification('success', 'Роль пользователя обновлена');
            closeModal();
            await this.load();
            
        } catch (error) {
            console.error('Error saving role:', error);
            showNotification('error', 'Ошибка сохранения роли');
        }
    },
    
    // Заблокировать пользователя
    blockUser: async function(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        if (!confirm(`Заблокировать пользователя "${user.email}"?\nВсе активные сессии будут завершены.`)) return;
        
        try {
            // Блокируем пользователя через API
            await api.blockUser(userId, currentUser.id);
            
            // Завершаем все сессии
            await api.terminateAllUserSessions(userId);
            
            await api.createLog({
                user_id: currentUser.id,
                action: 'block_user',
                details: `Заблокирован пользователь: ${user.email}`
            });
            
            showNotification('success', `Пользователь ${user.email} заблокирован`);
            this.load();
        } catch (error) {
            console.error('Error blocking user:', error);
            showNotification('error', 'Ошибка блокировки пользователя');
        }
    },
    
    // Разблокировать пользователя
    unblockUser: async function(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        try {
            // Разблокируем пользователя через API
            await api.unblockUser(userId);
            
            await api.createLog({
                user_id: currentUser.id,
                action: 'unblock_user',
                details: `Разблокирован пользователь: ${user.email}`
            });
            
            showNotification('success', `Пользователь ${user.email} разблокирован`);
            this.load();
        } catch (error) {
            console.error('Error unblocking user:', error);
            showNotification('error', 'Ошибка разблокировки пользователя');
        }
    },
    
    // Завершить все сессии пользователя
    terminateAllUserSessions: async function(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        if (!confirm(`Завершить все активные сессии пользователя "${user.email}"?\nПользователь будет вынужден заново войти в систему.`)) return;
        
        try {
            // Завершаем все сессии в БД
            await api.terminateAllUserSessions(userId);
            
            // Устанавливаем флаг инвалидации сессии в профиле
            await supabase.from('profiles').update({
                session_invalidated_at: new Date().toISOString()
            }).eq('user_id', userId);
            
            // Логируем действие
            await api.createLog({
                user_id: currentUser.id,
                action: 'terminate_sessions',
                details: `Принудительно завершены все сессии: ${user.email}`
            });
            
            showNotification('success', `Все сессии пользователя ${user.email} завершены`);
            this.load();
        } catch (error) {
            console.error('Error terminating sessions:', error);
            showNotification('error', 'Ошибка завершения сессий');
        }
    },
    
    // Обновить данные сессий
    refreshSessions: async function() {
        try {
            const [users, logs, sessions] = await Promise.all([
                api.getUsers(),
                api.getLogs({ limit: 100 }),
                api.getAllActiveSessions()
            ]);
            this.users = users;
            this.logs = logs;
            this.sessions = sessions;
            this.render();
            showNotification('info', 'Данные обновлены');
        } catch (error) {
            showNotification('error', 'Ошибка обновления данных');
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