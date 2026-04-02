// ========================================
// Валидаторы
// ========================================

// Валидация email
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Валидация пароля
function validatePassword(password) {
    return password && password.length >= 6;
}

// Валидация телефона
function validatePhone(phone) {
    if (!phone) return true; // Телефон необязателен
    
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 12;
}

// Валидация ФИО
function validateFullName(name) {
    if (!name || name.trim().length < 2) {
        return { valid: false, message: 'Введите корректное ФИО' };
    }
    
    if (name.trim().split(' ').length < 2) {
        return { valid: false, message: 'Введите полное ФИО (минимум 2 слова)' };
    }
    
    return { valid: true };
}

// Валидация названия учреждения
function validateInstitutionName(name) {
    if (!name || name.trim().length < 2) {
        return { valid: false, message: 'Введите название учреждения' };
    }
    
    if (name.trim().length > 200) {
        return { valid: false, message: 'Название слишком длинное (максимум 200 символов)' };
    }
    
    return { valid: true };
}

// Валидация адреса
function validateAddress(address) {
    if (!address || address.trim().length < 5) {
        return { valid: false, message: 'Введите корректный адрес' };
    }
    
    return { valid: true };
}

// Валидация даты
function validateDate(dateStr) {
    if (!dateStr) {
        return { valid: false, message: 'Введите дату' };
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return { valid: false, message: 'Введите корректную дату' };
    }
    
    return { valid: true };
}

// Валидация диапазона дат
function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
        return { valid: false, message: 'Введите обе даты' };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
        return { valid: false, message: 'Дата начала не может быть позже даты окончания' };
    }
    
    return { valid: true };
}

// Валидация числа
function validateNumber(value, min = null, max = null) {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return { valid: false, message: 'Введите число' };
    }
    
    if (min !== null && num < min) {
        return { valid: false, message: `Значение должно быть не менее ${min}` };
    }
    
    if (max !== null && num > max) {
        return { valid: false, message: `Значение должно быть не более ${max}` };
    }
    
    return { valid: true };
}

// Валидация обязательного поля
function validateRequired(value, fieldName = 'Поле') {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return { valid: false, message: `${fieldName} обязательно для заполнения` };
    }
    
    return { valid: true };
}

// Валидация при создании учреждения
function validateInstitutionForm(data) {
    const errors = {};
    
    // Название
    const nameResult = validateInstitutionName(data.name);
    if (!nameResult.valid) {
        errors.name = nameResult.message;
    }
    
    // Тип
    if (!data.type) {
        errors.type = 'Выберите тип учреждения';
    }
    
    // Регион
    if (!data.region) {
        errors.region = 'Выберите регион';
    }
    
    // Город
    if (!data.city || !data.city.trim()) {
        errors.city = 'Введите город';
    }
    
    // Адрес (полный)
    const addressResult = validateAddress(data.address);
    if (!addressResult.valid) {
        errors.address = addressResult.message;
    }
    
    // Телефон (опционально)
    if (data.phone && !validatePhone(data.phone)) {
        errors.phone = 'Введите корректный номер телефона';
    }
    
    // Email (опционально)
    if (data.email && !validateEmail(data.email)) {
        errors.email = 'Введите корректный email';
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors: errors
    };
}

// Валидация при создании учащегося
function validateStudentForm(data) {
    const errors = {};
    
    // ФИО
    const nameResult = validateFullName(data.full_name);
    if (!nameResult.valid) {
        errors.full_name = nameResult.message;
    }
    
    // Дата рождения
    const birthDateResult = validateDate(data.birth_date);
    if (!birthDateResult.valid) {
        errors.birth_date = birthDateResult.message;
    }
    
    // Учреждение
    if (!data.institution_id) {
        errors.institution_id = 'Выберите учреждение';
    }
    
    // Класс
    if (!data.grade) {
        errors.grade = 'Укажите класс';
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors: errors
    };
}

// Валидация при создании работника
function validateStaffForm(data) {
    const errors = {};
    
    // ФИО
    const nameResult = validateFullName(data.full_name);
    if (!nameResult.valid) {
        errors.full_name = nameResult.message;
    }
    
    // Учреждение
    if (!data.institution_id) {
        errors.institution_id = 'Выберите учреждение';
    }
    
    // Должность
    if (!data.position) {
        errors.position = 'Укажите должность';
    }
    
    // Дата приема
    const hireDateResult = validateDate(data.hire_date);
    if (!hireDateResult.valid) {
        errors.hire_date = hireDateResult.message;
    }
    
    // Телефон (опционально)
    if (data.phone && !validatePhone(data.phone)) {
        errors.phone = 'Введите корректный номер телефона';
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors: errors
    };
}

// Отображение ошибок валидации в форме
function displayValidationErrors(errors) {
    for (const [field, message] of Object.entries(errors)) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = message;
        }
        
        // Подсветка поля с ошибкой
        const input = document.getElementById(field);
        if (input) {
            input.style.borderColor = '#ef4444';
        }
    }
}

// Очистка стилей ошибок
function clearValidationStyles() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
    
    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.style.borderColor = '';
    });
}

// Экспорт валидаторов
window.validators = {
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validatePhone: validatePhone,
    validateFullName: validateFullName,
    validateInstitutionName: validateInstitutionName,
    validateAddress: validateAddress,
    validateDate: validateDate,
    validateDateRange: validateDateRange,
    validateNumber: validateNumber,
    validateRequired: validateRequired,
    validateInstitutionForm: validateInstitutionForm,
    validateStudentForm: validateStudentForm,
    validateStaffForm: validateStaffForm,
    displayValidationErrors: displayValidationErrors,
    clearValidationStyles: clearValidationStyles
};