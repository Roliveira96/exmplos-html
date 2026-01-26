(function ($) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
    const pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
    const scale = 1.5;

    const viewerArea = $('#viewer-area');
    const loadingMessage = $('#loading-message');
    const pageInfo = $('#page-info');

    let flipbook = null;
    let isFlipbookInitialized = false;
    let pdfDoc = null;
    let modalZoomLevel = 1.5;
    let bookmarks = [];
    let currentNotesBookmarkIndex = null;
    let pageToAddBookmark = null;

    const colors = {
        red: { bg: 'bg-red-400' },
        blue: { bg: 'bg-blue-400' },
        green: { bg: 'bg-green-400' },
        yellow: { bg: 'bg-yellow-400' },
        purple: { bg: 'bg-purple-400' }
    };

    function createFlipbookDOM() {
        const flipbookContainer = $('<div id="flipbook-container" class="w-full h-full"></div>');
        flipbook = $('<div id="flipbook"></div>');
        flipbookContainer.append(flipbook);
        viewerArea.prepend(flipbookContainer);
        return flipbook;
    }

    function initializeTurnJsWhenReady() {
        try {
            const display = $(window).width() < 1024 ? 'single' : 'double';
            flipbook.turn({
                display: display,
                width: viewerArea.width(),
                height: viewerArea.height(),
                autoCenter: true,
                elevation: 50,
                gradients: true,
                when: { turned: (event, page, view) => onPageTurn(view) }
            });
            isFlipbookInitialized = true;
            onPageTurn(flipbook.turn('view'));
            loadBookmarks();
            adjustAsideHeight();
        } catch (e) {
            showAlert("Ocorreu um erro grave ao exibir o livro.");
        }
    }

    async function loadPdfAndInitFlipbook() {
        try {
            pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
            const numPages = pdfDoc.numPages;
            flipbook = createFlipbookDOM();

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const pageElement = $('<div>').addClass('page').append(canvas);
                pageElement.data('pageNum', pageNum);
                flipbook.append(pageElement);
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            }

            if (numPages % 2 !== 0) {
                flipbook.append($('<div>').addClass('page'));
            }

            loadingMessage.hide();
            $('#flipbook-container, #pdf-controls, #bookmarks-section').show();
            initializeTurnJsWhenReady();

        } catch (error) {
            loadingMessage.text('Falha ao carregar o PDF.');
        }
    }

    function onPageTurn(view) {
        if (!isFlipbookInitialized) return;
        const currentPage = flipbook.turn('page');
        const totalPages = pdfDoc.numPages;
        pageInfo.text(`Página ${currentPage} de ${totalPages}`);
        updateRibbon(view);
    }

    $(window).on('resize', () => {
        if (isFlipbookInitialized && flipbook && flipbook.is(':visible')) {
            const newDisplay = $(window).width() < 1024 ? 'single' : 'double';
            if (flipbook.turn('display') !== newDisplay) {
                flipbook.turn('display', newDisplay);
            }
            flipbook.turn('size', viewerArea.width(), viewerArea.height());
        }
        adjustAsideHeight();
    });

    viewerArea.on('click', '.ribbon-marker', function () {
        const bookmarkIndex = $(this).data('bookmark-index');
        if (bookmarkIndex !== undefined && bookmarkIndex !== null) {
            openNotesModal(bookmarkIndex);
        }
    });

    $('#prev-page').on('click', () => flipbook.turn('previous'));
    $('#next-page').on('click', () => flipbook.turn('next'));

    let isPointerDown = false;
    let isDraggingPage = false;
    let startPageX = 0;
    const dragThreshold = 10;
    const turnPageThreshold = 50;

    function pointerDown(e) {
        if (e.type === 'mousedown' && e.which !== 1) return;
        isPointerDown = true;
        startPageX = e.type === 'touchstart' ? e.originalEvent.touches[0].pageX : e.pageX;
        isDraggingPage = false;
    }

    function pointerMove(e) {
        if (!isPointerDown) return;
        const currentPageX = e.type === 'touchmove' ? e.originalEvent.touches[0].pageX : e.pageX;
        if (!isDraggingPage && Math.abs(currentPageX - startPageX) > dragThreshold) {
            isDraggingPage = true;
            if (e.type === 'mousemove') {
                $('#flipbook').css('cursor', 'grabbing');
                $('body').css({ 'user-select': 'none' });
            }
        }
        if (isDraggingPage) {
            e.preventDefault();
        }
    }

    function pointerUp(e) {
        if (!isPointerDown) return;
        if (isDraggingPage) {
            const endPageX = e.type === 'touchend' ? e.originalEvent.changedTouches[0].pageX : e.pageX;
            const deltaX = endPageX - startPageX;
            if (Math.abs(deltaX) > turnPageThreshold) {
                if (deltaX < 0) {
                    flipbook.turn('next');
                } else {
                    flipbook.turn('previous');
                }
            }
        }
        isPointerDown = false;
        isDraggingPage = false;
        $('#flipbook').css('cursor', '');
        $('body').css({ 'user-select': '' });
    }

    viewerArea.on('mousedown touchstart', '#flipbook .page', pointerDown);
    $(document).on('mousemove touchmove', pointerMove);
    $(document).on('mouseup touchend', pointerUp);

    const addBookmarkRibbon = $('#add-bookmark-ribbon');
    let hoveredPageNum = null;

    viewerArea.on('mousemove', '#flipbook .page', function (e) {
        const pageElement = $(this);
        const pageNum = pageElement.data('pageNum');
        if (!pageNum) return;
        const yPos = e.pageY - pageElement.offset().top;
        const topThreshold = 40;
        if (yPos > 0 && yPos < topThreshold) {
            hoveredPageNum = pageNum;
            const display = flipbook.turn('display');
            let positionLeft = (display === 'double' && pageNum > 1 && pageNum < pdfDoc.numPages)
                ? (pageNum % 2 === 0 ? '25%' : '75%')
                : '50%';
            addBookmarkRibbon.css('left', positionLeft).removeClass('hidden');
        } else {
            if (hoveredPageNum === pageNum) {
                addBookmarkRibbon.addClass('hidden');
            }
        }
    });

    viewerArea.on('mouseleave', '#flipbook-container', () => addBookmarkRibbon.addClass('hidden'));

    addBookmarkRibbon.on('click', function () {
        if (hoveredPageNum) {
            pageToAddBookmark = hoveredPageNum;
            openBookmarkModal();
            addBookmarkRibbon.addClass('hidden');
        }
    });

    const bookmarksSection = $('#bookmarks-section');
    const bookmarksBackdrop = $('#bookmarks-backdrop');

    function openMobileBookmarks() {
        bookmarksBackdrop.removeClass('hidden');
        bookmarksSection.removeClass('translate-x-full');
    }

    function closeMobileBookmarks() {
        bookmarksBackdrop.addClass('hidden');
        bookmarksSection.addClass('translate-x-full');
    }

    $('#toggle-bookmarks-btn').on('click', openMobileBookmarks);
    $('#close-bookmarks-btn').on('click', closeMobileBookmarks);
    bookmarksBackdrop.on('click', closeMobileBookmarks);

    $('#add-bookmark-modal').on('click', '.page-option', function () {
        const selectedPage = $(this).data('page');
        pageToAddBookmark = selectedPage;
        $('.page-option').removeClass('bg-blue-600 text-white border-blue-600').addClass('border-gray-300 text-gray-800');
        $(this).addClass('bg-blue-600 text-white border-blue-600').removeClass('border-gray-300 text-gray-800');
    });

    let zoomViewContainer = null;
    let zoomContent = null;

    function updateRibbon(view) {
        const ribbonContainer = $('#ribbon-container');
        ribbonContainer.empty();
        const bookmarksByPage = {};
        bookmarks.forEach((bm, index) => {
            if (view.includes(bm.page)) {
                if (!bookmarksByPage[bm.page]) {
                    bookmarksByPage[bm.page] = [];
                }
                bookmarksByPage[bm.page].push({ bookmark: bm, index: index });
            }
        });
        const display = flipbook.turn('display');
        for (const pageNumStr in bookmarksByPage) {
            const pageNum = parseInt(pageNumStr);
            const pageBookmarksData = bookmarksByPage[pageNum];
            let basePosition = (display === 'double' && pageNum > 1 && pageNum < pdfDoc.numPages)
                ? (pageNum % 2 === 0 ? 25 : 75)
                : 50;
            const totalRibbonsOnPage = pageBookmarksData.length;
            const offsetStep = 2.5;
            pageBookmarksData.forEach((data, i) => {
                const offset = (i - (totalRibbonsOnPage - 1) / 2) * offsetStep;
                const finalPosition = basePosition + offset;
                const ribbonEl = $('<div class="ribbon-marker"></div>');
                ribbonEl.addClass(colors[data.bookmark.color].bg);
                ribbonEl.css('left', `${finalPosition}%`);
                ribbonEl.attr('title', data.bookmark.title);
                ribbonEl.data('bookmark-index', data.index);
                ribbonContainer.append(ribbonEl);
            });
        }
    }

    function renderBookmarks() {
        const list = $('#bookmarks-list');
        list.empty();
        if (bookmarks.length === 0) {
            list.html('<p class="text-gray-500 text-center">Nenhum marcador.</p>');
            return;
        }
        bookmarks.forEach((bm, index) => {
            const notesIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>`;
            const notesCount = bm.notes ? bm.notes.length : 0;
            const el = $(`
                <div class="bookmark-item flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100" data-page="${bm.page}">
                    <div class="flex items-center gap-3">
                        <span class="w-4 h-4 rounded-full ${colors[bm.color].bg}"></span>
                        <div class="flex-grow">
                            <p class="font-semibold text-gray-700">${bm.title}</p>
                            <p class="text-sm text-gray-500">Página ${bm.page}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="view-notes-btn p-1 flex items-center gap-1" data-index="${index}" title="Ver/Adicionar Anotações">
                            ${notesIcon}
                            <span class="text-xs font-bold text-gray-600">${notesCount}</span>
                        </button>
                        <button class="delete-bookmark-btn text-xl text-red-500 hover:text-red-700" data-index="${index}">&times;</button>
                    </div>
                </div>
            `);
            list.append(el);
        });
        if (flipbook) updateRibbon(flipbook.turn('view'));
    }

    function saveBookmarks() {
        localStorage.setItem('pdf_bookmarks', JSON.stringify(bookmarks));
        renderBookmarks();
    }

    function loadBookmarks() {
        const stored = localStorage.getItem('pdf_bookmarks');
        bookmarks = stored ? JSON.parse(stored) : [];
        renderBookmarks();
    }

    const bookmarkModal = $('#add-bookmark-modal');
    let selectedColor = 'red';

    $('#add-bookmark-btn').on('click', () => {
        pageToAddBookmark = flipbook.turn('page');
        openBookmarkModal();
    });

    function openBookmarkModal() {
        $('#bookmark-title-input').val('');
        selectedColor = 'red';
        $('.color-box').removeClass('ring-2 ring-offset-2 ring-blue-500').addClass('border-transparent');
        $('.color-box[data-color="red"]').addClass('ring-2 ring-offset-2 ring-blue-500');
        bookmarkModal.removeClass('hidden').addClass('flex');
        const pageSelectionContainer = $('#bookmark-page-selection');
        const view = flipbook.turn('view');
        if ($(window).width() >= 1024 && view.length === 2 && view[0] !== 0 && view[1] !== 0) {
            pageSelectionContainer.removeClass('hidden');
            const pageOptions = pageSelectionContainer.find('.page-option');
            $(pageOptions[0]).text(`Pág. ${view[0]}`).data('page', view[0]);
            $(pageOptions[1]).text(`Pág. ${view[1]}`).data('page', view[1]);
            pageToAddBookmark = view[0];
            $(pageOptions[0]).addClass('bg-blue-600 text-white border-blue-600').removeClass('border-gray-300 text-gray-800');
            $(pageOptions[1]).removeClass('bg-blue-600 text-white border-blue-600').addClass('border-gray-300 text-gray-800');
        } else {
            pageSelectionContainer.addClass('hidden');
        }
    }

    $('#cancel-bookmark-btn').on('click', () => bookmarkModal.addClass('hidden').removeClass('flex'));

    $('#bookmark-color-options').on('click', '.color-box', function () {
        selectedColor = $(this).data('color');
        $('.color-box').removeClass('ring-2 ring-offset-2 ring-blue-500');
        $(this).addClass('ring-2 ring-offset-2 ring-blue-500');
    });

    $('#save-bookmark-btn').on('click', () => {
        const title = $('#bookmark-title-input').val().trim();
        if (!title) { showAlert('Por favor, insira um título.'); return; }
        const newBookmark = {
            title: title,
            page: pageToAddBookmark,
            color: selectedColor,
            notes: []
        };
        bookmarks.push(newBookmark);
        saveBookmarks();
        bookmarkModal.addClass('hidden').removeClass('flex');
    });

    function animateTurnToPage(targetPage) {
        if (!flipbook) return;
        const flip = () => {
            const current = flipbook.turn('page');
            if (current == targetPage) return;
            const distance = Math.abs(targetPage - current);
            const direction = targetPage > current ? 1 : -1;
            let nextPage = (distance > 10) ? current + 10 * direction : current + 1 * direction;
            nextPage = direction > 0 ? Math.min(nextPage, targetPage) : Math.max(nextPage, targetPage);
            flipbook.turn('page', nextPage);
            if (nextPage != targetPage) {
                setTimeout(flip, 150);
            }
        };
        flip();
    }

    $('#bookmarks-list').on('click', '.bookmark-item', function () {
        animateTurnToPage($(this).data('page'));
        if ($(window).width() < 1024) {
            closeMobileBookmarks();
        }
    });

    $('#bookmarks-list').on('click', '.delete-bookmark-btn', function (e) {
        e.stopPropagation();
        const index = $(this).data('index');
        showConfirm('Tem certeza que deseja excluir este marcador?', (confirmed) => {
            if (confirmed) {
                bookmarks.splice(index, 1);
                saveBookmarks();
            }
        });
    });

    function openNotesModal(index) {
        currentNotesBookmarkIndex = index;
        const bookmark = bookmarks[index];
        $('#notes-modal-title').text(`Anotações para: "${bookmark.title}"`);
        renderNotesInModal();
        $('#notes-modal').removeClass('hidden').addClass('flex');
    }

    function renderNotesInModal() {
        const listContainer = $('#notes-list-container');
        listContainer.empty();
        const bookmark = bookmarks[currentNotesBookmarkIndex];
        if (!bookmark.notes || bookmark.notes.length === 0) {
            listContainer.html('<p class="text-gray-500 text-center">Nenhuma anotação ainda.</p>');
            return;
        }
        bookmark.notes.forEach((note, index) => {
            const noteEl = $(`
                <div class="note-item bg-gray-100 p-2 rounded-md flex justify-between items-start">
                    <p class="text-gray-800 whitespace-pre-wrap flex-grow">${note}</p>
                    <button class="delete-note-btn text-red-500 hover:text-red-700 ml-2 flex-shrink-0" data-note-index="${index}">&times;</button>
                </div>
            `);
            listContainer.append(noteEl);
        });
    }

    $('#save-note-btn').on('click', () => {
        const noteInput = $('#note-input');
        const noteText = noteInput.val().trim();
        if (noteText && currentNotesBookmarkIndex !== null) {
            if (!bookmarks[currentNotesBookmarkIndex].notes) {
                bookmarks[currentNotesBookmarkIndex].notes = [];
            }
            bookmarks[currentNotesBookmarkIndex].notes.push(noteText);
            saveBookmarks();
            renderNotesInModal();
            noteInput.val('');
        }
    });

    $('#notes-list-container').on('click', '.delete-note-btn', function () {
        const noteIndex = $(this).data('note-index');
        if (currentNotesBookmarkIndex !== null) {
            bookmarks[currentNotesBookmarkIndex].notes.splice(noteIndex, 1);
            saveBookmarks();
            renderNotesInModal();
        }
    });

    $('#close-notes-btn').on('click', () => {
        $('#notes-modal').addClass('hidden').removeClass('flex');
        currentNotesBookmarkIndex = null;
    });

    $('#bookmarks-list').on('click', '.view-notes-btn', function (e) {
        e.stopPropagation();
        const index = $(this).data('index');
        openNotesModal(index);
    });

    function showConfirm(message, callback) {
        $('#confirm-message').text(message);
        $('#confirm-modal').removeClass('hidden').addClass('flex');
        $('#confirm-btn-yes').off().on('click', () => {
            $('#confirm-modal').addClass('hidden').removeClass('flex');
            callback(true);
        });
        $('#confirm-btn-no').off().on('click', () => {
            $('#confirm-modal').addClass('hidden').removeClass('flex');
            callback(false);
        });
    }

    function showAlert(message) {
        $('#alert-message').text(message);
        $('#alert-modal').removeClass('hidden').addClass('flex');
    }

    $('#alert-btn-ok').on('click', () => {
        $('#alert-modal').addClass('hidden').removeClass('flex');
    });
    
    $(window).on('load', loadPdfAndInitFlipbook);
    
    function createZoomViewDOM() {
        const zoomViewHTML = `
            <div id="zoom-view-container" class="relative" style="display:none;">
                <div id="zoom-content"></div>
                <div class="absolute top-2 right-2 flex items-center space-x-2 z-10">
                    <button id="zoom-out-modal" class="bg-white text-gray-800 rounded-full py-1 px-3 text-2xl shadow-lg hover:bg-gray-200">-</button>
                    <button id="zoom-in-modal" class="bg-white text-gray-800 rounded-full py-1 px-3 text-2xl shadow-lg hover:bg-gray-200">+</button>
                    <button id="close-zoom" class="bg-white text-gray-800 rounded-full py-1 px-3 text-2xl shadow-lg hover:bg-gray-200">&times;</button>
                </div>
            </div>`;
        const zoomViewElement = $(zoomViewHTML);
        viewerArea.append(zoomViewElement);
        return zoomViewElement;
    }

    async function renderZoomedPages(scale, view, zoomContentElement) {
        zoomContentElement.empty();
        loadingMessage.text("Aplicando zoom...").show();
        try {
            const pageContainer = $('<div class="flex flex-col md:flex-row gap-2 items-start justify-start p-4"></div>');
            for (const pageNum of view) {
                if (pageNum === 0) continue;
                const pdfPage = await pdfDoc.getPage(pageNum);
                const viewport = pdfPage.getViewport({ scale: scale });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await pdfPage.render(renderContext).promise;
                pageContainer.append($('<div class="page flex-shrink-0"></div>').append(canvas));
            }
            zoomContentElement.append(pageContainer);
        } catch (error) {
            showAlert("Ocorreu um erro ao aplicar o zoom.");
        } finally {
            loadingMessage.hide().text("Carregando e renderizando as páginas do livro...");
        }
    }

    function setupPanning(zoomContentElement) {
        let isPanning = false;
        let startX, startY, scrollLeft, scrollTop;
        const getPointerEvent = (e) => {
            return e.type.startsWith('touch') ? e.originalEvent.touches[0] : e;
        };
        zoomContentElement.on("mousedown touchstart", (e) => {
            isPanning = true;
            zoomContentElement.addClass("grabbing");
            const pointer = getPointerEvent(e);
            startX = pointer.pageX - zoomContentElement.offset().left;
            startY = pointer.pageY - zoomContentElement.offset().top;
            scrollLeft = zoomContentElement.scrollLeft();
            scrollTop = zoomContentElement.scrollTop();
        });
        zoomContentElement.on("mouseup touchend mouseleave", (e) => {
            isPanning = false;
            zoomContentElement.removeClass("grabbing");
        });
        zoomContentElement.on("mousemove touchmove", (e) => {
            if (!isPanning) return;
            e.preventDefault(); 
            const pointer = getPointerEvent(e);
            const x = pointer.pageX - zoomContentElement.offset().left;
            const walkX = x - startX;
            zoomContentElement.scrollLeft(scrollLeft - walkX);
            const y = pointer.pageY - zoomContentElement.offset().top;
            const walkY = y - startY;
            zoomContentElement.scrollTop(scrollTop - walkY);
        });
    }

    $('#zoom-btn').on('click', async () => {
        modalZoomLevel = 1.5; 
        if (!flipbook) {
            return;
        }
        if (!zoomViewContainer) {
            zoomViewContainer = createZoomViewDOM();
            zoomContent = zoomViewContainer.find('#zoom-content');
            setupPanning(zoomContent);
            const zoomEvents = 'click touchend';
            zoomViewContainer.on(zoomEvents, '#zoom-in-modal', async (e) => {
                e.preventDefault();
                modalZoomLevel = Math.min(5.0, modalZoomLevel + 0.5);
                await renderZoomedPages(modalZoomLevel, flipbook.turn('view'), zoomContent);
            });
            zoomViewContainer.on(zoomEvents, '#zoom-out-modal', async (e) => {
                e.preventDefault();
                modalZoomLevel = Math.max(1.0, modalZoomLevel - 0.5);
                await renderZoomedPages(modalZoomLevel, flipbook.turn('view'), zoomContent);
            });
            zoomViewContainer.on(zoomEvents, '#close-zoom', (e) => {
                e.preventDefault();
                zoomViewContainer.hide();
                $('#flipbook-container, #pdf-controls').show();
                $(window).trigger('resize');
            });
        }
        $('#flipbook-container, #pdf-controls').hide();
        zoomViewContainer.show();
        const view = flipbook.turn('view');
        await renderZoomedPages(modalZoomLevel, view, zoomContent);
    });

    function adjustAsideHeight() {
        if ($(window).width() >= 1024) { 
            const viewerHeight = $('#viewer-area').height();
            if (viewerHeight > 0) {
                $('#bookmarks-section').css('height', viewerHeight);
            }
        } else {
            $('#bookmarks-section').css('height', ''); 
        }
    }

})(jQuery);