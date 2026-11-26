/* MontaWeb homepage interactions. No dependencies; shared utilities remain in app.js. */
'use strict';

const HOME_DEMOS = Object.freeze({
    restaurant: {
        image: 'images/modern/portfolio-restaurante-brasa.jpg',
        alt: 'Diseño web para restaurante Brasa y Criolla, mostrado en computadora y celular',
        domain: 'brasa-y-criolla.pe', category: 'GASTRONOMÍA', title: 'Brasa & Criolla'
    },
    clinic: {
        image: 'images/modern/portfolio-clinica-sanare.jpg',
        alt: 'Diseño web para Sanare Clínica, mostrado en computadora y celular',
        domain: 'sanare.pe', category: 'SALUD Y BIENESTAR', title: 'Sanare Clínica'
    },
    store: {
        image: 'images/modern/portfolio-panaderia.jpg',
        alt: 'Tienda online para panadería artesanal, mostrada en computadora y celular',
        domain: 'tanta-pasteleria.pe', category: 'TIENDA ONLINE', title: 'Panadería artesanal'
    }
});

function recommendProject(answers) {
    const plans = {
        presence: {
            title: 'Web Simple Profesional', price: 'Desde S/ 99 · pago único',
            description: 'Hasta 3 secciones con diseño personalizado, WhatsApp, Google Maps, SEO básico, SSL y hosting gratis el primer año.'
        },
        campaign: {
            title: 'Landing Page', price: 'Desde S/ 50 · pago único',
            description: 'Una página persuasiva y veloz para tu campaña, con hasta 5 bloques, formulario y acceso directo a WhatsApp.'
        },
        store: {
            title: 'Tienda Starter', price: 'Desde S/ 299 · pago único',
            description: 'Catálogo de hasta 20 productos con carrito, pedidos por WhatsApp y pagos con Yape o Plin. Incluye capacitación.'
        },
        redesign: {
            title: 'Rediseño Web Moderno', price: 'Desde S/ 199 · pago único',
            description: 'Una nueva experiencia para tu sitio actual: diseño UI/UX, migración de contenido, velocidad y mejor conversión.'
        }
    };
    const selected = plans[answers.goal] || plans.presence;
    const result = { ...selected };
    if (answers.content === 'help') {
        result.description += ' Podemos añadir la Creación de Contenido desde S/ 40 si quieres que preparemos tus textos e imágenes.';
    }
    return result;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recommendProject, HOME_DEMOS };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initDemoSwitcher();
        initProcess();
        initProjectFinder();
        initPromoVideo();
        initMagneticButtons();
    });
}

function initHomeNavigation() {
    const toggle = document.getElementById('home-nav-toggle');
    const menu = document.getElementById('home-nav-menu');
    if (!toggle || !menu) return;
    const close = () => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
        menu.classList.remove('open');
        document.body.classList.remove('menu-open');
    };
    toggle.addEventListener('click', () => {
        const opening = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(opening));
        toggle.setAttribute('aria-label', opening ? 'Cerrar menú' : 'Abrir menú');
        menu.classList.toggle('open', opening);
        document.body.classList.toggle('menu-open', opening);
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') { close(); toggle.focus(); }
    });
    document.addEventListener('click', event => {
        if (toggle.getAttribute('aria-expanded') === 'true' && !menu.contains(event.target) && !toggle.contains(event.target)) close();
    });
}

function initDemoSwitcher() {
    const image = document.getElementById('demo-image');
    const buttons = [...document.querySelectorAll('[data-demo]')];
    if (!image || !buttons.length) return;
    Object.values(HOME_DEMOS).forEach(demo => { const preload = new Image(); preload.src = demo.image; });
    let swapTimer;
    buttons.forEach(button => button.addEventListener('click', () => {
        const demo = HOME_DEMOS[button.dataset.demo];
        if (!demo || button.getAttribute('aria-pressed') === 'true') return;
        buttons.forEach(item => {
            const selected = item === button;
            item.classList.toggle('active', selected);
            item.setAttribute('aria-pressed', String(selected));
        });
        clearTimeout(swapTimer);
        image.classList.add('changing');
        swapTimer = setTimeout(() => {
            image.src = demo.image;
            image.alt = demo.alt;
            document.getElementById('demo-domain').textContent = demo.domain;
            document.getElementById('demo-category').textContent = demo.category;
            document.getElementById('demo-title').textContent = demo.title;
            image.classList.remove('changing');
        }, 160);
    }));
}

function initProcess() {
    const items = [...document.querySelectorAll('.process-item')];
    if (!items.length) return;
    items.forEach(item => {
        const trigger = item.querySelector('.process-trigger');
        trigger.addEventListener('click', () => {
            items.forEach(other => {
                const active = other === item;
                const button = other.querySelector('.process-trigger');
                const panel = document.getElementById(button.getAttribute('aria-controls'));
                other.classList.toggle('active', active);
                button.setAttribute('aria-expanded', String(active));
                button.querySelector('i').textContent = active ? '−' : '+';
                panel.hidden = !active;
            });
        });
        trigger.addEventListener('keydown', event => {
            if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
            event.preventDefault();
            const index = items.indexOf(item);
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            items[(index + direction + items.length) % items.length].querySelector('.process-trigger').focus();
        });
    });
}

function initProjectFinder() {
    const finder = document.getElementById('project-finder');
    if (!finder) return;
    const steps = [...finder.querySelectorAll('[data-finder-step]')];
    const result = document.getElementById('finder-result');
    const progress = document.getElementById('finder-progress-bar');
    const label = document.getElementById('finder-step-label');
    const progressWrap = finder.querySelector('.finder-progress');
    const answers = { goal: null, content: null };

    const setStep = number => {
        result.hidden = true;
        progressWrap.hidden = false;
        steps.forEach(step => {
            const active = Number(step.dataset.finderStep) === number;
            step.hidden = !active;
            step.classList.toggle('active', active);
        });
        label.textContent = `PREGUNTA ${number} DE 2`;
        progress.style.width = `${number * 50}%`;
    };

    finder.querySelectorAll('[data-finder-step="1"] [data-finder-option]').forEach(button => {
        button.addEventListener('click', () => {
            answers.goal = button.dataset.finderOption;
            setStep(2);
            finder.querySelector('[data-finder-step="2"] button').focus();
        });
    });
    finder.querySelectorAll('[data-finder-step="2"] [data-finder-option]').forEach(button => {
        button.addEventListener('click', () => {
            answers.content = button.dataset.finderOption;
            const recommendation = recommendProject(answers);
            steps.forEach(step => { step.hidden = true; });
            progressWrap.hidden = true;
            document.getElementById('finder-result-title').textContent = recommendation.title;
            document.getElementById('finder-result-price').textContent = recommendation.price;
            document.getElementById('finder-result-description').textContent = recommendation.description;
            const message = `Hola MontaWeb, el asesor digital me recomendó ${recommendation.title}. Quiero conversar sobre mi proyecto.${answers.content === 'help' ? ' También necesito ayuda con los textos y las imágenes.' : ''}`;
            document.getElementById('finder-result-link').href = `https://wa.me/51965403196?text=${encodeURIComponent(message)}`;
            result.hidden = false;
            result.setAttribute('tabindex', '-1');
            result.focus();
        });
    });
    document.getElementById('finder-back').addEventListener('click', () => setStep(1));
    document.getElementById('finder-restart').addEventListener('click', () => {
        answers.goal = null;
        answers.content = null;
        setStep(1);
        finder.querySelector('[data-finder-step="1"] button').focus();
    });
}

function initHomeScroll() {
    const header = document.getElementById('site-header');
    const bar = document.getElementById('scroll-progress-bar');
    const items = [...document.querySelectorAll('.reveal-item')];
    let ticking = false;
    const update = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        header?.classList.toggle('scrolled', window.scrollY > 30);
        if (bar) bar.style.width = `${scrollable > 0 ? Math.min(100, window.scrollY / scrollable * 100) : 0}%`;
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reducedMotion) {
        items.forEach(item => item.classList.add('is-visible'));
        return;
    }
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: .08, rootMargin: '0px 0px -45px' });
    items.forEach(item => observer.observe(item));
}

/* Plays the promo reel only while it is on screen, always muted, and never against
   the visitor's data plan or reduced-motion preference. The native controls stay
   available, so sound is an explicit choice. */
function initPromoVideo() {
    const video = document.getElementById('promo-video');
    if (!video) return;
    const saveData = navigator.connection && navigator.connection.saveData === true;
    if (saveData || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let autoPaused = false;
    let userPaused = false;
    video.addEventListener('pause', () => { if (!autoPaused) userPaused = true; });
    video.addEventListener('play', () => { userPaused = false; });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= .5 && !userPaused) {
                const playback = video.play();
                if (playback && typeof playback.catch === 'function') playback.catch(() => {});
            } else if (!entry.isIntersecting && !video.paused) {
                autoPaused = true;
                video.pause();
                autoPaused = false;
            }
        });
    }, { threshold: [0, .5] });
    observer.observe(video);
}

function initMagneticButtons() {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.magnetic').forEach(button => {
        button.addEventListener('pointermove', event => {
            const bounds = button.getBoundingClientRect();
            const x = (event.clientX - bounds.left - bounds.width / 2) * .12;
            const y = (event.clientY - bounds.top - bounds.height / 2) * .12;
            button.style.transform = `translate(${x}px, ${y}px)`;
        });
        button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
}

