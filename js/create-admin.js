// ========================================
// Скрипт для создания админа (запустить один раз и удалить)
// ========================================

// Временно добавляем функцию создания админа
window.createAdmin = async function() {
    const email = prompt('Введите email для админа:');
    const password = prompt('Введите пароль (мин 6 символов):');
    const name = prompt('Введите имя:');
    
    if (!email || !password || !name) {
        alert('Заполните все поля');
        return;
    }
    
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
        
        console.log('Пользователь создан:', data.user);
        
        // Создание профиля с ролью admin
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    user_id: data.user.id,
                    full_name: name,
                    role: 'admin'
                }]);
            
            if (profileError) {
                console.error('Ошибка создания профиля:', profileError);
                alert('Пользователь создан, но не удалось создать профиль. Выполните SQL вручную.');
            } else {
                alert('Админ успешно создан!');
            }
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
};

console.log('Для создания админа введите createAdmin() в консоли браузера');