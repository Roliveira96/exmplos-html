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

// Matrix Effect Class
class MatrixEffect {
    constructor(element) {
        this.element = element;
        // Check if canvas already exists to avoid duplication
        if (this.element.querySelector('.matrix-canvas')) return;

        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('matrix-canvas');
        this.element.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        this.init();

        // Use ResizeObserver for more robust resizing
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(this.element);

        this.animate();
    }

    resize() {
        // Canvas is sized by CSS (40% width), but we need internal resolution to match physical pixels?
        // Actually, let's trust offsetWidth/Height of the canvas itself if populated, 
        // OR layout is absolute, so we need to match the parent's dimensions but maybe restricted?
        // CSS rules say width: 40%, height: 100%. 
        // So canvas.width should be offsetWidth.
        this.width = this.canvas.offsetWidth;
        this.height = this.canvas.offsetHeight;

        // Handle case where element might be hidden or 0 size
        if (this.width === 0 || this.height === 0) return;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.fontSize = 14;
        this.columns = Math.floor(this.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100; // Start random above
        }
    }

    init() {
        this.characters = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.characters = this.characters.split("");
    }

    animate() {
        if (!this.ctx || this.width === 0) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        // Clear the entire canvas to have NO background color (transparent)
        // This removes the trails fading effect, but the user requested "remove the background".
        // To keep the text visible and moving without a background block:
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = "#10b981"; // Emerald 500 (Text Color)
        this.ctx.font = `${this.fontSize}px 'JetBrains Mono'`;

        for (let i = 0; i < this.drops.length; i++) {
            // Random chance to drop a character to look simpler? No, standard matrix is constant stream.
            const text = this.characters[Math.floor(Math.random() * this.characters.length)];

            // Draw text
            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            // Reset drop if it goes off screen
            if (this.drops[i] * this.fontSize > this.height && Math.random() > 0.98) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Helper to apply effect to eligible cards
    const applyMatrixToCards = () => {
        // IDs: profile-card, contact-card, skills-card, languages-card, summary-card
        const ids = ['profile-card', 'contact-card', 'skills-card', 'languages-card', 'summary-card'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.querySelector('.matrix-canvas')) {
                new MatrixEffect(el);
            }
        });

        // Classes: experience-card (inside experience-container), education-card (we'll add this class)
        document.querySelectorAll('.experience-card, .education-card').forEach(el => {
            if (!el.querySelector('.matrix-canvas')) {
                new MatrixEffect(el);
            }
        });
    };

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
            // Append the button after the text
            const buttonText = lang === 'br' ? 'Ouvir minha história' : 'Listen to my story';

            container.innerHTML = `
                <p class="leading-relaxed text-slate-300 text-lg mb-6">${resumeData.summary[lang]}</p>
                <div class="flex justify-start">
                    <button id="btn-listen-story" class="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all group">
                        <i class="fas fa-play text-sm group-hover:scale-110 transition-transform"></i>
                        <span class="text-sm font-semibold tracking-wide">${buttonText}</span>
                    </button>
                    <!-- Visualizer placeholder could go here -->
                </div>
            `;

            // Bind click event for the story button
            const storyBtn = document.getElementById('btn-listen-story');
            if (storyBtn) {
                storyBtn.addEventListener('click', async () => {
                    const originalText = storyBtn.querySelector('span').textContent;
                    const originalIcon = storyBtn.querySelector('i').className;

                    // Loading State
                    storyBtn.disabled = true;
                    storyBtn.querySelector('span').textContent = lang === 'br' ? 'Gerando Áudio...' : 'Generating Audio...';
                    storyBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
                    storyBtn.classList.add('opacity-75', 'cursor-not-allowed');

                    try {
                        // Stop any existing audio
                        window.speechSynthesis.cancel();
                        if (audioPlayer) {
                            audioPlayer.pause();
                            audioPlayer.currentTime = 0;
                        }

                        // Use the 'story' text from data.js
                        const storyText = resumeData.story[lang];

                        const response = await fetch('/synthesize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: storyText, lang: lang })
                        });

                        if (!response.ok) throw new Error('Network response was not ok');

                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);

                        if (audioPlayer) {
                            audioPlayer.src = url;
                            audioPlayer.onplay = () => {
                                storyBtn.querySelector('span').textContent = lang === 'br' ? 'Reproduzindo...' : 'Playing...';
                                storyBtn.querySelector('i').className = 'fas fa-volume-up animate-pulse';
                            };
                            audioPlayer.onended = () => {
                                storyBtn.disabled = false;
                                storyBtn.querySelector('span').textContent = originalText;
                                storyBtn.querySelector('i').className = originalIcon;
                                storyBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                                URL.revokeObjectURL(url);
                            };
                            audioPlayer.play();
                        } else {
                            // Fallback
                            const audio = new Audio(url);
                            audio.play();
                            audio.onended = () => {
                                storyBtn.disabled = false;
                                storyBtn.querySelector('span').textContent = originalText;
                                storyBtn.querySelector('i').className = originalIcon;
                                storyBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                            }
                        }

                    } catch (err) {
                        console.error("Story Audio Error:", err);
                        alert("Erro ao gerar áudio da história.");
                        storyBtn.disabled = false;
                        storyBtn.querySelector('span').textContent = originalText;
                        storyBtn.querySelector('i').className = originalIcon;
                        storyBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                    }
                });
            }
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
            // Added 'education-card' class for Matrix Targeting
            container.innerHTML = resumeData.education.map(edu => `
                 <div class="bg-slate-800/30 p-5 rounded-xl border border-slate-700/50 flex gap-4 items-center education-card">
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
        if (langEnButton) langEnButton.classList.toggle('active', lang === 'en');

        Object.values(render).forEach(fn => fn(lang));
        applyMatrixToCards(); // Re-apply Matrix Effect after re-render

        // Update Modal Button Texts
        const closeText = lang === 'br' ? 'Fechar' : 'Close';

        const modalCloseBtnAction = document.getElementById('modalCloseBtnAction');
        if (modalCloseBtnAction) modalCloseBtnAction.querySelector('span').textContent = closeText;

        const certModalCloseBtnAction = document.getElementById('certModalCloseBtnAction');
        if (certModalCloseBtnAction) certModalCloseBtnAction.querySelector('span').textContent = closeText;
    }

    if (langPtButton) langPtButton.addEventListener('click', () => switchLanguage('br'));
    if (langEnButton) langEnButton.addEventListener('click', () => switchLanguage('en'));

    // Modal Logic
    const generalModal = document.getElementById('generalModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalCloseBtnAction = document.getElementById('modalCloseBtnAction'); // New Hook
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

        // Update Close Button Text on Open as well just in case
        if (modalCloseBtnAction) modalCloseBtnAction.querySelector('span').textContent = currentLang === 'br' ? 'Fechar' : 'Close';

        generalModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeExperienceModal() {
        generalModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (closeModalButton) closeModalButton.addEventListener('click', closeExperienceModal);
    if (modalCloseBtnAction) modalCloseBtnAction.addEventListener('click', closeExperienceModal); // New Listener
    if (generalModal) generalModal.addEventListener('click', (e) => {
        if (e.target === generalModal) closeExperienceModal();
    });

    const certificateModal = document.getElementById('certificateModal');
    const closeCertificateModalButton = document.getElementById('closeCertificateModal');
    const certModalCloseBtnAction = document.getElementById('certModalCloseBtnAction'); // New Hook
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

        if (certModalCloseBtnAction) certModalCloseBtnAction.querySelector('span').textContent = currentLang === 'br' ? 'Fechar' : 'Close';

        certificateModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeCertificateModal() {
        certificateModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (closeCertificateModalButton) closeCertificateModalButton.addEventListener('click', closeCertificateModal);
    if (certModalCloseBtnAction) certModalCloseBtnAction.addEventListener('click', closeCertificateModal); // New Listener
    if (certificateModal) certificateModal.addEventListener('click', (e) => {
        if (e.target === certificateModal) closeCertificateModal();
    });

    // Init
    switchLanguage('br');

    // --- Audio / TTS Logic ---
    const readBtn = document.getElementById('readContentButton');
    const audioPlayer = document.getElementById('audioPlayer');

    if (readBtn) {
        readBtn.addEventListener('click', async () => {
            const description = document.getElementById('modalDescription').innerText;
            const title = document.getElementById('modalTitle').innerText;
            const fullText = `${title}. ${description}`;

            // 1. Loading State
            const originalText = currentLang === 'br' ? 'Ler Conteúdo' : 'Read Content'; // Force correct text
            const originalIconClass = 'fas fa-volume-up';

            readBtn.disabled = true;
            readBtn.querySelector('span').textContent = currentLang === 'br' ? 'Carregando...' : 'Loading...';
            readBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
            readBtn.classList.add('opacity-75', 'cursor-not-allowed');

            try {
                // Cancel any current speech (browser) and reset state if needed
                window.speechSynthesis.cancel();

                // If using Audio Element from previous attempts or global
                if (audioPlayer) {
                    audioPlayer.pause();
                    audioPlayer.currentTime = 0;
                }

                const response = await fetch('/synthesize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: fullText,
                        lang: currentLang // Send language context if needed by backend for voice selection logic
                    })
                });

                if (!response.ok) {
                    throw new Error('Falha ao gerar áudio. Verifique se o servidor está rodando.');
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                if (audioPlayer) {
                    audioPlayer.src = url;
                    audioPlayer.onplay = () => {
                        readBtn.querySelector('span').textContent = currentLang === 'br' ? 'Reproduzindo...' : 'Playing...';
                        readBtn.querySelector('i').className = 'fas fa-volume-up animate-pulse';
                    };
                    audioPlayer.onended = () => {
                        resetButton();
                        URL.revokeObjectURL(url); // Cleanup
                    };
                    audioPlayer.onerror = (e) => {
                        console.error('Audio Playback Error:', e);
                        resetButton();
                    };

                    await audioPlayer.play();
                } else {
                    // Fallback if no audio tag found
                    const audio = new Audio(url);
                    audio.play();
                    audio.onended = resetButton;
                }

            } catch (error) {
                console.error("Audio Generation Error:", error);
                alert("Erro ao conectar com o serviço de voz. Verifique se o 'node server.js' está rodando.");
                resetButton();
            }

            function resetButton() {
                readBtn.disabled = false;
                readBtn.querySelector('span').textContent = currentLang === 'br' ? 'Ler Conteúdo' : 'Read Content';
                readBtn.querySelector('i').className = originalIconClass;
                readBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        });
    }

    // Stop audio when closing modal
    const stopAudio = () => {
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
        window.speechSynthesis.cancel();
    };
    if (closeModalButton) closeModalButton.addEventListener('click', stopAudio);
    if (modalCloseBtnAction) modalCloseBtnAction.addEventListener('click', stopAudio);
    if (generalModal) generalModal.addEventListener('click', (e) => { if (e.target === generalModal) stopAudio(); });

    // PDF Download
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function () {
            // Check if loaded, if not load it
            if (typeof html2pdf === 'undefined') {
                downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
                script.onload = () => {
                    generatePDF();
                    downloadPdfBtn.innerHTML = '<i class="fas fa-file-pdf fa-lg"></i>';
                };
                document.body.appendChild(script);
            } else {
                generatePDF();
            }

            function generatePDF() {
                const element = document.body;
                const opt = {
                    margin: 0,
                    filename: 'Ricardo_Martins_Curriculo.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, scrollY: 0, backgroundColor: '#0b1120' },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(element).save();
            }
        });
    }
});
