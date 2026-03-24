// ========================================
// API модуль для работы с локальной базой данных SQLite
// ========================================

// API функции для работы с учреждениями образования
const api = {
    // ==================== Учреждения образования ====================
    
    // Получение всех учреждений
    async getInstitutions(filters = {}) {
        try {
            let sql = 'SELECT * FROM institutions WHERE 1=1';
            const params = [];

            if (filters.type) {
                sql += ' AND type = ?';
                params.push(filters.type);
            }
            if (filters.region) {
                sql += ' AND region = ?';
                params.push(filters.region);
            }
            if (filters.search) {
                sql += ' AND name LIKE ?';
                params.push(`%${filters.search}%`);
            }

            if (filters.sortBy) {
                sql += ` ORDER BY ${filters.sortBy} ${filters.sortAsc !== false ? 'ASC' : 'DESC'}`;
            } else {
                sql += ' ORDER BY name ASC';
            }

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }

            return db.query(sql, params);
        } catch (error) {
            console.error('Error fetching institutions:', error);
            throw error;
        }
    },
    
    // Получение учреждения по ID
    async getInstitutionById(id) {
        try {
            return db.getOne('SELECT * FROM institutions WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error fetching institution:', error);
            throw error;
        }
    },
    
    // Создание учреждения
    async createInstitution(data) {
        try {
            const sql = `
                INSERT INTO institutions (name, type, region, address, phone, email, website, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const result = db.run(sql, [
                data.name, data.type, data.region, data.address, 
                data.phone, data.email, data.website, data.description
            ]);
            
            if (result.success) {
                return { id: db.getLastInsertId(), ...data };
            }
            throw result.error;
        } catch (error) {
            console.error('Error creating institution:', error);
            throw error;
        }
    },
    
    // Обновление учреждения
    async updateInstitution(id, data) {
        try {
            const fields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(data)) {
                if (key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            }
            
            if (fields.length === 0) return { success: false };
            
            values.push(id);
            const sql = `UPDATE institutions SET ${fields.join(', ')} WHERE id = ?`;
            return db.run(sql, values);
        } catch (error) {
            console.error('Error updating institution:', error);
            throw error;
        }
    },
    
    // Удаление учреждения
    async deleteInstitution(id) {
        try {
            // Удаление связанных записей
            db.run('DELETE FROM students WHERE institution_id = ?', [id]);
            db.run('DELETE FROM staff WHERE institution_id = ?', [id]);
            db.run('DELETE FROM statistics WHERE institution_id = ?', [id]);
            return db.run('DELETE FROM institutions WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error deleting institution:', error);
            throw error;
        }
    },
    
    // ==================== Учащиеся ====================
    
    // Получение всех учащихся
    async getStudents(filters = {}) {
        try {
            let sql = 'SELECT * FROM students WHERE 1=1';
            const params = [];

            if (filters.institution_id) {
                sql += ' AND institution_id = ?';
                params.push(filters.institution_id);
            }
            if (filters.grade) {
                sql += ' AND grade = ?';
                params.push(filters.grade);
            }
            if (filters.search) {
                sql += ' AND full_name LIKE ?';
                params.push(`%${filters.search}%`);
            }

            sql += ' ORDER BY full_name ASC';

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }

            return db.query(sql, params);
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    },
    
    // Получение учащегося по ID
    async getStudentById(id) {
        try {
            return db.getOne('SELECT * FROM students WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error fetching student:', error);
            throw error;
        }
    },
    
    // Создание учащегося
    async createStudent(data) {
        try {
            const sql = `
                INSERT INTO students (full_name, birth_date, gender, grade, institution_id, address, parent_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const result = db.run(sql, [
                data.full_name, data.birth_date, data.gender, data.grade,
                data.institution_id, data.address, data.parent_phone
            ]);
            
            if (result.success) {
                return { id: db.getLastInsertId(), ...data };
            }
            throw result.error;
        } catch (error) {
            console.error('Error creating student:', error);
            throw error;
        }
    },
    
    // Обновление учащегося
    async updateStudent(id, data) {
        try {
            const fields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(data)) {
                if (key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            }
            
            if (fields.length === 0) return { success: false };
            
            values.push(id);
            const sql = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
            return db.run(sql, values);
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    },
    
    // Удаление учащегося
    async deleteStudent(id) {
        try {
            return db.run('DELETE FROM students WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    },
    
    // ==================== Работники ====================
    
    // Получение всех работников
    async getStaff(filters = {}) {
        try {
            let sql = 'SELECT * FROM staff WHERE 1=1';
            const params = [];

            if (filters.institution_id) {
                sql += ' AND institution_id = ?';
                params.push(filters.institution_id);
            }
            if (filters.position) {
                sql += ' AND position = ?';
                params.push(filters.position);
            }
            if (filters.search) {
                sql += ' AND full_name LIKE ?';
                params.push(`%${filters.search}%`);
            }

            sql += ' ORDER BY full_name ASC';

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }

            return db.query(sql, params);
        } catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    },
    
    // Получение работника по ID
    async getStaffById(id) {
        try {
            return db.getOne('SELECT * FROM staff WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    },
    
    // Создание работника
    async createStaff(data) {
        try {
            const sql = `
                INSERT INTO staff (full_name, position, institution_id, hire_date, education, specialty, phone, email)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const result = db.run(sql, [
                data.full_name, data.position, data.institution_id, data.hire_date,
                data.education, data.specialty, data.phone, data.email
            ]);
            
            if (result.success) {
                return { id: db.getLastInsertId(), ...data };
            }
            throw result.error;
        } catch (error) {
            console.error('Error creating staff:', error);
            throw error;
        }
    },
    
    // Обновление работника
    async updateStaff(id, data) {
        try {
            const fields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(data)) {
                if (key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            }
            
            if (fields.length === 0) return { success: false };
            
            values.push(id);
            const sql = `UPDATE staff SET ${fields.join(', ')} WHERE id = ?`;
            return db.run(sql, values);
        } catch (error) {
            console.error('Error updating staff:', error);
            throw error;
        }
    },
    
    // Удаление работника
    async deleteStaff(id) {
        try {
            return db.run('DELETE FROM staff WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    },
    
    // ==================== Статистика ====================
    
    // Получение статистики
    async getStatistics(filters = {}) {
        try {
            let sql = 'SELECT * FROM statistics WHERE 1=1';
            const params = [];

            if (filters.institution_id) {
                sql += ' AND institution_id = ?';
                params.push(filters.institution_id);
            }
            if (filters.category) {
                sql += ' AND category = ?';
                params.push(filters.category);
            }
            if (filters.start_date) {
                sql += ' AND date >= ?';
                params.push(filters.start_date);
            }
            if (filters.end_date) {
                sql += ' AND date <= ?';
                params.push(filters.end_date);
            }

            sql += ' ORDER BY date DESC';

            return db.query(sql, params);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    },
    
    // Создание записи статистики
    async createStatistic(data) {
        try {
            const sql = `
                INSERT INTO statistics (institution_id, category, value, date)
                VALUES (?, ?, ?, ?)
            `;
            const result = db.run(sql, [data.institution_id, data.category, data.value, data.date]);
            
            if (result.success) {
                return { id: db.getLastInsertId(), ...data };
            }
            throw result.error;
        } catch (error) {
            console.error('Error creating statistic:', error);
            throw error;
        }
    },
    
    // ==================== Отчеты ====================
    
    // Получение всех отчетов
    async getReports(filters = {}) {
        try {
            let sql = 'SELECT * FROM reports WHERE 1=1';
            const params = [];

            if (filters.user_id) {
                sql += ' AND user_id = ?';
                params.push(filters.user_id);
            }
            if (filters.type) {
                sql += ' AND type = ?';
                params.push(filters.type);
            }

            sql += ' ORDER BY created_at DESC';

            return db.query(sql, params);
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    },
    
    // Создание отчета
    async createReport(data) {
        try {
            const sql = `
                INSERT INTO reports (user_id, type, title, data)
                VALUES (?, ?, ?, ?)
            `;
            const result = db.run(sql, [data.user_id, data.type, data.title, JSON.stringify(data.data)]);
            
            if (result.success) {
                return { id: db.getLastInsertId(), ...data };
            }
            throw result.error;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    },
    
    // ==================== Логи ====================
    
    // Создание записи лога
    async createLog(data) {
        try {
            const sql = `
                INSERT INTO logs (user_id, action, details)
                VALUES (?, ?, ?)
            `;
            return db.run(sql, [data.user_id, data.action, data.details]);
        } catch (error) {
            console.error('Error creating log:', error);
        }
    },
    
    // Получение логов
    async getLogs(filters = {}) {
        try {
            let sql = 'SELECT * FROM logs WHERE 1=1';
            const params = [];

            if (filters.user_id) {
                sql += ' AND user_id = ?';
                params.push(filters.user_id);
            }
            if (filters.action) {
                sql += ' AND action = ?';
                params.push(filters.action);
            }

            sql += ' ORDER BY created_at DESC';

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }

            return db.query(sql, params);
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }
    },
    
    // ==================== Уведомления ====================
    
    // Получение уведомлений пользователя
    async getNotifications(userId) {
        try {
            return db.query(`
                SELECT * FROM notifications 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `, [userId]);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },
    
    // Создание уведомления
    async createNotification(data) {
        try {
            const sql = `
                INSERT INTO notifications (user_id, title, message, read)
                VALUES (?, ?, ?, ?)
            `;
            const result = db.run(sql, [data.user_id, data.title, data.message, 0]);
            
            if (result.success) {
                return { id: db.getLastInsertId(), ...data };
            }
            throw result.error;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },
    
    // Отметка уведомления как прочитанного
    async markNotificationRead(id) {
        try {
            return db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error marking notification:', error);
            throw error;
        }
    },
    
    // ==================== Профиль пользователя ====================
    
    // Получение профиля пользователя
    async getProfile(userId) {
        try {
            return db.getOne('SELECT * FROM profiles WHERE user_id = ?', [userId]);
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },
    
    // Создание профиля
    async createProfile(data) {
        try {
            const sql = `
                INSERT INTO profiles (user_id, full_name, role)
                VALUES (?, ?, ?)
            `;
            const result = db.run(sql, [data.user_id, data.full_name, data.role || 'user']);
            
            if (result.success) {
                return { id: db.getLastInsertId(), ...data };
            }
            throw result.error;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    },
    
    // Обновление профиля
    async updateProfile(userId, data) {
        try {
            const fields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(data)) {
                if (key !== 'user_id') {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            }
            
            if (fields.length === 0) return { success: false };
            
            values.push(userId);
            const sql = `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = ?`;
            return db.run(sql, values);
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },
    
    // ==================== Пользователи ====================
    
    // Получение всех пользователей (для админа)
    async getUsers() {
        try {
            return db.query('SELECT * FROM users ORDER BY created_at DESC');
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },
    
    // ==================== Показатели для дашборда ====================
    
    // Получение количества учреждений по типам
    async getInstitutionsCountByType() {
        try {
            const institutions = db.query('SELECT type FROM institutions');
            
            const counts = {};
            institutions.forEach(inst => {
                counts[inst.type] = (counts[inst.type] || 0) + 1;
            });
            
            return counts;
        } catch (error) {
            console.error('Error fetching count by type:', error);
            return {};
        }
    },
    
    // Получение общего количества учащихся
    async getTotalStudents() {
        try {
            const students = db.query('SELECT id FROM students');
            return students.length;
        } catch (error) {
            console.error('Error fetching total students:', error);
            return 0;
        }
    },
    
    // Получение общего количества работников
    async getTotalStaff() {
        try {
            const staff = db.query('SELECT id FROM staff');
            return staff.length;
        } catch (error) {
            console.error('Error fetching total staff:', error);
            return 0;
        }
    },
    
    // ==================== Массовые операции ====================
    
    // Массовое создание учреждений
    async bulkCreateInstitutions(dataArray) {
        try {
            const results = [];
            for (const data of dataArray) {
                const result = await this.createInstitution(data);
                results.push(result);
            }
            return results;
        } catch (error) {
            console.error('Error bulk creating institutions:', error);
            throw error;
        }
    },
    
    // Массовое создание учащихся
    async bulkCreateStudents(dataArray) {
        try {
            const results = [];
            for (const data of dataArray) {
                const result = await this.createStudent(data);
                results.push(result);
            }
            return results;
        } catch (error) {
            console.error('Error bulk creating students:', error);
            throw error;
        }
    },
    
    // Массовое создание работников
    async bulkCreateStaff(dataArray) {
        try {
            const results = [];
            for (const data of dataArray) {
                const result = await this.createStaff(data);
                results.push(result);
            }
            return results;
        } catch (error) {
            console.error('Error bulk creating staff:', error);
            throw error;
        }
    }
};

// Экспорт
window.api = api;