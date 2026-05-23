// ========================================
// Страница статистики
// ========================================

const statisticsPage = {
    institutions: [],
    students: [],
    staff: [],
    charts: {},
    selectedInstitution: '',
    
    load: async function() {
        try {
            const [institutions, students, staff] = await Promise.all([
                api.getInstitutions({ limit: 1000 }),
                api.getStudents({ limit: 1000 }),
                api.getStaff({ limit: 1000 })
            ]);
            this.institutions = institutions;
            this.students = students;
            this.staff = staff;
            this.render();
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.render();
        }
    },
    
    render: function() {
        const institutionFilter = document.getElementById('institutionFilter');
        this.selectedInstitution = institutionFilter ? institutionFilter.value : '';
        
        const filteredInstitutions = this.selectedInstitution 
            ? this.institutions.filter(i => i.id === this.selectedInstitution)
            : this.institutions;
        
        const filteredStudents = this.selectedInstitution
            ? this.students.filter(s => s.institution_id === this.selectedInstitution)
            : this.students;
            
        const filteredStaff = this.selectedInstitution
            ? this.staff.filter(s => s.institution_id === this.selectedInstitution)
            : this.staff;
        
        const selectedInst = this.selectedInstitution 
            ? this.institutions.find(i => i.id === this.selectedInstitution) 
            : null;
        
        const institutionStats = this.getInstitutionStats(selectedInst);
        const gradeStats = this.getGradeStats(filteredStudents);
        
        const html = `
            <div class="page-header">
                <h1>Статистика${selectedInst ? ': ' + selectedInst.name : ''}</h1>
                <p>Аналитические данные и визуализация показателей</p>
            </div>
            
            <div class="filters-bar">
                <div class="filter-group">
                    <label>Учреждение</label>
                    <select id="institutionFilter" onchange="statisticsPage.updateCharts()">
                        <option value="">Все учреждения</option>
                        ${this.institutions.map(i => `<option value="${i.id}" ${this.selectedInstitution === i.id ? 'selected' : ''}>${i.name}</option>`).join('')}
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
            
         ${selectedInst ? `
         <div class="card mb-3">
             <div class="card-header">
                 <h3>Информация об учреждении</h3>
             </div>
             <div class="detail-grid">
                 <div class="detail-item">
                     <label>Тип</label>
                     <span>${selectedInst.type || '—'}</span>
                 </div>
                 <div class="detail-item">
                     <label>Регион</label>
                     <span>${selectedInst.region || '—'}</span>
                 </div>
                 <div class="detail-item">
                     <label>Адрес</label>
                     <span>${selectedInst.address || '—'}</span>
                 </div>
                 <div class="detail-item">
                     <label>Телефон</label>
                     <span>${selectedInst.phone || '—'}</span>
                 </div>
                 <div class="detail-item">
                     <label>Email</label>
                     <span>${selectedInst.email || '—'}</span>
                 </div>
                 <div class="detail-item">
                     <label>Сайт</label>
                     <span>${selectedInst.website || '—'}</span>
                 </div>
             </div>
         </div>
         ` : ''}
         ${selectedInst && institutionStats ? `
         <div class="card mb-3">
             <div class="card-header">
                 <h3>Состав работников</h3>
             </div>
             <div class="detail-grid">
                 ${Object.keys(institutionStats.positionCounts).map(pos => `
                 <div class="detail-item">
                     <label>${pos}</label>
                     <span>${institutionStats.positionCounts[pos]}</span>
                 </div>
                 `).join('')}
             </div>
         </div>
         ` : ''}
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h4>${filteredInstitutions.length}</h4>
                        <p>${selectedInst ? 'Учреждение' : 'Всего учреждений'}</p>
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
                        <h4>${filteredStudents.length}</h4>
                        <p>${selectedInst ? 'Учащихся' : 'Всего учащихся'}</p>
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
                        <h4>${filteredStaff.length}</h4>
                        <p>${selectedInst ? 'Работников' : 'Всего работников'}</p>
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
                        <h4>${this.getCountByType('Общее среднее')}</h4>
                        <p>Школ</p>
                    </div>
                </div>
            </div>
            
            ${selectedInst ? `
            <div class="card mb-3">
                <div class="card-header">
                    <h3>Распределение учащихся по классам/курсам</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Класс/Курс</th>
                                <th>Количество учащихся</th>
                                <th>Процент</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(gradeStats).length > 0 ? Object.entries(gradeStats).sort((a,b) => {
                                const aNum = parseInt(a[0]) || 0;
                                const bNum = parseInt(b[0]) || 0;
                                return aNum - bNum;
                            }).map(([grade, count]) => `
                                <tr>
                                    <td>${grade}</td>
                                    <td>${count}</td>
                                    <td>${Math.round((count / filteredStudents.length) * 100)}%</td>
                                </tr>
                            `).join('') : '<tr><td colspan="3" class="text-center text-muted">Нет данных</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
            
            ${!selectedInst ? `
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
            ` : ''}
            
             ${selectedInst ? `
             <div class="grid-2">
                 <div class="chart-container">
                     <h3>Распределение по классам/курсам</h3>
                     <div class="chart-wrapper">
                         <canvas id="gradeChart"></canvas>
                     </div>
                 </div>
                 <div class="chart-container">
                     <h3>Распределение по полу</h3>
                     <div class="chart-wrapper">
                         <canvas id="genderChart"></canvas>
                     </div>
                 </div>
             </div>
             
             <div class="grid-2">
                 <div class="chart-container">
                     <h3>Состав сотрудников по должностям</h3>
                     <div class="chart-wrapper">
                         <canvas id="positionChart"></canvas>
                     </div>
                 </div>
                 <div class="chart-container">
                     <h3>Возрастная структура сотрудников</h3>
                     <div class="chart-wrapper">
                         <canvas id="ageChart"></canvas>
                     </div>
                 </div>
             </div>
             ` : ''}
            
            <div class="card mt-3">
                <div class="card-header">
                    <h3>${selectedInst ? 'Статистика по типам учреждений' : 'Детальная статистика'}</h3>
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
        
        setTimeout(() => {
            this.renderCharts();
        }, 100);
    },
    
    getInstitutionStats: function(institution) {
        if (!institution) return null;
        
        const students = this.students.filter(s => s.institution_id === institution.id);
        const staff = this.staff.filter(s => s.institution_id === institution.id);
        
        const gradeCounts = {};
        students.forEach(s => {
            const grade = s.grade || 'Не указан';
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        });
        
        const genderCounts = { male: 0, female: 0 };
        students.forEach(s => {
            if (s.gender === 'male') genderCounts.male++;
            else if (s.gender === 'female') genderCounts.female++;
        });
        
        const positionCounts = {};
        staff.forEach(s => {
            const pos = s.position || 'Не указана';
            positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });
        
        return {
            totalStudents: students.length,
            totalStaff: staff.length,
            gradeCounts,
            genderCounts,
            positionCounts
        };
    },
    
    getGradeStats: function(students) {
        const counts = {};
        students.forEach(s => {
            const grade = s.grade || 'Не указан';
            counts[grade] = (counts[grade] || 0) + 1;
        });
        return counts;
    },
    
    getCountByType: function(type) {
        return this.institutions.filter(i => i.type === type).length;
    },
    
    getTotalStats: function() {
        const counts = {};
        this.institutions.forEach(inst => {
            if (inst.created_at) {
                const year = new Date(inst.created_at).getFullYear();
                counts[year] = (counts[year] || 0) + 1;
            }
        });
        return counts;
    },
    
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
    
    getRegionStats: function() {
        const counts = {};
        
        this.institutions.forEach(inst => {
            const region = inst.region || 'Не указан';
            counts[region] = (counts[region] || 0) + 1;
        });
        
        return counts;
    },
    
    renderCharts: function() {
        const institutionFilter = document.getElementById('institutionFilter');
        const selectedInstitutionId = institutionFilter ? institutionFilter.value : '';
        
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 13 } } } },
            scales: { y: { beginAtZero: true } }
        };
        
         if (selectedInstitutionId) {
             const gradeCtx = document.getElementById('gradeChart');
             if (gradeCtx) {
                 const students = this.students.filter(s => s.institution_id === selectedInstitutionId);
                 const gradeStats = this.getGradeStats(students);
                 
                 if (this.charts.grade) this.charts.grade.destroy();
                 
                 this.charts.grade = new Chart(gradeCtx, {
                     type: 'bar',
                     data: {
                         labels: Object.keys(gradeStats),
                         datasets: [{
                             label: 'Учащихся',
                             data: Object.values(gradeStats),
                             backgroundColor: '#2563eb',
                             borderWidth: 1
                         }]
                     },
                     options: JSON.parse(JSON.stringify(baseOptions))
                 });
             }
             
             const genderCtx = document.getElementById('genderChart');
             if (genderCtx) {
                 const students = this.students.filter(s => s.institution_id === selectedInstitutionId);
                 const genderCounts = { male: 0, female: 0 };
                 students.forEach(s => {
                     if (s.gender === 'male') genderCounts.male++;
                     else if (s.gender === 'female') genderCounts.female++;
                 });
                 
                 if (this.charts.gender) this.charts.gender.destroy();
                 
                 this.charts.gender = new Chart(genderCtx, {
                     type: 'bar',
                     data: {
                         labels: ['Мальчики', 'Девочки'],
                         datasets: [{
                             data: [genderCounts.male, genderCounts.female],
                             backgroundColor: ['#3b82f6', '#ec4899']
                         }]
                     },
                      options: {
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 13 } } } }
                      }
                 });
             }
             
             const positionCtx = document.getElementById('positionChart');
             if (positionCtx) {
                 const staff = this.staff.filter(s => s.institution_id === selectedInstitutionId);
                 const positionCounts = {};
                 staff.forEach(s => {
                     const pos = s.position || 'Не указана';
                     positionCounts[pos] = (positionCounts[pos] || 0) + 1;
                 });
                 
                 if (this.charts.position) this.charts.position.destroy();
                 
                 this.charts.position = new Chart(positionCtx, {
                     type: 'bar',
                     data: {
                         labels: Object.keys(positionCounts),
                         datasets: [{
                             label: 'Сотрудников',
                             data: Object.values(positionCounts),
                             backgroundColor: '#8b5cf6',
                             borderWidth: 1
                         }]
                     },
                     options: JSON.parse(JSON.stringify(baseOptions))
                 });
             }
             
             const ageCtx = document.getElementById('ageChart');
             if (ageCtx) {
                 const staff = this.staff.filter(s => s.institution_id === selectedInstitutionId);
                 const ageGroups = { '20-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
                 staff.forEach(s => {
                     const age = s.age;
                     if (!age) return;
                     if (age >= 20 && age <= 29) ageGroups['20-29']++;
                     else if (age >= 30 && age <= 39) ageGroups['30-39']++;
                     else if (age >= 40 && age <= 49) ageGroups['40-49']++;
                     else if (age >= 50 && age <= 59) ageGroups['50-59']++;
                     else if (age >= 60) ageGroups['60+']++;
                 });
                 
                 if (this.charts.age) this.charts.age.destroy();
                 
                 this.charts.age = new Chart(ageCtx, {
                     type: 'bar',
                     data: {
                         labels: Object.keys(ageGroups),
                         datasets: [{
                             label: 'Сотрудников',
                             data: Object.values(ageGroups),
                             backgroundColor: '#14b8a6',
                             borderWidth: 1
                         }]
                     },
                     options: JSON.parse(JSON.stringify(baseOptions))
                 });
             }
         } else {
            const typeCtx = document.getElementById('typeChart');
            if (typeCtx) {
                const typeStats = this.getTypeStats();
                if (this.charts.type) this.charts.type.destroy();
                
                this.charts.type = new Chart(typeCtx, {
                    type: 'bar',
                    data: {
                        labels: typeStats.map(s => s.type),
                        datasets: [{
                            label: 'Учреждений',
                            data: typeStats.map(s => s.count),
                            backgroundColor: '#2563eb',
                            borderWidth: 1
                        }]
                    },
                    options: JSON.parse(JSON.stringify(baseOptions))
                });
            }
            
            const regionCtx = document.getElementById('regionChart');
            if (regionCtx) {
                const regionStats = this.getRegionStats();
                if (this.charts.region) this.charts.region.destroy();
                
                const vals = Object.values(regionStats);
                this.charts.region = new Chart(regionCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(regionStats),
                        datasets: [{
                            label: 'Количество',
                            data: vals,
                            backgroundColor: '#10b981',
                            borderWidth: 1
                        }]
                    },
                    options: JSON.parse(JSON.stringify(baseOptions))
                });
            }

            const timelineCtx = document.getElementById('timelineChart');
            if (timelineCtx) {
                const yearStats = this.getTotalStats();
                if (this.charts.timeline) this.charts.timeline.destroy();
                
                this.charts.timeline = new Chart(timelineCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(yearStats),
                        datasets: [{
                            label: 'Создано учреждений',
                            data: Object.values(yearStats),
                            backgroundColor: '#f59e0b',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false, labels: { font: { size: 13 } } } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        }
    },
    
    updateCharts: function() {
        const institutionFilter = document.getElementById('institutionFilter');
        this.selectedInstitution = institutionFilter ? institutionFilter.value : '';
        
        this.render();
    },
    
    exportStats: function() {
        const typeStats = this.getTypeStats();
        const today = new Date().toLocaleDateString('ru-RU');

        const data = [
            ['АИИО РБ — Автоматизация информации учреждений образования РБ'],
            ['Статистический отчет по типам учреждений'],
            ['Дата формирования:', today],
            [''],
            ['Тип', 'Количество', 'Процент'],
        ];

        typeStats.forEach(stat => {
            data.push([stat.type, stat.count, stat.percent + '%']);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Заголовки жирным, автоширина колонок
        const ws_range = XLSX.utils.decode_range(ws['!ref']);
        const col_widths = {};
        for (let R = 0; R <= ws_range.e.r; R++) {
            for (let C = ws_range.s.c; C <= ws_range.e.c; C++) {
                const cell_ref = XLSX.utils.encode_cell({r: R, c: C});
                const cell = ws[cell_ref];
                if (!cell) continue;
                if (R === 0) {
                    cell.s = cell.s || {};
                    cell.s.font = { bold: true, sz: 14, name: 'Calibri' };
                    cell.s.alignment = { horizontal: 'left', vertical: 'center' };
                } else if (R === 4) {
                    cell.s = cell.s || {};
                    cell.s.font = { bold: true, sz: 12, name: 'Calibri' };
                    cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                } else {
                    cell.s = cell.s || {};
                    cell.s.font = { sz: 12, name: 'Calibri' };
                    cell.s.alignment = { vertical: 'center' };
                }
                const val = String(cell.t === 'n' ? (cell.v === 0 ? '0' : cell.v) : (cell.v || ''));
                const w = Math.min(Math.max(val.length * 1.6, 10), 50);
                col_widths[C] = Math.max(col_widths[C] || 10, w);
            }
        }
        ws['!cols'] = Object.values(col_widths).map(w => ({ wch: Math.round(w) }));
        ws['!autofilter'] = { ref: 'A5:C' + (5 + typeStats.length) };

        // Объединение ячеек для заголовка
        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push({s: {r: 0, c: 0}, e: {r: 0, c: 2}});
        ws['!merges'].push({s: {r: 1, c: 0}, e: {r: 1, c: 2}});
        ws['!merges'].push({s: {r: 2, c: 0}, e: {r: 2, c: 1}});

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Статистика');

        XLSX.writeFile(wb, 'statistics.xlsx');

        showNotification('success', 'Статистика экспортирована в Excel');
    }
};

window.statisticsPage = statisticsPage;