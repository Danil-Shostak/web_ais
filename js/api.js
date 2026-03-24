// ========================================
// API модуль для работы с данными
// ========================================

// Таблицы базы данных
const TABLES = {
    users: 'users',
    profiles: 'profiles',
    institutions: 'institutions',
    students: 'students',
    staff: 'staff',
    statistics: 'statistics',
    reports: 'reports',
    logs: 'logs',
    notifications: 'notifications',
    settings: 'settings'
};

// API функции для работы с учреждениями образования
const api = {
    // ==================== Учреждения образования ====================
    
    // Получение всех учреждений
    async getInstitutions(filters = {}) {
        try {
            let query = supabase.from(TABLES.institutions).select('*');
            
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.region) {
                query = query.eq('region', filters.region);
            }
            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.offset(filters.offset);
            }
            
            if (filters.sortBy) {
                query = query.order(filters.sortBy, { ascending: filters.sortAsc !== false });
            }
            
            return await query.execute();
        } catch (error) {
            console.error('Error fetching institutions:', error);
            throw error;
        }
    },
    
    // Получение учреждения по ID
    async getInstitutionById(id) {
        try {
            const data = await supabase.from(TABLES.institutions)
                .select('*')
                .eq('id', id)
                .execute();
            return data[0] || null;
        } catch (error) {
            console.error('Error fetching institution:', error);
            throw error;
        }
    },
    
    // Создание учреждения
    async createInstitution(data) {
        try {
            return await supabase.insert(TABLES.institutions, data);
        } catch (error) {
            console.error('Error creating institution:', error);
            throw error;
        }
    },
    
    // Обновление учреждения
    async updateInstitution(id, data) {
        try {
            return await supabase.update(TABLES.institutions, data, { id: id });
        } catch (error) {
            console.error('Error updating institution:', error);
            throw error;
        }
    },
    
    // Удаление учреждения
    async deleteInstitution(id) {
        try {
            return await supabase.delete(TABLES.institutions, { id: id });
        } catch (error) {
            console.error('Error deleting institution:', error);
            throw error;
        }
    },
    
    // ==================== Учащиеся ====================
    
    // Получение всех учащихся
    async getStudents(filters = {}) {
        try {
            let query = supabase.from(TABLES.students).select('*');
            
            if (filters.institution_id) {
                query = query.eq('institution_id', filters.institution_id);
            }
            if (filters.grade) {
                query = query.eq('grade', filters.grade);
            }
            if (filters.search) {
                query = query.ilike('full_name', `%${filters.search}%`);
            }
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.offset(filters.offset);
            }
            
            return await query.execute();
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    },
    
    // Получение учащегося по ID
    async getStudentById(id) {
        try {
            const data = await supabase.from(TABLES.students)
                .select('*')
                .eq('id', id)
                .execute();
            return data[0] || null;
        } catch (error) {
            console.error('Error fetching student:', error);
            throw error;
        }
    },
    
    // Создание учащегося
    async createStudent(data) {
        try {
            return await supabase.insert(TABLES.students, data);
        } catch (error) {
            console.error('Error creating student:', error);
            throw error;
        }
    },
    
    // Обновление учащегося
    async updateStudent(id, data) {
        try {
            return await supabase.update(TABLES.students, data, { id: id });
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    },
    
    // Удаление учащегося
    async deleteStudent(id) {
        try {
            return await supabase.delete(TABLES.students, { id: id });
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    },
    
    // ==================== Работники ====================
    
    // Получение всех работников
    async getStaff(filters = {}) {
        try {
            let query = supabase.from(TABLES.staff).select('*');
            
            if (filters.institution_id) {
                query = query.eq('institution_id', filters.institution_id);
            }
            if (filters.position) {
                query = query.eq('position', filters.position);
            }
            if (filters.search) {
                query = query.ilike('full_name', `%${filters.search}%`);
            }
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.offset(filters.offset);
            }
            
            return await query.execute();
        } catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    },
    
    // Получение работника по ID
    async getStaffById(id) {
        try {
            const data = await supabase.from(TABLES.staff)
                .select('*')
                .eq('id', id)
                .execute();
            return data[0] || null;
        } catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    },
    
    // Создание работника
    async createStaff(data) {
        try {
            return await supabase.insert(TABLES.staff, data);
        } catch (error) {
            console.error('Error creating staff:', error);
            throw error;
        }
    },
    
    // Обновление работника
    async updateStaff(id, data) {
        try {
            return await supabase.update(TABLES.staff, data, { id: id });
        } catch (error) {
            console.error('Error updating staff:', error);
            throw error;
        }
    },
    
    // Удаление работника
    async deleteStaff(id) {
        try {
            return await supabase.delete(TABLES.staff, { id: id });
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    },
    
    // ==================== Статистика ====================
    
    // Получение статистики
    async getStatistics(filters = {}) {
        try {
            let query = supabase.from(TABLES.statistics).select('*');
            
            if (filters.institution_id) {
                query = query.eq('institution_id', filters.institution_id);
            }
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (filters.start_date) {
                query = query.gte('date', filters.start_date);
            }
            if (filters.end_date) {
                query = query.lte('date', filters.end_date);
            }
            
            return await query.execute();
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    },
    
    // Создание записи статистики
    async createStatistic(data) {
        try {
            return await supabase.insert(TABLES.statistics, data);
        } catch (error) {
            console.error('Error creating statistic:', error);
            throw error;
        }
    },
    
    // ==================== Отчеты ====================
    
    // Получение всех отчетов
    async getReports(filters = {}) {
        try {
            let query = supabase.from(TABLES.reports).select('*');
            
            if (filters.user_id) {
                query = query.eq('user_id', filters.user_id);
            }
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            
            return await query.execute();
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    },
    
    // Создание отчета
    async createReport(data) {
        try {
            return await supabase.insert(TABLES.reports, data);
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    },
    
    // ==================== Логи ====================
    
    // Создание записи лога
    async createLog(data) {
        try {
            return await supabase.insert(TABLES.logs, data);
        } catch (error) {
            console.error('Error creating log:', error);
            // Не блокируем выполнение при ошибке логирования
        }
    },
    
    // Получение логов
    async getLogs(filters = {}) {
        try {
            let query = supabase.from(TABLES.logs).select('*');
            
            if (filters.user_id) {
                query = query.eq('user_id', filters.user_id);
            }
            if (filters.action) {
                query = query.eq('action', filters.action);
            }
            
            query = query.order('created_at', { ascending: false });
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            return await query.execute();
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }
    },
    
    // ==================== Уведомления ====================
    
    // Получение уведомлений пользователя
    async getNotifications(userId) {
        try {
            return await supabase.from(TABLES.notifications)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .execute();
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },
    
    // Создание уведомления
    async createNotification(data) {
        try {
            return await supabase.insert(TABLES.notifications, data);
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },
    
    // Отметка уведомления как прочитанного
    async markNotificationRead(id) {
        try {
            return await supabase.update(TABLES.notifications, { read: true }, { id: id });
        } catch (error) {
            console.error('Error marking notification:', error);
            throw error;
        }
    },
    
    // ==================== Пользователи ====================
    
    // Получение профиля пользователя
    async getProfile(userId) {
        try {
            const data = await supabase.from(TABLES.profiles)
                .select('*')
                .eq('user_id', userId)
                .execute();
            return data[0] || null;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },
    
    // Обновление профиля
    async updateProfile(userId, data) {
        try {
            return await supabase.update(TABLES.profiles, data, { user_id: userId });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },
    
    // Получение всех пользователей (для админа)
    async getUsers() {
        try {
            return await supabase.from(TABLES.users).select('*').execute();
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },
    
    // ==================== Показатели для дашборда ====================
    
    // Получение количества учреждений по типам
    async getInstitutionsCountByType() {
        try {
            // Используем простой подсчет - в реальном приложении можно использовать RPC
            const institutions = await supabase.from(TABLES.institutions).select('type').execute();
            
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
            const students = await supabase.from(TABLES.students).select('id').execute();
            return students.length;
        } catch (error) {
            console.error('Error fetching total students:', error);
            return 0;
        }
    },
    
    // Получение общего количества работников
    async getTotalStaff() {
        try {
            const staff = await supabase.from(TABLES.staff).select('id').execute();
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
                const result = await supabase.insert(TABLES.institutions, data);
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
                const result = await supabase.insert(TABLES.students, data);
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
                const result = await supabase.insert(TABLES.staff, data);
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