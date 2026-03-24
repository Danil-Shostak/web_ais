// ========================================
// Локальная база данных SQLite (sql.js)
// ========================================

class LocalDatabase {
    constructor() {
        this.db = null;
        this.SQL = null;
        this.initialized = false;
    }

    // Инициализация базы данных
    async init() {
        if (this.initialized) return true;

        try {
            // Загрузка sql.js
            if (!window.initSqlJs) {
                await this.loadSqlJs();
            }

            // Инициализация SQL.js
            this.SQL = await window.initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });

            // Загрузка сохраненной базы данных или создание новой
            const savedDb = localStorage.getItem('app_database');
            if (savedDb) {
                const data = new Uint8Array(JSON.parse(savedDb));
                this.db = new this.SQL.Database(data);
            } else {
                this.db = new this.SQL.Database();
                this.createTables();
                this.insertSampleData();
            }

            this.initialized = true;
            console.log('База данных SQLite инициализирована');
            return true;
        } catch (error) {
            console.error('Ошибка инициализации БД:', error);
            throw error;
        }
    }

    // Загрузка sql.js
    loadSqlJs() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://sql.js.org/dist/sql-wasm.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Создание таблиц
    createTables() {
        // Таблица пользователей
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'user',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица профилей
        this.db.run(`
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE,
                full_name TEXT,
                role TEXT DEFAULT 'user',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Таблица учреждений
        this.db.run(`
            CREATE TABLE IF NOT EXISTS institutions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                region TEXT,
                address TEXT,
                phone TEXT,
                email TEXT,
                website TEXT,
                description TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица учащихся
        this.db.run(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                birth_date TEXT,
                gender TEXT,
                grade TEXT,
                institution_id INTEGER,
                address TEXT,
                parent_phone TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (institution_id) REFERENCES institutions(id)
            )
        `);

        // Таблица работников
        this.db.run(`
            CREATE TABLE IF NOT EXISTS staff (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                position TEXT,
                institution_id INTEGER,
                hire_date TEXT,
                education TEXT,
                specialty TEXT,
                phone TEXT,
                email TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (institution_id) REFERENCES institutions(id)
            )
        `);

        // Таблица статистики
        this.db.run(`
            CREATE TABLE IF NOT EXISTS statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                institution_id INTEGER,
                category TEXT,
                value INTEGER,
                date TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (institution_id) REFERENCES institutions(id)
            )
        `);

        // Таблица отчетов
        this.db.run(`
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                type TEXT,
                title TEXT,
                data TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Таблица логов
        this.db.run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                action TEXT,
                details TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Таблица уведомлений
        this.db.run(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                title TEXT,
                message TEXT,
                read INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Таблица настроек
        this.db.run(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE,
                value TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        this.save();
    }

    // Вставка демо-данных
    insertSampleData() {
        // Создание администратора по умолчанию
        const adminId = 'admin_' + Date.now();
        this.db.run(`
            INSERT INTO users (id, email, password, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        `, [adminId, 'admin@test.com', 'admin123', 'Администратор', 'admin']);

        this.db.run(`
            INSERT INTO profiles (user_id, full_name, role)
            VALUES (?, ?, ?)
        `, [adminId, 'Администратор', 'admin']);

        // Демо учреждения
        const institutions = [
            ['ГУО "Средняя школа №1 г. Минска"', 'Общее среднее', 'Минск', 'ул. Ленина, 1', '+375 17 123-45-67', 'school1@minsk.edu.by', 'https://school1.minsk.edu.by'],
            ['ГУО "Гимназия №2 г. Минска"', 'Общее среднее', 'Минск', 'ул. Советская, 15', '+375 17 234-56-78', 'gymnasium2@minsk.edu.by', 'https://gym2.minsk.edu.by'],
            ['ГУО "Детский сад №5"', 'Дошкольное', 'Минск', 'ул. Пушкина, 22', '+375 17 345-67-89', 'ds5@minsk.edu.by'],
            ['ГУО "Лицей №1 г. Гродно"', 'Общее среднее', 'Гродно', 'ул. Октябрьская, 8', '+375 15 456-78-90', 'lyceum1@grodno.edu.by'],
            ['ГУО "Колледж машиностроения"', 'Среднее специальное', 'Минск', 'ул. Промышленная, 12', '+375 17 567-89-01', 'college@minsk.edu.by']
        ];

        institutions.forEach(inst => {
            this.db.run(`
                INSERT INTO institutions (name, type, region, address, phone, email, website)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, inst);
        });

        // Демо учащиеся (20 человек)
        const studentNames = [
            'Иванов Иван Иванович', 'Петров Петр Петрович', 'Сидоров Алексей Сергеевич',
            'Козлова Анна Михайловна', 'Смирнова Елена Викторовна', 'Ковалев Дмитрий Олегович',
            'Михайлова Мария Дмитриевна', 'Андреев Сергей Александрович', 'Николаева Ольга Ивановна',
            'Захаров Виктор Петрович', 'Соколов Андрей Михайлович', 'Лебедева Татьяна Сергеевна',
            'Егоров Павел Викторович', 'Волкова Екатерина Андреевна', 'Федоров Игорь Николаевич',
            'Алексеева Наталья Петровна', 'Дмитриев Максим Иванович', 'Орлова Светлана Викторовна',
            'Григорьев Алексей Петрович', 'Новикова Ирина Александровна'
        ];

        studentNames.forEach((name, i) => {
            const birthYear = 2010 + Math.floor(Math.random() * 4);
            const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            const grade = Math.floor(Math.random() * 11) + 1;
            const gender = i % 2 === 0 ? 'male' : 'female';
            
            this.db.run(`
                INSERT INTO students (full_name, birth_date, gender, grade, institution_id)
                VALUES (?, ?, ?, ?, ?)
            `, [name, `${birthYear}-${birthMonth}-${birthDay}`, gender, grade, (i % 5) + 1]);
        });

        // Демо работники (15 человек)
        const staffNames = [
            'Суслова Марина Ивановна', 'Тихонов Сергей Петрович', 'Борисенко Наталья Викторовна',
            'Громов Алексей Дмитриевич', 'Коновалова Елена Сергеевна', 'Зайцев Виктор Михайлович',
            'Павлова Анна Александровна', 'Савельев Дмитрий Олегович', 'Ефимова Ирина Викторовна',
            'Романов Константин Сергеевич', 'Кузнецова Екатерина Петровна', 'Морозов Антон Иванович',
            'Никитина Ольга Михайловна', 'Жуковский Виктор Александрович', 'Белова Татьяна Викторовна'
        ];

        const positions = ['Директор', 'Зам. директора', 'Учитель', 'Воспитатель', 'Психолог', 'Бухгалтер'];
        
        staffNames.forEach((name, i) => {
            const position = positions[i % positions.length];
            const hireYear = 2015 + Math.floor(Math.random() * 9);
            const hireMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            
            this.db.run(`
                INSERT INTO staff (full_name, position, institution_id, hire_date, education)
                VALUES (?, ?, ?, ?, ?)
            `, [name, position, (i % 5) + 1, `${hireYear}-${hireMonth}-01`, 'Высшее']);
        });

        // Демо статистика
        const categories = ['Количество учащихся', 'Количество работников', 'Успеваемость', 'Посещаемость'];
        
        for (let i = 1; i <= 5; i++) {
            categories.forEach(cat => {
                const value = Math.floor(Math.random() * 100) + 50;
                const year = 2023 + Math.floor(Math.random() * 2);
                const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                
                this.db.run(`
                    INSERT INTO statistics (institution_id, category, value, date)
                    VALUES (?, ?, ?, ?)
                `, [i, cat, value, `${year}-${month}-01`]);
            });
        }

        this.save();
    }

    // Сохранение базы данных в localStorage
    save() {
        const data = this.db.export();
        const arr = Array.from(data);
        localStorage.setItem('app_database', JSON.stringify(arr));
    }

    // Выполнение запроса SELECT
    query(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            stmt.bind(params);
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
        } catch (error) {
            console.error('SQL Error:', error);
            return [];
        }
    }

    // Выполнение запроса INSERT/UPDATE/DELETE
    run(sql, params = []) {
        try {
            this.db.run(sql, params);
            this.save();
            return { success: true };
        } catch (error) {
            console.error('SQL Error:', error);
            return { success: false, error };
        }
    }

    // Получение последнего вставленного ID
    getLastInsertId() {
        const result = this.query('SELECT last_insert_rowid() as id');
        return result[0]?.id || null;
    }

    // Получение одной записи
    getOne(sql, params = []) {
        const results = this.query(sql, params);
        return results[0] || null;
    }

    // Генерация UUID
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

// Создание экземпляра базы данных
const db = new LocalDatabase();

// Экспорт
window.db = db;