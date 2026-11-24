/* Shared public-site navigation, progress and reveal behavior. */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initSiteNavigation();
    initSiteScroll();
});

function initSiteNavigation() {
    const toggle = document.getElementById('home-nav-toggle');
    const menu = document.getElementById('home-nav-menu');
    if (!toggle || !menu) return;

    const close = (returnFocus = false) => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
        menu.classList.remove('open');
        document.body.classList.remove('menu-open');
        if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
        const opening = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(opening));
        toggle.setAttribute('aria-label', opening ? 'Cerrar menú' : 'Abrir menú');
        menu.classList.toggle('open', opening);
        document.body.classList.toggle('menu-open', opening);
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close()));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true);
    });
    document.addEventListener('click', event => {
        if (toggle.getAttribute('aria-expanded') === 'true' && !menu.contains(event.target) && !toggle.contains(event.target)) close();
    });
    window.matchMedia('(min-width: 681px)').addEventListener('change', event => {
        if (event.matches) close();
    });
}

function initSiteScroll() {
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
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
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
    }, { threshold: .06, rootMargin: '0px 0px -35px' });
    items.forEach(item => observer.observe(item));
}
