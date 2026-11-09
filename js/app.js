/* ==========================================================================
   MontaWeb — Interactive Experience 2026
   Nav / Theme / FAQ / Portfolio filters / Price comparator / Plan quiz /
   Floating widgets / Contact form (WhatsApp) / Reveal animations
   ========================================================================== */
'use strict';

const MW = {
    brand: 'MontaWeb',
    phone: '965403196',
    wa: '51965403196'
};

document.addEventListener('DOMContentLoaded', () => {
    const safe = fn => { try { fn(); } catch (e) { console.warn('[MontaWeb]', e); } };
    safe(initNav);
    safe(initTheme);
    safe(initFaq);
    safe(initPortfolioFilters);
    safe(initReveal);
    safe(initSmoothAnchors);
    safe(initBackToTop);
    safe(initFloatingWidgets);
    safe(initCalculator);
    safe(initCalculatorLogic);
    safe(initQuiz);
    safe(initContactForm);
});

/* ---------- 1. Navigation ---------- */
function initNav() {
    const burger = document.getElementById('nav-burger');
    const menu = document.getElementById('nav-menu');
    if (burger && menu) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            menu.classList.toggle('active');
        });
        menu.querySelectorAll('.nav__link, .nav__cta').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                menu.classList.remove('active');
            });
        });
        document.addEventListener('click', e => {
            if (!menu.contains(e.target) && !burger.contains(e.target)) {
                burger.classList.remove('active');
                menu.classList.remove('active');
            }
        });
    }
    document.querySelectorAll('.nav__dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', e => {
            if (window.innerWidth <= 860) {
                e.preventDefault();
                toggle.closest('.nav__dropdown').classList.toggle('active');
            }
        });
    });
}

/* ---------- 2. Theme (dark default, persisted) ---------- */
function initTheme() {
    const html = document.documentElement;
    const saved = localStorage.getItem('mw-theme');
    html.setAttribute('data-theme', saved || 'dark');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', next);
            localStorage.setItem('mw-theme', next);
        });
    }
}

/* ---------- 3. FAQ accordion ---------- */
function initFaq() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach(item => {
        const q = item.querySelector('.faq-q');
        if (!q) return;
        q.addEventListener('click', () => {
            const wasActive = item.classList.contains('active');
            items.forEach(i => i.classList.remove('active'));
            if (!wasActive) item.classList.add('active');
        });
    });
}

/* ---------- 4. Portfolio filters ---------- */
function initPortfolioFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.work[data-category]');
    if (!buttons.length || !cards.length) return;
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            cards.forEach(card => {
                card.style.display = (f === 'all' || card.dataset.category === f) ? '' : 'none';
            });
        });
    });
}

/* ---------- 5. Scroll reveal ---------- */
function initReveal() {
    const els = document.querySelectorAll('.f-card, .step, .p-card, .work, .t-card, .contact-card, .faq-item, .quiz-wrap');
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('reveal', 'in')); return; }
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => { el.classList.add('reveal'); io.observe(el); });
}

/* ---------- 6. Smooth anchors ---------- */
function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.offsetTop - 90, behavior: 'smooth' });
            }
        });
    });
}

/* ---------- 7. Back to top (one per page, shared by every page loading app.js) ---------- */
const MW_BACK_TO_TOP_FROM = 420;

function initBackToTop() {
    if (document.getElementById('back-to-top')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'back-to-top';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Volver arriba');
    btn.setAttribute('title', 'Volver arriba');
    btn.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
    document.body.appendChild(btn);

    const toggle = () => btn.classList.toggle('show', window.scrollY > MW_BACK_TO_TOP_FROM);
    window.addEventListener('scroll', toggle, { passive: true });
    // A page opened on an anchor (/servicios#precios) is already scrolled before any scroll event.
    toggle();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- 8. Floating WhatsApp + calculator button ---------- */
function initFloatingWidgets() {
    if (!document.querySelector('.wa-float')) {
        const wa = document.createElement('a');
        wa.href = `https://wa.me/${MW.wa}?text=${encodeURIComponent('Hola MontaWeb, quiero información sobre sus servicios de diseño web.')}`;
        wa.target = '_blank';
        wa.className = 'wa-float';
        wa.setAttribute('aria-label', 'Contactar por WhatsApp');
        wa.innerHTML = '<i class="fab fa-whatsapp"></i>';
        document.body.appendChild(wa);
    }
    if (!document.getElementById('calcFloatBtn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'calcFloatBtn';
        btn.className = 'calc-btn-float';
        btn.innerHTML = '<i class="fas fa-calculator"></i><span>Comparar Precios</span>';
        document.body.appendChild(btn);
    }
}

/* ---------- 9. Price comparator ---------- */
const MW_PRICES = {
    types: {
        menuqr:    { name: 'Menú Digital QR', min: 150, max: 450, ours: 69 },
        landing:   { name: 'Landing Page', min: 550, max: 1400, ours: 50 },
        catalogo:  { name: 'Catálogo WhatsApp', min: 120, max: 400, ours: 59 },
        simple:    { name: 'Web Simple Profesional', min: 850, max: 2200, ours: 99 },
        redesign:  { name: 'Rediseño Web Moderno', min: 900, max: 2500, ours: 199 },
        corporate: { name: 'Web Corporativa', min: 1500, max: 3800, ours: 249 },
        ecommerce: { name: 'Tienda Starter', min: 2400, max: 6000, ours: 299 },
        tiendapro: { name: 'Tienda Pro con pasarela', min: 3500, max: 8500, ours: 499 },
        custom:    { name: 'Proyecto a Medida', min: 2800, max: 7500, ours: 399 }
    },
    addons: {
        seo:         { name: 'SEO Básico', comp: 250, ours: 0 },
        content:     { name: 'Creación de Contenido', comp: 300, ours: 40 },
        hosting:     { name: 'Hosting + SSL', comp: 220, ours: 0 },
        gmb:         { name: 'Google Mi Negocio', comp: 280, ours: 79 },
        maintenance: { name: 'Soporte Mensual', comp: 250, ours: 49 },
        analytics:   { name: 'WhatsApp + Analytics', comp: 150, ours: 0 }
    },
    timelines: {
        normal:   { mult: 1.0 },
        urgent:   { mult: 1.25 },
        flexible: { mult: 1.0 }
    }
};

function initCalculator() {
    if (!document.getElementById('calcModal')) {
        const modal = document.createElement('div');
        modal.className = 'calc-modal';
        modal.id = 'calcModal';
        modal.innerHTML = `
        <div class="calc-modal__overlay" id="calcOverlay"></div>
        <div class="calc-modal__box">
            <div class="calc-modal__head">
                <h3><i class="fas fa-scale-balanced"></i>Comparador de Precios Web</h3>
                <button class="calc-close" id="calcClose" aria-label="Cerrar"><i class="fas fa-times"></i></button>
            </div>
            <div class="calc-field">
                <label for="calcType">1. Selecciona el tipo de proyecto:</label>
                <select id="calcType">
                    <option value="">Elige el tipo de web...</option>
                    <option value="menuqr">Menú Digital QR (S/ 69)</option>
                    <option value="landing">Landing Page de Alta Conversión (S/ 50)</option>
                    <option value="catalogo">Catálogo WhatsApp (S/ 59)</option>
                    <option value="simple">Web Simple Profesional 1-3 secciones (S/ 99)</option>
                    <option value="redesign">Rediseño de Web Existente (S/ 199)</option>
                    <option value="corporate">Web Corporativa / Empresarial (S/ 249)</option>
                    <option value="ecommerce">Tienda Starter con Yape y Plin (S/ 299)</option>
                    <option value="tiendapro">Tienda Pro con pasarela de pagos (S/ 499)</option>
                    <option value="custom">Sistema / Proyecto a Medida (S/ 399)</option>
                </select>
            </div>
            <div class="calc-field">
                <label>2. Incluye funcionalidades adicionales:</label>
                <div class="calc-checks">
                    <label><input type="checkbox" value="seo" checked> SEO en Google (Gratis)</label>
                    <label><input type="checkbox" value="hosting" checked> Hosting + SSL (Gratis)</label>
                    <label><input type="checkbox" value="content"> Redacción de textos (+S/ 40/página)</label>
                    <label><input type="checkbox" value="gmb"> Google Mi Negocio (+S/ 79)</label>
                    <label><input type="checkbox" value="maintenance"> Soporte Mensual (+S/ 49)</label>
                    <label><input type="checkbox" value="analytics" checked> WhatsApp + Analytics (Gratis)</label>
                </div>
            </div>
            <div class="calc-field">
                <label for="calcTimeline">3. Prioridad de entrega:</label>
                <select id="calcTimeline">
                    <option value="normal">Estándar (3 a 7 días hábiles)</option>
                    <option value="urgent">Express Prioritario (48 - 72 horas)</option>
                    <option value="flexible">Flexible (2 semanas)</option>
                </select>
            </div>
            <div class="calc-results" id="calcResults" style="display:none;">
                <div class="calc-vs">
                    <div class="calc-vs__side"><small>Otras agencias</small><div class="val" id="calcCompetitor"></div><small style="text-transform:none;letter-spacing:0;">+ cobros extras</small></div>
                    <div class="calc-vs__divider">VS</div>
                    <div class="calc-vs__side calc-vs__side--ours"><small>Precio MontaWeb</small><div class="val" id="calcOurs"></div><small style="text-transform:none;letter-spacing:0;">todo incluido</small></div>
                </div>
                <div class="calc-save"><i class="fas fa-piggy-bank"></i><span id="calcSaveText"></span></div>
                <a href="#" id="calcWhatsapp" class="btn btn--whatsapp btn--block" target="_blank"><i class="fab fa-whatsapp"></i> Solicitar este presupuesto por WhatsApp</a>
                <button type="button" class="btn btn--ghost btn--block" id="calcReset" style="margin-top:.7rem;"><i class="fas fa-rotate-left"></i> Calcular otra combinación</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
    }
}

function initCalculatorLogic() {
    const modal = document.getElementById('calcModal');
    if (!modal) return;
    const openModal = () => { modal.classList.add('show'); document.body.style.overflow = 'hidden'; };
    const closeModal = () => { modal.classList.remove('show'); document.body.style.overflow = ''; };

    document.getElementById('calcFloatBtn')?.addEventListener('click', openModal);
    document.getElementById('calcOverlay')?.addEventListener('click', closeModal);
    document.getElementById('calcClose')?.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    document.querySelectorAll('[data-open-calculator]').forEach(t => t.addEventListener('click', e => { e.preventDefault(); openModal(); }));

    const recalc = () => {
        const type = document.getElementById('calcType').value;
        const results = document.getElementById('calcResults');
        if (!type) { results.style.display = 'none'; return; }
        const p = MW_PRICES.types[type];
        let min = p.min, max = p.max, ours = p.ours;
        const chosen = [];
        document.querySelectorAll('#calcModal .calc-checks input:checked').forEach(cb => {
            const a = MW_PRICES.addons[cb.value];
            if (a) { min += a.comp; max += a.comp; ours += a.ours; chosen.push(a.name); }
        });
        const tl = document.getElementById('calcTimeline').value;
        const mult = MW_PRICES.timelines[tl] ? MW_PRICES.timelines[tl].mult : 1;
        min = Math.round(min * mult); max = Math.round(max * mult); ours = Math.round(ours * mult);

        document.getElementById('calcCompetitor').textContent = `S/ ${min.toLocaleString()} - S/ ${max.toLocaleString()}`;
        document.getElementById('calcOurs').textContent = `S/ ${ours.toLocaleString()}`;
        document.getElementById('calcSaveText').textContent = `¡Ahorras entre S/ ${Math.max(0, min - ours).toLocaleString()} y S/ ${Math.max(0, max - ours).toLocaleString()}!`;
        const msg = `Hola MontaWeb, usé el Comparador de Precios y quiero cotizar:\n• Proyecto: ${p.name}\n• Extras: ${chosen.join(', ') || 'Estándar'}\n• Precio estimado MontaWeb: S/ ${ours}`;
        document.getElementById('calcWhatsapp').href = `https://wa.me/${MW.wa}?text=${encodeURIComponent(msg)}`;
        results.style.display = 'block';
    };

    document.getElementById('calcType')?.addEventListener('change', recalc);
    document.getElementById('calcTimeline')?.addEventListener('change', recalc);
    document.querySelectorAll('#calcModal .calc-checks input').forEach(cb => cb.addEventListener('change', recalc));
    document.getElementById('calcReset')?.addEventListener('click', () => {
        const t = document.getElementById('calcType');
        if (t) t.value = '';
        document.getElementById('calcResults').style.display = 'none';
    });
}

/* ---------- 10. Plan recommender quiz ---------- */
function initQuiz() {
    const quiz = document.getElementById('mw-quiz');
    if (!quiz) return;
    const state = { goal: null, situation: null, content: null };

    const setStep = n => {
        quiz.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
        quiz.querySelector(`[data-quiz-step="${n}"]`)?.classList.add('active');
        quiz.querySelectorAll('.quiz-dot').forEach((d, i) => d.classList.toggle('active', i < n));
    };

    quiz.querySelectorAll('[data-quiz-step="1"] .quiz-opt').forEach(b => b.addEventListener('click', () => { state.goal = b.dataset.value; setStep(2); }));
    quiz.querySelectorAll('[data-quiz-step="2"] .quiz-opt').forEach(b => b.addEventListener('click', () => { state.situation = b.dataset.value; setStep(3); }));
    quiz.querySelectorAll('[data-quiz-step="3"] .quiz-opt').forEach(b => b.addEventListener('click', () => { state.content = b.dataset.value; showResult(state); }));
    document.getElementById('quizRestart')?.addEventListener('click', () => setStep(1));

    function showResult(st) {
        let rec;
        if (st.goal === 'store') {
            rec = { title: 'Tienda Starter', price: 'S/ 299 • pago único', desc: 'Catálogo de hasta 20 productos con carrito, pedidos y pagos por Yape/Plin directo a tu WhatsApp, diseño premium y hosting gratis por 6 meses. Si necesitas más catálogo o cobros con tarjeta, existe Tienda Pro (S/ 499).', plan: 'Tienda Starter' };
        } else if (st.goal === 'campaign') {
            rec = { title: 'Landing Page de Alta Conversión', price: 'desde S/ 50 • pago único', desc: 'Página de aterrizaje veloz y persuasiva, perfecta para campañas de Facebook, Instagram o TikTok Ads con embudo directo a WhatsApp.', plan: 'Landing Page' };
        } else if (st.situation === 'redesign') {
            rec = { title: 'Rediseño Web Moderno', price: 'desde S/ 199 • pago único', desc: 'Renovamos tu sitio actual: nuevo diseño UI/UX, migración segura del contenido, velocidad extrema y mejor conversión a WhatsApp.', plan: 'Rediseño Web' };
        } else {
            rec = { title: 'Web Simple Profesional', price: 'S/ 99 • pago único', desc: 'Hasta 3 secciones modernas, botón directo a WhatsApp, SEO básico, SSL y hosting gratis por 6 meses. La favorita de los negocios peruanos.', plan: 'Web Simple Profesional' };
        }
        if (st.situation === 'maps') rec.desc += ' Además, potencia tu zona con Google Mi Negocio (+S/ 79).';
        if (st.content === 'need') rec.desc += ' Incluye la Creación de Contenido (+S/ 40) si no tienes textos ni fotos.';

        document.getElementById('quizTitle').textContent = rec.title;
        document.getElementById('quizPrice').textContent = rec.price;
        document.getElementById('quizDesc').textContent = rec.desc;
        const msg = `Hola MontaWeb, el asesor digital me recomendó el plan "${rec.title}". Quiero empezar mi proyecto.`;
        document.getElementById('quizWhatsapp').href = `https://wa.me/${MW.wa}?text=${encodeURIComponent(msg)}`;
        setStep(4);
    }
}

/* ---------- 11. Contact form → WhatsApp ---------- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form || form.dataset.handler === 'emailjs') return;
    form.addEventListener('submit', e => {
        e.preventDefault();
        const val = id => (document.getElementById(id)?.value || '').trim();
        const nombre = val('nombre'), telefono = val('telefono'), email = val('email');
        const empresa = val('empresa'), servicio = val('servicio');
        const rubro = val('tipo-negocio'), presupuesto = val('presupuesto'), mensaje = val('mensaje');
        const acepto = document.getElementById('acepto')?.checked === true;

        if (!nombre || !telefono || !mensaje) {
            alert('Por favor completa tu nombre, teléfono y detalles del proyecto.');
            return;
        }
        if (!acepto) {
            alert('Autoriza el uso de tus datos para responder tu solicitud y consulta la Política de privacidad.');
            document.getElementById('acepto')?.focus();
            return;
        }
        const waMessage = `Hola *MontaWeb*, solicito una cotización web:\n\n` +
            `• *Nombre:* ${nombre}\n• *Teléfono:* ${telefono}\n• *Email:* ${email}\n` +
            `• *Autorizo el uso de mis datos para responder esta solicitud:* Sí\n` +
            (empresa ? `• *Empresa:* ${empresa}\n` : '') +
            (servicio ? `• *Servicio:* ${servicio}\n` : '') +
            (rubro ? `• *Rubro:* ${rubro}\n` : '') +
            (presupuesto ? `• *Presupuesto:* ${presupuesto}\n` : '') +
            `• *Proyecto:* ${mensaje}`;
        window.open(`https://wa.me/${MW.wa}?text=${encodeURIComponent(waMessage)}`, '_blank');
        window.location.href = '/gracias';
    });
}
