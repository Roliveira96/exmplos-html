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
            const header = document.querySelector('header');
            if (!header) return;
            header.innerHTML = `
                <img src="${resumeData.profile.image}" alt="Foto de Perfil de ${resumeData.profile.name}" class="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-indigo-500 shadow-lg transform hover:scale-105 transition-all duration-300">
                <h1 class="text-6xl sm:text-7xl font-extrabold text-indigo-900 mb-4 tracking-tight">${resumeData.profile.name}</h1>
                <p class="text-xl sm:text-2xl text-gray-600 mb-4">${resumeData.profile.address}</p>
                <div class="text-xl sm:text-2xl text-gray-700 space-x-4 p-2 bg-indigo-50 rounded-xl shadow-inner inline-block">
                    <a href="${resumeData.profile.contact.phone.link}" class="text-indigo-700 hover:text-indigo-900 transition duration-300 ease-in-out px-3 py-1 rounded-lg animated-link"><i class="${resumeData.profile.contact.phone.icon} mr-2"></i>${resumeData.profile.contact.phone.display}</a>
                    <span class="text-gray-400">|</span>
                    <a href="${resumeData.profile.contact.email.link}" class="text-indigo-700 hover:text-indigo-900 transition duration-300 ease-in-out px-3 py-1 rounded-lg animated-link"><i class="${resumeData.profile.contact.email.icon} mr-2"></i>${resumeData.profile.contact.email.display}</a>
                </div>
             `;
        },
        socialLinks: () => {
            const container = document.querySelector('#social-links-container');
            if (!container) return;
            container.innerHTML = resumeData.socialLinks.map(link => `
                <a href="${link.url}" target="_blank" class="flex items-center ${link.colorClass} text-white py-3 px-6 rounded-full font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                    <i class="${link.icon} mr-2"></i> ${link.name}
                </a>
             `).join('');
        },
        summary: (lang) => {
            const container = document.querySelector('#summary-content');
            if (!container) return;
            container.innerHTML = `<p class="text-lg leading-relaxed text-gray-700 mt-8">${resumeData.summary[lang]}</p>`;
        },
        experience: (lang) => {
            const container = document.getElementById('experience-container');
            if (!container) return;
            container.innerHTML = resumeData.experience.map(exp => `
                <div class="p-6 bg-gray-50 rounded-xl shadow-md transform hover:scale-[1.01] transition-all duration-300 ease-in-out border border-gray-200 relative overflow-hidden group experience-card">
                    <span class="experience-card-left-border"></span>
                    <div class="relative z-10">
                        <h3 class="text-xl sm:text-2xl font-semibold text-indigo-700 mb-1 exp-role">${exp.role[lang]}</h3>
                        <p class="text-gray-600 text-lg mb-1 exp-company">${exp.company[lang]}</p>
                        <p class="text-gray-500 text-base mb-3 exp-duration">${exp.duration[lang]}</p>
                        <p class="text-gray-700 mb-4 exp-summary">${exp.summary[lang]}</p>
                        <div class="hidden exp-description">${exp.description[lang]}</div>
                        <ul class="hidden exp-responsibilities">
                            ${exp.responsibilities[lang].map(req => `<li>${req}</li>`).join('')}
                        </ul>
                        <button class="bg-indigo-500 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-indigo-600 transition duration-300 ease-in-out transform hover:scale-105 view-more-btn">
                             ${lang === 'br' ? 'Ver Mais' : 'View More'}
                        </button>
                    </div>
                </div>
             `).join('');

            // Re-attach event listeners for view more buttons
            document.querySelectorAll('.experience-card .view-more-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    openExperienceModal(e.currentTarget.closest('.experience-card'));
                });
            });
        },
        education: (lang) => {
            const container = document.getElementById('education-container');
            if (!container) return;
            container.innerHTML = resumeData.education.map(edu => `
                 <div class="p-6 bg-gray-50 rounded-xl shadow-md transform hover:scale-[1.01] transition-all duration-300 ease-in-out border border-gray-200">
                    <h3 class="text-xl font-semibold text-indigo-700 mb-2">${edu.institution[lang]}</h3>
                    <p class="text-gray-600">${edu.location}</p>
                    <p class="text-gray-700 mt-2">${edu.course[lang]}</p>
                </div>
             `).join('');
        },
        courses: (lang) => {
            const container = document.getElementById('courses-container');
            if (!container) return;
            container.innerHTML = resumeData.courses.map(course => `
                <div class="bg-gray-50 rounded-xl shadow-md transform hover:scale-[1.01] transition-all duration-300 ease-in-out border border-gray-200 overflow-hidden course-card">
                    <a href="#" class="certificate-link" data-img-src="${course.image}" data-pdf-src="${course.pdf}">
                        <img src="${course.image}" alt="${course.title[lang]}" class="w-full h-auto">
                    </a>
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-indigo-700 mb-2">${course.title[lang]}</h3>
                        <p class="text-sm text-gray-700">${course.description[lang]}</p>
                        <p class="text-xs text-gray-500 mt-2">${course.date[lang]}</p>
                        <div class="hidden course-details">${course.longDescription[lang]}</div>
                    </div>
                </div>
             `).join('');

            // Re-attach event listeners
            document.querySelectorAll('.certificate-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
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
                let groupHtml = `<div>
                    <h3 class="text-2xl font-semibold text-gray-700 mt-8 mb-4 border-b border-gray-200 pb-2">${group.groupName}</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">`;
                group.skills.forEach(skill => {
                    groupHtml += `<div class="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg shadow-sm hover:shadow-lg hover:border-indigo-400 transform hover:scale-105 transition-all duration-300 ease-in-out border border-gray-200 skill-card-glow cursor-pointer">
                        <i class="${skill.icon} fa-2x ${skill.color} mb-2"></i>
                        <span class="text-base font-medium ${skill.color} text-center">${skill.name}</span>
                    </div>`;
                });
                groupHtml += `</div></div>`;
                skillsContainer.innerHTML += groupHtml;
            });
        },
        languages: (lang) => {
            const container = document.getElementById('languages-list');
            if (!container) return;
            container.innerHTML = resumeData.languages[lang].map(l => `<li>${l}</li>`).join('');
        },
        footer: (lang) => {
            const footer = document.querySelector('footer');
            if (!footer) return;
            const text = lang === 'br' ?
                `&copy; ${resumeData.footerYear} Ricardo Martins de Oliveira. Todos os direitos reservados.` :
                `&copy; ${resumeData.footerYear} Ricardo Martins de Oliveira. All rights reserved.`;
            footer.innerHTML = `<span class="version-content">${text}</span>`;
        },
        sectionTitles: (lang) => {
            const titles = {
                'summary-title': { br: 'Resumo Profissional', en: 'Professional Summary' },
                'experience-title': { br: 'Experiência Profissional', en: 'Professional Experience' },
                'education-title': { br: 'Formação Acadêmica', en: 'Academic Education' },
                'courses-title': { br: 'Cursos e Certificados', en: 'Courses and Certificates' },
                'skills-title': { br: 'Competências', en: 'Skills' },
                'languages-title': { br: 'Idiomas', en: 'Languages' }
            };
            for (const [id, text] of Object.entries(titles)) {
                const el = document.getElementById(id);
                if (el) el.textContent = text[lang];
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

    const progressBar = document.getElementById('progressBar');
    window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;
        const progress = (scrollPosition / totalHeight) * 100;
        if (progressBar) progressBar.style.width = `${progress}%`;
    });

    let currentLang = 'br';
    const langPtButton = document.getElementById('lang-pt-btn');
    const langEnButton = document.getElementById('lang-en-btn');

    function switchLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang === 'br' ? 'pt-BR' : 'en';

        if (langPtButton) langPtButton.classList.toggle('active', lang === 'br');
        if (langEnButton) langEnButton.classList.toggle('active', lang === 'eua');

        // Render content dependent on language
        render.summary(lang);
        render.experience(lang);
        render.education(lang);
        render.courses(lang);
        render.skills(lang);
        render.languages(lang);
        render.footer(lang);
        render.sectionTitles(lang);
    }

    if (langPtButton) langPtButton.addEventListener('click', () => switchLanguage('br'));
    if (langEnButton) langEnButton.addEventListener('click', () => switchLanguage('eua'));

    // Modal de Experiência
    const generalModal = document.getElementById('generalModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubTitle = document.getElementById('modalSubTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalResponsibilities = document.getElementById('modalResponsibilities');
    const audioPlayer = document.getElementById('audioPlayer');

    function openExperienceModal(cardElement) {
        // cardElement is the .experience-card div.
        // We will pull the CURRENTLY RENDERED data in that card.
        // Because re-rendering destroys the DOM references, we must be careful.
        // However, we are attaching the listener AFTER render, so it should be fine.

        // We can just grab the text content from the card as it is already in the correct language.
        const role = cardElement.querySelector('.exp-role').textContent;
        const company = cardElement.querySelector('.exp-company').textContent;
        const duration = cardElement.querySelector('.exp-duration').textContent;
        const descriptionHtml = cardElement.querySelector('.exp-description').innerHTML;
        const responsibilitiesHtml = cardElement.querySelector('.exp-responsibilities').innerHTML;

        modalTitle.textContent = role;
        modalSubTitle.textContent = `${company} (${duration})`;
        modalDescription.innerHTML = descriptionHtml;
        modalResponsibilities.innerHTML = responsibilitiesHtml;
        modalResponsibilities.style.display = responsibilitiesHtml ? 'block' : 'none';

        // Update Read Content text based on language
        const readBtn = document.getElementById('readContentButton');
        if (readBtn) {
            readBtn.querySelector('span').textContent = currentLang === 'br' ? 'Ler Conteúdo' : 'Read Content';
        }

        generalModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeExperienceModal() {
        generalModal.classList.remove('open');
        document.body.style.overflow = '';
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
    }

    if (closeModalButton) closeModalButton.addEventListener('click', closeExperienceModal);
    if (generalModal) generalModal.addEventListener('click', (e) => {
        if (e.target === generalModal) closeExperienceModal();
    });

    // Modal de Certificado
    const certificateModal = document.getElementById('certificateModal');
    const closeCertificateModalButton = document.getElementById('closeCertificateModal');
    const certificateImage = document.getElementById('certificateImage');
    const certificatePdfLink = document.getElementById('certificatePdfLink');
    const certificateDescription = document.getElementById('certificateDescription');

    function openCertificateModal(imgSrc, pdfSrc, description) {
        certificateImage.src = imgSrc;
        certificatePdfLink.href = pdfSrc;
        certificateDescription.innerHTML = description;

        // Update View PDF text based on language
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


    // Initial Render
    // Static content that doesn't change with language
    render.profile();
    render.socialLinks();

    // Content that defaults to BR
    switchLanguage('br');

    // PDF Download Logic
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function () {
            if (typeof html2pdf === 'undefined') {
                alert('Erro: Biblioteca PDF não carregada.');
                return;
            }
            const element = document.querySelector('.container');
            const opt = {
                margin: 0.2,
                filename: 'Ricardo_Martins_Curriculo.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            const originalBoxShadow = element.style.boxShadow;
            element.style.boxShadow = 'none';
            html2pdf().set(opt).from(element).save().then(() => {
                element.style.boxShadow = originalBoxShadow;
            });
        });
    }
});
