const slides = document.querySelectorAll('.slide');
const progressBar = document.getElementById('progressBar');
let currentIdx = 0;
let isAnimating = false;
const slideInterval = 10000;
let isPaused = false;
let progressTween;

function init() {
    slides.forEach((slide, i) => {
        const bg = slide.getAttribute('data-bg');
        const forceBg = slide.querySelector('.force-bg-layer');
        if (bg) {
            if (forceBg) forceBg.style.backgroundImage = `url(${bg})`;
            else slide.style.backgroundImage = `url(${bg})`;
        }
        spawnTechParticles(slide);
        
        // Pause triggers - Expanded to content containers for better UX
        const pauseSelectors = '.uxui-composition, .datacenter-panels, .performance-content-wrapper, .hero-panel, .v-panel, .liquid-shape, .cards-container, .glass-performance-card';
        const pauseElements = slide.querySelectorAll(pauseSelectors);
        pauseElements.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                pausePortfolio();
            });
            el.addEventListener('mouseleave', (e) => {
                e.stopPropagation();
                resumePortfolio();
            });
        });
    });

    // Dynamic Resolution Display
    const resDisplay = document.getElementById('resDisplay');
    if (resDisplay) {
        resDisplay.innerText = `FRAME_01 | ${window.screen.width}x${window.screen.height}`;
    }
    
    startProgress();
    animateSlideContent(slides[0]);
    initSmartCardsCycle();
    generateDots();
    updatePlayPauseUI();
}

function spawnTechParticles(slide) {
    const container = document.createElement('div');
    container.className = 'absolute inset-0 pointer-events-none z-0 overflow-hidden';
    slide.appendChild(container);

    const isPerformance = slide.classList.contains('slide-performance');
    const symbols = ['+', '-', '■', '●', '▲', 'X', '#', '</>'];

    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'zero-item glass-geometry';
        p.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.fontSize = 'clamp(12px, 2vw, 24px)';
        
        container.appendChild(p);

        gsap.to(p, {
            x: 'random(-100, 100)',
            y: 'random(-100, 100)',
            rotation: 360,
            duration: 'random(20, 40)',
            repeat: -1,
            yoyo: true,
            ease: "none"
        });
    }
}

function startProgress() {
    if (isPaused) return;
    
    if (progressTween) progressTween.kill();
    
    gsap.set(progressBar, { width: 0 });
    progressTween = gsap.to(progressBar, {
        width: '100%',
        duration: slideInterval / 1000,
        ease: "none",
        onComplete: () => {
            if (!isPaused) nextSlide();
        }
    });
}

function togglePlayPause() {
    isPaused = !isPaused;
    updatePlayPauseUI();
    if (isPaused) {
        if (progressTween) progressTween.pause();
    } else {
        startProgress();
    }
}

function updatePlayPauseUI() {
    const btn = document.getElementById('playPauseBtn');
    if (isPaused) {
        btn.classList.remove('is-playing');
    } else {
        btn.classList.add('is-playing');
    }
}

function generateDots() {
    const dotsContainer = document.getElementById('carouselDots');
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    });
}

function updateDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIdx);
    });
}

function pausePortfolio() {
    // We only pause temporarily on hover if we ARE playing
    if (!isPaused && progressTween) progressTween.pause();
}

function resumePortfolio() {
    // We only resume on hover-out if we ARE NOT manually paused
    if (!isPaused) {
        if (progressTween) progressTween.play();
        else startProgress();
    }
}

function animateSlideContent(slide) {
    const title = slide.querySelectorAll('.hero-title');
    const desc = slide.querySelectorAll('.hero-desc, .stats-row, .badge-tech, .panel-info, .blob-content, .card');
    const num = slide.querySelector('.slide-number');
    
    // Adjusted opacity in animation to make it more visible (match CSS)
    gsap.fromTo(num, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 2, ease: "power2.out" });

    // Text stagger
    gsap.fromTo(title, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "expo.out", delay: 0.3 });
    gsap.fromTo(desc, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power2.out", delay: 0.6 });

    // Custom shape animations
    if (slide.classList.contains('slide-uxui')) {
        gsap.fromTo('.ux-shape', { scale: 0, opacity: 0, rotation: -45 }, { 
            scale: 1, 
            opacity: 1, 
            rotation: (i, t) => t.classList.contains('s-rect') ? -10 : 5, 
            duration: 1.5, 
            stagger: 0.2, 
            ease: "back.out(1.2)" 
        });
        
        // Extra float for UI fragments
        gsap.to('.ui-fragment', {
            y: "+=20",
            duration: 3,
            repeat: -1,
            yoyo: true,
            stagger: 0.5,
            ease: "sine.inOut"
        });
    }

    if (slide.classList.contains('slide-performance')) {
        gsap.fromTo('.performance-shape', { x: -300, opacity: 0 }, { x: 0, opacity: 1, duration: 1.5, ease: "power4.out" });
        gsap.fromTo('.glass-performance-card', { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: "power2.out", delay: 0.3 });
        
        // Animate Lighthouse Gauges
        const gauges = slide.querySelectorAll('.lh-gauge__wrapper');
        gauges.forEach((gauge, i) => {
            const score = parseInt(gauge.getAttribute('data-score'));
            const color = gauge.getAttribute('data-color');
            const circle = gauge.querySelector('.lh-gauge-arc');
            const scoreNum = gauge.querySelector('.lh-score');
            
            // Total circumference of r=56 is ~351.85 (2 * PI * r)
            const circumference = 2 * Math.PI * 56;
            const offset = circumference - (score / 100) * circumference;

            // Reset
            gsap.set(circle, { strokeDasharray: `0, ${circumference}` });
            
            // Animate Arc
            gsap.to(circle, {
                strokeDasharray: `${circumference - offset}, ${circumference}`,
                duration: 2,
                ease: "power4.out",
                delay: 0.8 + (i * 0.1)
            });

            // Animate Number
            let count = { val: 0 };
            gsap.to(count, {
                val: score,
                duration: 2,
                ease: "power2.out",
                delay: 0.8 + (i * 0.1),
                onUpdate: () => {
                    scoreNum.innerText = Math.floor(count.val);
                }
            });
        });
    }

    if (slide.classList.contains('slide-datacenter')) {
        gsap.fromTo('.v-panel', { width: 0, opacity: 0 }, { width: 320, opacity: 1, duration: 1.2, stagger: 0.3, ease: "power4.out" });
        gsap.fromTo('.panel-stat, .security-chip', { x: (i, t) => i === 0 ? -50 : 50, opacity: 0 }, { x: 0, opacity: 1, duration: 1, stagger: 0.1, delay: 0.8 });
        gsap.fromTo('.hex-grid', { opacity: 0 }, { opacity: 0.2, duration: 2, delay: 0.5 });
    }

    if (slide.classList.contains('slide-cards')) {
        gsap.fromTo('.card', { rotateY: 90, x: 200, opacity: 0 }, { rotateY: -20, x: 0, opacity: 1, duration: 1.5, stagger: 0.2, ease: "power3.out" });
    }
}

function goToSlide(idx) {
    if (isAnimating) return;
    isAnimating = true;

    const prevSlide = slides[currentIdx];

    gsap.to(prevSlide, { opacity: 0, duration: 0.8, onComplete: () => {
        prevSlide.classList.remove('active');
    }});

    const nextSlide = slides[idx];
    currentIdx = idx;
    nextSlide.classList.add('active');
    
    gsap.fromTo(nextSlide, { opacity: 0 }, { opacity: 1, duration: 0.8, onComplete: () => {
        isAnimating = false;
        if (!isPaused) startProgress();
    }});

    animateSlideContent(nextSlide);
    updateDots();
}

function nextSlide() { goToSlide((currentIdx + 1) % slides.length); }
function prevSlide() { 
    if (isAnimating) return;
    goToSlide((currentIdx - 1 + slides.length) % slides.length); 
}

/* SMART CARDS CYCLE (BANNER 05) */
const smartData = [
    {
        top: "Personalização", desc: "Design exclusivo sob medida.",
        price: "A partir de", value: "R$ 4.000", badge: "OFERTA ESPECIAL",
        bottomTitle: "Performance", bottomDesc: "PageSpeed 100 pontos."
    },
    {
        top: "Sistema Web", desc: "Sistemas robustos e escaláveis.",
        price: "A partir de", value: "R$ 5.000", badge: "TECNOLOGIA GO",
        bottomTitle: "Infraestrutura", bottomDesc: "Otimizado para VPS."
    },
    {
        top: "Aplicativo Mobile", desc: "Apps nativos Android e iOS.",
        price: "A partir de", value: "R$ 3.000", badge: "CROSS PLATFORM",
        bottomTitle: "Mobile Expert", bottomDesc: "Alta fluidez e UX premium."
    }
];

let smartIdx = 0;
function initSmartCardsCycle() {
    setInterval(() => {
        if (isAnimating) return;
        smartIdx = (smartIdx + 1) % smartData.length;
        const data = smartData[smartIdx];

        const elements = [
            '#cardTopTitle', '#cardTopDesc', '#priceText', '#priceValue', 
            '#priceBadge', '#cardBottomTitle', '#cardBottomDesc'
        ];

        gsap.to('.card', { opacity: 0.5, scale: 0.95, duration: 0.5, onComplete: () => {
            document.getElementById('cardTopTitle').innerText = data.top;
            document.getElementById('cardTopDesc').innerText = data.desc;
            document.getElementById('priceBadge').innerText = data.badge;
            document.getElementById('priceValue').innerText = data.value;
            document.getElementById('cardBottomTitle').innerText = data.bottomTitle;
            document.getElementById('cardBottomDesc').innerText = data.bottomDesc;
            
            gsap.to('.card', { opacity: 1, scale: 1, duration: 0.5 });
        }});
    }, 4000);
}

/* 3D TILT EFFECT FOR BANNER 05 */
const cardContainer = document.getElementById('smartCardsContainer');
if (cardContainer) {
    cardContainer.addEventListener('mousemove', (e) => {
        const rect = cardContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Softened factor (dividing by 30 instead of 10)
        const rotateX = (y - centerY) / 30;
        const rotateY = (centerX - x) / 30;
        
        // Target all cards, but handle scale for the middle one
        const cards = cardContainer.querySelectorAll('.card');
        cards.forEach(c => {
            const isHighlighted = c.classList.contains('card-2');
            gsap.to(c, {
                rotateX: rotateX + 10,
                rotateY: rotateY - 20,
                scale: isHighlighted ? 1.1 : 1, // Keep middle card larger
                duration: 0.8,
                ease: "power2.out"
            });
        });
    });

    cardContainer.addEventListener('mouseleave', () => {
        const cards = cardContainer.querySelectorAll('.card');
        cards.forEach(c => {
            const isHighlighted = c.classList.contains('card-2');
            gsap.to(c, {
                rotateX: 10,
                rotateY: -20,
                scale: isHighlighted ? 1.1 : 1,
                duration: 1.2,
                ease: "elastic.out(1, 0.4)"
            });
        });
    });
}

window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;

    const activeSlide = slides[currentIdx];
    const shapes = activeSlide.querySelectorAll('.ux-shape, .ui-fragment, .partner-bubble, .performance-shape, .v-panel, .liquid-shape, .card, .slide-number, .cards-container');
    
    shapes.forEach((s, i) => {
        const speed = s.classList.contains('slide-number') ? 0.1 : (i % 3 + 1) * 0.5;
        gsap.to(s, { x: x * speed, y: y * speed, duration: 2, ease: "power2.out" });
    });
});

init();
