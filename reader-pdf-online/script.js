const PDF_URL = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2ccae/web/compressed.tracemonkey-pldi-09.pdf';

const state = {
    pdfDoc: null,
    pageNum: 1,
    numPages: 0,
    zoom: 1.0,
    minZoom: 0.1,
    maxZoom: 10.0,
    markers: [],
    isMarkersOpen: false,
    isPagesOpen: false,
    editingMarkerId: null,
    targetMarkerIdForAnnotation: null,
    tempMarkerData: { name: '', color: '#2563eb' },
    tempAnnData: { title: '', description: '' },
    isRendering: false
};

const colors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0f172a'];

// Zoom & Pan Logic State
let isZooming = false;
let startDist = 0;
let startZoom = 1;

// Pan tracking
let panStart = { x: 0, y: 0 };
let currentPan = { x: 0, y: 0 };
let pinchStartOrigin = { x: 0, y: 0 }; // Store the origin relative to content

// Double Tap State
let lastTapTime = 0;

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
    backdrop: document.getElementById('backdrop')
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

    // Zoom / Pinch Events
    els.pdfViewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    els.pdfViewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    els.pdfViewport.addEventListener('touchend', handleTouchEnd);
    els.pdfViewport.addEventListener('touchcancel', handleTouchEnd);

    // Double Click for Desktop / fallback
    els.pdfViewport.addEventListener('dblclick', handleDoubleClick);

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

        // Wait for next frame to ensure layout is computed
        requestAnimationFrame(async () => {
            const viewportWidth = els.pdfViewport.getBoundingClientRect().width;

            // Desktop A4 Logic: Fixed 900px width
            if (viewportWidth > 1024) {
                state.zoom = 900 / viewportWidth;
            } else {
                state.zoom = 1.0;
            }

            // Apply immediately
            els.pdfContent.style.width = `${state.zoom * 100}%`;

            await renderAllPages();
            setupIntersectionObserver();
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
        setTimeout(() => els.readingView.classList.remove('opacity-0'), 50);
    }, 300);
}

function closeReader() {
    els.readingView.classList.add('opacity-0');
    setTimeout(() => {
        els.readingView.classList.add('hidden');
        els.landingView.classList.remove('hidden');
        setTimeout(() => els.landingView.classList.remove('opacity-0'), 50);
        els.btnOpenReader.innerText = "Abrir Modo Leitura";
        els.pagesContainer.innerHTML = '';
        els.thumbnailsList.innerHTML = '';
        state.markers = [];
        state.zoom = 1.0;
        els.pdfContent.style.width = '100%';
        els.pdfContent.style.transform = '';
        renderMarkersList();
    }, 300);
}

async function renderAllPages() {
    els.pagesContainer.innerHTML = '';
    for (let i = 1; i <= state.numPages; i++) {
        const wrapper = document.createElement('div');
        wrapper.id = `page-${i}`;
        // min-height placeholder to prevent jumpiness, adjust as needed
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

    // STRATEGY: Render ONLY ONCE at HIGH RESOLUTION (Scale 3.0 = ~2k/4k quality)
    // We do NOT re-render on zoom. We let the browser scale this high-quality image.
    const FIXED_HIGH_QUALITY_SCALE = 3.0; // Sharp up to 300% zoom

    const page = await state.pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: FIXED_HIGH_QUALITY_SCALE });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
}

// NO reRenderContent needed anymore!
// NO "flicker" possible because we never clear the canvas after load!

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

/**
 * Updates the 'real' zoom level (width) and adjusts scroll position.
 */
function updateZoom(newZoom, centerPoint = null, contentOffset = { x: 0, y: 0 }) {
    const oldZoom = state.zoom;
    state.zoom = Math.max(state.minZoom, Math.min(state.maxZoom, newZoom));

    if (Math.abs(oldZoom - state.zoom) < 0.001) return;

    const scaleRatio = state.zoom / oldZoom;
    const currentScrollLeft = els.pdfViewport.scrollLeft;
    const currentScrollTop = els.pdfViewport.scrollTop;

    // 1. Commit New Width (Browser scales high-res canvas efficiently)
    els.pdfContent.style.width = `${state.zoom * 100}%`;

    // 2. Adjust Scroll to keep focus
    if (centerPoint) {
        // centerPoint is the COORDINATE ON THE PAGE CONTENT that should stay under the given visual point.
        // Wait, the previous logic passed "Finger Screen Pos" as centerPoint.
        // But with the new geometric fix, we are passing {x: pointX, y: pointY} as centerPoint (Page Coords)
        // and "Finger Screen Pos" as the SECOND argument?? No.

        // Let's look at how handleTouchEnd calls it:
        // updateZoom(targetZoom, { x: pointX, y: pointY }, { clientX: fingerScreenX, clientY: fingerScreenY });
        // So centerPoint is NOT null. It is {x, y} on OLD content logic? No, on CONTENT.

        // Let's redefine updateZoom signature to be clear:
        // updateZoom(newZoom, fixedPointOnContent, fixedPointOnScreen)

        // centerPoint = {x, y} coordinate relative to Top-Left of content element (unscaled logic)
        // contentOffset = {clientX, clientY} coordinate on screen where we want centerPoint to end up.

        const fixedPointOnContent = centerPoint;
        const fixedPointOnScreen = contentOffset; // Renamed for clarity inside

        const viewportRect = els.pdfViewport.getBoundingClientRect();

        // Calculate where the content top-left should be relative to screen
        // ScreenPos = ContentPos_New + LayoutOffset
        // ScreenPos = (FixedPointOnContent * NewScaleMultiplier) + (Viewport_Left - NewScrollLeft) (?)

        // Wait, state.zoom is the scale factor relative to "100% container".
        // But our "PointOnContent" was calculated based on current element dimensions.

        // With simpler math:
        // New distance of point from top-left of content:
        const newPointDistX = fixedPointOnContent.x * scaleRatio;
        const newPointDistY = fixedPointOnContent.y * scaleRatio;

        // We want this point to be at fixedPointOnScreen.clientX
        // So:
        // fixedPointOnScreen.clientX = (Viewport.left - NewScrollLeft) + newPointDistX
        // NewScrollLeft = Viewport.left + newPointDistX - fixedPointOnScreen.clientX

        // But wait, Viewport.left is screen coordinate of viewport left edge.
        // ScrollLeft is positive.
        // Content Left Edge on Screen = Viewport.left - ScrollLeft.

        const contentLeftOnScreen = fixedPointOnScreen.clientX - newPointDistX;
        const contentTopOnScreen = fixedPointOnScreen.clientY - newPointDistY;

        // Viewport.left - NewScrollLeft = contentLeftOnScreen
        // NewScrollLeft = Viewport.left - contentLeftOnScreen

        const newScrollLeft = viewportRect.left - contentLeftOnScreen;
        const newScrollTop = viewportRect.top - contentTopOnScreen;

        els.pdfViewport.scrollLeft = newScrollLeft;
        els.pdfViewport.scrollTop = newScrollTop;

    } else {
        // Center Zoom (Buttons)
        const rect = els.pdfViewport.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const contentX = centerX + currentScrollLeft;
        const contentY = centerY + currentScrollTop;

        els.pdfViewport.scrollLeft = (contentX * scaleRatio) - centerX;
        els.pdfViewport.scrollTop = (contentY * scaleRatio) - centerY;
    }
}

// --- TOUCH HANDLING (PAN + ZOOM + DOUBLE TAP) ---

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        isZooming = true;

        const t1 = e.touches[0];
        const t2 = e.touches[1];

        startDist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
        startZoom = state.zoom;

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        panStart = { x: midX, y: midY }; // Screen coordinates of centroid start
        currentPan = { x: 0, y: 0 };

        const rect = els.pdfContent.getBoundingClientRect();
        // Origin relative to the content element
        const originX = midX - rect.left;
        const originY = midY - rect.top;

        pinchStartOrigin = { x: originX, y: originY };

        els.pdfContent.style.transformOrigin = `${originX}px ${originY}px`;
        els.pdfContent.style.transition = 'none';
    } else if (e.touches.length === 1) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
            handleDoubleTap(e.touches[0].clientX, e.touches[0].clientY);
        }
        lastTapTime = currentTime;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 2 && isZooming) {
        e.preventDefault();

        const t1 = e.touches[0];
        const t2 = e.touches[1];

        const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
        if (startDist <= 0) return;
        const scale = dist / startDist;

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        // Current Pan: Difference between current centroid and start centroid
        const panX = midX - panStart.x;
        const panY = midY - panStart.y;
        currentPan = { x: panX, y: panY };

        els.pdfContent.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }
}

function handleTouchEnd(e) {
    if (isZooming && e.touches.length < 2) {
        isZooming = false;

        const transform = els.pdfContent.style.transform;
        const scaleMatch = transform.match(/scale\((.+)\)/);
        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

        els.pdfContent.style.transform = '';
        els.pdfContent.style.transformOrigin = '0 0';

        const targetZoom = startZoom * scale;

        // --- GEOMETRIC CORRECTION ---
        // Goal: Find the point on the CONTENT that is currently under the finger centroid.
        // We know:
        // 1. Transform Origin (pinchStartOrigin) relative to Content TL.
        // 2. Translation (currentPan).
        // 3. Scale (scale).
        // 4. Current Finger Position on Screen (panStart + currentPan).

        // Formula to map Screen Coordinate S back to Element Coordinate P (relative to Top-Left):
        // P = ((S - TL_Screen - Translate - Origin_Screen_Offset) / Scale) + Origin_Element_Offset ??

        // Simpler:
        // The point P_original (pinchStartOrigin) has moved to P_new on screen.
        // P_new_screen = (VP_Left - ScrollLeft) + pinchStartOrigin + currentPan (Translation)
        // Wait, scale happens around pinchStartOrigin. So pinchStartOrigin stays "fixed" relative to translation frame?
        // Yes, the point 'pinchStartOrigin' on the content ends up at:
        // ScreenPos(Origin) = (Content_TL_Screen + pinchStartOrigin) + currentPan.
        // (Because scale doesn't move the origin point).

        // But the user might not be centering their pinch on the origin anymore (fingers moved).
        // The finger centroid is at: panStart + currentPan.

        // We need the Content Point (X,Y) corresponding to the Finger Centroid.
        // Vector from Origin to Finger (Screen Space):
        // V_screen = Finger_Screen - ScreenPos(Origin)
        // V_screen = (panStart + currentPan) - (Content_TL_Screen + pinchStartOrigin + currentPan)
        // V_screen = panStart - (Content_TL_Screen + pinchStartOrigin)

        // In Element Space (scaled), this vector is V_element_scaled = V_screen.
        // In Unscaled Element Space, V_element = V_screen / scale.

        // So: Point_Under_Finger = pinchStartOrigin + (V_screen / scale).

        const viewportRect = els.pdfViewport.getBoundingClientRect();
        const contentTLScreenX = viewportRect.left - els.pdfViewport.scrollLeft;
        const contentTLScreenY = viewportRect.top - els.pdfViewport.scrollTop;

        const originScreenX = contentTLScreenX + pinchStartOrigin.x + currentPan.x;
        const originScreenY = contentTLScreenY + pinchStartOrigin.y + currentPan.y;

        const fingerScreenX = panStart.x + currentPan.x;
        const fingerScreenY = panStart.y + currentPan.y;

        const vectorX = fingerScreenX - originScreenX;
        const vectorY = fingerScreenY - originScreenY;

        const pointOnContentX = pinchStartOrigin.x + (vectorX / scale);
        const pointOnContentY = pinchStartOrigin.y + (vectorY / scale);

        // Now update zoom, telling it that 'pointOnContent' MUST end up at 'fingerScreen'
        updateZoom(targetZoom,
            { x: pointOnContentX, y: pointOnContentY },
            { clientX: fingerScreenX, clientY: fingerScreenY }
        );
    }
}

function handleDoubleClick(e) {
    handleDoubleTap(e.clientX, e.clientY);
}

function handleDoubleTap(clientX, clientY) {
    // If we double tap, we want the point under the cursor to become the new center/focus?
    // Current simple logic:
    if (state.zoom > 1.25) {
        // Return to A4/Fit
        const viewportWidth = els.pdfViewport.getBoundingClientRect().width;
        const target = viewportWidth > 1024 ? (900 / viewportWidth) : 1.0;
        updateZoom(target);
    } else {
        // Zoom in to 2.5x.
        // Ideally we want the tapped point to stay under the tap (or center screen).
        // For now, simple scaling relative to viewport center is often safer unless accurate 'centerPoint' is passed.
        // Let's pass the click point so it zooms INTO that point.

        // Point on content currently under click:
        const viewportRect = els.pdfViewport.getBoundingClientRect();
        const contentTLScreenX = viewportRect.left - els.pdfViewport.scrollLeft;
        const contentTLScreenY = viewportRect.top - els.pdfViewport.scrollTop;

        const pointX = clientX - contentTLScreenX;
        const pointY = clientY - contentTLScreenY;

        // But wait, pointX is in scaled coords if zoom > 1?
        // No, current logic assumes updateZoom takes "Unscaled relative to current element".
        // Actually updateZoom logic: "newPointDistX = fixedPointOnContent.x * scaleRatio"
        // fixedPointOnContent.x is "Distance from Left in OLD ZOOM units".
        // Yes, pointX is exactly that.

        updateZoom(2.5, { x: pointX, y: pointY }, { clientX: clientX, clientY: clientY });
    }
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
}

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
    if (state.isPagesOpen) renderThumbnails();
}

function renderMarkersList() {
    if (state.markers.length === 0) {
        els.markersList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-zinc-300 opacity-60">
                <i data-lucide="bookmark" class="w-16 h-16 mb-4 stroke-1"></i>
                <p class="font-bold text-lg">Sem marcadores</p>
            </div>`;
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
                    <span class="text-xs font-black text-zinc-400 flex items-center gap-2">
                        <i data-lucide="message-square" class="w-4 h-4"></i> ${m.annotations.length} NOTAS
                    </span>
                    <button onclick="openAnnotationModal(${m.id})" class="text-xs font-black bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
                        + NOTA
                    </button>
                </div>
            </div>
        `).join('');
    }
    lucide.createIcons();
}

function renderAnnotations(anns) {
    if (!anns.length) return '';
    return `<div class="mt-6 space-y-3">
        ${anns.map(a => `
            <div class="bg-zinc-50 p-5 rounded-3xl border border-zinc-100">
                <p class="font-black text-zinc-800 text-base">${a.title}</p>
                <p class="text-zinc-600 mt-3 text-sm leading-relaxed">${a.description}</p>
            </div>
        `).join('')}
    </div>`;
}

window.deleteMarker = function (id) {
    state.markers = state.markers.filter(m => m.id !== id);
    renderMarkersList();
    if (state.isPagesOpen) renderThumbnails();
};

window.scrollToPage = function (p) {
    document.getElementById(`page-${p}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    toggleSidebar('markers', false);
    toggleSidebar('pages', false);
};

window.openAnnotationModal = function (markerId) {
    state.targetMarkerIdForAnnotation = markerId;
    state.tempAnnData = { title: '', description: '' };
    els.inputAnnTitle.value = '';
    els.inputAnnDesc.value = '';
    els.modalAnnotation.classList.remove('hidden');
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
            badge.innerHTML = `
                <div class="bg-white rounded-full px-5 py-2 text-sm font-black shadow-2xl flex items-center gap-2" style="color: ${firstMarker.color}">
                    ${pageMarkers.length} <i data-lucide="bookmark" class="w-3 h-3 fill-current"></i>
                </div>`;
            inner.appendChild(badge);
        }

        const label = document.createElement('div');
        label.className = "mt-4 text-center text-sm font-black text-zinc-900 uppercase tracking-widest";
        label.innerText = `PÁGINA ${i}`;

        container.appendChild(inner);
        container.appendChild(label);
        els.thumbnailsList.appendChild(container);

        const page = await state.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
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
