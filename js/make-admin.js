// ========================================
// Скрипт для получения ID текущего пользователя и назначения админа
// ========================================

// Функция для назначения текущего пользователя админом
window.makeMeAdmin = async function() {
    try {
        // Получаем текущего пользователя
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
            alert('Вы не авторизованы! Сначала войдите.');
            return;
        }
        
        console.log('Ваш user_id:', user.id);
        console.log('Ваш email:', user.email);
        
        // Пробуем создать или обновить профиль
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        
        if (existingProfile) {
            // Профиль уже есть - обновляем роль
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'admin', full_name: user.email?.split('@')[0] || 'Админ' })
                .eq('user_id', user.id);
            
            if (updateError) throw updateError;
            alert('Вы назначены админом!');
        } else {
            // Профиля нет - создаём
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{
                    user_id: user.id,
                    full_name: user.email?.split('@')[0] || 'Админ',
                    role: 'admin'
                }]);
            
            if (insertError) throw insertError;
            alert('Профиль создан с правами админа!');
        }
        
        console.log('Готово! Обновите страницу и войдите заново.');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message + '\n\nСначала создайте таблицы в Supabase SQL Editor!');
    }
};

console.log('=== Инструкция ===');
console.log('1. Сначала создайте таблицы в Supabase (SQL Editor)');
console.log('2. Войдите на сайт под своим аккаунтом');
console.log('3. В консоли браузера введите: makeMeAdmin()');
console.log('===================');