// ========================================
// Страница импорта данных
// ========================================

const importPage = {
    // Загрузка страницы
    load: function() {
        this.render();
    },
    
    // Рендер страницы
    render: function() {
        const html = `
            <div class="page-header">
                <h1>Импорт данных</h1>
                <p>Массовый импорт данных из файлов Excel и CSV</p>
            </div>
            
            <div class="grid-2">
                <!-- Загрузка файла -->
                <div class="card">
                    <div class="card-header">
                        <h3>Загрузка файла</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>Выберите тип данных</label>
                            <select id="importType" onchange="importPage.updateFileInput()">
                                <option value="">Выберите тип...</option>
                                <option value="institutions">Учреждения образования</option>
                                <option value="students">Учащиеся</option>
                                <option value="staff">Работники</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Выберите файл</label>
                            <input type="file" id="importFile" accept=".xlsx,.xls,.csv">
                            <small class="text-muted">Поддерживаются форматы: Excel (.xlsx, .xls), CSV (.csv)</small>
                        </div>
                        
                        <div id="importPreview" style="display: none;">
                            <div class="form-group">
                                <label>Предпросмотр (первые 5 строк)</label>
                                <div class="table-container">
                                    <table id="previewTable">
                                        <thead></thead>
                                        <tbody></tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <p>Найдено записей: <strong id="recordCount">0</strong></p>
                            </div>
                        </div>
                        
                        <button class="btn-primary" onclick="importPage.processFile()">
                            Импортировать данные
                        </button>
                    </div>
                </div>
                
                <!-- Шаблоны -->
                <div class="card">
                    <div class="card-header">
                        <h3>Шаблоны для загрузки</h3>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-2">Скачайте шаблоны для корректного импорта данных:</p>
                        
                        <div class="flex flex-column" style="gap: 12px;">
                            <button class="btn-secondary" onclick="importPage.downloadTemplate('institutions')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Шаблон учреждений (XLSX)
                            </button>
                            <button class="btn-secondary" onclick="importPage.downloadTemplate('students')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Шаблон учащихся (XLSX)
                            </button>
                            <button class="btn-secondary" onclick="importPage.downloadTemplate('staff')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Шаблон работников (XLSX)
                            </button>
                        </div>
                        
                        <hr style="margin: 20px 0;">
                        
                        <h4>Инструкция по импорту:</h4>
                        <ol style="margin-top: 10px; padding-left: 20px;">
                            <li>Скачайте соответствующий шаблон</li>
                            <li>Заполните данные согласно образцу</li>
                            <li>Сохраните файл в формате XLSX или CSV</li>
                            <li>Загрузите файл через форму</li>
                            <li>Проверьте предпросмотр и подтвердите импорт</li>
                        </ol>
                    </div>
                </div>
            </div>
            
            <!-- Результаты импорта -->
            <div id="importResults" class="card mt-3" style="display: none;">
                <div class="card-header">
                    <h3>Результаты импорта</h3>
                </div>
                <div class="card-body">
                    <div id="resultsContent"></div>
                </div>
            </div>
        `;
        
        document.getElementById('pageContent').innerHTML = html;
        
        // Добавить обработчик изменения файла
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.previewFile(e.target.files[0]);
        });
    },
    
    // Обновление поля файла
    updateFileInput: function() {
        const type = document.getElementById('importType').value;
        const fileInput = document.getElementById('importFile');
        
        if (type) {
            fileInput.disabled = false;
        } else {
            fileInput.disabled = true;
            document.getElementById('importPreview').style.display = 'none';
        }
    },
    
    // Предпросмотр файла
    previewFile: function(file) {
        if (!file) return;
        
        const type = document.getElementById('importType').value;
        if (!type) {
            showNotification('warning', 'Сначала выберите тип данных');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    showNotification('warning', 'Файл пуст или содержит только заголовки');
                    return;
                }
                
                // Отображение предпросмотра
                const headers = jsonData[0];
                const previewRows = jsonData.slice(1, 6);
                
                const thead = document.querySelector('#previewTable thead');
                const tbody = document.querySelector('#previewTable tbody');
                
                thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
                tbody.innerHTML = previewRows.map(row => 
                    `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`
                ).join('');
                
                document.getElementById('recordCount').textContent = jsonData.length - 1;
                document.getElementById('importPreview').style.display = 'block';
                
                // Сохраняем данные для импорта
                this.importData = { headers, rows: jsonData.slice(1), type };
                
            } catch (error) {
                console.error('Error reading file:', error);
                showNotification('error', 'Ошибка чтения файла');
            }
        };
        
        reader.readAsArrayBuffer(file);
    },
    
    // Обработка файла и импорт
    processFile: async function() {
        if (!this.importData) {
            showNotification('warning', 'Сначала загрузите файл');
            return;
        }
        
        const { headers, rows, type } = this.importData;
        
        if (rows.length === 0) {
            showNotification('warning', 'Нет данных для импорта');
            return;
        }
        
        showLoader();
        
        try {
            // Преобразование данных в зависимости от типа
            let dataToImport = [];
            
            if (type === 'institutions') {
                dataToImport = this.mapInstitutions(headers, rows);
            } else if (type === 'students') {
                dataToImport = this.mapStudents(headers, rows);
            } else if (type === 'staff') {
                dataToImport = this.mapStaff(headers, rows);
            }
            
            // Импорт данных
            let successCount = 0;
            let errorCount = 0;
            
            for (const item of dataToImport) {
                try {
                    if (type === 'institutions') {
                        await api.createInstitution(item);
                    } else if (type === 'students') {
                        await api.createStudent(item);
                    } else if (type === 'staff') {
                        await api.createStaff(item);
                    }
                    successCount++;
                } catch (err) {
                    console.error('Error importing item:', err);
                    errorCount++;
                }
            }
            
            // Отображение результатов
            document.getElementById('importResults').style.display = 'block';
            document.getElementById('resultsContent').innerHTML = `
                <div class="stats-grid" style="margin-bottom: 0;">
                    <div class="stat-card">
                        <div class="stat-icon green">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <h4>${successCount}</h4>
                            <p>Успешно импортировано</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon red">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <div class="stat-info">
                            <h4>${errorCount}</h4>
                            <p>Ошибок</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Логирование
            await api.createLog({
                user_id: currentUser.id,
                action: 'import',
                details: `Импорт ${type}: ${successCount} успешно, ${errorCount} ошибок`
            });
            
            showNotification('success', `Импорт завершен: ${successCount} записей`);
            
        } catch (error) {
            console.error('Import error:', error);
            showNotification('error', 'Ошибка импорта данных');
        }
        
        hideLoader();
    },
    
    // Маппинг данных учреждений
    mapInstitutions: function(headers, rows) {
        return rows.map(row => {
            const item = {};
            headers.forEach((h, i) => {
                const key = h.toLowerCase().trim();
                if (key === 'название') item.name = row[i];
                if (key === 'тип') item.type = row[i];
                if (key === 'регион') item.region = row[i];
                if (key === 'город') item.city = row[i];
                if (key === 'улица' || key === 'улица, дом') item.street = row[i];
                if (key === 'адрес') item.address = row[i];
                if (key === 'телефон') item.phone = row[i];
                if (key === 'email') item.email = row[i];
                if (key === 'сайт') item.website = row[i];
                if (key === 'описание') item.description = row[i];
            });
            
            // Формируем полный адрес из города и улицы
            if (item.city && item.street) {
                item.address = `${item.city}, ${item.street}`;
            } else if (item.city && !item.street) {
                item.address = item.city;
            } else if (!item.city && item.street) {
                item.address = item.street;
            }
            
            return item;
        });
    },
    
    // Маппинг данных учащихся
    mapStudents: function(headers, rows) {
        return rows.map(row => {
            const item = {};
            headers.forEach((h, i) => {
                const key = h.toLowerCase().trim();
                if (key === 'фио' || key === 'фИО') item.full_name = row[i];
                if (key === 'дата рождения') item.birth_date = row[i];
                if (key === 'пол') item.gender = row[i] === 'М' || row[i] === 'male' ? 'male' : 'female';
                if (key === 'учебное заведение' || key === 'учебное заведение') {
                    // Нужен маппинг на ID -暂时简化处理
                }
                if (key === 'класс') item.grade = parseInt(row[i]);
                if (key === 'адрес') item.address = row[i];
                if (key === 'телефон родителя') item.parent_phone = row[i];
            });
            return item;
        });
    },
    
    // Маппинг данных работников
    mapStaff: function(headers, rows) {
        return rows.map(row => {
            const item = {};
            headers.forEach((h, i) => {
                const key = h.toLowerCase().trim();
                if (key === 'фио' || key === 'фИО') item.full_name = row[i];
                if (key === 'должность') item.position = row[i];
                if (key === 'дата приема') item.hire_date = row[i];
                if (key === 'образование') item.education = row[i];
                if (key === 'специальность') item.specialty = row[i];
                if (key === 'телефон') item.phone = row[i];
                if (key === 'email') item.email = row[i];
            });
            return item;
        });
    },
    
    // Скачивание шаблона
    downloadTemplate: function(type) {
        let data = [];
        let filename = '';
        
        if (type === 'institutions') {
            data = [['Название', 'Тип', 'Регион', 'Город', 'Улица, дом', 'Телефон', 'Email', 'Сайт', 'Описание']];
            data.push(['Гимназия №1', 'Общее среднее', 'Минск', 'Минск', 'ул. Ленина, 15', '+375171100000', 'school1@edu.by', 'https://school1.edu.by', 'Гимназия с углубленным изучением иностранных языков']);
            data.push(['Детский сад №5', 'Дошкольное', 'Гродно', 'Гродно', 'ул. Пушкина, 8', '+375152100000', 'ds5@grodno.edu.by', '', 'Детский сад с ясельными группами']);
            filename = 'template_institutions';
        } else if (type === 'students') {
            data = [['ФИО', 'Дата рождения', 'Пол', 'Класс', 'Адрес', 'Телефон родителя']];
            data.push(['Иванов Иван Иванович', '2010-05-15', 'М', '5', 'ул. Пушкина, 10', '+375291234567']);
            filename = 'template_students';
        } else if (type === 'staff') {
            data = [['ФИО', 'Должность', 'Дата приема', 'Образование', 'Специальность', 'Телефон', 'Email']];
            data.push(['Петров Петр Петрович', 'Учитель', '2015-09-01', 'БГПУ', 'Математика', '+375291234567', 'petrov@edu.by']);
            filename = 'template_staff';
        }
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Шаблон');
        XLSX.writeFile(wb, filename + '.xlsx');
        
        showNotification('success', 'Шаблон загружен');
    }
};

// Экспорт
window.importPage = importPage;