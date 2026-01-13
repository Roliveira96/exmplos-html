function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function pcmToWav(pcmData, sampleRate) {
    const dataLength = pcmData.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    let offset = 0;
    function writeString(str) { for (let i = 0; i < str.length; i++) { view.setUint8(offset + i, str.charCodeAt(i)); } offset += str.length; }
    function writeUint32(val) { view.setUint32(offset, val, true); offset += 4; }
    function writeUint16(val) { view.setUint16(offset, val, true); offset += 2; }
    writeString('RIFF'); writeUint32(36 + dataLength); writeString('WAVE'); writeString('fmt '); writeUint32(16); writeUint16(1); writeUint16(1); writeUint32(sampleRate); writeUint32(sampleRate * 2); writeUint16(2); writeUint16(16); writeString('data'); writeUint32(dataLength);
    for (let i = 0; i < pcmData.length; i++) { view.setInt16(offset, pcmData[i], true); offset += 2; }
    return new Blob([view], { type: 'audio/wav' });
}

document.addEventListener('DOMContentLoaded', function () {
    // Utility for dynamic HTML generation
    const render = {
        profile: () => {
            const container = document.getElementById('profile-card');
            if (!container) return;

            let socialHtml = resumeData.socialLinks.map(link => `
                <a href="${link.url}" target="_blank" class="text-gray-400 hover:text-emerald-400 transition-all duration-300 transform hover:scale-110 p-2 bg-slate-800/50 rounded-full border border-slate-700 hover:border-emerald-500/50 flex items-center justify-center w-10 h-10" title="${link.name}">
                    <i class="${link.icon}"></i>
                </a>
             `).join('');

            container.innerHTML = `
                <div class="relative inline-block mb-6 group">
                    <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <img src="${resumeData.profile.image}" alt="Foto de Perfil" class="relative w-40 h-40 rounded-full mx-auto border-4 border-slate-800 shadow-2xl object-cover">
                    <div class="absolute bottom-2 right-4 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                </div>
                <h1 class="text-3xl font-bold text-white mb-2 font-heading tracking-tight">${resumeData.profile.name}</h1>
                <p class="text-emerald-400 text-sm font-mono mb-6 bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">Software Engineer & Tech Lead</p>
                <div class="flex justify-center gap-3 flex-wrap mt-4 pt-6 border-t border-slate-700/50">
                    ${socialHtml}
                </div>
             `;
        },
        contact: (lang) => {
            const container = document.getElementById('contact-card');
            if (!container) return;
            container.innerHTML = `
                <h2 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <i class="fas fa-terminal text-emerald-500"></i> ${lang === 'br' ? 'Contato' : 'Contact'}
                </h2>
                 <div class="space-y-4">
                    <a href="${resumeData.profile.contact.phone.link}" class="flex items-center gap-4 text-gray-300 hover:text-white group transition-all p-2 rounded-lg hover:bg-slate-800/50 -mx-2">
                        <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                            <i class="${resumeData.profile.contact.phone.icon} text-emerald-400"></i>
                        </div>
                        <span class="text-sm font-mono">${resumeData.profile.contact.phone.display}</span>
                    </a>
                    <a href="${resumeData.profile.contact.email.link}" class="flex items-center gap-4 text-gray-300 hover:text-white group transition-all p-2 rounded-lg hover:bg-slate-800/50 -mx-2">
                         <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                            <i class="${resumeData.profile.contact.email.icon} text-emerald-400"></i>
                        </div>
                        <span class="text-sm truncate font-mono">${resumeData.profile.contact.email.display}</span>
                    </a>
                    <div class="flex items-center gap-4 text-gray-300 p-2 rounded-lg -mx-2">
                         <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                            <i class="fas fa-map-marker-alt text-emerald-400"></i>
                        </div>
                        <span class="text-sm">${resumeData.profile.address}</span>
                    </div>
                </div>
             `;
        },
        summary: (lang) => {
            const container = document.querySelector('#summary-content');
            if (!container) return;
            container.innerHTML = `<p class="leading-relaxed text-slate-300 text-lg">${resumeData.summary[lang]}</p>`;
        },
        experience: (lang) => {
            const container = document.getElementById('experience-container');
            if (!container) return;
            container.innerHTML = resumeData.experience.map(exp => `
                <div class="group relative pl-8 pb-8 border-l border-slate-800 last:border-0 last:pb-0">
                    <!-- Timeline Dot -->
                    <div class="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-emerald-500 group-hover:scale-125 transition-all"></div>
                    
                    <div class="bg-slate-800/20 rounded-xl p-6 border border-slate-700/50 hover:bg-slate-800/40 hover:border-emerald-500/30 transition-all experience-card cursor-pointer">
                        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2">
                            <h3 class="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors exp-role font-heading">${exp.role[lang]}</h3>
                            <span class="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 mt-2 sm:mt-0 w-fit exp-duration">${exp.duration[lang]}</span>
                        </div>
                        
                        <div class="text-lg text-slate-400 mb-4 font-medium exp-company flex items-center gap-2">
                            <i class="fas fa-building text-sm"></i> ${exp.company[lang]}
                        </div>
                        
                        <p class="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed exp-summary">${exp.summary[lang]}</p>
                        
                        <!-- Hidden content -->
                        <div class="hidden exp-description">${exp.description[lang]}</div>
                        <ul class="hidden exp-responsibilities">
                             ${exp.responsibilities[lang].map(req => `<li>${req}</li>`).join('')}
                        </ul>

                        <button class="text-sm text-emerald-400 font-semibold flex items-center gap-2 hover:gap-3 transition-all view-more-btn">
                             ${lang === 'br' ? 'Ver Mais' : 'View More'} <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
             `).join('');

            document.querySelectorAll('.experience-card .view-more-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openExperienceModal(e.currentTarget.closest('.experience-card'));
                });
            });
            document.querySelectorAll('.experience-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    openExperienceModal(e.currentTarget);
                });
            });
        },
        education: (lang) => {
            const container = document.getElementById('education-container');
            if (!container) return;
            container.innerHTML = resumeData.education.map(edu => `
                 <div class="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50 flex gap-4 items-center">
                    <div class="flex-shrink-0 w-12 h-12 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center border border-blue-500/20">
                        <i class="fas fa-graduation-cap fa-lg"></i>
                    </div>
                    <div>
                        <h4 class="text-base font-bold text-white font-heading">${edu.institution[lang]}</h4>
                        <p class="text-sm text-slate-500">${edu.location}</p>
                        <p class="text-sm font-medium text-slate-300 mt-1">${edu.course[lang]}</p>
                    </div>
                </div>
             `).join('');
        },
        courses: (lang) => {
            const container = document.getElementById('courses-container');
            if (!container) return;
            container.innerHTML = resumeData.courses.map(course => `
                 <div class="group bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden hover:border-emerald-500/40 transition-all course-card flex flex-col h-full">
                    <!-- Image Container: Fixed height, White background, full width -->
                    <div class="h-56 bg-white w-full flex items-center justify-center relative border-b border-slate-700/50 overflow-hidden">
                         <img src="${course.image}" alt="${course.title[lang]}" class="w-full h-full object-contain transform group-hover:scale-105 transition-all duration-300">
                    </div>
                    
                    <div class="p-5 flex-grow flex flex-col">
                        <div class="mb-4">
                            <h4 class="text-base font-bold text-white mb-2 leading-snug group-hover:text-emerald-400 transition-colors font-heading" title="${course.title[lang]}">${course.title[lang]}</h4>
                            <p class="text-xs font-mono text-slate-500 flex items-center gap-2">
                                <i class="far fa-calendar-alt"></i> ${course.date[lang]}
                            </p>
                        </div>
                        
                        <a href="#" class="certificate-link mt-auto w-full py-2.5 px-4 bg-slate-800 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 group/btn"
                           data-img-src="${course.image}" data-pdf-src="${course.pdf}">
                            <i class="fas fa-certificate group-hover/btn:rotate-12 transition-transform"></i>
                            ${lang === 'br' ? 'Ver Certificado' : 'View Certificate'}
                        </a>
                        <div class="hidden course-details">${course.longDescription[lang]}</div>
                    </div>
                </div>
             `).join('');

            document.querySelectorAll('.certificate-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const card = e.currentTarget.closest('.course-card');
                    const description = card.querySelector('.course-details').innerHTML;

                    const imgSrc = e.currentTarget.dataset.imgSrc;
                    const pdfSrc = e.currentTarget.dataset.pdfSrc;
                    openCertificateModal(imgSrc, pdfSrc, description);
                });
            });
        },
        skills: (lang) => {
            const skillsContainer = document.getElementById('skills-container');
            if (!skillsContainer) return;
            skillsContainer.innerHTML = '';
            resumeData.skills[lang].forEach(group => {
                let groupHtml = `<div class="mb-6 last:mb-0">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span class="w-1 h-1 bg-emerald-500 rounded-full"></span> ${group.groupName}
                    </h3>
                    <div class="flex flex-wrap gap-2">`;
                group.skills.forEach(skill => {
                    groupHtml += `
                    <div class="px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-2 hover:border-emerald-500/50 hover:text-white transition-all cursor-default shadow-sm">
                        <i class="${skill.icon}"></i>
                        <span>${skill.name}</span>
                    </div>`;
                });
                groupHtml += `</div></div>`;
                skillsContainer.innerHTML += groupHtml;
            });
        },
        languages: (lang) => {
            const container = document.getElementById('languages-list');
            if (!container) return;
            container.innerHTML = resumeData.languages[lang].map(l => `
                <li class="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <span class="text-sm font-medium text-slate-300">${l}</span>
                    <i class="fas fa-check text-emerald-500 text-xs"></i>
                </li>
             `).join('');
        },
        footer: (lang) => {
            const footer = document.querySelector('footer');
            if (!footer) return;
            const text = lang === 'br' ?
                `&copy; ${resumeData.footerYear} Ricardo Martins de Oliveira. <br> <span class="text-xs text-slate-600">Built with VS Code & AI</span>` :
                `&copy; ${resumeData.footerYear} Ricardo Martins de Oliveira. <br> <span class="text-xs text-slate-600">Built with VS Code & AI</span>`;
            footer.innerHTML = `<span class="text-slate-500">${text}</span>`;
        },
        sectionTitles: (lang) => {
            const titles = {
                'summary-title': { br: 'Sobre Mim', en: 'About Me' },
                'experience-title': { br: 'Experiência Profissional', en: 'Work Experience' },
                'education-title': { br: 'Formação Acadêmica', en: 'Education' },
                'courses-title': { br: 'Certificações & Cursos', en: 'Certifications & Courses' },
                'skills-title': { br: 'Tech Stack', en: 'Tech Stack' },
                'languages-title': { br: 'Idiomas', en: 'Languages' }
            };
            for (const [id, text] of Object.entries(titles)) {
                const el = document.getElementById(id);
                if (el && el.querySelector('span:last-child')) el.querySelector('span:last-child').textContent = text[lang];
                else if (el) el.textContent = text[lang];
            }
        }
    };

    // Fade in Logic
    const sections = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });
    sections.forEach(section => { observer.observe(section); });

    let currentLang = 'br';
    const langPtButton = document.getElementById('lang-pt-btn');
    const langEnButton = document.getElementById('lang-en-btn');

    function switchLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang === 'br' ? 'pt-BR' : 'en';

        if (langPtButton) langPtButton.classList.toggle('active', lang === 'br');
        if (langEnButton) langEnButton.classList.toggle('active', lang === 'eua');

        Object.values(render).forEach(fn => fn(lang));
    }

    if (langPtButton) langPtButton.addEventListener('click', () => switchLanguage('br'));
    if (langEnButton) langEnButton.addEventListener('click', () => switchLanguage('eua'));

    // Modal Logic
    const generalModal = document.getElementById('generalModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubTitle = document.getElementById('modalSubTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalResponsibilities = document.getElementById('modalResponsibilities');

    function openExperienceModal(cardElement) {
        const role = cardElement.querySelector('.exp-role').textContent;
        const company = cardElement.querySelector('.exp-company').textContent;
        const duration = cardElement.querySelector('.exp-duration').textContent;
        const descriptionHtml = cardElement.querySelector('.exp-description').innerHTML;
        const responsibilitiesHtml = cardElement.querySelector('.exp-responsibilities').innerHTML;

        modalTitle.textContent = role;
        modalTitle.className = "text-2xl font-bold text-white mb-2 font-heading";

        modalSubTitle.textContent = `${company} | ${duration}`;
        modalSubTitle.className = "text-emerald-400 text-sm font-mono mb-6";

        modalDescription.innerHTML = descriptionHtml;
        modalDescription.className = "text-slate-300 leading-relaxed mb-6";

        modalResponsibilities.innerHTML = responsibilitiesHtml;
        modalResponsibilities.className = "list-disc list-inside text-slate-300 space-y-2 ml-4";

        const readBtn = document.getElementById('readContentButton');
        if (readBtn) readBtn.querySelector('span').textContent = currentLang === 'br' ? 'Ler Conteúdo' : 'Read Content';

        generalModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeExperienceModal() {
        generalModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (closeModalButton) closeModalButton.addEventListener('click', closeExperienceModal);
    if (generalModal) generalModal.addEventListener('click', (e) => {
        if (e.target === generalModal) closeExperienceModal();
    });

    const certificateModal = document.getElementById('certificateModal');
    const closeCertificateModalButton = document.getElementById('closeCertificateModal');
    const certificateImage = document.getElementById('certificateImage');
    const certificatePdfLink = document.getElementById('certificatePdfLink');
    const certificateDescription = document.getElementById('certificateDescription');

    function openCertificateModal(imgSrc, pdfSrc, description) {
        certificateImage.src = imgSrc;
        certificatePdfLink.href = pdfSrc;
        certificateDescription.innerHTML = description;
        certificateDescription.className = "text-slate-300 text-sm my-4 leading-relaxed";

        const pdfBtn = document.getElementById('certificatePdfLink');
        if (pdfBtn) {
            const span = pdfBtn.querySelector('span');
            if (span) span.textContent = currentLang === 'br' ? 'Ver PDF' : 'View PDF';
        }

        certificateModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeCertificateModal() {
        certificateModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (closeCertificateModalButton) closeCertificateModalButton.addEventListener('click', closeCertificateModal);
    if (certificateModal) certificateModal.addEventListener('click', (e) => {
        if (e.target === certificateModal) closeCertificateModal();
    });

    // Init
    switchLanguage('br');

    // PDF Download
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function () {
            if (typeof html2pdf === 'undefined') {
                alert('Erro: Biblioteca PDF não carregada.');
                return;
            }
            const element = document.body;
            const opt = {
                margin: 0,
                filename: 'Ricardo_Martins_Curriculo.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0, backgroundColor: '#0b1120' }, // Dark BG for PDF
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        });
    }
});
