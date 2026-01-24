
document.addEventListener('DOMContentLoaded', function () {
    // PDF Export - Opens a preview modal with A4 layout and PDF download option
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function () {
            if (typeof html2pdf === 'undefined') {
                const icon = downloadPdfBtn.querySelector('i');
                const originalClass = icon ? icon.className : '';
                if (icon) icon.className = 'fas fa-spinner fa-spin';

                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
                script.onload = () => {
                    if (icon) icon.className = originalClass;
                    generateAndOpenModal();
                };
                document.body.appendChild(script);
            } else {
                generateAndOpenModal();
            }
        });
    }
});

function generateAndOpenModal() {
    // Determine language from DOM state since currentLang is scoped in script.js
    const isBr = document.documentElement.lang === 'pt-BR';
    const lang = isBr ? 'br' : 'en';
    const t = (pt, en) => isBr ? pt : en;

    // Check if resumeData exists (global from data.js)
    if (typeof resumeData === 'undefined') {
        alert('Erro: Dados do currículo não encontrados.');
        return;
    }

    // Colors
    const accentColor = '#2563eb';
    const darkColor = '#1e293b';
    const grayColor = '#64748b';

    // 1. Create Preview Modal Overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.overflowY = 'auto';
    overlay.id = 'pdf-preview-overlay';

    // 2. Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.padding = '15px';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '20px';
    toolbar.style.background = 'transparent'; // Clean look
    toolbar.style.position = 'sticky';
    toolbar.style.top = '0';
    toolbar.style.zIndex = '10000';

    const btnStyle = "padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 8px; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;";

    const btnDownload = document.createElement('button');
    btnDownload.innerHTML = `<i class="fas fa-download"></i> ${t('Baixar PDF', 'Download PDF')}`;
    btnDownload.style.cssText = btnStyle + "background-color: #10b981; color: white;";
    btnDownload.onmouseover = () => btnDownload.style.transform = 'translateY(-2px)';
    btnDownload.onmouseout = () => btnDownload.style.transform = 'translateY(0)';

    const btnClose = document.createElement('button');
    btnClose.innerHTML = `<i class="fas fa-times"></i> ${t('Fechar', 'Close')}`;
    btnClose.style.cssText = btnStyle + "background-color: #ef4444; color: white;";
    btnClose.onmouseover = () => btnClose.style.transform = 'translateY(-2px)';
    btnClose.onmouseout = () => btnClose.style.transform = 'translateY(0)';

    toolbar.appendChild(btnDownload);
    toolbar.appendChild(btnClose);
    overlay.appendChild(toolbar);

    // 3. Page Content Wrapper
    const pageContainer = document.createElement('div');
    pageContainer.style.margin = '0 auto 50px auto';
    pageContainer.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';

    // The actual content to turn into PDF
    const pageContent = document.createElement('div');
    pageContent.id = 'resume-to-pdf';

    // HTML Content - Refined for compact A4
    const html = `
        <style>
            .pdf-page {
                width: 210mm;
                height: auto; /* Allow auto height, but html2pdf handles pagination */
                background: white;
                padding: 12mm; /* Compact padding */
                font-family: 'Roboto', sans-serif;
                color: ${darkColor};
                box-sizing: border-box;
            }
            .pdf-header {
                display: flex; gap: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 18px;
            }
            .pdf-header img {
                    width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid ${accentColor};
            }
            .pdf-title { font-size: 24px; line-height: 1.2; margin: 0 0 4px 0; color: ${darkColor}; }
            .pdf-subtitle { font-size: 14px; color: ${accentColor}; font-weight: 500; margin: 0; }
            .pdf-contact { font-size: 11px; color: ${grayColor}; margin-top: 5px; line-height: 1.4; }
            .pdf-link { color: ${accentColor}; text-decoration: none; margin-right: 15px; font-size: 11px; }
            
            .pdf-grid { display: flex; gap: 25px; }
            .pdf-main { flex: 2; }
            .pdf-sidebar { flex: 1; }
            
            /* Section Spacing */
            .pdf-section { margin-bottom: 15px; }
            .pdf-section:last-child { margin-bottom: 0; }
            
            .pdf-section-title {
                font-size: 13px; text-transform: uppercase; color: ${darkColor};
                border-bottom: 1px solid ${accentColor}; padding-bottom: 3px; margin-bottom: 8px;
                letter-spacing: 1px; font-weight: 700;
                page-break-after: avoid;
                break-after: avoid;
            }
            
            /* Item Spacing */
            .pdf-item { margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid; }
            .pdf-item:last-child { margin-bottom: 0; }
            
            .pdf-item-title { font-weight: 700; font-size: 13px; color: ${darkColor}; display: flex; justify-content: space-between; }
            .pdf-item-subtitle { font-size: 11px; color: ${accentColor}; font-weight: 500; margin-bottom: 2px; }
            .pdf-item-desc { font-size: 11px; line-height: 1.4; color: #475569; text-align: justify; margin-bottom: 3px; }
            .pdf-list { padding-left: 15px; margin: 0; }
            .pdf-list li { font-size: 11px; color: #475569; margin-bottom: 1px; }
            
            .pdf-tag {
                display: inline-block; background: #f1f5f9; padding: 2px 7px; border-radius: 4px;
                font-size: 10px; color: #475569; border: 1px solid #e2e8f0; margin: 0 3px 3px 0;
            }
        </style>
        
        <div class="pdf-page">
            <div class="pdf-header">
                <img src="${resumeData.profile.image}" crossorigin="anonymous">
                <div style="flex: 1;">
                    <h1 class="pdf-title">${resumeData.profile.name}</h1>
                    <p class="pdf-subtitle">Software Engineer & Tech Lead</p>
                    <p class="pdf-contact">
                        ${resumeData.profile.address} <br>
                        ${resumeData.profile.contact.email.display} • ${resumeData.profile.contact.phone.display}
                    </p>
                    <div style="margin-top: 6px;">
                            <a href="${resumeData.socialLinks.find(l => l.name === 'LinkedIn').url}" class="pdf-link">LinkedIn</a>
                            <a href="${resumeData.socialLinks.find(l => l.name === 'GitHub').url}" class="pdf-link">GitHub</a>
                            <a href="${resumeData.socialLinks.find(l => l.name === 'Site').url}" class="pdf-link">Portfolio</a>
                    </div>
                </div>
            </div>
            
            <div class="pdf-grid">
                <div class="pdf-main">
                    <div class="pdf-section">
                        <h3 class="pdf-section-title">${t('Resumo', 'Summary')}</h3>
                        <p class="pdf-item-desc">${resumeData.summary[lang].replace(/<[^>]*>/g, '')}</p>
                    </div>
                    
                    <div class="pdf-section">
                        <h3 class="pdf-section-title">${t('Experiência', 'Experience')}</h3>
                        ${resumeData.experience.map(exp => `
                            <div class="pdf-item">
                                <div class="pdf-item-title">
                                    <span>${exp.role[lang]}</span>
                                </div>
                                <div class="pdf-item-subtitle">
                                    ${exp.company[lang]} • <span style="font-weight: normal; color: ${grayColor};">${exp.duration[lang]}</span>
                                </div>
                                <p class="pdf-item-desc">${exp.summary[lang]}</p>
                                <ul class="pdf-list">
                                    ${exp.responsibilities[lang].map(r => `<li>${r}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="pdf-sidebar">
                    <div class="pdf-section">
                        <h3 class="pdf-section-title">Skills</h3>
                        ${resumeData.skills[lang].map(group => `
                            <div class="pdf-item">
                                <strong style="display: block; font-size: 12px; color: ${darkColor}; margin-bottom: 2px;">${group.groupName}</strong>
                                <div>
                                    ${group.skills.map(s => `<span class="pdf-tag">${s.name}</span>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="pdf-section">
                        <h3 class="pdf-section-title">${t('Educação', 'Education')}</h3>
                        ${resumeData.education.map(edu => `
                            <div class="pdf-item">
                                <strong style="display: block; font-size: 12px; color: ${darkColor};">${edu.institution[lang]}</strong>
                                <span style="display: block; font-size: 10px; color: ${grayColor}; margin-bottom: 1px;">${edu.location}</span>
                                <span style="display: block; font-size: 11px; color: ${accentColor};">${edu.course[lang]}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="pdf-section">
                        <h3 class="pdf-section-title">${t('Outros', 'Others')}</h3>
                        <div class="pdf-item">
                            <strong style="font-size: 12px; color: ${darkColor};">${t('Idiomas', 'Languages')}</strong>
                            <p style="font-size: 11px; color: ${grayColor}; margin-top: 2px;">${resumeData.languages[lang].join(', ')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    pageContent.innerHTML = html;
    pageContainer.appendChild(pageContent);
    overlay.appendChild(pageContainer);
    document.body.appendChild(overlay);

    // Close Action
    btnClose.onclick = () => document.body.removeChild(overlay);

    // Download Action
    btnDownload.onclick = () => {
        const originalElement = pageContent.querySelector('.pdf-page');

        // Clone the element to render it in a clean context (avoiding modal scroll/fixed positioning issues)
        const clonedElement = originalElement.cloneNode(true);

        // Create a temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '0';
        container.style.width = '210mm'; // Force A4 width
        container.style.zIndex = '-1';
        container.appendChild(clonedElement);
        document.body.appendChild(container);

        const opt = {
            margin: 0,
            filename: `CV_Ricardo_Oliveira_${lang.toUpperCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const originalText = btnDownload.innerHTML;
        btnDownload.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('Gerando...', 'Generating...')}`;

        html2pdf().set(opt).from(clonedElement).save().then(() => {
            btnDownload.innerHTML = originalText;
            document.body.removeChild(container); // Clean up
        }).catch(err => {
            console.error(err);
            alert("Erro ao gerar PDF: " + err.message);
            btnDownload.innerHTML = originalText;
            document.body.removeChild(container); // Clean up
        });
    };
}
