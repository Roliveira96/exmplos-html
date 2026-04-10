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
        if (bg) slide.style.backgroundImage = `url(${bg})`;
        spawnTechParticles(slide);
        
        // Pause triggers
        const cards = slide.querySelectorAll('.hero-panel, .glass-cyber-card, .glass-performance-card, .v-panel, .liquid-shape, .cards-container');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => pausePortfolio());
            card.addEventListener('mouseleave', () => resumePortfolio());
        });
    });
    
    startProgress();
    animateSlideContent(slides[0]);
}

function spawnTechParticles(slide) {
    const container = document.createElement('div');
    container.className = 'absolute inset-0 pointer-events-none z-0 overflow-hidden';
    slide.appendChild(container);

    for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.className = 'zero-item';
        const size = Math.random() * 20 + 5;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.border = '1px solid white';
        p.style.borderRadius = i % 2 === 0 ? '50%' : '2px';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        
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

function pausePortfolio() {
    isPaused = true;
    if (progressTween) progressTween.pause();
}

function resumePortfolio() {
    isPaused = false;
    if (progressTween) {
        progressTween.play();
    } else {
        startProgress();
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
    if (slide.classList.contains('slide-layered')) {
        gsap.fromTo('.rect-main', { x: -200, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: "power4.out" });
        gsap.fromTo('.circle-glass', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, ease: "back.out(1.7)", delay: 0.5 });
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

    if (slide.classList.contains('slide-split-glass')) {
        gsap.fromTo('.panel-1', { y: -1000 }, { y: 0, duration: 1.2, ease: "power4.out" });
        gsap.fromTo('.panel-2', { y: 1000 }, { y: 0, duration: 1.2, ease: "power4.out", delay: 0.1 });
        gsap.fromTo('.panel-3', { y: -1000 }, { y: 0, duration: 1.2, ease: "power4.out", delay: 0.2 });
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
        startProgress();
    }});

    animateSlideContent(nextSlide);
}

function nextSlide() { goToSlide((currentIdx + 1) % slides.length); }
function prevSlide() { 
    if (isAnimating) return;
    goToSlide((currentIdx - 1 + slides.length) % slides.length); 
}

// Parallax
window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;

    const activeSlide = slides[currentIdx];
    const shapes = activeSlide.querySelectorAll('.shape, .portal-mask, .v-panel, .liquid-shape, .card, .slide-number');
    
    shapes.forEach((s, i) => {
        const speed = s.classList.contains('slide-number') ? 0.1 : (i % 3 + 1) * 0.5;
        gsap.to(s, { x: x * speed, y: y * speed, duration: 2, ease: "power2.out" });
    });
});

init();
