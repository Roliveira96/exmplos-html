// --- Icon Picker Data ---
const commonIcons = [
    // Social & Brands
    "fab fa-github", "fab fa-linkedin", "fab fa-instagram", "fab fa-whatsapp", "fab fa-twitter", "fab fa-facebook", "fab fa-youtube", "fab fa-twitch", "fab fa-discord", "fab fa-telegram", "fab fa-medium", "fab fa-dev", "fab fa-stack-overflow", "fab fa-dribbble", "fab fa-behance", "fab fa-figma", "fab fa-google", "fab fa-apple", "fab fa-windows", "fab fa-android", "fab fa-docker", "fab fa-aws", "fab fa-node-js", "fab fa-react", "fab fa-vuejs", "fab fa-angular", "fab fa-python", "fab fa-java", "fab fa-js", "fab fa-html5", "fab fa-css3", "fab fa-git-alt",
    // Interface
    "fas fa-envelope", "fas fa-phone", "fas fa-map-marker-alt", "fas fa-globe", "fas fa-link", "fas fa-code", "fas fa-laptop-code", "fas fa-briefcase", "fas fa-graduation-cap", "fas fa-certificate", "fas fa-user", "fas fa-users", "fas fa-star", "fas fa-heart", "fas fa-check", "fas fa-times", "fas fa-plus", "fas fa-trash", "fas fa-pen", "fas fa-download", "fas fa-file-pdf", "fas fa-file-alt", "fas fa-camera", "fas fa-video", "fas fa-music", "fas fa-gamepad", "fas fa-book", "fas fa-lightbulb", "fas fa-rocket", "fas fa-tools", "fas fa-cog", "fas fa-search", "fas fa-home", "fas fa-calendar"
];

// --- Color Picker Data ---
const tailwindColors = [
    { name: 'Slate', keys: ['text-slate-400', 'text-slate-500', 'text-slate-600'], hex: ['#94a3b8', '#64748b', '#475569'] },
    { name: 'Red', keys: ['text-red-400', 'text-red-500', 'text-red-600'], hex: ['#f87171', '#ef4444', '#dc2626'] },
    { name: 'Orange', keys: ['text-orange-400', 'text-orange-500', 'text-orange-600'], hex: ['#fb923c', '#f97316', '#ea580c'] },
    { name: 'Amber', keys: ['text-amber-400', 'text-amber-500', 'text-amber-600'], hex: ['#fbbf24', '#f59e0b', '#d97706'] },
    { name: 'Green', keys: ['text-green-400', 'text-green-500', 'text-green-600'], hex: ['#4ade80', '#22c55e', '#16a34a'] },
    { name: 'Emerald', keys: ['text-emerald-400', 'text-emerald-500', 'text-emerald-600'], hex: ['#34d399', '#10b981', '#059669'] },
    { name: 'Teal', keys: ['text-teal-400', 'text-teal-500', 'text-teal-600'], hex: ['#2dd4bf', '#14b8a6', '#0d9488'] },
    { name: 'Cyan', keys: ['text-cyan-400', 'text-cyan-500', 'text-cyan-600'], hex: ['#22d3ee', '#06b6d4', '#0891b2'] },
    { name: 'Sky', keys: ['text-sky-400', 'text-sky-500', 'text-sky-600'], hex: ['#38bdf8', '#0ea5e9', '#0284c7'] },
    { name: 'Blue', keys: ['text-blue-400', 'text-blue-500', 'text-blue-600'], hex: ['#60a5fa', '#3b82f6', '#2563eb'] },
    { name: 'Indigo', keys: ['text-indigo-400', 'text-indigo-500', 'text-indigo-600'], hex: ['#818cf8', '#6366f1', '#4f46e5'] },
    { name: 'Violet', keys: ['text-violet-400', 'text-violet-500', 'text-violet-600'], hex: ['#a78bfa', '#8b5cf6', '#7c3aed'] },
    { name: 'Purple', keys: ['text-purple-400', 'text-purple-500', 'text-purple-600'], hex: ['#c084fc', '#a855f7', '#9333ea'] },
    { name: 'Fuchsia', keys: ['text-fuchsia-400', 'text-fuchsia-500', 'text-fuchsia-600'], hex: ['#e879f9', '#d946ef', '#c026d3'] },
    { name: 'Pink', keys: ['text-pink-400', 'text-pink-500', 'text-pink-600'], hex: ['#f472b6', '#ec4899', '#db2777'] },
    { name: 'Rose', keys: ['text-rose-400', 'text-rose-500', 'text-rose-600'], hex: ['#fb7185', '#f43f5e', '#e11d48'] },
];

/**
 * Renders the HTML for the Color Picker Component
 * @param {string} id - Unique ID for the input
 * @param {string} currentValue - Current value (Tailwind class)
 */
function renderColorPicker(id, currentValue) {
    const dropdownId = `color-drop-${id}`;
    const previewId = `color-prev-${id}`;

    let currentHex = '#3f3f46';
    for (const grp of tailwindColors) {
        const idx = grp.keys.indexOf(currentValue);
        if (idx !== -1) currentHex = grp.hex[idx];
    }

    const gridHtml = tailwindColors.map(grp => `
        <div class="color-row">
            <span class="color-label">${grp.name}</span>
            <div class="color-options-row">
                ${grp.keys.map((k, i) => `
                    <div class="color-circle" 
                         style="background-color: ${grp.hex[i]}" 
                         title="${k}"
                         onclick="selectColor('${id}', '${k}', '${grp.hex[i]}')">
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    return `
        <div class="relative group">
            <div class="flex gap-2 items-center">
                <div id="${previewId}" class="w-10 h-10 rounded-full border-2 border-zinc-700 flex-shrink-0" style="background-color: ${currentHex}"></div>
                <div class="flex-1 relative">
                    <input type="text" id="${id}" value="${currentValue || ''}" 
                        onfocus="toggleColorDropdown('${dropdownId}', true)"
                        onblur="setTimeout(() => toggleColorDropdown('${dropdownId}', false), 200)"
                        placeholder="Ex: text-emerald-500"
                        class="w-full px-4 py-2.5 rounded-lg text-sm bg-[#0c0c0e] border border-zinc-800 focus:bg-zinc-900 focus:border-emerald-500 outline-none transition-colors">
                    <div id="${dropdownId}" class="icon-dropdown">
                        <div class="color-grid custom-scroll">
                            ${gridHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders the HTML for the Icon Picker Component
 * @param {string} id - Unique ID for the input
 * @param {string} currentValue - Current icon class
 */
function renderIconPicker(id, currentValue) {
    const pId = `preview-${id}`;
    const dropdownId = `dropdown-${id}`;
    const gridId = `grid-${id}`;
    const safeValue = currentValue || 'fas fa-icons';

    // Delayed simple render of items to avoid massive string in JS memory if list is huge (it's small now)
    const gridItems = commonIcons.map(icon => `
        <div class="icon-option" onclick="selectIcon('${id}', '${icon}')" title="${icon}">
            <i class="${icon}"></i>
        </div>
    `).join('');

    return `
        <div class="relative group">
            <div class="flex gap-2 items-center">
                <div class="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center flex-shrink-0">
                    <i id="${pId}" class="${safeValue} text-xl text-emerald-500"></i>
                </div>
                <div class="flex-1 relative">
                    <input type="text" id="${id}" value="${currentValue || ''}" 
                        onfocus="toggleIconDropdown('${dropdownId}', true)"
                        onblur="setTimeout(() => toggleIconDropdown('${dropdownId}', false), 200)"
                        onkeyup="filterIcons('${gridId}', this.value); document.getElementById('${pId}').className = this.value + ' text-xl text-emerald-500'"
                        placeholder="Pesquise ou selecione..."
                        autocomplete="off"
                        class="w-full px-4 py-2.5 rounded-lg text-sm bg-[#0c0c0e] border border-zinc-800 focus:bg-zinc-900 focus:border-emerald-500 outline-none transition-colors">
                    <div id="${dropdownId}" class="icon-dropdown">
                        <div id="${gridId}" class="icon-grid custom-scroll">
                            ${gridItems}
                        </div>
                    </div>
                </div>
                <a href="https://fontawesome.com/v5/search?m=free" target="_blank" class="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-800 rounded border border-zinc-700 transition-colors" title="Buscar no FontAwesome">
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </div>
    `;
}

// --- Global Handlers (Attached to Window) ---
window.toggleColorDropdown = function (id, state) {
    const el = document.getElementById(id);
    if (state) el.classList.add('show');
    else el.classList.remove('show');
}

window.selectColor = function (inputId, colorClass, hexValue) {
    document.getElementById(inputId).value = colorClass;
    document.getElementById(`color-prev-${inputId}`).style.backgroundColor = hexValue;
}

window.toggleIconDropdown = function (id, state) {
    const el = document.getElementById(id);
    if (state) el.classList.add('show');
    else el.classList.remove('show');
}

window.filterIcons = function (gridId, query) {
    const grid = document.getElementById(gridId);
    const term = query.toLowerCase();
    const options = grid.getElementsByClassName('icon-option');
    Array.from(options).forEach(opt => {
        const iconClass = opt.getAttribute('title').toLowerCase();
        opt.style.display = iconClass.includes(term) ? 'flex' : 'none';
    });
}

window.selectIcon = function (inputId, iconValue) {
    const input = document.getElementById(inputId);
    input.value = iconValue;
    const pId = `preview-${inputId}`;
    const preview = document.getElementById(pId);
    if (preview) preview.className = iconValue + ' text-xl text-emerald-500';
}
