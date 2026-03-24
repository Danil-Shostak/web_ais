// ========================================
// Страница статистики
// ========================================

const statisticsPage = {
    institutions: [],
    charts: {},
    
    // Загрузка страницы
    load: async function() {
        try {
            const institutions = await api.getInstitutions({ limit: 1000 });
            this.institutions = institutions;
            this.render();
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.render();
        }
    },
    
    // Рендер страницы
    render: function() {
        const html = `
            <div class="page-header">
                <h1>Статистика</h1>
                <p>Аналитические данные и визуализация показателей</p>
            </div>
            
            <!-- Фильтры -->
            <div class="filters-bar">
                <div class="filter-group">
                    <label>Учреждение</label>
                    <select id="institutionFilter" onchange="statisticsPage.updateCharts()">
                        <option value="">Все учреждения</option>
                        ${this.institutions.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Период</label>
                    <select id="periodFilter" onchange="statisticsPage.updateCharts()">
                        <option value="all">За все время</option>
                        <option value="year">За год</option>
                        <option value="month">За месяц</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Тип графика</label>
                    <select id="chartType" onchange="statisticsPage.updateCharts()">
                        <option value="bar">Столбчатая диаграмма</option>
                        <option value="line">Линейный график</option>
                        <option value="pie">Круговая диаграмма</option>
                    </select>
                </div>
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
                        <h4>${this.institutions.length}</h4>
                        <p>Всего учреждений</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h4>${this.getCountByType('Общее среднее')}</h4>
                        <p>Школ</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h4>${this.getCountByType('Дошкольное')}</h4>
                        <p>Детских садов</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h4>${this.getCountByType('Высшее')}</h4>
                        <p>ВУЗов</p>
                    </div>
                </div>
            </div>
            
            <!-- Графики -->
            <div class="grid-2">
                <div class="chart-container">
                    <h3>Учреждения по типам</h3>
                    <div class="chart-wrapper">
                        <canvas id="typeChart"></canvas>
                    </div>
                </div>
                <div class="chart-container">
                    <h3>Учреждения по регионам</h3>
                    <div class="chart-wrapper">
                        <canvas id="regionChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>Динамика учреждений по годам</h3>
                <div class="chart-wrapper">
                    <canvas id="timelineChart"></canvas>
                </div>
            </div>
            
            <!-- Таблица статистики -->
            <div class="card mt-3">
                <div class="card-header">
                    <h3>Детальная статистика</h3>
                    <button class="btn-secondary btn-sm" onclick="statisticsPage.exportStats()">
                        Экспорт в Excel
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Тип учреждения</th>
                                <th>Количество</th>
                                <th>Процент</th>
                                <th>Визуализация</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.getTypeStats().map(stat => `
                                <tr>
                                    <td>${stat.type}</td>
                                    <td>${stat.count}</td>
                                    <td>${stat.percent}%</td>
                                    <td>
                                        <div style="width: 100%; background: #e2e8f0; height: 20px; border-radius: 4px;">
                                            <div style="width: ${stat.percent}%; background: var(--primary-color); height: 100%; border-radius: 4px;"></div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('pageContent').innerHTML = html;
        
        // Рисуем графики после рендеринга
        setTimeout(() => {
            this.renderCharts();
        }, 100);
    },
    
    // Получить количество по типу
    getCountByType: function(type) {
        return this.institutions.filter(i => i.type === type).length;
    },
    
    // Получить статистику по типам
    getTypeStats: function() {
        const total = this.institutions.length;
        const counts = {};
        
        this.institutions.forEach(inst => {
            counts[inst.type] = (counts[inst.type] || 0) + 1;
        });
        
        return Object.entries(counts).map(([type, count]) => ({
            type: type,
            count: count,
            percent: total > 0 ? Math.round((count / total) * 100) : 0
        }));
    },
    
    // Получить статистику по регионам
    getRegionStats: function() {
        const counts = {};
        
        this.institutions.forEach(inst => {
            const region = inst.region || 'Не указан';
            counts[region] = (counts[region] || 0) + 1;
        });
        
        return counts;
    },
    
    // Рисование графиков
    renderCharts: function() {
        // График по типам
        const typeCtx = document.getElementById('typeChart');
        if (typeCtx) {
            const typeStats = this.getTypeStats();
            if (this.charts.type) this.charts.type.destroy();
            
            this.charts.type = new Chart(typeCtx, {
                type: 'pie',
                data: {
                    labels: typeStats.map(s => s.type),
                    datasets: [{
                        data: typeStats.map(s => s.count),
                        backgroundColor: [
                            '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
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
                            labels: { padding: 15, usePointStyle: true }
                        }
                    }
                }
            });
        }
        
        // График по регионам
        const regionCtx = document.getElementById('regionChart');
        if (regionCtx) {
            const regionStats = this.getRegionStats();
            if (this.charts.region) this.charts.region.destroy();
            
            this.charts.region = new Chart(regionCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(regionStats),
                    datasets: [{
                        label: 'Количество',
                        data: Object.values(regionStats),
                        backgroundColor: '#2563eb'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        // График по годам
        const timelineCtx = document.getElementById('timelineChart');
        if (timelineCtx) {
            const yearStats = this.getYearStats();
            if (this.charts.timeline) this.charts.timeline.destroy();
            
            this.charts.timeline = new Chart(timelineCtx, {
                type: 'line',
                data: {
                    labels: Object.keys(yearStats),
                    datasets: [{
                        label: 'Создано учреждений',
                        data: Object.values(yearStats),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    },
    
    // Получить статистику по годам
    getYearStats: function() {
        const counts = {};
        
        this.institutions.forEach(inst => {
            if (inst.created_at) {
                const year = new Date(inst.created_at).getFullYear();
                counts[year] = (counts[year] || 0) + 1;
            }
        });
        
        // Заполнить отсутствующие годы
        const years = Object.keys(counts).sort();
        if (years.length > 0) {
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years) || new Date().getFullYear();
            
            for (let y = minYear; y <= maxYear; y++) {
                if (!counts[y]) counts[y] = 0;
            }
        }
        
        return counts;
    },
    
    // Обновить графики
    updateCharts: function() {
        this.renderCharts();
    },
    
    // Экспорт статистики
    exportStats: function() {
        const typeStats = this.getTypeStats();
        
        // Добавление заголовков
        const data = [['Тип', 'Количество', 'Процент']];
        
        // Добавление данных
        typeStats.forEach(stat => {
            data.push([stat.type, stat.count, stat.percent + '%']);
        });
        
        // Создание книги Excel
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Статистика');
        
        // Сохранение файла
        XLSX.writeFile(wb, 'statistics.xlsx');
        
        showNotification('success', 'Статистика экспортирована в Excel');
    }
};

// Экспорт
window.statisticsPage = statisticsPage;