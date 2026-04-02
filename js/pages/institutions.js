// ========================================
// Страница учреждений образования
// ========================================

const institutionsPage = {
    data: [],
    currentPage: 1,
    pageSize: 20,
    editingId: null,
    viewMode: 'table', // 'table' | 'map'
    mapInstance: null,
    
    // Загрузка страницы
    load: async function() {
        await this.loadData();
        this.render();
    },
    
    // Загрузка данных
    loadData: async function() {
        try {
            this.data = await api.getInstitutions({ limit: 1000 });
        } catch (error) {
            console.error('Error loading institutions:', error);
            this.data = [];
        }
    },
    
    // Рендер страницы
    render: function() {
        const filteredData = this.filterData();
        const totalPages = Math.ceil(filteredData.length / this.pageSize);
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const pageData = filteredData.slice(startIndex, startIndex + this.pageSize);
        
        const html = `
            <div class="page-header">
                <div class="flex flex-between">
                    <div>
                        <h1>Учреждения образования</h1>
                        <p>Управление базой учреждений образования РБ</p>
                    </div>
                    <div class="flex flex-gap">
                        <div class="btn-group">
                            <button class="btn-secondary btn-sm ${this.viewMode === 'table' ? 'active' : ''}" onclick="institutionsPage.setViewMode('table')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
                                Таблица
                            </button>
                            <button class="btn-secondary btn-sm ${this.viewMode === 'map' ? 'active' : ''}" onclick="institutionsPage.setViewMode('map')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                                Карта
                            </button>
                        </div>
                        ${canAccess('institutions.edit') ? `
                            <button class="btn-primary" onclick="institutionsPage.showAddForm()">
                                + Добавить учреждение
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Фильтры -->
            <div class="filters-bar">
                <div class="filter-group">
                    <label>Поиск</label>
                    <input type="text" id="searchInput" placeholder="Название, адрес..." 
                           value="${this.filters.search || ''}" 
                           onchange="institutionsPage.applyFilters()">
                </div>
                <div class="filter-group">
                    <label>Тип</label>
                    <select id="typeFilter" onchange="institutionsPage.applyFilters()">
                        <option value="">Все типы</option>
                        ${CONFIG.institutionTypes.map(type => `
                            <option value="${type}" ${this.filters.type === type ? 'selected' : ''}>${type}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Регион</label>
                    <select id="regionFilter" onchange="institutionsPage.applyFilters()">
                        <option value="">Все регионы</option>
                        <option value="Минск" ${this.filters.region === 'Минск' ? 'selected' : ''}>Минск</option>
                        <option value="Минская область" ${this.filters.region === 'Минская область' ? 'selected' : ''}>Минская область</option>
                        <option value="Брестская область" ${this.filters.region === 'Брестская область' ? 'selected' : ''}>Брестская область</option>
                        <option value="Гомельская область" ${this.filters.region === 'Гомельская область' ? 'selected' : ''}>Гомельская область</option>
                        <option value="Гродненская область" ${this.filters.region === 'Гродненская область' ? 'selected' : ''}>Гродненская область</option>
                        <option value="Могилевская область" ${this.filters.region === 'Могилевская область' ? 'selected' : ''}>Могилевская область</option>
                        <option value="Витебская область" ${this.filters.region === 'Витебская область' ? 'selected' : ''}>Витебская область</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Сортировка</label>
                    <select id="sortFilter" onchange="institutionsPage.applyFilters()">
                        <option value="name" ${this.filters.sortBy === 'name' ? 'selected' : ''}>По названию</option>
                        <option value="type" ${this.filters.sortBy === 'type' ? 'selected' : ''}>По типу</option>
                        <option value="created_at" ${this.filters.sortBy === 'created_at' ? 'selected' : ''}>По дате создания</option>
                    </select>
                </div>
            </div>
            
            <!-- Таблица -->
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Тип</th>
                                <th>Регион</th>
                                <th>Город</th>
                                <th>Улица</th>
                                <th>Телефон</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageData.length > 0 ? pageData.map(inst => `
                                <tr>
                                    <td>
                                        <strong>${inst.name}</strong>
                                        ${inst.email ? `<br><small class="text-muted">${inst.email}</small>` : ''}
                                    </td>
                                    <td>${inst.type}</td>
                                    <td>${inst.region || '-'}</td>
                                    <td>${inst.city || '-'}</td>
                                    <td>${inst.street || '-'}</td>
                                    <td>${inst.phone ? formatPhone(inst.phone) : '-'}</td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="btn-icon" onclick="institutionsPage.viewInstitution('${inst.id}')" title="Просмотр">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            </button>
                                            ${canAccess('institutions.edit') ? `
                                                <button class="btn-icon" onclick="institutionsPage.edit('${inst.id}')" title="Редактировать">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            ` : ''}
                                            ${canAccess('institutions.delete') ? `
                                                <button class="btn-icon" onclick="institutionsPage.delete('${inst.id}')" title="Удалить">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" class="text-center text-muted">
                                        Учреждения не найдены
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                
                <!-- Пагинация -->
                ${totalPages > 1 ? `
                    <div class="pagination" id="pagination"></div>
                ` : ''}
            </div>
            
            <!-- Карта учреждений (скрыта по умолчанию) -->
            <div id="institutionsMap" class="card" style="display:none;">
                <div class="card-header">
                    <h3>Карта учреждений образования РБ</h3>
                    <span class="text-muted" style="font-size:13px;">Маркеры расставлены по регионам</span>
                </div>
                <div id="leafletMap" class="map-container" style="height: 520px; border-radius: 0 0 8px 8px;"></div>
            </div>
            
            <!-- Модальное окно формы -->
            <div id="formModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="formModalTitle">Добавить учреждение</h2>
                        <button class="modal-close" onclick="institutionsPage.closeForm()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="institutionForm" onsubmit="institutionsPage.submitForm(event)">
                            <input type="hidden" id="institutionId">
                            
                            <div class="form-group">
                                <label for="name">Название *</label>
                                <input type="text" id="name" required placeholder="Полное название учреждения">
                                <span class="error-message" id="nameError"></span>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="type">Тип учреждения *</label>
                                    <select id="type" required>
                                        <option value="">Выберите тип</option>
                                        ${CONFIG.institutionTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                                    </select>
                                    <span class="error-message" id="typeError"></span>
                                </div>
                                <div class="form-group">
                                    <label for="region">Регион *</label>
                                    <select id="region" required>
                                        <option value="">Выберите регион</option>
                                        <option value="Минск">Минск</option>
                                        <option value="Минская область">Минская область</option>
                                        <option value="Брестская область">Брестская область</option>
                                        <option value="Гомельская область">Гомельская область</option>
                                        <option value="Гродненская область">Гродненская область</option>
                                        <option value="Могилевская область">Могилевская область</option>
                                        <option value="Витебская область">Витебская область</option>
                                    </select>
                                    <span class="error-message" id="regionError"></span>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="city">Город/Населённый пункт *</label>
                                    <input type="text" id="city" required placeholder="Новогрудок">
                                    <span class="error-message" id="cityError"></span>
                                </div>
                                <div class="form-group">
                                    <label for="street">Улица, дом</label>
                                    <input type="text" id="street" placeholder="Мицкевича, 15">
                                    <span class="error-message" id="streetError"></span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="address">Адрес (полный) *</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" id="address" required placeholder="Новогрудок, Мицкевича, 15" style="flex: 1;">
                                    <button type="button" class="btn-secondary btn-sm" onclick="institutionsPage.geocodeAddress()" title="Определить координаты по адресу">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </button>
                                </div>
                                <small class="text-muted">Адрес формируется автоматически из города и улицы. Можно отредактировать вручную.</small>
                                <span class="error-message" id="addressError"></span>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="latitude">Широта (координаты)</label>
                                    <input type="number" id="latitude" step="0.000001" placeholder="53.9045">
                                    <small class="text-muted">Найдите координаты на <a href="https://www.openstreetmap.org/" target="_blank">карте</a></small>
                                </div>
                                <div class="form-group">
                                    <label for="longitude">Долгота (координаты)</label>
                                    <input type="number" id="longitude" step="0.000001" placeholder="27.5615">
                                    <small class="text-muted">Найдите координаты на <a href="https://www.openstreetmap.org/" target="_blank">карте</a></small>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="phone">Телефон</label>
                                    <input type="text" id="phone" placeholder="+375 (XX) XXX-XX-XX">
                                    <span class="error-message" id="phoneError"></span>
                                </div>
                                <div class="form-group">
                                    <label for="email">Email</label>
                                    <input type="email" id="email" placeholder="email@example.com">
                                    <span class="error-message" id="emailError"></span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="website">Сайт</label>
                                <input type="text" id="website" placeholder="https://example.com">
                            </div>
                            
                            <div class="form-group">
                                <label for="description">Описание</label>
                                <textarea id="description" rows="3" placeholder="Краткое описание учреждения"></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="institutionsPage.closeForm()">Отмена</button>
                                <button type="submit" class="btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('pageContent').innerHTML = html;
        
        // Добавляем обработчики для автоматического формирования адреса
        const cityInput = document.getElementById('city');
        const streetInput = document.getElementById('street');
        const addressInput = document.getElementById('address');
        
        if (cityInput && streetInput && addressInput) {
            // При изменении города или улицы обновляем полный адрес
            const updateAddress = () => {
                const parts = [];
                const city = cityInput.value.trim();
                const street = streetInput.value.trim();
                if (city) parts.push(city);
                if (street) parts.push(street);
                addressInput.value = parts.join(', ');
            };
            
            cityInput.addEventListener('input', updateAddress);
            streetInput.addEventListener('input', updateAddress);
            
            // При изменении полного адреса разбираем его на город и улицу
            addressInput.addEventListener('input', () => {
                const fullAddress = addressInput.value.trim();
                const parts = fullAddress.split(',').map(s => s.trim()).filter(s => s);
                
                if (parts.length >= 2) {
                    // Первая часть - город, остальное - улица и дом
                    cityInput.value = parts[0] || '';
                    streetInput.value = parts.slice(1).join(', ') || '';
                } else if (parts.length === 1) {
                    // Если только одна часть, считаем это городом
                    cityInput.value = parts[0] || '';
                    streetInput.value = '';
                } else {
                    cityInput.value = '';
                    streetInput.value = '';
                }
            });
        }
        
        // Применяем режим вида
        const tableCard = document.querySelector('#pageContent > .card');
        const mapCard = document.getElementById('institutionsMap');
        
        if (this.viewMode === 'map') {
            if (tableCard) tableCard.style.display = 'none';
            if (mapCard) mapCard.style.display = 'block';
            setTimeout(() => this.renderMap(), 50);
        } else {
            if (tableCard) tableCard.style.display = '';
            if (mapCard) mapCard.style.display = 'none';
        }
        
        // Инициализация пагинации
        if (totalPages > 1 && this.viewMode === 'table') {
            paginator = new Paginator(filteredData.length, this.pageSize, (page, offset, limit) => {
                this.currentPage = page;
                this.render();
            });
            paginator.goToPage(this.currentPage);
            paginator.render('pagination');
        }
    },
    
    // Установить режим отображения
    setViewMode: function(mode) {
        this.viewMode = mode;
        this.render();
    },
    
    // Рендер карты Leaflet
    renderMap: function() {
        const container = document.getElementById('leafletMap');
        if (!container || typeof L === 'undefined') return;
        
        // Уничтожить старую карту если есть
        if (this.mapInstance) {
            this.mapInstance.remove();
            this.mapInstance = null;
        }
        
        // Реальные координаты областных центров Беларуси
        const regionCoords = {
            'Минск':               [53.9045, 27.5615],
            'Минская область':     [53.5000, 27.2000],
            'Брестская область':   [52.0976, 23.7340],
            'Гомельская область':  [52.4345, 30.9754],
            'Гродненская область': [53.6788, 23.8460],
            'Могилевская область': [53.8985, 30.3300],
            'Витебская область':   [55.1836, 30.2049]
        };
        
        // Границы регионов для распределения маркеров (latMin, latMax, lngMin, lngMax)
        const regionBounds = {
            'Минск':               [53.85, 53.96, 27.45, 27.68],
            'Минская область':     [52.80, 54.40, 26.50, 28.50],
            'Брестская область':   [51.60, 52.80, 22.70, 25.20],
            'Гомельская область':  [51.40, 53.20, 29.00, 32.50],
            'Гродненская область': [53.10, 54.30, 23.00, 25.50],
            'Могилевская область': [53.10, 54.30, 29.50, 31.80],
            'Витебская область':   [54.50, 56.20, 27.50, 31.00]
        };
        
        const map = L.map(container).setView([53.7, 27.9], 6);
        this.mapInstance = map;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18
        }).addTo(map);
        
        // Цвета по типу учреждения
        const typeColors = {
            'Общее среднее': '#2563eb',
            'Дошкольное':    '#10b981',
            'Высшее':        '#8b5cf6',
            'Среднее специальное': '#f59e0b',
            'Профессионально-техническое': '#ef4444'
        };
        
        const regionCounters = {};
        const filteredData = this.filterData();
        
        filteredData.forEach(inst => {
            const key = inst.region || 'default';
            
            let lat, lng;
            
            // Сначала проверяем наличие реальных координат в базе данных
            if (inst.latitude && inst.longitude) {
                lat = parseFloat(inst.latitude);
                lng = parseFloat(inst.longitude);
            } else {
                // Если координат нет, используем координаты региона с распределением
                regionCounters[key] = (regionCounters[key] || 0) + 1;
                const n = regionCounters[key];
                const bounds = regionBounds[key];
                
                if (bounds) {
                    // Равномерное распределение маркеров внутри границ региона
                    const latRange = bounds[1] - bounds[0];
                    const lngRange = bounds[3] - bounds[2];
                    const cols = Math.ceil(Math.sqrt(n));
                    const rows = Math.ceil(n / cols);
                    const col = (n - 1) % cols;
                    const row = Math.floor((n - 1) / cols);
                    lat = bounds[0] + (latRange / (rows + 1)) * (row + 1);
                    lng = bounds[2] + (lngRange / (cols + 1)) * (col + 1);
                } else {
                    const baseCoords = regionCoords[key] || [53.9, 27.5];
                    lat = baseCoords[0];
                    lng = baseCoords[1];
                }
            }
            
            const color = typeColors[inst.type] || '#64748b';
            
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });
            
            const marker = L.marker([lat, lng], { icon }).addTo(map);
            marker.bindPopup(`
                <div style="min-width:220px;">
                    <strong style="font-size:14px;">${escapeHtml(inst.name)}</strong><br>
                    <span style="color:#64748b;font-size:12px;">${inst.type || ''}</span><br>
                    <span style="font-size:12px;">📍 ${inst.region || ''}</span><br>
                    ${inst.address ? `<span style="font-size:12px;">${escapeHtml(inst.address)}</span><br>` : ''}
                    ${inst.phone ? `<span style="font-size:12px;">📞 ${escapeHtml(inst.phone)}</span><br>` : ''}
                    ${inst.email ? `<span style="font-size:12px;">✉️ ${escapeHtml(inst.email)}</span><br>` : ''}
                    <button onclick="institutionsPage.viewInstitution('${inst.id}')" style="margin-top:6px;padding:4px 10px;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Подробнее</button>
                </div>
            `, { maxWidth: 280 });
        });
        
        // Легенда
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'leaflet-bar');
            div.style.cssText = 'background:#fff;padding:8px 12px;font-size:12px;line-height:1.8;';
            div.innerHTML = Object.entries(typeColors).map(([t, c]) =>
                `<div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c};margin-right:6px;"></span>${t}</div>`
            ).join('') + `<div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#64748b;margin-right:6px;"></span>Прочие</div>`;
            return div;
        };
        legend.addTo(map);
    },
    
    // Фильтрация данных
    filterData: function() {
        let filtered = [...this.data];
        
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(inst => 
                inst.name.toLowerCase().includes(search) ||
                (inst.address && inst.address.toLowerCase().includes(search))
            );
        }
        
        if (this.filters.type) {
            filtered = filtered.filter(inst => inst.type === this.filters.type);
        }
        
        if (this.filters.region) {
            filtered = filtered.filter(inst => inst.region === this.filters.region);
        }
        
        if (this.filters.sortBy) {
            const sortAsc = this.filters.sortAsc !== false;
            filtered.sort((a, b) => {
                const aVal = a[this.filters.sortBy] || '';
                const bVal = b[this.filters.sortBy] || '';
                return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            });
        }
        
        return filtered;
    },
    
    // Применение фильтров
    applyFilters: function() {
        this.filters = {
            search: document.getElementById('searchInput').value,
            type: document.getElementById('typeFilter').value,
            region: document.getElementById('regionFilter').value,
            sortBy: document.getElementById('sortFilter').value,
            sortAsc: true
        };
        this.currentPage = 1;
        this.render();
    },
    
    // Показать форму добавления
    showAddForm: function() {
        this.editingId = null;
        document.getElementById('formModalTitle').textContent = 'Добавить учреждение';
        document.getElementById('institutionForm').reset();
        document.getElementById('institutionId').value = '';
        document.getElementById('city').value = '';
        document.getElementById('street').value = '';
        document.getElementById('address').value = '';
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        document.getElementById('formModal').classList.add('active');
        clearValidationStyles();
    },
    
    // Редактирование
    edit: function(id) {
        const institution = this.data.find(i => i.id === id);
        if (!institution) return;
        
        this.editingId = id;
        document.getElementById('formModalTitle').textContent = 'Редактировать учреждение';
        
        document.getElementById('institutionId').value = id;
        document.getElementById('name').value = institution.name || '';
        document.getElementById('type').value = institution.type || '';
        document.getElementById('region').value = institution.region || '';
        document.getElementById('latitude').value = institution.latitude || '';
        document.getElementById('longitude').value = institution.longitude || '';
        document.getElementById('phone').value = institution.phone || '';
        document.getElementById('email').value = institution.email || '';
        document.getElementById('website').value = institution.website || '';
        document.getElementById('description').value = institution.description || '';
        
        // Заполняем город и улицу из отдельных полей, если они есть
        const city = institution.city || '';
        const street = institution.street || '';
        const fullAddress = institution.address || '';
        
        document.getElementById('city').value = city;
        document.getElementById('street').value = street;
        document.getElementById('address').value = fullAddress;
        
        // Если city/street пустые, но есть address, пробуем разобрать его
        if (!city && !street && fullAddress) {
            const addressParts = fullAddress.split(',').map(s => s.trim()).filter(s => s);
            if (addressParts.length >= 2) {
                document.getElementById('city').value = addressParts[0] || '';
                document.getElementById('street').value = addressParts.slice(1).join(', ') || '';
            } else if (addressParts.length === 1) {
                document.getElementById('city').value = addressParts[0] || '';
            }
        }
        
        document.getElementById('formModal').classList.add('active');
        clearValidationStyles();
    },
    
    // Закрыть форму
    closeForm: function() {
        document.getElementById('formModal').classList.remove('active');
        this.editingId = null;
    },
    
    // Геокодирование адреса (определение координат по адресу)
    geocodeAddress: async function() {
        const city = document.getElementById('city').value.trim();
        const street = document.getElementById('street').value.trim();
        const region = document.getElementById('region').value;
        
        if (!city) {
            showNotification('warning', 'Введите город для определения координат');
            return;
        }
        
        // Формируем полный адрес: город всегда первый, затем улица, затем страна
        // Формат: "улица, город, Беларусь" - такой порядок лучше работает с Nominatim
        let searchQuery;
        if (street) {
            // Если есть улица, используем "улица, город, Беларусь"
            searchQuery = `${street}, ${city}, Беларусь`;
        } else {
            // Если только город, используем "город, Беларусь"
            searchQuery = `${city}, Беларусь`;
        }
        
        try {
            showNotification('info', 'Определение координат...');
            
            // Используем Nominatim API для геокодирования с viewbox для ограничения поиска Беларусью
            const viewbox = '23.17,51.26,32.77,56.17'; // Границы Беларуси
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&viewbox=${viewbox}&bounded=0&countrycodes=by`, {
                headers: {
                    'Accept-Language': 'ru'
                }
            });
            
            if (!response.ok) throw new Error('Ошибка геокодирования');
            
            const data = await response.json();
            
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                
                document.getElementById('latitude').value = lat.toFixed(6);
                document.getElementById('longitude').value = lon.toFixed(6);
                
                showNotification('success', `Координаты определены: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            } else {
                showNotification('warning', `Не удалось определить координаты по адресу: "${searchQuery}". Попробуйте уточнить адрес.`);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            showNotification('error', 'Ошибка определения координат');
        }
    },
    
    // Удаление
    delete: async function(id) {
        const institution = this.data.find(i => i.id === id);
        if (!institution) return;
        
        if (!confirm(`Вы уверены, что хотите удалить учреждение "${institution.name}"?`)) {
            return;
        }
        
        try {
            await api.deleteInstitution(id);
            
            // Логирование
            await api.createLog({
                user_id: currentUser.id,
                action: 'delete',
                details: `Удалено учреждение: ${institution.name}`
            });
            
            showNotification('success', 'Учреждение удалено');
            await this.loadData();
            this.render();
            
        } catch (error) {
            console.error('Error deleting institution:', error);
            showNotification('error', 'Ошибка удаления учреждения');
        }
    },
    
    // Отправка формы
    submitForm: async function(event) {
        event.preventDefault();
        
        const latValue = document.getElementById('latitude').value.trim();
        const lngValue = document.getElementById('longitude').value.trim();
        const cityValue = document.getElementById('city').value.trim();
        const streetValue = document.getElementById('street').value.trim();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            type: document.getElementById('type').value,
            region: document.getElementById('region').value,
            city: cityValue || null,
            street: streetValue || null,
            address: document.getElementById('address').value.trim(),
            latitude: latValue ? parseFloat(latValue) : null,
            longitude: lngValue ? parseFloat(lngValue) : null,
            phone: document.getElementById('phone').value.trim() || null,
            email: document.getElementById('email').value.trim() || null,
            website: document.getElementById('website').value.trim() || null,
            description: document.getElementById('description').value.trim() || null
        };
        
        // Валидация
        const validation = validateInstitutionForm(formData);
        if (!validation.valid) {
            displayValidationErrors(validation.errors);
            return;
        }
        
        try {
            if (this.editingId) {
                await api.updateInstitution(this.editingId, formData);
                showNotification('success', 'Учреждение обновлено');
                
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'update',
                    details: `Обновлено учреждение: ${formData.name}`
                });
            } else {
                await api.createInstitution(formData);
                showNotification('success', 'Учреждение добавлено');
                
                await api.createLog({
                    user_id: currentUser.id,
                    action: 'create',
                    details: `Добавлено учреждение: ${formData.name}`
                });
            }
            
            this.closeForm();
            await this.loadData();
            this.render();
            
        } catch (error) {
            console.error('Error saving institution:', error);
            showNotification('error', 'Ошибка сохранения учреждения');
        }
    },
    
    filters: {},
    
    // Просмотр учреждения
    viewInstitution: async function(id) {
        const institution = this.data.find(i => i.id === id);
        if (!institution) {
            showNotification('error', 'Учреждение не найдено');
            return;
        }
        
        const content = `
            <div class="detail-section">
                <h3>Основная информация</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Название</label>
                        <span>${escapeHtml(institution.name)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Тип</label>
                        <span>${escapeHtml(institution.type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Регион</label>
                        <span>${escapeHtml(institution.region || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Город</label>
                        <span>${escapeHtml(institution.city || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Улица</label>
                        <span>${escapeHtml(institution.street || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Полный адрес</label>
                        <span>${escapeHtml(institution.address || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Телефон</label>
                        <span>${institution.phone ? formatPhone(institution.phone) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email</label>
                        <span>${escapeHtml(institution.email || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Сайт</label>
                        <span>${escapeHtml(institution.website || '-')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Дата создания</label>
                        <span>${formatDate(institution.created_at)}</span>
                    </div>
                </div>
            </div>
            ${institution.description ? `
                <div class="detail-section">
                    <h3>Описание</h3>
                    <p>${escapeHtml(institution.description)}</p>
                </div>
            ` : ''}
        `;
        
        const buttons = [
            { label: 'Закрыть', onclick: 'closeModal()', class: 'btn-secondary' }
        ];
        
        if (canAccess('institutions.edit')) {
            buttons.unshift({
                label: 'Редактировать',
                onclick: `institutionsPage.edit('${id}')`,
                class: 'btn-primary'
            });
        }
        
        showModal(institution.name, content, buttons);
    }
};

// Экспорт
window.institutionsPage = institutionsPage;