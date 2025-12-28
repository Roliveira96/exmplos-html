const PDF_URL = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2ccae/web/compressed.tracemonkey-pldi-09.pdf';

const state = {
    pdfDoc: null,
    pageNum: 1,
    numPages: 0,
    zoom: 1.0,
    minZoom: 0.5,
    maxZoom: 10.0,
    markers: [],
    isMarkersOpen: false,
    isPagesOpen: false,
    editingMarkerId: null,
    targetMarkerIdForAnnotation: null,
    tempMarkerData: { name: '', color: '#2563eb' },
    tempAnnData: { title: '', description: '' },
    isRendering: false,
    uiTimeout: null,
    isUiVisible: true
};

const colors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0f172a'];

const els = {
    landingView: document.getElementById('landing-view'),
    readingView: document.getElementById('reading-view'),
    btnOpenReader: document.getElementById('btn-open-reader'),
    btnCloseReader: document.getElementById('btn-close-reader'),
    pdfViewport: document.getElementById('pdf-viewport'),
    pdfContent: document.getElementById('pdf-content'),
    pagesContainer: document.getElementById('pages-container'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnOpenMarkers: document.getElementById('btn-open-markers'),
    btnCloseMarkers: document.getElementById('btn-close-markers'),
    sidebarMarkers: document.getElementById('sidebar-markers'),
    markersList: document.getElementById('markers-list'),
    btnCreateMarker: document.getElementById('btn-create-marker'),
    modalMarker: document.getElementById('modal-marker'),
    inputMarkerName: document.getElementById('input-marker-name'),
    colorPicker: document.getElementById('color-picker'),
    btnCancelMarker: document.getElementById('btn-cancel-marker'),
    btnSaveMarker: document.getElementById('btn-save-marker'),
    overlayMarker: document.getElementById('overlay-marker'),
    modalAnnotation: document.getElementById('modal-annotation'),
    inputAnnTitle: document.getElementById('input-ann-title'),
    inputAnnDesc: document.getElementById('input-ann-desc'),
    btnCancelAnn: document.getElementById('btn-cancel-ann'),
    btnSaveAnn: document.getElementById('btn-save-ann'),
    overlayAnnotation: document.getElementById('overlay-annotation'),
    sidebarPages: document.getElementById('sidebar-pages'),
    thumbnailsList: document.getElementById('thumbnails-list'),
    btnOpenPages: document.getElementById('btn-open-pages'),
    btnClosePages: document.getElementById('btn-close-pages'),
    backdrop: document.getElementById('backdrop'),
    uiOverlay: document.getElementById('ui-overlay')
};

async function init() {
    lucide.createIcons();
    renderColorPicker();
    setupEventListeners();
}

function setupEventListeners() {
    els.btnOpenReader.addEventListener('click', loadPDF);
    els.btnCloseReader.addEventListener('click', closeReader);

    els.btnZoomIn.addEventListener('click', () => updateZoom(state.zoom + 0.5));
    els.btnZoomOut.addEventListener('click', () => updateZoom(state.zoom - 0.5));

    els.btnOpenMarkers.addEventListener('click', () => toggleSidebar('markers', true));
    els.btnCloseMarkers.addEventListener('click', () => toggleSidebar('markers', false));
    els.btnOpenPages.addEventListener('click', () => {
        toggleSidebar('pages', true);
        renderThumbnails();
    });
    els.btnClosePages.addEventListener('click', () => toggleSidebar('pages', false));
    els.backdrop.addEventListener('click', () => {
        toggleSidebar('markers', false);
        toggleSidebar('pages', false);
    });

    // Sync UI with Browser Native Pinch Zoom
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', syncUI);
        window.visualViewport.addEventListener('scroll', syncUI);
    }
    window.addEventListener('resize', () => {
        syncUI();
        updateZoom(state.zoom);
    });

    els.readingView.addEventListener('mousemove', resetUiTimeout);
    els.readingView.addEventListener('touchstart', resetUiTimeout);
    els.readingView.addEventListener('click', resetUiTimeout);

    // Drag-to-Scroll (Mouse)
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    els.pdfViewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        els.pdfViewport.style.cursor = 'grabbing';
        startX = e.pageX - els.pdfViewport.offsetLeft;
        startY = e.pageY - els.pdfViewport.offsetTop;
        scrollLeft = els.pdfViewport.scrollLeft;
        scrollTop = els.pdfViewport.scrollTop;
    });

    els.pdfViewport.addEventListener('mouseleave', () => {
        isDragging = false;
        els.pdfViewport.style.cursor = 'grab';
    });

    els.pdfViewport.addEventListener('mouseup', () => {
        isDragging = false;
        els.pdfViewport.style.cursor = 'grab';
    });

    els.pdfViewport.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - els.pdfViewport.offsetLeft;
        const y = e.pageY - els.pdfViewport.offsetTop;
        const walkX = (x - startX);
        const walkY = (y - startY);
        els.pdfViewport.scrollLeft = scrollLeft - walkX;
        els.pdfViewport.scrollTop = scrollTop - walkY;
    });

    els.btnCreateMarker.addEventListener('click', () => openMarkerModal());
    els.btnCancelMarker.addEventListener('click', closeMarkerModal);
    els.overlayMarker.addEventListener('click', closeMarkerModal);
    els.btnSaveMarker.addEventListener('click', saveMarker);

    els.btnCancelAnn.addEventListener('click', closeAnnotationModal);
    els.overlayAnnotation.addEventListener('click', closeAnnotationModal);
    els.btnSaveAnn.addEventListener('click', saveAnnotation);

    els.inputMarkerName.addEventListener('input', (e) => state.tempMarkerData.name = e.target.value);
    els.inputAnnTitle.addEventListener('input', (e) => state.tempAnnData.title = e.target.value);
    els.inputAnnDesc.addEventListener('input', (e) => state.tempAnnData.description = e.target.value);
}

async function loadPDF() {
    els.btnOpenReader.innerText = "Carregando...";
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    try {
        const loadingTask = pdfjsLib.getDocument(PDF_URL);
        state.pdfDoc = await loadingTask.promise;
        state.numPages = state.pdfDoc.numPages;

        showReadingView();

        requestAnimationFrame(async () => {
            updateZoom(1.0);
            await renderAllPages();
            setupIntersectionObserver();
            syncUI();
            resetUiTimeout();
        });

    } catch (error) {
        console.error(error);
        alert("Erro ao carregar PDF");
        els.btnOpenReader.innerText = "Abrir Modo Leitura";
    }
}

function showReadingView() {
    els.landingView.classList.add('opacity-0');
    setTimeout(() => {
        els.landingView.classList.add('hidden');
        els.readingView.classList.remove('hidden');
        document.documentElement.style.overflow = 'hidden';
        setTimeout(() => els.readingView.classList.remove('opacity-0'), 50);
    }, 300);
}

function closeReader() {
    els.readingView.classList.add('opacity-0');
    setTimeout(() => {
        els.readingView.classList.add('hidden');
        els.landingView.classList.remove('hidden');
        document.documentElement.style.overflow = '';

        setTimeout(() => els.landingView.classList.remove('opacity-0'), 50);
        els.btnOpenReader.innerText = "Abrir Modo Leitura";
        els.pagesContainer.innerHTML = '';
        els.thumbnailsList.innerHTML = '';
        state.markers = [];
        state.zoom = 1.0;
        els.pdfContent.style.width = '100%';
        els.pdfViewport.scrollLeft = 0;
        els.pdfViewport.scrollTop = 0;
        renderMarkersList();
    }, 300);
}

async function renderAllPages() {
    els.pagesContainer.innerHTML = '';
    for (let i = 1; i <= state.numPages; i++) {
        const wrapper = document.createElement('div');
        wrapper.id = `page-${i}`;
        wrapper.className = "flex flex-col items-center mb-10 w-full min-h-[600px]";
        wrapper.dataset.pageNum = i;

        const canvasContainer = document.createElement('div');
        canvasContainer.className = "bg-white shadow-2xl border border-zinc-200 w-full";
        canvasContainer.id = `canvas-container-${i}`;

        const canvas = document.createElement('canvas');
        canvas.className = "w-full h-auto block";
        canvasContainer.appendChild(canvas);

        const pageNumBadge = document.createElement('div');
        pageNumBadge.className = "mt-4 px-4 py-1.5 bg-zinc-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg";
        pageNumBadge.innerText = `Página ${i}`;

        wrapper.appendChild(canvasContainer);
        wrapper.appendChild(pageNumBadge);
        els.pagesContainer.appendChild(wrapper);

        await renderPageOnCanvas(i, canvas);
    }
}

async function renderPageOnCanvas(num, canvas) {
    if (!state.pdfDoc) return;
    // Boost quality for high zoom targets
    const FIXED_HIGH_QUALITY_SCALE = 3.0;
    const page = await state.pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: FIXED_HIGH_QUALITY_SCALE });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport: viewport }).promise;
}

function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageId = entry.target.id.split('-')[1];
                state.pageNum = parseInt(pageId);
            }
        });
    }, { threshold: 0.1 });

    for (let i = 1; i <= state.numPages; i++) {
        const el = document.getElementById(`page-${i}`);
        if (el) observer.observe(el);
    }
}

function resetUiTimeout() {
    showUI();
    if (state.uiTimeout) clearTimeout(state.uiTimeout);
    state.uiTimeout = setTimeout(() => {
        // Don't hide if a modal or sidebar is open
        if (!state.isMarkersOpen && !state.isPagesOpen && els.modalMarker.classList.contains('hidden') && els.modalAnnotation.classList.contains('hidden')) {
            hideUI();
        }
    }, 10000); // 10 seconds
}

function showUI() {
    if (!state.isUiVisible) {
        els.uiOverlay.style.opacity = "1";
        // Do NOT set pointerEvents to auto on the overlay itself,
        // it must remain 'none' to allow interacting with the PDF beneath.
        state.isUiVisible = true;
    }
}

function hideUI() {
    if (state.isUiVisible) {
        els.uiOverlay.style.opacity = "0";
        state.isUiVisible = false;
    }
}

/**
 * Programmatic Zoom targeting only the PDF Content.
 * focalPoint: {x, y} coordinate in the old zoom level that should stay under screenPoint.
 * screenPoint: {x, y} coordinate relative to the viewport.
 */
function updateZoom(newZoom, focalPoint = null, screenPoint = null) {
    const oldZoom = state.zoom;
    state.zoom = Math.max(state.minZoom, Math.min(state.maxZoom, newZoom));

    // if (oldZoom === state.zoom) return; // Removed to force width update on init

    const scaleRatio = state.zoom / oldZoom;

    // Apply zoom
    let newWidth;

    if (window.matchMedia('(min-width: 1024px)').matches) {
        // Desktop: Base width is FIXED at 794px (A4)
        const baseWidth = 794;
        newWidth = `${baseWidth * state.zoom}px`;
    } else {
        // Mobile: Base width is percentage of viewport
        newWidth = `${state.zoom * 100}%`;
    }

    els.pdfContent.style.width = newWidth;

    // Adjust scroll to keep focal point under the finger/mouse
    if (focalPoint && screenPoint) {
        const newFocalX = focalPoint.x * scaleRatio;
        const newFocalY = focalPoint.y * scaleRatio;

        els.pdfViewport.scrollLeft = newFocalX - screenPoint.x;
        els.pdfViewport.scrollTop = newFocalY - screenPoint.y;
    }

    syncUI();
}

/**
 * Compensates UI Overlay for native Pinch Zoom (browser level).
 */
function syncUI() {
    if (els.readingView.classList.contains('hidden')) return;

    const vv = window.visualViewport;
    if (!vv) return;

    // vv.scale is the pinch zoom level
    const compensation = 1 / vv.scale;

    // The uiOverlay container is layout-fixed. We translate and scale it
    // so it perfectly overlays the user's visible physical screen area.
    els.uiOverlay.style.width = `${vv.width * vv.scale}px`;
    els.uiOverlay.style.height = `${vv.height * vv.scale}px`;

    els.uiOverlay.style.transform = `
        translate(${vv.offsetLeft}px, ${vv.offsetTop}px)
        scale(${compensation})
    `;
}

function toggleSidebar(type, open) {
    const sidebar = type === 'markers' ? els.sidebarMarkers : els.sidebarPages;
    const translateClass = type === 'markers' ? 'translate-x-full' : '-translate-x-full';

    if (open) {
        sidebar.classList.remove(translateClass);
        els.backdrop.classList.remove('hidden');
        setTimeout(() => els.backdrop.classList.remove('opacity-0'), 10);
        if (type === 'markers') {
            renderMarkersList();
            state.isMarkersOpen = true;
        } else {
            state.isPagesOpen = true;
        }
    } else {
        sidebar.classList.add(translateClass);
        state.isMarkersOpen = false;
        state.isPagesOpen = false;
        if (!state.isMarkersOpen && !state.isPagesOpen) {
            els.backdrop.classList.add('opacity-0');
            setTimeout(() => els.backdrop.classList.add('hidden'), 300);
        }
    }
    syncUI();
}

// Marker Logic
function renderColorPicker() {
    els.colorPicker.innerHTML = colors.map(c => `
        <button onclick="selectColor('${c}')" class="color-btn w-16 h-16 rounded-[1.5rem] transition-all flex items-center justify-center border-8 border-transparent opacity-40 hover:opacity-100" style="background-color: ${c}" data-color="${c}">
        </button>
    `).join('');
    selectColor(colors[0]);
}

window.selectColor = function (color) {
    state.tempMarkerData.color = color;
    document.querySelectorAll('.color-btn').forEach(btn => {
        const btnColor = btn.dataset.color;
        if (btnColor === color) {
            btn.classList.add('border-zinc-900', 'scale-125');
            btn.classList.remove('border-transparent', 'opacity-40');
            btn.innerHTML = '<i data-lucide="check" class="text-white w-8 h-8 stroke-[4px]"></i>';
        } else {
            btn.classList.remove('border-zinc-900', 'scale-125');
            btn.classList.add('border-transparent', 'opacity-40');
            btn.innerHTML = '';
        }
    });
    lucide.createIcons();
};

function openMarkerModal(markerId = null) {
    if (markerId) {
        const marker = state.markers.find(m => m.id === markerId);
        state.editingMarkerId = markerId;
        state.tempMarkerData = { name: marker.name, color: marker.color };
        document.getElementById('modal-marker-title').innerText = 'Editar Marcador';
    } else {
        state.editingMarkerId = null;
        state.tempMarkerData = { name: '', color: colors[0] };
        document.getElementById('modal-marker-title').innerText = 'Criar Marcador';
    }
    els.inputMarkerName.value = state.tempMarkerData.name;
    selectColor(state.tempMarkerData.color);
    els.modalMarker.classList.remove('hidden');
    syncUI();
}

function closeMarkerModal() {
    els.modalMarker.classList.add('hidden');
}

function saveMarker() {
    if (state.editingMarkerId) {
        state.markers = state.markers.map(m => m.id === state.editingMarkerId ? { ...m, ...state.tempMarkerData } : m);
    } else {
        state.markers.push({
            id: Date.now(),
            page: state.pageNum,
            name: state.tempMarkerData.name || `Pág. ${state.pageNum}`,
            color: state.tempMarkerData.color,
            annotations: []
        });
    }
    closeMarkerModal();
    renderMarkersList();
}

function renderMarkersList() {
    if (state.markers.length === 0) {
        els.markersList.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-zinc-300 opacity-60"><i data-lucide="bookmark" class="w-16 h-16 mb-4 stroke-1"></i><p class="font-bold text-lg">Sem marcadores</p></div>`;
    } else {
        els.markersList.innerHTML = state.markers.map(m => `
            <div class="bg-white rounded-[2.5rem] p-6 shadow-sm border border-zinc-200" style="border-left-color: ${m.color}; border-left-width: 12px">
                <div class="flex justify-between items-start">
                    <div onclick="scrollToPage(${m.page})" class="cursor-pointer flex-1">
                        <p class="font-black text-zinc-900 text-xl leading-tight">${m.name}</p>
                        <p class="text-sm font-black text-blue-600 mt-2 uppercase tracking-tighter">Página ${m.page}</p>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="openMarkerModal(${m.id})" class="p-3 bg-zinc-50 rounded-2xl text-zinc-400"><i data-lucide="edit-2" class="w-5 h-5"></i></button>
                        <button onclick="deleteMarker(${m.id})" class="p-3 bg-zinc-50 rounded-2xl text-red-500"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                    </div>
                </div>
                ${renderAnnotations(m.annotations)}
                <div class="mt-8 pt-6 border-t border-zinc-100 flex justify-between items-center">
                    <span class="text-xs font-black text-zinc-400 flex items-center gap-2"><i data-lucide="message-square" class="w-4 h-4"></i> ${m.annotations.length} NOTAS</span>
                    <button onclick="openAnnotationModal(${m.id})" class="text-xs font-black bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg active:scale-95 transition-transform">+ NOTA</button>
                </div>
            </div>
        `).join('');
    }
    lucide.createIcons();
}

function renderAnnotations(anns) {
    if (!anns.length) return '';
    return `<div class="mt-6 space-y-3">${anns.map(a => `<div class="bg-zinc-50 p-5 rounded-3xl border border-zinc-100"><p class="font-black text-zinc-800 text-base">${a.title}</p><p class="text-zinc-600 mt-3 text-sm leading-relaxed">${a.description}</p></div>`).join('')}</div>`;
}

window.deleteMarker = function (id) {
    state.markers = state.markers.filter(m => m.id !== id);
    renderMarkersList();
};

window.scrollToPage = function (p) {
    const el = document.getElementById(`page-${p}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toggleSidebar('markers', false);
    toggleSidebar('pages', false);
};

window.openAnnotationModal = function (markerId) {
    state.targetMarkerIdForAnnotation = markerId;
    state.tempAnnData = { title: '', description: '' };
    els.inputAnnTitle.value = '';
    els.inputAnnDesc.value = '';
    els.modalAnnotation.classList.remove('hidden');
    syncUI();
};

function closeAnnotationModal() {
    els.modalAnnotation.classList.add('hidden');
}

function saveAnnotation() {
    state.markers = state.markers.map(m => {
        if (m.id === state.targetMarkerIdForAnnotation) {
            return { ...m, annotations: [...m.annotations, { id: Date.now(), ...state.tempAnnData }] };
        }
        return m;
    });
    closeAnnotationModal();
    renderMarkersList();
}

async function renderThumbnails() {
    if (!state.pdfDoc) return;
    els.thumbnailsList.innerHTML = '';

    for (let i = 1; i <= state.numPages; i++) {
        const pageMarkers = state.markers.filter(m => m.page === i);
        const firstMarker = pageMarkers[0];
        const isActive = state.pageNum === i;

        const container = document.createElement('div');
        container.onclick = () => scrollToPage(i);
        container.className = `relative rounded-[2.5rem] p-3 border-8 transition-all active:scale-95 ${isActive ? 'border-blue-600 bg-white shadow-2xl' : 'border-transparent'}`;

        const inner = document.createElement('div');
        inner.className = "aspect-[3/4] bg-zinc-200 rounded-[2rem] flex items-center justify-center relative overflow-hidden shadow-inner";
        if (firstMarker) inner.style.border = `8px solid ${firstMarker.color}`;

        const canvas = document.createElement('canvas');
        canvas.className = "w-full h-auto rounded-xl shadow-inner";
        inner.appendChild(canvas);

        const overlay = document.createElement('div');
        overlay.className = "absolute inset-0 flex items-center justify-center bg-black/10";
        overlay.innerHTML = `<span class="text-white font-black text-4xl drop-shadow-md">${i}</span>`;
        inner.appendChild(overlay);

        if (firstMarker) {
            const badge = document.createElement('div');
            badge.className = "absolute top-4 right-4";
            badge.innerHTML = `<div class="bg-white rounded-full px-5 py-2 text-sm font-black shadow-2xl flex items-center gap-2" style="color: ${firstMarker.color}">${pageMarkers.length} <i data-lucide="bookmark" class="w-3 h-3 fill-current"></i></div>`;
            inner.appendChild(badge);
        }

        const label = document.createElement('div');
        label.className = "mt-4 text-center text-sm font-black text-zinc-900 uppercase tracking-widest";
        label.innerText = `PÁGINA ${i}`;

        container.appendChild(inner);
        container.appendChild(label);
        els.thumbnailsList.appendChild(container);

        const page = await state.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
    }
    lucide.createIcons();
}

// Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
