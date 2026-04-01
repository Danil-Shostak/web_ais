// ========================================
// Страница отчетов
// ========================================

const reportsPage = {
    institutions: [],
    
    // Загрузка страницы
    load: async function() {
        try {
            const institutions = await api.getInstitutions({ limit: 1000 });
            this.institutions = institutions;
            this.render();
        } catch (error) {
            console.error('Error loading reports:', error);
            this.render();
        }
    },
    
    // Рендер страницы
    render: function() {
        const html = `
            <div class="page-header">
                <h1>Отчеты</h1>
                <p>Генерация и экспорт отчетов в различных форматах</p>
            </div>
            
            <div class="grid-2">
                <!-- Создание отчета -->
                <div class="card">
                    <div class="card-header">
                        <h3>Создать отчет</h3>
                    </div>
                    <div class="card-body">
                        <form id="reportForm" onsubmit="reportsPage.generateReport(event)">
                            <div class="form-group">
                                <label for="reportType">Тип отчета *</label>
                                <select id="reportType" required onchange="reportsPage.updateReportOptions()">
                                    <option value="">Выберите тип отчета</option>
                                    <option value="institution">Отчет по учреждению</option>
                                    <option value="students">Отчет по учащимся</option>
                                    <option value="staff">Отчет по работникам</option>
                                    <option value="statistics">Статистический отчет</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="institutionSelect" style="display: none;">
                                <label for="reportInstitution">Учреждение *</label>
                                <select id="reportInstitution">
                                    <option value="">Выберите учреждение</option>
                                    ${this.institutions.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group" id="dateRange" style="display: none;">
                                <label>Период</label>
                                <div class="form-row">
                                    <input type="date" id="startDate" placeholder="Дата начала">
                                    <input type="date" id="endDate" placeholder="Дата окончания">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Формат *</label>
                                <div class="flex flex-gap">
                                    <label>
                                        <input type="checkbox" name="format" value="pdf" checked> PDF
                                    </label>
                                    <label>
                                        <input type="checkbox" name="format" value="xlsx" checked> Excel
                                    </label>
                                    <label>
                                        <input type="checkbox" name="format" value="doc"> Word
                                    </label>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-primary">
                                Создать отчет
                            </button>
                        </form>
                    </div>
                </div>
                
                <!-- Шаблоны отчетов -->
                <div class="card">
                    <div class="card-header">
                        <h3>Быстрые шаблоны</h3>
                    </div>
                    <div class="card-body">
                        <div class="flex flex-column" style="gap: 12px;">
                            <button class="btn-secondary" onclick="reportsPage.quickReport('all_institutions')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path>
                                </svg>
                                Отчет по всем учреждениям
                            </button>
                            <button class="btn-secondary" onclick="reportsPage.quickReport('all_students')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                Отчет по всем учащимся
                            </button>
                            <button class="btn-secondary" onclick="reportsPage.quickReport('all_staff')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                                Отчет по всем работникам
                            </button>
                            <button class="btn-secondary" onclick="reportsPage.quickReport('summary')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="20" x2="18" y2="10"></line>
                                    <line x1="12" y1="20" x2="12" y2="4"></line>
                                    <line x1="6" y1="20" x2="6" y2="14"></line>
                                </svg>
                                Сводный отчет
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- История отчетов -->
            <div class="card mt-3">
                <div class="card-header">
                    <h3>История созданных отчетов</h3>
                </div>
                <div class="card-body">
                    <p class="text-muted text-center">Здесь будет отображаться история созданных отчетов</p>
                </div>
            </div>
        `;
        
        document.getElementById('pageContent').innerHTML = html;
    },
    
    // Обновление опций отчета
    updateReportOptions: function() {
        const type = document.getElementById('reportType').value;
        
        document.getElementById('institutionSelect').style.display = 
            ['institution', 'students', 'staff'].includes(type) ? 'block' : 'none';
        
        document.getElementById('dateRange').style.display = 
            type === 'statistics' ? 'block' : 'none';
    },
    
    // Генерация отчета
    generateReport: async function(event) {
        event.preventDefault();
        
        const type = document.getElementById('reportType').value;
        const formats = Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value);
        
        if (!type) {
            showNotification('warning', 'Выберите тип отчета');
            return;
        }
        
        if (formats.length === 0) {
            showNotification('warning', 'Выберите хотя бы один формат');
            return;
        }
        
        showLoader();
        
        try {
            // Генерация данных для отчета
            let data = [];
            let title = '';
            
            switch (type) {
                case 'institution':
                    const instId = document.getElementById('reportInstitution').value;
                    if (!instId) throw new Error('Выберите учреждение');
                    const inst = await api.getInstitutionById(instId);
                    data = [inst];
                    title = `Отчет по учреждению: ${inst.name}`;
                    break;
                    
                case 'students':
                    const studInstId = document.getElementById('reportInstitution').value;
                    data = await api.getStudents({ institution_id: studInstId || undefined });
                    title = 'Отчет по учащимся';
                    break;
                    
                case 'staff':
                    const staffInstId = document.getElementById('reportInstitution').value;
                    data = await api.getStaff({ institution_id: staffInstId || undefined });
                    title = 'Отчет по работникам';
                    break;
                    
                case 'statistics':
                    data = this.institutions;
                    title = 'Статистический отчет';
                    break;
            }
            
            // Создание отчетов в выбранных форматах
            for (const format of formats) {
                await this.createReportFile(data, type, format);
            }
            
            // Логирование
            await api.createLog({
                user_id: currentUser.id,
                action: 'create',
                details: `Создан отчет: ${title} (${formats.join(', ')})`
            });
            
            showNotification('success', 'Отчеты успешно созданы');
            
        } catch (error) {
            console.error('Error generating report:', error);
            showNotification('error', 'Ошибка создания отчета: ' + error.message);
        }
        
        hideLoader();
    },
    
    // Создание файла отчета
    createReportFile: async function(data, type, format) {
        const timestamp = new Date().toISOString().slice(0, 10);
        let filename = `report_${type}_${timestamp}`;
        let content = '';
        
        if (format === 'pdf') {
            await this.generatePDF(data, type, filename);
            return;
        }
        
        if (format === 'xlsx') {
            this.generateExcel(data, type, filename);
            return;
        }
        
        if (format === 'doc') {
            content = this.generateDocContent(data, type);
            this.downloadFile(content, filename + '.doc', 'application/msword');
            return;
        }
    },
    
    // Генерация PDF (использует pdfmake с поддержкой кириллицы)
    generatePDF: async function(data, type, filename) {
        const typeLabels = {
            institution: 'Отчет по учреждению',
            students: 'Отчет по учащимся',
            staff: 'Отчет по работникам',
            statistics: 'Статистический отчет'
        };
        
        const fieldLabels = {
            name: 'Название', full_name: 'ФИО', type: 'Тип', region: 'Регион',
            address: 'Адрес', phone: 'Телефон', email: 'Email',
            birth_date: 'Дата рождения', gender: 'Пол', grade: 'Класс',
            institution_id: 'ID учреждения',
            parent_phone: 'Телефон родителя', position: 'Должность',
            hire_date: 'Дата принятия', education: 'Образование',
            specialty: 'Специальность', website: 'Сайт', description: 'Описание'
        };
        
        const content = [];
        
        // Заголовок
        content.push({
            text: 'АИИО РБ — Автоматизация информации учреждений образования РБ',
            style: 'header',
            margin: [0, 0, 0, 8]
        });
        content.push({
            text: typeLabels[type] || 'Отчет',
            style: 'subheader',
            margin: [0, 0, 0, 4]
        });
        content.push({
            text: `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`,
            style: 'small',
            margin: [0, 0, 0, 16]
        });
        
        if (data.length > 0) {
            const keys = Object.keys(data[0]).filter(k => !['id', 'created_at', 'updated_at', 'institution_id'].includes(k));
            const headers = keys.map(k => ({ text: fieldLabels[k] || k, style: 'tableHeader' }));
            const rows = data.map(item =>
                keys.map(h => ({ text: String(item[h] || '—'), style: 'tableCell' }))
            );
            
            content.push({
                table: {
                    headerRows: 1,
                    widths: keys.map(() => '*'),
                    body: [headers, ...rows]
                },
                layout: {
                    fillColor: (rowIndex) => rowIndex === 0 ? '#2563eb' : (rowIndex % 2 === 0 ? '#f8fafc' : null)
                }
            });
            
            content.push({
                text: `Итого записей: ${data.length}`,
                style: 'small',
                margin: [0, 12, 0, 0]
            });
        } else {
            content.push({ text: 'Данные отсутствуют', style: 'small' });
        }
        
        const docDef = {
            content: content,
            defaultStyle: { font: 'Roboto', fontSize: 9 },
            styles: {
                header: { fontSize: 14, bold: true, color: '#1e293b' },
                subheader: { fontSize: 11, bold: true, color: '#2563eb' },
                small: { fontSize: 9, color: '#64748b' },
                tableHeader: { bold: true, color: '#ffffff', fontSize: 9 },
                tableCell: { fontSize: 8, color: '#1e293b' }
            },
            pageMargins: [30, 40, 30, 40]
        };
        
        pdfMake.createPdf(docDef).download(filename + '.pdf');
    },
    
    // Генерация Excel
    generateExcel: function(data, type, filename) {
        if (data.length === 0) {
            showNotification('warning', 'Нет данных для отчета');
            return;
        }
        
        // Подготовка данных
        const headers = Object.keys(data[0]).filter(k => !['id', 'created_at', 'updated_at'].includes(k));
        const rows = data.map(item => headers.map(h => item[h] || ''));
        
        // Создание книги
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Отчет');
        
        XLSX.writeFile(wb, filename + '.xlsx');
    },
    
    // Генерация содержимого Word
    generateDocContent: function(data, type) {
        let content = 'АИИО РБ - Отчет\r\n';
        content += '====================\r\n\r\n';
        content += `Тип отчета: ${type}\r\n`;
        content += `Дата: ${new Date().toLocaleDateString('ru-RU')}\r\n\r\n`;
        
        if (data.length > 0) {
            content += 'Данные:\r\n\r\n';
            
            data.forEach((item, index) => {
                content += `${index + 1}. ${JSON.stringify(item, null, 2)}\r\n\r\n`;
            });
        }
        
        return content;
    },
    
    // Скачивание файла
    downloadFile: function(content, filename, type) {
        const blob = new Blob([content], { type: type });
        saveAs(blob, filename);
    },
    
    // Быстрый отчет
    quickReport: async function(type) {
        showLoader();
        
        try {
            let data = [];
            let title = '';
            let filename = '';
            
            switch (type) {
                case 'all_institutions':
                    data = await api.getInstitutions({ limit: 1000 });
                    title = 'Отчет по всем учреждениям';
                    filename = 'all_institutions';
                    break;
                    
                case 'all_students':
                    data = await api.getStudents({ limit: 1000 });
                    title = 'Отчет по всем учащимся';
                    filename = 'all_students';
                    break;
                    
                case 'all_staff':
                    data = await api.getStaff({ limit: 1000 });
                    title = 'Отчет по всем работникам';
                    filename = 'all_staff';
                    break;
                    
                case 'summary':
                    // Сводный отчет
                    const [inst, stud, staff] = await Promise.all([
                        api.getInstitutions({ limit: 1000 }),
                        api.getStudents({ limit: 1000 }),
                        api.getStaff({ limit: 1000 })
                    ]);
                    
                    data = [
                        { Показатель: 'Учреждения образования', Значение: inst.length },
                        { Показатель: 'Учащиеся', Значение: stud.length },
                        { Показатель: 'Работники', Значение: staff.length }
                    ];
                    title = 'Сводный отчет';
                    filename = 'summary';
                    break;
            }
            
            // Экспорт в Excel
            this.generateExcel(data, type, filename);
            
            await api.createLog({
                user_id: currentUser.id,
                action: 'create',
                details: `Создан быстрый отчет: ${title}`
            });
            
            showNotification('success', 'Отчет создан и загружен');
            
        } catch (error) {
            console.error('Error quick report:', error);
            showNotification('error', 'Ошибка создания отчета');
        }
        
        hideLoader();
    }
};

// Экспорт
window.reportsPage = reportsPage;