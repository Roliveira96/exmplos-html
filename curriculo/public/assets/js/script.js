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

        this.resizeObserver = new ResizeObserver((entries) => {
            // Debounce resize to avoid trashing
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.resize();
            }, 100);
        });
        this.resizeObserver.observe(this.element);

        // Defer initial resize to avoid forced reflow during initialization
        requestAnimationFrame(() => {
            this.resize();
            this.init();
            this.animate();
        });
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
        this.ctx.font = `10px 'JetBrains Mono'`;

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
        // Check for mobile/low-power devices
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) return; // Skip Matrix effect on mobile to save battery/CPU

        // IDs: profile-card, contact-card, skills-card, languages-card, summary-card
        const ids = ['profile-card', 'contact-card', 'skills-card', 'languages-card', 'summary-card'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.querySelector('.matrix-canvas')) {
                new MatrixEffect(el);
            }
        });

        // Classes: experience-card (inside experience-container), education-card
        document.querySelectorAll('.experience-card, .education-card').forEach(el => {
            if (!el.querySelector('.matrix-canvas')) {
                new MatrixEffect(el);
            }
        });
    };

    const render = {
        profile: (lang) => {
            const container = document.getElementById('profile-card');
            if (!container) return;
            // REMOVE PULSE class if present
            container.querySelector('.animate-pulse')?.classList.remove('animate-pulse');

            let socialHtml = resumeData.socialLinks.map(link => `
                <a href="${link.url}" target="_blank" class="text-gray-400 hover:text-emerald-400 transition-all duration-300 transform hover:scale-110 p-2 bg-slate-800/50 rounded-full border border-slate-700 hover:border-emerald-500/50 flex items-center justify-center w-10 h-10" title="${link.name}">
                    <i class="${link.icon}"></i>
                </a>
             `).join('');

            container.innerHTML = `
                <div class="relative inline-block mb-12 group">
                    <!-- Ultra-Bright Neon Glow Background -->
                    <div class="absolute -inset-2 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 bg-emerald-500 shadow-[0_0_30px_#10b981]">
                    </div>

                    <!-- Photo with Neon Border -->
                    <img src="${resumeData.profile.image}" alt="${resumeData.profile.name}" width="160" height="160"
                        class="relative w-40 h-40 rounded-full mx-auto object-cover z-10 profile-photo-matrix"
                        fetchpriority="high">

                    <!-- Matrix Status Badge -->
                    <div id="status-badge"
                        class="px-5 py-1.5 rounded-full flex items-center gap-3 z-20 min-w-[125px] justify-center transition-all duration-300 hover:scale-110 status-badge-matrix">
                        <span id="status-dot" class="w-2.5 h-2.5 rounded-full animate-pulse bg-emerald-400 status-dot-matrix"></span>
                        <span id="status-text" class="text-[12px] font-black uppercase tracking-[0.2em] font-mono text-emerald-400">CONNECTING</span>
                    </div>
                </div>
                <h1 class="text-3xl font-bold text-white mb-2 font-heading tracking-tight">${resumeData.profile.name}</h1>
                <p class="text-emerald-400 text-sm font-mono mb-6 bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">Software Engineer & Tech Lead</p>
                <div class="flex justify-center gap-3 flex-wrap mt-4 pt-6 border-t border-slate-700/50">
                    ${socialHtml}
                </div>
             `;

            // Re-trigger status update since we replaced the DOM
            updateOnlineStatus();
        },
        contact: (lang) => {
            const container = document.getElementById('contact-card');
            if (!container) return;
            // REMOVE PULSE from child div wrapper
            const pulse = container.querySelector('.animate-pulse');
            if (pulse) pulse.classList.remove('animate-pulse');

            const defaultTitle = lang === 'br' ? 'Contato' : 'Contact';

            container.innerHTML = `
                <h2 class="text-sm font-bold text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <i class="fas fa-terminal text-emerald-300"></i> 
                    <span id="contact-typewriter-target" class="typing-cursor idle">${defaultTitle}</span>
                </h2>
                 <div class="space-y-4">
                    <a href="${resumeData.profile.contact.phone.link}" class="flex items-center gap-4 text-slate-100 hover:text-white group transition-all p-2 rounded-lg hover:bg-slate-800/50 -mx-2">
                        <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                            <i class="${resumeData.profile.contact.phone.icon} text-emerald-300"></i>
                        </div>
                        <span class="text-sm font-mono">${resumeData.profile.contact.phone.display}</span>
                    </a>
                    <a href="${resumeData.profile.contact.email.link}" class="flex items-center gap-4 text-slate-100 hover:text-white group transition-all p-2 rounded-lg hover:bg-slate-800/50 -mx-2">
                         <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                            <i class="${resumeData.profile.contact.email.icon} text-emerald-300"></i>
                        </div>
                        <span class="text-sm truncate font-mono">${resumeData.profile.contact.email.display}</span>
                    </a>
                    <div class="flex items-center gap-4 text-slate-100 p-2 rounded-lg -mx-2">
                         <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                            <i class="fas fa-map-marker-alt text-emerald-300"></i>
                        </div>
                        <span class="text-sm">${resumeData.profile.address}</span>
                    </div>
                </div>
             `;

            // Initialize/Re-initialize Typewriter logic
            setupContactTypewriter(lang);
        },
        summary: (lang) => {
            const container = document.querySelector('#summary-content');
            if (!container) return;
            // CRITICAL: Remove animate-pulse from the container itself
            container.classList.remove('animate-pulse');

            // Append the button after the text
            const buttonText = lang === 'br' ? 'Ouvir minha história' : 'Listen to my story';

            container.innerHTML = `
                <p class="leading-relaxed text-slate-100 text-lg mb-6 shadow-black drop-shadow-md">${resumeData.summary[lang]}</p>
                <div class="flex justify-start">
                    <button id="btn-listen-story" class="flex items-center gap-3 px-5 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 rounded-lg transition-all group font-bold shadow-lg" aria-label="${buttonText}">
                        <i class="fas fa-play text-sm group-hover:scale-110 transition-transform text-emerald-300"></i>
                        <span class="text-sm tracking-wide shadow-black drop-shadow-sm">${buttonText}</span>
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
                <div class="group relative pl-8 pb-8 border-l border-slate-700 last:border-0 last:pb-0">
                    <!-- Timeline Dot -->
                    <div class="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-600 group-hover:border-emerald-500 group-hover:scale-125 transition-all"></div>
                    
                    <div class="bg-slate-800/40 rounded-xl p-6 border border-slate-700/60 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all experience-card cursor-pointer">
                        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2">
                            <h3 class="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors exp-role font-heading">${exp.role[lang]}</h3>
                            <span class="text-xs font-mono text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/30 mt-2 sm:mt-0 w-fit exp-duration">${exp.duration[lang]}</span>
                        </div>
                        
                        <div class="text-lg text-slate-300 mb-4 font-medium exp-company flex items-center gap-2">
                            <i class="fas fa-building text-sm"></i> ${exp.company[lang]}
                        </div>
                        
                        <p class="text-slate-300 text-sm mb-4 line-clamp-3 leading-relaxed exp-summary">${exp.summary[lang]}</p>
                        
                        <!-- Hidden content -->
                        <div class="hidden exp-description">${exp.description[lang]}</div>
                        <ul class="hidden exp-responsibilities">
                             ${exp.responsibilities[lang].map(req => `<li>${req}</li>`).join('')}
                        </ul>

                        <button class="text-sm text-emerald-400 font-bold flex items-center gap-2 hover:gap-3 transition-all view-more-btn" aria-label="${lang === 'br' ? 'Ver Mais detalhes sobre ' + exp.role[lang] : 'View More details about ' + exp.role[lang]}">
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
                <div class="bg-slate-800/40 p-5 rounded-xl border border-slate-700/60 flex gap-4 items-center education-card">
                    <div class="flex-shrink-0 w-12 h-12 bg-blue-900/20 text-blue-300 rounded-lg flex items-center justify-center border border-blue-500/30">
                        <i class="fas fa-graduation-cap fa-lg"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-white font-heading">${edu.institution[lang]}</h3>
                        <p class="text-sm text-slate-300">${edu.location}</p>
                        <p class="text-sm font-medium text-slate-200 mt-1">${edu.course[lang]}</p>
                    </div>
                </div>
             `).join('');
        },
        courses: (lang) => {
            const container = document.getElementById('courses-container');
            if (!container) return;
            container.innerHTML = resumeData.courses.map(course => `
                 <div class="group bg-slate-800/40 rounded-xl border border-slate-700/60 overflow-hidden hover:border-emerald-500/40 transition-all course-card flex flex-col h-full">
                    <!-- Image Container: Fixed height, White background, full width -->
                    <div class="h-56 bg-white w-full flex items-center justify-center relative border-b border-slate-700/50 overflow-hidden">
                         <img src="${course.image}" alt="${course.title[lang]}" width="525" height="390" class="w-full h-full object-contain transform group-hover:scale-105 transition-all duration-300" loading="lazy">
                    </div>
                    
                    <div class="p-5 flex-grow flex flex-col">
                        <div class="mb-4">
                            <h3 class="text-base font-bold text-white mb-2 leading-snug group-hover:text-emerald-300 transition-colors font-heading" title="${course.title[lang]}">${course.title[lang]}</h3>
                            <p class="text-xs font-mono text-slate-400 flex items-center gap-2">
                                <i class="far fa-calendar-alt"></i> ${course.date[lang]}
                            </p>
                        </div>
                        
                        <a href="#" class="certificate-link mt-auto w-full py-2.5 px-4 bg-slate-800 hover:bg-emerald-950/30 border border-slate-700 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 group/btn"
                           data-img-src="${course.image}" data-pdf-src="${course.pdf}" aria-label="${lang === 'br' ? 'Ver Certificado de ' + course.title[lang] : 'View Certificate of ' + course.title[lang]}">
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
            // CRITICAL: Remove pulse animation
            skillsContainer.classList.remove('animate-pulse');

            skillsContainer.innerHTML = '';
            resumeData.skills[lang].forEach(group => {
                let groupHtml = `<div class="mb-6 last:mb-0">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2 shadow-black drop-shadow-sm">
                        <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full box-shadow-glow"></span> ${group.groupName}
                    </h3>
                    <div class="flex flex-wrap gap-2">`;
                group.skills.forEach(skill => {
                    groupHtml += `
                    <div class="px-3 py-1.5 bg-slate-800 border border-slate-600 text-slate-100 rounded-lg text-xs font-semibold flex items-center gap-2 hover:border-emerald-400 hover:text-white transition-all cursor-default shadow-md">
                        <i class="${skill.icon} text-emerald-300"></i>
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
            // CRITICAL: Remove pulse animation
            container.classList.remove('animate-pulse');

            container.innerHTML = resumeData.languages[lang].map(l => `
                <li class="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 border border-slate-700">
                    <span class="text-sm font-semibold text-slate-100">${l}</span>
                    <i class="fas fa-check text-emerald-400 text-xs"></i>
                </li>
             `).join('');
        },
        footer: (lang) => {
            const footer = document.querySelector('footer');
            if (!footer) return;
            const text = lang === 'br' ?
                `&copy; ${resumeData.footerYear} Ricardo Martins de Oliveira.` :
                `&copy; ${resumeData.footerYear} Ricardo Martins de Oliveira.`;
            footer.innerHTML = `<span class="text-slate-400 font-medium">${text}</span>`;
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

    // Typewriter Logic for Contact Card
    let typewriterController = null;

    const setupContactTypewriter = (lang) => {
        const card = document.getElementById('contact-card');
        const target = document.getElementById('contact-typewriter-target');

        if (!card || !target) return;

        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);

        const currentCard = document.getElementById('contact-card');
        const currentTarget = document.getElementById('contact-typewriter-target');

        if (!currentCard || !currentTarget) return;

        if (typewriterController) typewriterController.abort();
        typewriterController = new AbortController();

        const actualPhrases = resumeData.profile.contactPhrases?.[lang] || [
            lang === 'br' ? "Olá, tudo bem?" : "Hello, how are you?"
        ];
        const defaultText = lang === 'br' ? 'Contato' : 'Contact';

        let currentPhraseIndex = 0;
        let rotationTimeout = null;

        const sleep = (ms, signal) => new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, ms);
            signal?.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('aborted'));
            });
        });

        const typeChar = async (char, signal) => {
            if (!currentTarget) return;
            currentTarget.textContent += char;
            const delay = Math.random() * (90 - 40) + 40;
            await sleep(delay, signal);
        };

        const backspace = async (count, signal) => {
            if (!currentTarget) return;
            for (let i = 0; i < count; i++) {
                if (signal.aborted) return;
                currentTarget.textContent = currentTarget.textContent.slice(0, -1);
                await sleep(50, signal);
            }
        };

        const typeHuman = async (text, signal) => {
            for (let i = 0; i < text.length; i++) {
                if (signal.aborted) return;
                if (Math.random() < 0.15 && i < text.length - 1) {
                    const wrongChar = String.fromCharCode(text.charCodeAt(i) + 1);
                    await typeChar(wrongChar, signal);
                    await sleep(250, signal);
                    await backspace(1, signal);
                    await sleep(100, signal);
                }
                await typeChar(text[i], signal);
            }
        };

        const startSequence = async () => {
            const signal = typewriterController.signal;
            if (!currentTarget) return;

            currentTarget.classList.remove('idle');

            try {
                await backspace(currentTarget.textContent.length, signal);
                await sleep(400, signal);

                if (currentPhraseIndex < actualPhrases.length) {
                    const phrase = actualPhrases[currentPhraseIndex];
                    await typeHuman(phrase, signal);
                    currentTarget.classList.add('idle');
                    currentPhraseIndex++;

                    rotationTimeout = setTimeout(() => {
                        if (!signal.aborted) startSequence();
                    }, 5000);
                } else {
                    await typeHuman(defaultText, signal);
                    currentTarget.classList.add('idle');
                    currentPhraseIndex = 0;
                }
            } catch (e) {
                if (e.message !== 'aborted') console.error(e);
            }
        };

        currentCard.addEventListener('mouseenter', () => {
            if (typewriterController) typewriterController.abort();
            clearTimeout(rotationTimeout);
            typewriterController = new AbortController();
            currentPhraseIndex = 0;
            startSequence();
        });

        currentCard.addEventListener('mouseleave', () => {
            if (typewriterController) typewriterController.abort();
            clearTimeout(rotationTimeout);
            if (currentTarget) {
                currentTarget.textContent = defaultText;
                currentTarget.classList.add('idle');
            }
        });
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

    const updateLanguageSwitcher = (lang) => {
        const brBtn = document.getElementById('lang-br-btn');
        const enBtn = document.getElementById('lang-en-btn');

        // Ensure buttons exist before manipulating
        if (brBtn) {
            const img = brBtn.querySelector('img');
            if (img && !img.src.includes('w80')) img.src = 'https://flagcdn.com/w80/br.png';

            // Apply active class to the BUTTON, not the image
            brBtn.classList.toggle('active', lang === 'br');
        }

        if (enBtn) {
            const img = enBtn.querySelector('img');
            if (img && !img.src.includes('w80')) img.src = 'https://flagcdn.com/w80/us.png';

            enBtn.classList.toggle('active', lang === 'en');
        }
    };

    // Online Status Logic
    // Online Status Logic
    const updateOnlineStatus = () => {
        const statusBadge = document.getElementById('status-badge');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');

        if (!statusBadge || !statusDot || !statusText) return;

        // Ensure base classes for CSS selectors
        statusDot.classList.add('status-dot-matrix', 'w-2.5', 'h-2.5', 'rounded-full', 'animate-pulse');
        statusText.classList.add('status-text-matrix', 'text-[12px]', 'font-black', 'uppercase', 'tracking-[0.2em]', 'font-mono');

        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();

        const isOnline = (day >= 1 && day <= 6) && (hour >= 8 && hour < 21);

        if (isOnline) {
            statusBadge.classList.add('online');
            statusBadge.classList.remove('offline');
            statusText.textContent = "ONLINE";
        } else {
            statusBadge.classList.add('offline');
            statusBadge.classList.remove('online');
            statusText.textContent = "OFFLINE";
        }

        // Clear any inline styles left by previous versions
        statusBadge.style = "";
        statusDot.style = "";
        statusText.style = "";
    };

    // Run immediately and check every minute
    updateOnlineStatus();
    setInterval(updateOnlineStatus, 60000);


    let currentLang = 'br';

    // Correct IDs matching index.html
    const langBrButton = document.getElementById('lang-br-btn');
    const langEnButton = document.getElementById('lang-en-btn');

    // Renamed back to switchLanguage to fix references or kept specific name but ensuring all calls match
    const switchLanguage = (lang) => {
        if (currentLang === lang) return;
        currentLang = lang;
        document.documentElement.lang = lang === 'br' ? 'pt-BR' : 'en';

        updateLanguageSwitcher(lang);

        Object.values(render).forEach(fn => fn(lang));
        applyMatrixToCards();
        // Update Modal Button Texts
        const closeText = lang === 'br' ? 'Fechar' : 'Close';

        const modalCloseBtnAction = document.getElementById('modalCloseBtnAction');
        if (modalCloseBtnAction) modalCloseBtnAction.querySelector('span').textContent = closeText;

        const certModalCloseBtnAction = document.getElementById('certModalCloseBtnAction');
        if (certModalCloseBtnAction) certModalCloseBtnAction.querySelector('span').textContent = closeText;
    };

    if (langBrButton) {
        langBrButton.addEventListener('click', () => switchLanguage('br'));
    }

    if (langEnButton) {
        langEnButton.addEventListener('click', () => switchLanguage('en'));
    }

    // Initialize
    updateLanguageSwitcher(currentLang);
    Object.values(render).forEach(fn => fn(currentLang));
    applyMatrixToCards();

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
    const audioPlayer = document.getElementById('audioPlayer');

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

});
