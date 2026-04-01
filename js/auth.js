// ========================================
// Модуль аутентификации и авторизации (Supabase версия)
// ========================================

// Текущий пользователь
let currentUser = null;

// Инициализация аутентификации
async function initAuth() {
    // Проверка наличия supabase
    if (typeof supabase === 'undefined') {
        console.log('Waiting for Supabase client to load...');
        setTimeout(initAuth, 100);
        return;
    }
    
    // Проверка сохраненной сессии
    const savedUser = localStorage.getItem('current_user');
    const authToken = localStorage.getItem('authToken');
    
    if (savedUser && authToken) {
        try {
            // Проверка валидности токена через Supabase
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                // Токен невалиден, удаляем и показываем логин
                localStorage.removeItem('current_user');
                localStorage.removeItem('authToken');
                showLogin();
                return;
            }
            
            currentUser = JSON.parse(savedUser);
            // Проверка блокировки
            const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
            if (blockedUsers.includes(user.id)) {
                localStorage.removeItem('current_user');
                localStorage.removeItem('authToken');
                await supabase.auth.signOut();
                showLogin();
                return;
            }
            // Загрузка профиля пользователя из Supabase
            const profile = await api.getProfile(user.id);
            if (profile) {
                currentUser.profile = profile;
            }
            showApp();
        } catch (error) {
            console.error('Auth init error:', error);
            localStorage.removeItem('current_user');
            localStorage.removeItem('authToken');
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

// Переключение между вкладками входа и регистрации
function showLoginTab(tabName) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    if (tabName === 'login') {
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
        // Вход через Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Получение данных пользователя
        const user = data.user;
        const session = data.session;
        
        // Сохранение токена
        if (rememberMe) {
            localStorage.setItem('authToken', session.access_token);
        } else {
            sessionStorage.setItem('authToken', session.access_token);
        }
        
        // Загрузка профиля из profiles таблицы
        const profile = await api.getProfile(user.id);
        
        currentUser = {
            id: user.id,
            email: user.email,
            full_name: profile?.full_name || user.email.split('@')[0],
            role: profile?.role || 'user',
            profile: profile
        };
        
        localStorage.setItem('current_user', JSON.stringify(currentUser));
        
        // Логирование
        api.createLog({
            user_id: user.id,
            action: 'login',
            details: 'Успешный вход в систему'
        }).catch(console.error);
        
        showApp();
        showNotification('success', 'Добро пожаловать!');
        
    } catch (error) {
        console.error('Login error:', error);
        hideLoader();
        
        let errorMessage = 'Ошибка входа';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Неверный email или пароль';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Email не подтвержден';
        } else {
            errorMessage = error.message;
        }
        
        showError('loginPasswordError', errorMessage);
    }
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
        // Регистрация через Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        // Если email требует подтверждения
        if (data.user && !data.session) {
            hideLoader();
            showNotification('info', 'На ваш email отправлена ссылка для подтверждения. Пожалуйста, проверьте почту.');
            showLoginTab('login');
            return;
        }
        
        // Создание профиля в profiles таблице
        if (data.user) {
            await api.createProfile({
                user_id: data.user.id,
                full_name: name,
                role: 'user'
            });
        }
        
        hideLoader();
        showNotification('success', 'Регистрация успешна! Добро пожаловать!');
        
        // Автоматический вход
        if (data.session) {
            currentUser = {
                id: data.user.id,
                email: data.user.email,
                full_name: name,
                role: 'user'
            };
            
            localStorage.setItem('authToken', data.session.access_token);
            localStorage.setItem('current_user', JSON.stringify(currentUser));
            
            showApp();
        }
        
    } catch (error) {
        console.error('Register error:', error);
        hideLoader();
        
        let errorMessage = 'Ошибка регистрации';
        if (error.message.includes('User already registered')) {
            errorMessage = 'Пользователь с таким email уже существует';
        } else {
            errorMessage = error.message;
        }
        
        showError('registerEmailError', errorMessage);
    }
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
        
        // Выход из Supabase
        await supabase.auth.signOut();
        
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Очистка локальных данных
    currentUser = null;
    localStorage.removeItem('current_user');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    
    showLogin();
    showNotification('info', 'Вы вышли из системы');
}

// Обновление пароля
async function updatePassword(currentPassword, newPassword) {
    try {
        // Проверка текущего пароля через повторный вход
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword
        });
        
        if (verifyError) throw new Error('Неверный текущий пароль');
        
        // Обновление пароля
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (updateError) throw updateError;
        
        showNotification('success', 'Пароль успешно изменен');
        return true;
    } catch (error) {
        console.error('Update password error:', error);
        showNotification('error', error.message);
        return false;
    }
}

// Проверка доступа
function canAccess(permission) {
    if (!currentUser) return false;
    
    const role = currentUser.role || currentUser.profile?.role;
    
    // Ролевая система доступа
    const permissions = {
        admin: ['*'],
        editor: ['dashboard.view', 'institutions.view', 'institutions.edit', 'students.view', 'students.edit', 'staff.view', 'staff.edit', 'statistics.view', 'reports.view', 'import.view'],
        user: ['dashboard.view', 'institutions.view', 'students.view', 'staff.view', 'statistics.view']
    };
    
    const rolePermissions = permissions[role] || [];
    
    return rolePermissions.includes('*') || rolePermissions.includes(permission);
}

// Глобальные функции
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.canAccess = canAccess;
window.updatePassword = updatePassword;
window.showLogin = showLogin;
window.showApp = showApp;
window.showLoginTab = showLoginTab;
window.updateUserInfo = updateUserInfo;
window.currentUser = currentUser;

// Функция проверки роли
function hasRole(role) {
    const userRole = currentUser?.role || currentUser?.profile?.role;
    return userRole === role || userRole === 'admin';
}
window.hasRole = hasRole;
