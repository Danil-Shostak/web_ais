// ========================================
// API модуль для работы с Supabase
// ========================================

// API функции для работы с учреждениями образования
const api = {
    // ==================== Учреждения образования ====================
    
    // Получение всех учреждений
    async getInstitutions(filters = {}) {
        try {
            let query = supabase.from('institutions').select('*');
            
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.region) {
                query = query.eq('region', filters.region);
            }
            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }
            
            if (filters.sortBy) {
                query = query.order(filters.sortBy, { ascending: filters.sortAsc !== false });
            } else {
                query = query.order('name', { ascending: true });
            }
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching institutions:', error);
            throw error;
        }
    },
    
    // Получение учреждения по ID
    async getInstitutionById(id) {
        try {
            const { data, error } = await supabase
                .from('institutions')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching institution:', error);
            throw error;
        }
    },
    
    // Создание учреждения
    async createInstitution(data) {
        try {
            const { data: result, error } = await supabase
                .from('institutions')
                .insert([data])
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating institution:', error);
            throw error;
        }
    },
    
    // Обновление учреждения
    async updateInstitution(id, data) {
        try {
            const { data: result, error } = await supabase
                .from('institutions')
                .update(data)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error updating institution:', error);
            throw error;
        }
    },
    
    // Удаление учреждения
    async deleteInstitution(id) {
        try {
            // Удаление связанных записей
            await supabase.from('students').delete().eq('institution_id', id);
            await supabase.from('staff').delete().eq('institution_id', id);
            await supabase.from('statistics').delete().eq('institution_id', id);
            
            const { error } = await supabase
                .from('institutions')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting institution:', error);
            throw error;
        }
    },
    
    // ==================== Учащиеся ====================
    
    // Получение всех учащихся
    async getStudents(filters = {}) {
        try {
            let query = supabase.from('students').select('*');
            
            if (filters.institution_id) {
                query = query.eq('institution_id', filters.institution_id);
            }
            if (filters.grade) {
                query = query.eq('grade', filters.grade);
            }
            if (filters.search) {
                query = query.ilike('full_name', `%${filters.search}%`);
            }
            
            query = query.order('full_name', { ascending: true });
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    },
    
    // Получение учащегося по ID
    async getStudentById(id) {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching student:', error);
            throw error;
        }
    },
    
    // Создание учащегося
    async createStudent(data) {
        try {
            const { data: result, error } = await supabase
                .from('students')
                .insert([data])
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating student:', error);
            throw error;
        }
    },
    
    // Обновление учащегося
    async updateStudent(id, data) {
        try {
            const { data: result, error } = await supabase
                .from('students')
                .update(data)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    },
    
    // Удаление учащегося
    async deleteStudent(id) {
        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    },
    
    // ==================== Работники ====================
    
    // Получение всех работников
    async getStaff(filters = {}) {
        try {
            let query = supabase.from('staff').select('*');
            
            if (filters.institution_id) {
                query = query.eq('institution_id', filters.institution_id);
            }
            if (filters.position) {
                query = query.eq('position', filters.position);
            }
            if (filters.search) {
                query = query.ilike('full_name', `%${filters.search}%`);
            }
            
            query = query.order('full_name', { ascending: true });
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    },
    
    // Получение работника по ID
    async getStaffById(id) {
        try {
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    },
    
    // Создание работника
    async createStaff(data) {
        try {
            const { data: result, error } = await supabase
                .from('staff')
                .insert([data])
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating staff:', error);
            throw error;
        }
    },
    
    // Обновление работника
    async updateStaff(id, data) {
        try {
            const { data: result, error } = await supabase
                .from('staff')
                .update(data)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error updating staff:', error);
            throw error;
        }
    },
    
    // Удаление работника
    async deleteStaff(id) {
        try {
            const { error } = await supabase
                .from('staff')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    },
    
    // ==================== Статистика ====================
    
    // Получение статистики
    async getStatistics(filters = {}) {
        try {
            let query = supabase.from('statistics').select('*');
            
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
            
            query = query.order('date', { ascending: false });
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    },
    
    // Создание записи статистики
    async createStatistic(data) {
        try {
            const { data: result, error } = await supabase
                .from('statistics')
                .insert([data])
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating statistic:', error);
            throw error;
        }
    },
    
    // ==================== Отчеты ====================
    
    // Получение всех отчетов
    async getReports(filters = {}) {
        try {
            let query = supabase.from('reports').select('*');
            
            if (filters.user_id) {
                query = query.eq('user_id', filters.user_id);
            }
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            
            query = query.order('created_at', { ascending: false });
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    },
    
    // Создание отчета
    async createReport(data) {
        try {
            const { data: result, error } = await supabase
                .from('reports')
                .insert([{
                    ...data,
                    data: JSON.stringify(data.data)
                }])
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    },
    
    // ==================== Логи ====================
    
    // Создание записи лога
    async createLog(data) {
        // Проверка на пустые данные
        if (!data || !data.user_id) {
            console.warn('createLog called with invalid data, skipping');
            return;
        }
        
        try {
            const { error } = await supabase
                .from('logs')
                .insert([data]);
            
            if (error) console.error('Error creating log:', error);
        } catch (error) {
            console.error('Error creating log:', error);
        }
    },
    
    // Получение логов
    async getLogs(filters = {}) {
        try {
            let query = supabase.from('logs').select('*');
            
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
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }
    },
    
    // ==================== Уведомления ====================
    
    // Получение уведомлений пользователя
    async getNotifications(userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },
    
    // Создание уведомления
    async createNotification(data) {
        try {
            const { data: result, error } = await supabase
                .from('notifications')
                .insert([{ ...data, read: false }])
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },
    
    // Отметка уведомления как прочитанного
    async markNotificationRead(id) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error marking notification:', error);
            throw error;
        }
    },
    
    // ==================== Профиль пользователя ====================
    
    // Получение профиля пользователя
    async getProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (error) {
                // Если профиль не найден, возвращаем null
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    },
    
    // Создание профиля
    async createProfile(data) {
        try {
            const { data: result, error } = await supabase
                .from('profiles')
                .insert([data])
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    },
    
    // Обновление профиля
    async updateProfile(userId, data) {
        try {
            const { data: result, error } = await supabase
                .from('profiles')
                .update(data)
                .eq('user_id', userId)
                .select()
                .single();
            
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },
    
    // ==================== Пользователи ====================
    
    // Получение всех пользователей (для админа)
    async getUsers() {
        try {
            // Получаем текущую сессию для извлечения email
            const { data: { user: authUser } } = await supabase.auth.getUser();
            
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Добавляем email из auth для каждого профиля
            const users = (data || []).map(profile => ({
                ...profile,
                email: authUser?.email || '—',
                id: profile.user_id || profile.id
            }));
            
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },
    
    // ==================== Показатели для дашборда ====================
    
    // Получение количества учреждений по типам
    async getInstitutionsCountByType() {
        try {
            const { data, error } = await supabase
                .from('institutions')
                .select('type');
            
            if (error) throw error;
            
            const counts = {};
            data?.forEach(inst => {
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
            const { count, error } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching total students:', error);
            return 0;
        }
    },
    
    // Получение общего количества работников
    async getTotalStaff() {
        try {
            const { count, error } = await supabase
                .from('staff')
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching total staff:', error);
            return 0;
        }
    },
    
    // ==================== Массовые операции ====================
    
    // Массовое создание учреждений
    async bulkCreateInstitutions(dataArray) {
        try {
            const { data, error } = await supabase
                .from('institutions')
                .insert(dataArray)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error bulk creating institutions:', error);
            throw error;
        }
    },
    
    // Массовое создание учащихся
    async bulkCreateStudents(dataArray) {
        try {
            const { data, error } = await supabase
                .from('students')
                .insert(dataArray)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error bulk creating students:', error);
            throw error;
        }
    },
    
    // Массовое создание работников
    async bulkCreateStaff(dataArray) {
        try {
            const { data, error } = await supabase
                .from('staff')
                .insert(dataArray)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error bulk creating staff:', error);
            throw error;
        }
    }
};

// Экспорт
window.api = api;