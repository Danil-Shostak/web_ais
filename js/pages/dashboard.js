// ========================================
// Страница дашборда
// ========================================

const dashboardPage = {
    // Загрузка дашборда
    load: async function() {
        try {
            // Получение данных для дашборда
            const [institutionsCount, studentsCount, staffCount, recentLogs] = await Promise.all([
                api.getInstitutions({ limit: 1000 }),
                api.getTotalStudents(),
                api.getTotalStaff(),
                api.getLogs({ limit: 10 })
            ]);
            
            // Подсчет по типам учреждений
            const typeCounts = {};
            institutionsCount.forEach(inst => {
                typeCounts[inst.type] = (typeCounts[inst.type] || 0) + 1;
            });
            
            // Генерация HTML дашборда
            const html = `
                <div class="page-header">
                    <h1>Дашборд</h1>
                    <p>Обзор системы автоматизации образования</p>
                </div>
                
                <!-- Статистические карточки -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon blue">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <h4>${institutionsCount.length}</h4>
                            <p>Учреждений образования</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <h4>${studentsCount}</h4>
                            <p>Учащихся</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon orange">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <h4>${staffCount}</h4>
                            <p>Работников</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon red">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <h4>${recentLogs.length}</h4>
                            <p>Активность (сегодня)</p>
                        </div>
                    </div>
                </div>
                
                <!-- Графики и активность -->
                <div class="dashboard-grid">
                    <div class="card">
                        <div class="card-header">
                            <h3>Учреждения по типам</h3>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="typeChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3>Последняя активность</h3>
                        </div>
                        <div class="card-body">
                            ${recentLogs.length > 0 ? `
                                <ul class="activity-list">
                                    ${recentLogs.map(log => `
                                        <li>
                                            <div class="activity-icon">
                                                ${this.getActivityIcon(log.action)}
                                            </div>
                                            <div class="activity-info">
                                                <p>${this.formatAction(log.action)}</p>
                                                <span>${formatDate(log.created_at, 'datetime')}</span>
                                            </div>
                                        </li>
                                    `).join('')}
                                </ul>
                            ` : '<p class="text-muted text-center">Нет активности</p>'}
                        </div>
                    </div>
                </div>
                
                <!-- Быстрые действия -->
                <div class="card mt-3">
                    <div class="card-header">
                        <h3>Быстрые действия</h3>
                    </div>
                    <div class="card-body">
                        <div class="flex flex-gap">
                            ${canAccess('institutions.edit') ? `
                                <button class="btn-primary" onclick="navigateTo('institutions')">
                                    Добавить учреждение
                                </button>
                            ` : ''}
                            <button class="btn-secondary" onclick="navigateTo('reports')">
                                Создать отчет
                            </button>
                            <button class="btn-secondary" onclick="navigateTo('statistics')">
                                Просмотреть статистику
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('pageContent').innerHTML = html;
            
            // Рисуем график после рендеринга
            setTimeout(() => {
                this.renderChart(typeCounts);
            }, 100);
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            document.getElementById('pageContent').innerHTML = `
                <div class="empty-state">
                    <h2>Ошибка загрузки дашборда</h2>
                    <p>Попробуйте обновить страницу</p>
                </div>
            `;
        }
    },
    
    // Получение иконки для активности
    getActivityIcon: function(action) {
        const icons = {
            'login': '🔑',
            'logout': '🚪',
            'create': '➕',
            'update': '✏️',
            'delete': '🗑️',
            'error': '⚠️'
        };
        return icons[action] || '📋';
    },
    
    // Форматирование действия
    formatAction: function(action) {
        const actions = {
            'login': 'Вход в систему',
            'logout': 'Выход из системы',
            'create': 'Создание записи',
            'update': 'Обновление записи',
            'delete': 'Удаление записи',
            'error': 'Ошибка'
        };
        return actions[action] || action;
    },
    
    // Рисование графика
    renderChart: function(typeCounts) {
        const ctx = document.getElementById('typeChart');
        if (!ctx) return;
        
        const labels = Object.keys(typeCounts);
        const data = Object.values(typeCounts);
        
        // Создание графика
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#2563eb',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#ec4899'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
};

// Экспорт
window.dashboardPage = dashboardPage;