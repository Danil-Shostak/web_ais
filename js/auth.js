// ========================================
// Модуль аутентификации и авторизации (локальная версия)
// ========================================

// Текущий пользователь
let currentUser = null;

// Инициализация аутентификации
async function initAuth() {
    // Проверка загрузки db
    if (typeof db === 'undefined' || !db.initialized) {
        console.log('Waiting for database to load...');
        setTimeout(initAuth, 100);
        return;
    }
    
    // Проверка сохраненной сессии
    const savedUser = localStorage.getItem('current_user');
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            // Загрузка профиля пользователя
            const profile = await api.getProfile(currentUser.id);
            if (profile) {
                currentUser.profile = profile;
            }
            showApp();
        } catch (error) {
            console.error('Auth init error:', error);
            localStorage.removeItem('current_user');
            showLogin();
        }
    } else {
        showLogin();
    }
}

// Показать страницу входа
function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('loader').classList.add('hidden');
}

// Показать основное приложение
function showApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('loader').classList.add('hidden');
    
    // Обновление информации о пользователе
    updateUserInfo();
    
    // Загрузка меню
    loadNavigation();
    
    // Переход на дашборд
    navigateTo('dashboard');
}

// Обновление информации о пользователе
function updateUserInfo() {
    if (currentUser) {
        const userName = currentUser.full_name || currentUser.email || 'Пользователь';
        document.getElementById('currentUserName').textContent = userName;
    }
}

// Обработка входа
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Валидация
    clearErrors();
    
    if (!validateEmail(email)) {
        showError('loginEmailError', 'Введите корректный email');
        return;
    }
    
    if (!password) {
        showError('loginPasswordError', 'Введите пароль');
        return;
    }
    
    // Показать загрузку
    showLoader();
    
    try {
        // Поиск пользователя в локальной базе
        const user = db.getOne('SELECT * FROM users WHERE email = ?', [email]);
        
        if (!user) {
            throw new Error('Пользователь не найден');
        }
        
        // Проверка пароля (простая проверка, в реальном приложении нужно хэширование)
        if (user.password !== password) {
            throw new Error('Неверный пароль');
        }
        
        // Установка текущего пользователя
        currentUser = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        };
        
        // Загрузка профиля
        const profile = await api.getProfile(user.id);
        if (profile) {
            currentUser.profile = profile;
        } else {
            // Создание профиля при первом входе
            await api.createProfile({
                user_id: user.id,
                full_name: user.full_name || email.split('@')[0],
                role: user.role
            });
            currentUser.profile = { role: user.role };
        }
        
        // Сохранение сессии
        if (rememberMe) {
            localStorage.setItem('current_user', JSON.stringify(currentUser));
        }
        
        // Логирование
        await api.createLog({
            user_id: currentUser.id,
            action: 'login',
            details: 'Вход в систему'
        });
        
        showApp();
        showNotification('success', 'Добро пожаловать в систему!');
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('error', 'Ошибка входа: ' + (error.message || 'Неверные учетные данные'));
    }
    
    hideLoader();
}

// Обработка регистрации
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Валидация
    clearErrors();
    let hasError = false;
    
    if (!name.trim()) {
        showError('registerNameError', 'Введите ФИО');
        hasError = true;
    }
    
    if (!validateEmail(email)) {
        showError('registerEmailError', 'Введите корректный email');
        hasError = true;
    }
    
    if (!validatePassword(password)) {
        showError('registerPasswordError', 'Пароль должен быть не менее 6 символов');
        hasError = true;
    }
    
    if (password !== confirmPassword) {
        showError('registerConfirmPasswordError', 'Пароли не совпадают');
        hasError = true;
    }
    
    if (hasError) return;
    
    // Показать загрузку
    showLoader();
    
    try {
        // Проверка, что пользователь с таким email не существует
        const existingUser = db.getOne('SELECT id FROM users WHERE email = ?', [email]);
        
        if (existingUser) {
            throw new Error('Пользователь с таким email уже существует');
        }
        
        // Создание нового пользователя
        const userId = db.generateId();
        
        const sql = `
            INSERT INTO users (id, email, password, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(sql, [userId, email, password, name, 'user']);
        
        // Создание профиля
        await api.createProfile({
            user_id: userId,
            full_name: name,
            role: 'user'
        });
        
        showNotification('success', 'Регистрация успешна! Теперь вы можете войти в систему.');
        
        // Переключение на вкладку входа
        showLoginTab('login');
        
        // Очистка формы регистрации
        document.getElementById('registerForm').reset();
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('error', 'Ошибка регистрации: ' + (error.message || 'Попробуйте позже'));
    }
    
    hideLoader();
}

// Выход из системы
async function logout() {
    try {
        // Логирование выхода
        if (currentUser) {
            await api.createLog({
                user_id: currentUser.id,
                action: 'logout',
                details: 'Выход из системы'
            });
        }
        
        currentUser = null;
        localStorage.removeItem('current_user');
        
        showLogin();
        showNotification('info', 'Вы вышли из системы');
        
    } catch (error) {
        console.error('Logout error:', error);
        showLogin();
    }
}

// Проверка роли пользователя
function hasRole(role) {
    if (!currentUser) {
        return false;
    }
    
    const userRole = currentUser.role || (currentUser.profile && currentUser.profile.role) || 'user';
    
    if (role === 'admin') {
        return userRole === 'admin';
    }
    
    if (role === 'editor') {
        return userRole === 'admin' || userRole === 'editor';
    }
    
    return true;
}

// Проверка прав доступа к функции
function canAccess(feature) {
    // Администратор имеет доступ ко всему
    if (hasRole('admin')) {
        return true;
    }
    
    // Права доступа для разных функций
    const permissions = {
        'dashboard': true,
        'institutions': true,
        'institutions.edit': hasRole('editor'),
        'institutions.delete': hasRole('admin'),
        'students': true,
        'students.edit': hasRole('editor'),
        'staff': true,
        'staff.edit': hasRole('editor'),
        'statistics': true,
        'reports': true,
        'import': hasRole('editor'),
        'settings': true,
        'admin': hasRole('admin')
    };
    
    return permissions[feature] || false;
}

// Переключение между вкладками входа/регистрации
function showLoginTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Загрузка навигации в зависимости от роли
function loadNavigation() {
    const navMenu = document.getElementById('navMenu');
    
    const menuItems = [
        {
            id: 'dashboard',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>',
            label: 'Дашборд',
            access: 'dashboard'
        },
        {
            id: 'institutions',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path></svg>',
            label: 'Учреждения',
            access: 'institutions'
        },
        {
            id: 'students',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            label: 'Учащиеся',
            access: 'students'
        },
        {
            id: 'staff',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>',
            label: 'Работники',
            access: 'staff'
        },
        {
            id: 'statistics',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
            label: 'Статистика',
            access: 'statistics'
        },
        {
            id: 'reports',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            label: 'Отчеты',
            access: 'reports'
        },
        {
            id: 'import',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
            label: 'Импорт данных',
            access: 'import'
        },
        {
            id: 'settings',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
            label: 'Настройки',
            access: 'settings'
        },
        {
            id: 'admin',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
            label: 'Администрирование',
            access: 'admin'
        }
    ];
    
    // Фильтрация меню по правам доступа
    const filteredItems = menuItems.filter(item => canAccess(item.access));
    
    navMenu.innerHTML = filteredItems.map(item => `
        <li>
            <a href="#" onclick="navigateTo('${item.id}')" data-page="${item.id}">
                ${item.icon}
                <span>${item.label}</span>
            </a>
        </li>
    `).join('');
}

// Показать настройки профиля
function showProfileSettings() {
    navigateTo('settings');
}

// Смена пароля пользователя
async function changePassword(currentPassword, newPassword) {
    try {
        if (!currentUser) {
            showNotification('error', 'Пользователь не авторизован');
            return false;
        }
        
        // Получение текущего пароля
        const user = db.getOne('SELECT password FROM users WHERE id = ?', [currentUser.id]);
        
        if (!user || user.password !== currentPassword) {
            showNotification('error', 'Неверный текущий пароль');
            return false;
        }
        
        // Обновление пароля
        db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, currentUser.id]);
        
        showNotification('success', 'Пароль успешно изменен');
        return true;
    } catch (error) {
        showNotification('error', 'Ошибка смены пароля');
        return false;
    }
}

// Экспорт
window.auth = {
    currentUser: () => currentUser,
    hasRole: hasRole,
    canAccess: canAccess,
    logout: logout,
    changePassword: changePassword
};