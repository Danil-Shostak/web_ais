// ========================================
// Страница настроек
// ========================================

const settingsPage = {
    // Загрузка страницы
    load: function() {
        this.render();
    },
    
    // Рендер страницы
    render: function() {
        const user = currentUser;
        
        const html = `
            <div class="page-header">
                <h1>Настройки</h1>
                <p>Управление профилем и настройками системы</p>
            </div>
            
            <div class="settings-grid">
                <!-- Боковое меню настроек -->
                <div class="settings-nav">
                    <ul>
                        <li><a href="#" onclick="settingsPage.showSection('profile')" class="active" data-section="profile">Профиль</a></li>
                        <li><a href="#" onclick="settingsPage.showSection('security')" data-section="security">Безопасность</a></li>
                        <li><a href="#" onclick="settingsPage.showSection('notifications')" data-section="notifications">Уведомления</a></li>
                        ${hasRole('admin') ? '<li><a href="#" onclick="settingsPage.showSection(\'system\')" data-section="system">Системные настройки</a></li>' : ''}
                    </ul>
                </div>
                
                <!-- Контент настроек -->
                <div class="settings-content">
                    <!-- Профиль -->
                    <div id="section-profile" class="settings-section">
                        <h2>Профиль пользователя</h2>
                        <form onsubmit="settingsPage.saveProfile(event)">
                            <div class="form-group">
                                <label for="profileEmail">Email</label>
                                <input type="email" id="profileEmail" value="${user.email || ''}" disabled>
                                <small class="text-muted">Email нельзя изменить</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="profileName">ФИО</label>
                                <input type="text" id="profileName" value="${user.profile?.full_name || ''}" placeholder="Ваше ФИО">
                            </div>
                            
                            <div class="form-group">
                                <label for="profilePhone">Телефон</label>
                                <input type="text" id="profilePhone" value="${user.profile?.phone || ''}" placeholder="+375 (XX) XXX-XX-XX">
                            </div>
                            
                            <button type="submit" class="btn-primary">Сохранить изменения</button>
                        </form>
                    </div>
                    
                    <!-- Безопасность -->
                    <div id="section-security" class="settings-section" style="display: none;">
                        <h2>Безопасность</h2>
                        <form onsubmit="settingsPage.changePassword(event)">
                            <div class="form-group">
                                <label for="currentPassword">Текущий пароль</label>
                                <input type="password" id="currentPassword" required placeholder="Введите текущий пароль">
                            </div>
                            
                            <div class="form-group">
                                <label for="newPassword">Новый пароль</label>
                                <input type="password" id="newPassword" required placeholder="Введите новый пароль">
                                <small class="text-muted">Минимум 6 символов</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="confirmNewPassword">Подтверждение пароля</label>
                                <input type="password" id="confirmNewPassword" required placeholder="Повторите новый пароль">
                            </div>
                            
                            <button type="submit" class="btn-primary">Изменить пароль</button>
                        </form>
                        
                        <hr style="margin: 30px 0;">
                        
                        <h3>История сессий</h3>
                        <p class="text-muted">Информация о текущей сессии:</p>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Последний вход</label>
                                <span>${user.email ? 'Текущая сессия' : '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Роль</label>
                                <span>${CONFIG.userRoles[user.profile?.role || 'user'] || 'Пользователь'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Уведомления -->
                    <div id="section-notifications" class="settings-section" style="display: none;">
                        <h2>Уведомления</h2>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="notifyEmail" checked>
                                Email уведомления
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="notifySystem" checked>
                                Системные уведомления
                            </label>
                        </div>
                        
                        <button class="btn-primary" onclick="settingsPage.saveNotificationSettings()">
                            Сохранить настройки
                        </button>
                    </div>
                    
                    <!-- Системные настройки (только для админа) -->
                    <div id="section-system" class="settings-section" style="display: none;">
                        <h2>Системные настройки</h2>
                        
                        <div class="form-group">
                            <label for="systemName">Название системы</label>
                            <input type="text" id="systemName" value="${CONFIG.app.name}">
                        </div>
                        
                        <div class="form-group">
                            <label for="itemsPerPage">Элементов на странице</label>
                            <select id="itemsPerPage">
                                <option value="10">10</option>
                                <option value="20" selected>20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                        
                        <button class="btn-primary" onclick="settingsPage.saveSystemSettings()">
                            Сохранить настройки
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('pageContent').innerHTML = html;
    },
    
    // Показать секцию
    showSection: function(section) {
        // Обновление активной ссылки
        document.querySelectorAll('.settings-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });
        
        // Показать нужную секцию
        document.querySelectorAll('.settings-section').forEach(sec => {
            sec.style.display = 'none';
        });
        document.getElementById(`section-${section}`).style.display = 'block';
    },
    
    // Сохранить профиль
    saveProfile: async function(event) {
        event.preventDefault();
        
        const name = document.getElementById('profileName').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        
        try {
            await api.updateProfile(currentUser.id, {
                full_name: name,
                phone: phone
            });
            
            currentUser.profile = {
                ...currentUser.profile,
                full_name: name,
                phone: phone
            };
            
            showNotification('success', 'Профиль обновлен');
            
        } catch (error) {
            console.error('Error saving profile:', error);
            showNotification('error', 'Ошибка сохранения профиля');
        }
    },
    
    // Изменить пароль
    changePassword: async function(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmPassword) {
            showNotification('error', 'Пароли не совпадают');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('error', 'Пароль должен быть не менее 6 символов');
            return;
        }
        
        try {
            const success = await auth.changePassword(currentPassword, newPassword);
            
            if (success) {
                showNotification('success', 'Пароль изменен');
                
                // Очистка формы
                event.target.reset();
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('error', 'Ошибка смены пароля');
        }
    },
    
    // Сохранить настройки уведомлений
    saveNotificationSettings: function() {
        showNotification('success', 'Настройки уведомлений сохранены');
    },
    
    // Сохранить системные настройки
    saveSystemSettings: function() {
        showNotification('success', 'Системные настройки сохранены');
    }
};

// Экспорт
window.settingsPage = settingsPage;