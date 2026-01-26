let fullData = {};
let currentTab = '';
let currentModalLang = 'br';
let editingIndex = -1;

let editingSubIndex = -1; // For nested items
let tempSubList = []; // To hold sub-list state while editing parent
let currentSubSchema = null;

let sortableInstance = null;

// Schemas with 'localized' flag
const schemas = {
    'social': {
        fields: [
            { key: 'name', label: 'Nome da Rede', type: 'text' },
            { key: 'url', label: 'URL / Link', type: 'text' },
            { key: 'icon', label: 'Ícone (FontAwesome)', type: 'text', help: 'Ex: fab fa-github' },
            { key: 'colorClass', label: 'Cor (Tailwind)', type: 'text', help: 'Ex: text-blue-500' }
        ],
        path: 'socialLinks',
        titleFn: (item) => item.name,
        iconFn: (item) => item.icon
    },
    'experience': {
        fields: [
            { key: 'role', label: 'Cargo', type: 'text', localized: true },
            { key: 'company', label: 'Empresa', type: 'text', localized: true }, // Although company usually same, user might want to localize "Inc." or location
            { key: 'duration', label: 'Duração', type: 'text', localized: true },
            { key: 'description', label: 'Descrição Curta', type: 'textarea', localized: true },
            { key: 'summary', label: 'Resumo / Detalhes', type: 'textarea', localized: true },
            { key: 'responsibilities', label: 'Responsabilidades (Uma por linha)', type: 'list_text', localized: true },
        ],
        path: 'experience',
        titleFn: (item) => `${item.role.br || 'Novo'} @ ${item.company.br || ''}`,
        iconFn: () => 'fas fa-briefcase'
    },
    'education': {
        fields: [
            { key: 'institution', label: 'Instituição', type: 'text', localized: true },
            { key: 'location', label: 'Local', type: 'text', localized: false },
            { key: 'course', label: 'Curso', type: 'text', localized: true }
        ],
        path: 'education',
        titleFn: (item) => item.course.br,
        iconFn: () => 'fas fa-graduation-cap'
    },
    'courses': {
        fields: [
            { key: 'title', label: 'Título do Curso', type: 'text', localized: true },
            { key: 'date', label: 'Data Conclusão', type: 'text', localized: true },
            { key: 'image', label: 'URL Imagem', type: 'text', localized: false },
            { key: 'pdf', label: 'URL Certificado (PDF)', type: 'text', localized: false },
            { key: 'longDescription', label: 'Descrição Detalhada', type: 'textarea', localized: true }
        ],
        path: 'courses',
        titleFn: (item) => item.title.br,
        iconFn: () => 'fas fa-certificate'
    },
    'skills': {
        fields: [
            { key: 'groupName', label: 'Nome do Grupo (Ex: Frontend)', type: 'text', localized: false },
            // Sub-list field
            {
                key: 'skills',
                label: 'Lista de Tecnologias',
                type: 'sub_list',
                localized: false,
                subSchema: [
                    { key: 'name', label: 'Nome (Ex: React)', type: 'text' },
                    { key: 'icon', label: 'Ícone (FontAwesome)', type: 'text', help: 'Ex: fab fa-react' },
                    { key: 'color', label: 'Cor (Tailwind Class)', type: 'text', help: 'Ex: text-blue-500' }
                ]
            }
        ],
        path: 'skills.br',
        titleFn: (item) => item.groupName,
        iconFn: () => 'fas fa-code'
    }
};

// --- Core ---
async function init() {
    try {
        const res = await fetch('/api/data');
        fullData = await res.json();
        document.getElementById('loading').style.display = 'none';
        switchTab('profile');
    } catch (e) {
        alert("Erro ao carregar: " + e);
    }
}

function switchTab(tab) {
    currentTab = tab;
    // Active State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + tab).classList.add('active');

    // Hide Sections
    ['section-profile', 'section-list-container', 'section-bio', 'section-seo'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    const titleEl = document.getElementById('page-title');

    if (tab === 'profile') {
        titleEl.textContent = 'Editar Perfil';
        document.getElementById('section-profile').style.display = 'block';
        renderProfile();
    } else if (tab === 'bio') {
        titleEl.textContent = 'Bio & História';
        document.getElementById('section-bio').style.display = 'block';
        renderBio();
    } else if (tab === 'seo') {
        titleEl.textContent = 'Configurações de SEO';
        document.getElementById('section-seo').style.display = 'block';
        renderSeo();
    } else {
        titleEl.textContent = 'Gerenciar ' + tab.charAt(0).toUpperCase() + tab.slice(1);
        document.getElementById('section-list-container').style.display = 'block';
        renderList(tab);
    }
}

// --- Renderers ---
function renderProfile() {
    const container = document.getElementById('section-profile');
    const p = fullData.profile;

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="card-panel p-6 space-y-5">
                <div class="flex items-center gap-3 mb-2 border-b border-zinc-800 pb-2">
                     <i class="fas fa-id-card text-emerald-500"></i>
                     <h3 class="font-bold text-lg text-white">Dados Principais</h3>
                </div>
                ${createInput('Nome Completo', p.name, 'profile.name')}
                ${createInput('Localização', p.address, 'profile.address')}
                ${createInput('Caminho Foto (URL)', p.image, 'profile.image')}
            </div>
            
            <div class="card-panel p-6 space-y-5">
                <div class="flex items-center gap-3 mb-2 border-b border-zinc-800 pb-2">
                     <i class="fas fa-address-book text-emerald-500"></i>
                     <h3 class="font-bold text-lg text-white">Contato</h3>
                </div>
                 <div class="grid grid-cols-2 gap-4">
                    ${createInput('WhatsApp (Visual)', p.contact.phone.display, 'profile.contact.phone.display')}
                    ${createInput('WhatsApp Link', p.contact.phone.link, 'profile.contact.phone.link')}
                 </div>
                 <div class="grid grid-cols-2 gap-4">
                    ${createInput('E-mail (Visual)', p.contact.email.display, 'profile.contact.email.display')}
                    ${createInput('E-mail Link', p.contact.email.link, 'profile.contact.email.link')}
                 </div>
            </div>
        </div>
    `;
}

function renderBio() {
    const container = document.getElementById('section-bio');

    // Language switching for Bio could be tabs content. For simplicity in this section, stacked is cleaner
    // OR, implement local state for visibility. Let's do simple Headers.

    container.innerHTML = `
        <div class="card-panel p-6">
            <div class="flex items-center gap-3 mb-4">
                <i class="fas fa-quote-left text-emerald-500"></i>
                <h3 class="font-bold text-lg text-white">Resumo Profissional</h3>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <span class="badget text-xs font-bold bg-green-900 text-green-300 px-2 py-1 rounded mb-2 inline-block">PT-BR</span>
                    <textarea onchange="updatePath('summary.br', this.value)" class="w-full h-32 p-3 rounded-xl text-sm leading-relaxed">${fullData.summary.br}</textarea>
                </div>
                <div>
                    <span class="badget text-xs font-bold bg-blue-900 text-blue-300 px-2 py-1 rounded mb-2 inline-block">EN-US</span>
                    <textarea onchange="updatePath('summary.en', this.value)" class="w-full h-32 p-3 rounded-xl text-sm leading-relaxed">${fullData.summary.en}</textarea>
                </div>
            </div>
        </div>
        
         <div class="card-panel p-6">
             <div class="flex items-center gap-3 mb-4">
                <i class="fas fa-book-open text-emerald-500"></i>
                <h3 class="font-bold text-lg text-white">História Completa</h3>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                     <span class="badget text-xs font-bold bg-green-900 text-green-300 px-2 py-1 rounded mb-2 inline-block">PT-BR</span>
                    <textarea onchange="updatePath('story.br', this.value)" class="w-full h-48 p-3 rounded-xl text-sm leading-relaxed">${fullData.story.br}</textarea>
                </div>
                <div>
                     <span class="badget text-xs font-bold bg-blue-900 text-blue-300 px-2 py-1 rounded mb-2 inline-block">EN-US</span>
                    <textarea onchange="updatePath('story.en', this.value)" class="w-full h-48 p-3 rounded-xl text-sm leading-relaxed">${fullData.story.en}</textarea>
                </div>
            </div>
        </div>
     `;
}

function renderSeo() {
    const container = document.getElementById('section-seo');
    const s = fullData.seo || {};

    container.innerHTML = `
        <div class="card-panel p-6 space-y-5">
            <div class="flex items-center gap-3 mb-2 border-b border-zinc-800 pb-2">
                    <i class="fas fa-search text-emerald-500"></i>
                    <h3 class="font-bold text-lg text-white">Meta Tags Principais</h3>
            </div>
            
            ${createInput('Título da Página (Tag Title)', s.title, 'seo.title', 'Ex: Ricardo Martins - Engenheiro de Software')}
            
            <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Descrição (Meta Description)</label>
                <textarea onchange="updatePath('seo.description', this.value)" 
                    placeholder="Ex: Especialista em desenvolvimento de sistemas com Go e Docker..."
                    class="w-full h-24 p-3 rounded-xl text-sm bg-[#0c0c0e] border border-zinc-800 focus:bg-zinc-900 resize-none">${(s.description || '').replace(/"/g, '&quot;')}</textarea>
                <p class="text-xs text-zinc-600 mt-1">Recomendado: 150-160 caracteres.</p>
            </div>
            
            <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Palavras-Chave (Keywords)</label>
                <textarea onchange="updatePath('seo.keywords', this.value)" 
                    placeholder="Ex: desenvolvimento, golang, backend, api..."
                    class="w-full h-24 p-3 rounded-xl text-sm bg-[#0c0c0e] border border-zinc-800 focus:bg-zinc-900 resize-none">${(s.keywords || '').replace(/"/g, '&quot;')}</textarea>
                <p class="text-xs text-zinc-600 mt-1">Separe as palavras por vírgula.</p>
            </div>
            
            ${createInput('Autor', s.author, 'seo.author', 'Ex: Ricardo Martins')}
            ${createInput('Robots', s.robots || 'index, follow', 'seo.robots', 'Ex: index, follow')}
            ${createInput('Nome do Site (og:site_name)', s.siteName || 'RMO.DEV', 'seo.siteName', 'Ex: RMO.DEV')}
            ${createInput('Idioma (og:locale)', s.locale || 'pt_BR', 'seo.locale', 'Ex: pt_BR')}
        </div>
        
        <div class="card-panel p-6 space-y-5">
            <div class="flex items-center gap-3 mb-2 border-b border-zinc-800 pb-2">
                    <i class="fas fa-share-alt text-emerald-500"></i>
                    <h3 class="font-bold text-lg text-white">Social & Open Graph</h3>
            </div>
            <p class="text-xs text-zinc-500 mb-4 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <i class="fas fa-info-circle mr-1"></i>
                Esta seção controla como seu link aparece no <strong>WhatsApp, Facebook e LinkedIn</strong>.
                <br>Certifique-se de usar uma imagem de alta qualidade (recomendado: 1200x630px).
            </p>
            
            ${createInput('URL da Imagem de Capa (OG Image)', s.ogImage, 'seo.ogImage', 'Ex: https://meusite.com/assets/img/perfil.webp')}
            ${createInput('URL Canônica', s.canonicalUrl, 'seo.canonicalUrl', 'Ex: https://meusite.com/')}
            ${createInput('Twitter Handle', s.twitterHandle, 'seo.twitterHandle', 'Ex: @ricardomartins')}
            
            <div class="pt-4 border-t border-zinc-800">
                <label class="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Cor do Tema (Mobile Browser)</label>
                <div class="flex gap-2">
                    <input type="color" value="${s.themeColor || '#10b981'}" 
                        onchange="updatePath('seo.themeColor', this.value); document.getElementById('theme-color-text').value = this.value"
                        class="h-10 w-12 rounded bg-transparent cursor-pointer border-0 p-0">
                    <input type="text" id="theme-color-text" value="${s.themeColor || '#10b981'}" 
                        onchange="updatePath('seo.themeColor', this.value)"
                        class="flex-1 px-4 py-2.5 rounded-lg text-sm bg-[#0c0c0e] border border-zinc-800 focus:bg-zinc-900 font-mono" placeholder="#10b981">
                </div>
                <p class="text-xs text-zinc-600 mt-1">Define a cor da barra do navegador em celulares.</p>
            </div>

        </div>
    `;
}

function renderList(tab) {
    const container = document.getElementById('list-items');

    // Destroy previous Sortable instance if exists to avoid dupes/memory leaks
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }

    const schema = schemas[tab];
    const list = getDeepValue(fullData, schema.path) || [];

    container.innerHTML = list.map((item, index) => `
        <div class="card-panel p-5 flex flex-row items-center justify-between group hover:border-emerald-500/50 transition-all cursor-grab active:cursor-grabbing bg-zinc-900/50" data-index="${index}" onclick="editItem(${index})">
            <div class="flex items-center gap-4 overflow-hidden pointer-events-none">
                <div class="w-6 text-zinc-600 flex justify-center"><i class="fas fa-grip-vertical"></i></div>
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition-colors flex-shrink-0">
                    <i class="${schema.iconFn(item)}"></i>
                </div>
                <div class="truncate">
                    <h4 class="font-bold text-white text-sm truncate">${schema.titleFn(item) || 'Novo Item'}</h4>
                    <span class="text-xs text-zinc-500">Arraste para mover</span>
                </div>
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onclick="event.stopPropagation(); deleteItem(${index})" class="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">
                    <i class="fas fa-trash-alt text-xs"></i>
                 </button>
            </div>
        </div>
    `).join('');

    // Init Sortable
    sortableInstance = new Sortable(container, {
        animation: 150,
        ghostClass: 'bg-emerald-900/20', // Class for the drag placeholder
        onEnd: function (evt) {
            // Reorder Array Logic
            const listPath = schema.path;
            const currentList = getDeepValue(fullData, listPath);
            const item = currentList.splice(evt.oldIndex, 1)[0];
            currentList.splice(evt.newIndex, 0, item);

            // No need to setDeepValue because currentList is a reference to the array inside fullData
            // But we should re-render to update the "data-index" attributes and onclick handlers correct indices
            renderList(tab);
        }
    });
}

// --- Inputs ---
function createInput(label, value, path, placeholder = '') {
    return `
        <div>
            <label class="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">${label}</label>
            <input type="text" value="${(value || '').replace(/"/g, '&quot;')}" 
                placeholder="${placeholder}"
                onchange="updatePath('${path}', this.value)"
                class="w-full px-4 py-2.5 rounded-lg text-sm bg-[#0c0c0e] border border-zinc-800 focus:bg-zinc-900">
        </div>
    `;
}

// --- Logic ---
function updatePath(path, value) {
    const parts = path.split('.');
    let obj = fullData;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
}

function getDeepValue(obj, path) {
    return path.split('.').reduce((o, i) => o ? o[i] : null, obj);
}

// --- Modal ---
function setModalLang(lang) {
    currentModalLang = lang;
    // Update Buttons
    document.querySelectorAll('.modal-lang-btn').forEach(btn => {
        const isTarget = btn.dataset.lang === lang;
        btn.className = isTarget
            ? 'modal-lang-btn px-3 py-1 text-xs font-medium rounded-md transition-all active bg-[#10b981] text-white shadow-lg'
            : 'modal-lang-btn px-3 py-1 text-xs font-medium rounded-md transition-all text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800';
    });

    // Show/Hide Fields
    document.querySelectorAll('.field-group-custom').forEach(grp => {
        if (grp.dataset.localized === 'false') return; // Always show shared fields
        if (grp.dataset.lang === lang) {
            grp.style.display = 'block';
        } else {
            grp.style.display = 'none';
        }
    });
}

function renderModal() {
    const container = document.getElementById('modal-form');
    const schema = schemas[currentTab];
    const list = getDeepValue(fullData, schema.path);
    const item = editingIndex === -1 ? {} : list[editingIndex];

    // Setup language toggle visibility in header
    const hasLocalized = schema.fields.some(f => f.localized);
    document.getElementById('modal-lang-tabs').style.display = hasLocalized ? 'flex' : 'none';

    // Prepare tempSubList if we are opening a modal containing a sub_list
    const subListField = schema.fields.find(f => f.type === 'sub_list');
    if (subListField) {
        tempSubList = JSON.parse(JSON.stringify(item[subListField.key] || [])); // Deep Clone for editing
        currentSubSchema = subListField.subSchema;
    }

    container.innerHTML = schema.fields.map(field => {
        // If Field is localized, we render TWO versions (br and en) wrapped in divs
        if (field.localized) {
            return `
                <!-- PT BR -->
                <div class="field-group-custom" data-lang="br" data-localized="true">
                    <label class="block text-xs font-bold text-emerald-500 mb-1.5 uppercase">${field.label} (PT)</label>
                    ${renderFieldInput(field, item, 'br')}
                </div>
                <!-- EN US -->
                <div class="field-group-custom" data-lang="en" data-localized="true" style="display:none">
                        <label class="block text-xs font-bold text-blue-500 mb-1.5 uppercase">${field.label} (EN)</label>
                        ${renderFieldInput(field, item, 'en')}
                </div>
            `;
        } else {
            return `
                <div class="field-group-custom" data-localized="false">
                        <label class="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">${field.label}</label>
                        ${renderFieldInput(field, item, null)}
                </div>
            `;
        }
    }).join('');

    // Re-apply current language state
    setModalLang(currentModalLang);

    // If there's a sub_list, we need to render the list UI
    if (subListField) renderSubListUI();
}

function renderFieldInput(field, item, langSuffix) {
    if (field.type === 'sub_list') return `<div id="sub-list-container" class="space-y-2 mt-2"></div>`; // Placeholder for sub-list UI

    let val;

    // Logic to get value
    if (langSuffix) {
        // Try item[key][lang]
        val = (item[field.key] && item[field.key][langSuffix]) || '';
    } else {
        val = item[field.key] || '';
    }

    const id = `input-${field.key}-${langSuffix || 'common'}`;

    // Check for Icon or Color Picker based on Key Name
    if (field.key === 'icon') return renderIconPicker(id, val);
    if (field.key === 'color' || field.key === 'colorClass') return renderColorPicker(id, val);

    if (field.type === 'list_text') {
        val = Array.isArray(val) ? val.join('\n') : val;
        return `<textarea id="${id}" class="w-full h-32 p-3 rounded-xl text-sm font-mono leading-relaxed resize-none">${val}</textarea>`;
    }
    if (field.type === 'textarea') {
        return `<textarea id="${id}" class="w-full h-24 p-3 rounded-xl text-sm resize-none">${val}</textarea>`;
    }

    return `<input type="text" id="${id}" value="${String(val).replace(/"/g, '&quot;')}" class="w-full px-4 py-2.5 rounded-lg text-sm bg-[#0c0c0e] border border-zinc-800 focus:bg-zinc-900">`;
}

// Components (pickers.js) are loaded externally

// --- Sub List Logic ---
function renderSubListUI() {
    const container = document.getElementById('sub-list-container');
    container.innerHTML = `
        <div class="flex justify-end mb-2"><button onclick="openSubModal(-1)" class="text-xs bg-emerald-600 px-3 py-1 rounded text-white font-bold"><i class="fas fa-plus"></i> Add Tech</button></div>
        <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scroll">
            ${tempSubList.map((subItem, idx) => `
                <div class="flex items-center justify-between bg-zinc-900 p-2 rounded border border-zinc-700">
                        <div class="flex items-center gap-2">
                        <i class="${subItem.icon} text-zinc-500 w-6 text-center"></i>
                        <span class="text-sm font-medium text-white">${subItem.name}</span>
                        </div>
                        <div class="flex gap-2">
                        <button onclick="openSubModal(${idx})" class="text-blue-500 hover:text-white"><i class="fas fa-pen"></i></button>
                        <button onclick="removeSubItem(${idx})" class="text-red-500 hover:text-white"><i class="fas fa-trash"></i></button>
                        </div>
                </div>
            `).join('')}
        </div>
    `;
}

function openSubModal(index) {
    editingSubIndex = index;
    const subItem = index === -1 ? {} : tempSubList[index];
    const container = document.getElementById('sub-modal-form');

    container.innerHTML = currentSubSchema.map(f => {
        let inputHtml;
        const fieldId = `sub-${f.key}`;
        const val = subItem[f.key];

        if (f.key === 'icon') {
            inputHtml = renderIconPicker(fieldId, val);
        } else if (f.key === 'color') {
            inputHtml = renderColorPicker(fieldId, val);
        } else {
            inputHtml = `<input type="text" id="${fieldId}" value="${(val || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 bg-black border border-zinc-700 rounded text-sm text-white focus:border-emerald-500 outline-none">`;
        }

        return `
            <div>
                    <label class="block text-xs text-zinc-400 mb-1 font-bold uppercase">${f.label}</label>
                    ${inputHtml}
            </div>
        `;
    }).join('');

    document.getElementById('sub-modal').classList.remove('hidden');
}

function closeSubModal() { document.getElementById('sub-modal').classList.add('hidden'); }

function saveSubItem() {
    const newItem = {};
    currentSubSchema.forEach(f => {
        newItem[f.key] = document.getElementById(`sub-${f.key}`).value;
    });

    if (editingSubIndex === -1) tempSubList.push(newItem);
    else tempSubList[editingSubIndex] = newItem;

    closeSubModal();
    renderSubListUI();
}

function removeSubItem(index) {
    if (!confirm('Remover tecnologia?')) return;
    tempSubList.splice(index, 1);
    renderSubListUI();
}

// --- Modal Save ---
function saveModalItem() {
    const schema = schemas[currentTab];
    const list = getDeepValue(fullData, schema.path);
    const newItem = editingIndex === -1 ? {} : list[editingIndex];

    schema.fields.forEach(field => {
        if (field.type === 'sub_list') {
            // Save the temp list to the item
            newItem[field.key] = JSON.parse(JSON.stringify(tempSubList)); // Copy back
            return;
        }

        if (field.localized) {
            if (!newItem[field.key]) newItem[field.key] = {};
            let valBR = document.getElementById(`input-${field.key}-br`).value;
            if (field.type === 'list_text') valBR = valBR.split('\n').filter(l => l.trim());
            newItem[field.key]['br'] = valBR;

            let valEN = document.getElementById(`input-${field.key}-en`).value;
            if (field.type === 'list_text') valEN = valEN.split('\n').filter(l => l.trim());
            newItem[field.key]['en'] = valEN;
        } else {
            const el = document.getElementById(`input-${field.key}-common`);
            if (el) newItem[field.key] = el.value;
        }
    });

    if (editingIndex === -1) list.push(newItem);

    closeModal();
    renderList(currentTab);
}

// --- Actions ---
function addItem() { editingIndex = -1; openModal(); }
function editItem(i) { editingIndex = i; openModal(); }

function openModal() {
    renderModal();
    document.getElementById('edit-modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('edit-modal').classList.add('hidden'); }

function deleteItem(index) {
    if (!confirm('Deseja excluir este item?')) return;
    const schema = schemas[currentTab];
    const list = getDeepValue(fullData, schema.path);
    list.splice(index, 1);
    renderList(currentTab);
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    toast.className = `fixed top-24 right-8 ${bgClass} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform translate-x-full transition-transform duration-300 z-50`;
    toast.innerHTML = `
        <i class="fas ${icon} text-xl"></i>
        <div>
            <h4 class="font-bold text-sm uppercase tracking-wide">${type === 'success' ? 'Sucesso' : 'Erro'}</h4>
            <p class="text-sm font-medium">${message}</p>
        </div>
    `;

    document.body.appendChild(toast);

    // Slide In
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full');
    });

    // Slide Out & Remove
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Save
document.getElementById('save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-btn');
    const original = btn.innerHTML;

    // Update UI to show processing
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i><span>Rodando Build (Aguarde)...</span>`;
    btn.classList.replace('bg-emerald-600', 'bg-zinc-600'); // Grey out slightly
    btn.disabled = true;

    try {
        const res = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullData)
        });
        const d = await res.json();

        if (d.success) {
            // Success State
            btn.classList.replace('bg-zinc-600', 'bg-emerald-600');
            btn.innerHTML = `<i class="fas fa-check-double"></i><span>Build Concluído!</span>`;

            showToast('Dados salvos e site gerado na pasta dist!', 'success');

            setTimeout(() => {
                btn.innerHTML = original;
                btn.disabled = false;
            }, 3000);
        } else {
            throw new Error(d.error);
        }
    } catch (e) {
        showToast(e.message, 'error');
        btn.classList.replace('bg-zinc-600', 'bg-red-600');
        btn.innerHTML = `<i class="fas fa-times"></i><span>Erro no Build</span>`;

        setTimeout(() => {
            btn.classList.replace('bg-red-600', 'bg-emerald-600');
            btn.innerHTML = original;
            btn.disabled = false;
        }, 3000);
    }
});

init();
