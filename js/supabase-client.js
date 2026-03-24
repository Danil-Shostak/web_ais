// ========================================
// Клиент Supabase (упрощенная реализация)
// ========================================

class SupabaseClient {
    constructor(url, anonKey) {
        this.url = url;
        this.anonKey = anonKey;
        this.authToken = null;
    }
    
    // Установка токена авторизации
    setAuthToken(token) {
        this.authToken = token;
        localStorage.setItem('authToken', token);
    }
    
    // Получение токена авторизации
    getAuthToken() {
        if (!this.authToken) {
            this.authToken = localStorage.getItem('authToken');
        }
        return this.authToken;
    }
    
    // Очистка токена
    clearAuthToken() {
        this.authToken = null;
        localStorage.removeItem('authToken');
    }
    
    // Базовые заголовки
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'apikey': this.anonKey
        };
        
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    // Выполнение запроса
    async request(method, endpoint, body = null, options = {}) {
        const url = `${this.url}/${endpoint}`;
        
        const config = {
            method: method,
            headers: this.getHeaders()
        };
        
        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(body);
        }
        
        // Добавление параметров запроса для GET
        if (method === 'GET' && options.params) {
            const params = new URLSearchParams(options.params);
            const fullUrl = `${url}?${params.toString()}`;
            
            try {
                const response = await fetch(fullUrl, config);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Ошибка запроса');
                }
                
                return data;
            } catch (error) {
                console.error('Request error:', error);
                throw error;
            }
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Ошибка запроса');
            }
            
            return data;
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }
    
    // SELECT - получение данных
    async from(table) {
        return new QueryBuilder(this, table);
    }
    
    // INSERT - вставка данных
    async insert(table, data) {
        return this.request('POST', table, data);
    }
    
    // UPDATE - обновление данных
    async update(table, data, filters) {
        const filtersStr = this.buildFilters(filters);
        return this.request('PATCH', `${table}?${filtersStr}`, data);
    }
    
    // DELETE - удаление данных
    async delete(table, filters) {
        const filtersStr = this.buildFilters(filters);
        return this.request('DELETE', `${table}?${filtersStr}`);
    }
    
    // Построение фильтров для URL
    buildFilters(filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return '';
        }
        
        const params = [];
        for (const [key, value] of Object.entries(filters)) {
            params.push(`${key}=${encodeURIComponent(value)}`);
        }
        
        return params.join('&');
    }
    
    // Аутентификация
    async auth.signUp(email, password) {
        const response = await fetch(`${this.url}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.anonKey
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error_description || data.msg || 'Ошибка регистрации');
        }
        
        return data;
    }
    
    async auth.signIn(email, password) {
        const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.anonKey
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error_description || data.msg || 'Ошибка входа');
        }
        
        this.setAuthToken(data.access_token);
        return data;
    }
    
    async auth.signOut() {
        const token = this.getAuthToken();
        
        if (token) {
            await fetch(`${this.url}/auth/v1/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        }
        
        this.clearAuthToken();
    }
    
    async auth.getUser() {
        const token = this.getAuthToken();
        
        if (!token) {
            return null;
        }
        
        const response = await fetch(`${this.url}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': this.anonKey
            }
        });
        
        if (!response.ok) {
            return null;
        }
        
        return await response.json();
    }
    
    // RPC - вызов функций
    async rpc(functionName, params) {
        return this.request('POST', `rpc/${functionName}`, params);
    }
}

// Класс для построения запросов
class QueryBuilder {
    constructor(client, table) {
        this.client = client;
        this.table = table;
        this.queryParams = {};
        this.selectQuery = '*';
    }
    
    // Выбор полей
    select(fields) {
        this.selectQuery = fields || '*';
        return this;
    }
    
    // Фильтр по равенству
    eq(column, value) {
        this.queryParams[`${column}`] = `eq.${value}`;
        return this;
    }
    
    // Фильтр по неравенству
    neq(column, value) {
        this.queryParams[`${column}`] = `neq.${value}`;
        return this;
    }
    
    // Фильтр больше
    gt(column, value) {
        this.queryParams[`${column}`] = `gt.${value}`;
        return this;
    }
    
    // Фильтр меньше
    lt(column, value) {
        this.queryParams[`${column}`] = `lt.${value}`;
        return this;
    }
    
    // Фильтр больше или равно
    gte(column, value) {
        this.queryParams[`${column}`] = `gte.${value}`;
        return this;
    }
    
    // Фильтр меньше или равно
    lte(column, value) {
        this.queryParams[`${column}`] = `lte.${value}`;
        return this;
    }
    
    // LIKE поиск
    like(column, pattern) {
        this.queryParams[`${column}`] = `like.${encodeURIComponent(pattern)}`;
        return this;
    }
    
    // iLIKE поиск (без учета регистра)
    ilike(column, pattern) {
        this.queryParams[`${column}`] = `ilike.${encodeURIComponent(pattern)}`;
        return this;
    }
    
    // Фильтр по вхождению в массив
    in(column, values) {
        this.queryParams[`${column}`] = `in.(${values.join(',')})`;
        return this;
    }
    
    // Проверка на null
    isNull(column) {
        this.queryParams[`${column}`] = 'is.null';
        return this;
    }
    
    // Проверка на не null
    isNotNull(column) {
        this.queryParams[`${column}`] = `not.is.null`;
        return this;
    }
    
    // Сортировка
    order(column, { ascending = true } = {}) {
        this.queryParams['order'] = `${column}.${ascending ? 'asc' : 'desc'}`;
        return this;
    }
    
    // Ограничение количества
    limit(count) {
        this.queryParams['limit'] = count;
        return this;
    }
    
    // Смещение (для пагинации)
    offset(count) {
        this.queryParams['offset'] = count;
        return this;
    }
    
    // Внешние ключи
    // Пример: .with('students', 'students(institution_id)')
    with(namedFilter, query) {
        this.queryParams[`${namedFilter}`] = query;
        return this;
    }
    
    // Выполнение запроса
    async then(resolve, reject) {
        try {
            // Построение URL с параметрами
            let url = `${this.table}?select=${this.selectQuery}`;
            
            for (const [key, value] of Object.entries(this.queryParams)) {
                if (key !== 'select') {
                    url += `&${key}=${value}`;
                }
            }
            
            const data = await this.client.request('GET', url);
            resolve(data);
        } catch (error) {
            reject(error);
        }
    }
    
    // Асинхронный вызов
    async execute() {
        return new Promise((resolve, reject) => {
            this.then(resolve, reject);
        });
    }
}

// Создание экземпляра клиента
const supabase = new SupabaseClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);