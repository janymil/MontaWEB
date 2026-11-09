// ==========================================================================
// MontaWeb by Semantika TECH (RUC 20616806981)
// Interactive Experience & Smart Tools (2026 Edition)
// ==========================================================================

const MONTAWEB_CONFIG = {
    brand: 'MontaWeb',
    provider: 'Semantika TECH',
    ruc: '20616806981',
    phone: '965403196',
    whatsappNumber: '51965403196'
};

document.addEventListener('DOMContentLoaded', function() {
    try { initNavigation(); } catch (e) { console.warn('Navigation init error:', e); }
    try { initDarkMode(); } catch (e) { console.warn('Dark mode init error:', e); }
    try { initPortfolioFilters(); } catch (e) { console.warn('Portfolio filter error:', e); }
    try { initFAQ(); } catch (e) { console.warn('FAQ init error:', e); }
    try { initSmoothScrolling(); } catch (e) { console.warn('Smooth scroll error:', e); }
    try { initAnimations(); } catch (e) { console.warn('Animations error:', e); }
    try { initBackToTop(); } catch (e) { console.warn('Back to top error:', e); }
    try { initFloatingWidgets(); } catch (e) { console.warn('Floating widgets error:', e); }
    try { initPriceCalculator(); } catch (e) { console.warn('Price calculator error:', e); }
    try { initProjectQuiz(); } catch (e) { console.warn('Project quiz error:', e); }
    try { initContactFormWhatsApp(); } catch (e) { console.warn('Contact form error:', e); }
    try { initLeadMagnetDownload(); } catch (e) { console.warn('Lead magnet error:', e); }
});

// ==========================================================================
// 1. Navigation & Mobile Menu
// ==========================================================================
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navDropdowns = document.querySelectorAll('.nav-dropdown');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        document.addEventListener('click', function(e) {
            if (e && e.target && navToggle && navMenu) {
                const clickedInside = navToggle.contains(e.target) || navMenu.contains(e.target);
                if (!clickedInside) {
                    navToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            }
        });
    }

    navDropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });
}

// ==========================================================================
// 2. Dark / Light Theme Switcher
// ==========================================================================
function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    const savedTheme = localStorage.getItem('montaweb_theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        htmlEl.setAttribute('data-theme', savedTheme);
    } else if (systemDark) {
        htmlEl.setAttribute('data-theme', 'dark');
    } else {
        htmlEl.setAttribute('data-theme', 'light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const current = htmlEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', next);
            localStorage.setItem('montaweb_theme', next);
        });
    }
}

// ==========================================================================
// 3. Portfolio Category Filtering
// ==========================================================================
function initPortfolioFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    if (!filterBtns.length || !portfolioItems.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// ==========================================================================
// 4. FAQ Accordion
// ==========================================================================
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                faqItems.forEach(other => other.classList.remove('active'));
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}

// ==========================================================================
// 5. Smooth Scrolling & Scroll Animations
// ==========================================================================
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                window.scrollTo({
                    top: target.offsetTop - 88,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initAnimations() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    const els = document.querySelectorAll('.bento-card, .service-card, .service-card-new, .client-card, .portfolio-card, .testimonial-card, .feature-item, .workflow-step, .contact-method');
    els.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(18px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.setAttribute('aria-label', 'Volver arriba');
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 360) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==========================================================================
// 6. Global Floating WhatsApp & Price Comparator Injection
// ==========================================================================
function initFloatingWidgets() {
    // Ensure floating WhatsApp button exists on all pages
    if (!document.querySelector('.whatsapp-float')) {
        const waBtn = document.createElement('a');
        waBtn.href = `https://wa.me/${MONTAWEB_CONFIG.whatsappNumber}?text=${encodeURIComponent('Hola MontaWeb, quiero información sobre sus servicios de diseño web.')}`;
        waBtn.target = '_blank';
        waBtn.className = 'whatsapp-float';
        waBtn.setAttribute('aria-label', 'Contactar por WhatsApp');
        waBtn.innerHTML = '<i class="fab fa-whatsapp"></i>';
        document.body.appendChild(waBtn);
    }

    // Ensure Floating Price Comparator exists on main pages if not already in DOM
    if (!document.getElementById('floatingCalculatorBtn')) {
        const calcBtn = document.createElement('div');
        calcBtn.className = 'floating-calculator-btn';
        calcBtn.id = 'floatingCalculatorBtn';
        calcBtn.innerHTML = `
            <div class="floating-btn-content">
                <i class="fas fa-calculator"></i>
                <span class="floating-btn-text">Comparar Precios</span>
            </div>
        `;
        document.body.appendChild(calcBtn);
    }

    if (!document.getElementById('calculatorModal')) {
        const modal = document.createElement('div');
        modal.className = 'calculator-modal';
        modal.id = 'calculatorModal';
        modal.innerHTML = `
            <div class="modal-overlay" id="modalOverlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-scale-balanced" style="color:var(--mw-primary);margin-right:8px;"></i> Comparador de Precios Web</h3>
                    <button class="modal-close" id="modalClose" aria-label="Cerrar"><i class="fas fa-times"></i></button>
                </div>
                <div class="calculator-form">
                    <div class="form-section">
                        <label for="projectType">1. Selecciona el tipo de proyecto:</label>
                        <select id="projectType" onchange="calculatePrice()">
                            <option value="">Elige el tipo de web...</option>
                            <option value="landing">Landing Page de Alta Conversión (S/ 50)</option>
                            <option value="simple">Web Simple Profesional 1-3 secciones (S/ 99)</option>
                            <option value="redesign">Rediseño de Web Existente (S/ 199)</option>
                            <option value="corporate">Web Corporativa / Empresarial (S/ 249)</option>
                            <option value="ecommerce">Tienda Online / E-commerce con Yape y Plin (S/ 299)</option>
                            <option value="custom">Sistema / Proyecto a Medida (S/ 399)</option>
                        </select>
                    </div>
                    <div class="form-section">
                        <label>2. Incluye funcionalidades adicionales:</label>
                        <div class="checkbox-group">
                            <label class="checkbox-item"><input type="checkbox" value="seo" checked onchange="calculatePrice()"><span>SEO en Google (Gratis)</span></label>
                            <label class="checkbox-item"><input type="checkbox" value="hosting" checked onchange="calculatePrice()"><span>Hosting + SSL (Gratis)</span></label>
                            <label class="checkbox-item"><input type="checkbox" value="content" onchange="calculatePrice()"><span>Redacción de textos (+S/ 40)</span></label>
                            <label class="checkbox-item"><input type="checkbox" value="gmb" onchange="calculatePrice()"><span>Google Mi Negocio (+S/ 79)</span></label>
                            <label class="checkbox-item"><input type="checkbox" value="maintenance" onchange="calculatePrice()"><span>Soporte Mensual (+S/ 49)</span></label>
                            <label class="checkbox-item"><input type="checkbox" value="analytics" checked onchange="calculatePrice()"><span>WhatsApp + Analytics (Gratis)</span></label>
                        </div>
                    </div>
                    <div class="form-section">
                        <label for="timeline">3. Prioridad de entrega:</label>
                        <select id="timeline" onchange="calculatePrice()">
                            <option value="normal">Estándar (3 a 7 días hábiles)</option>
                            <option value="urgent">Express Prioritario (48 - 72 horas)</option>
                            <option value="flexible">Flexible (2 semanas)</option>
                        </select>
                    </div>
                    <div class="results-section" id="resultsSection" style="display: none;">
                        <div class="price-comparison">
                            <div class="competitor-price">
                                <div class="price-label">Otras Agencias en Perú</div>
                                <div class="price-range" id="competitorPrice">S/ 900 - S/ 2,200</div>
                                <small style="color:var(--text-muted)">Cobros extras por hosting y SSL</small>
                            </div>
                            <div class="vs-divider"><span>VS</span></div>
                            <div class="our-price">
                                <div class="price-label">Precio MontaWeb</div>
                                <div class="price-range our-price-highlight" id="ourPrice">S/ 99</div>
                                <small style="color:var(--mw-accent);font-weight:600;">Todo incluido • Garantía 100%</small>
                            </div>
                        </div>
                        <div class="savings-highlight" id="savingsHighlight">
                            <div class="savings-badge">
                                <i class="fas fa-piggy-bank"></i>
                                <span>¡Ahorras hasta S/ 1,800 con MontaWeb!</span>
                            </div>
                        </div>
                        <a href="https://wa.me/51965403196" id="calcWhatsappCta" class="btn btn-primary-calc" target="_blank">
                            <i class="fab fa-whatsapp"></i> Solicitar este presupuesto por WhatsApp
                        </a>
                        <button type="button" class="btn btn-secondary-calc" onclick="resetCalculator()">
                            <i class="fas fa-redo"></i> Calcular otra combinación
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// ==========================================================================
// 7. Upgraded Price Comparator Logic (2.0)
// ==========================================================================
window.priceData = {
    projectTypes: {
        landing: { name: 'Landing Page', competitorMin: 550, competitorMax: 1400, ourPrice: 50 },
        simple: { name: 'Web Simple Profesional', competitorMin: 850, competitorMax: 2200, ourPrice: 99 },
        redesign: { name: 'Rediseño Web Moderno', competitorMin: 900, competitorMax: 2500, ourPrice: 199 },
        corporate: { name: 'Web Corporativa', competitorMin: 1500, competitorMax: 3800, ourPrice: 249 },
        ecommerce: { name: 'Tienda Online E-commerce', competitorMin: 2400, competitorMax: 6000, ourPrice: 299 },
        custom: { name: 'Proyecto a Medida', competitorMin: 2800, competitorMax: 7500, ourPrice: 399 }
    },
    addons: {
        seo: { name: 'SEO Básico', competitorPrice: 250, ourPrice: 0 },
        content: { name: 'Creación de Contenido', competitorPrice: 300, ourPrice: 40 },
        hosting: { name: 'Hosting + SSL', competitorPrice: 220, ourPrice: 0 },
        gmb: { name: 'Google Mi Negocio', competitorPrice: 280, ourPrice: 79 },
        maintenance: { name: 'Mantenimiento Mensual', competitorPrice: 250, ourPrice: 49 },
        ssl: { name: 'Certificado SSL', competitorPrice: 120, ourPrice: 0 },
        analytics: { name: 'Google Analytics', competitorPrice: 150, ourPrice: 0 }
    },
    timelines: {
        urgent: { multiplier: 1.25, name: 'Express (48-72h)' },
        normal: { multiplier: 1.0, name: 'Estándar (3-7 días)' },
        flexible: { multiplier: 1.0, name: 'Flexible' }
    }
};

function initPriceCalculator() {
    const floatingBtn = document.getElementById('floatingCalculatorBtn');
    const modal = document.getElementById('calculatorModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');

    if (!floatingBtn || !modal) return;

    floatingBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    function hideModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (modalOverlay) modalOverlay.addEventListener('click', hideModal);
    if (modalClose) modalClose.addEventListener('click', hideModal);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            hideModal();
        }
    });

    // Trigger open from any button with data-open-calculator
    document.querySelectorAll('[data-open-calculator]').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    });
}

window.calculatePrice = function() {
    const projectTypeEl = document.getElementById('projectType');
    const timelineEl = document.getElementById('timeline');
    const resultsSection = document.getElementById('resultsSection');
    if (!projectTypeEl || !resultsSection) return;

    const projectType = projectTypeEl.value;
    const timeline = timelineEl ? timelineEl.value : 'normal';
    const checkboxes = document.querySelectorAll('#calculatorModal .checkbox-group input[type="checkbox"]:checked');

    if (!projectType) {
        resultsSection.style.display = 'none';
        return;
    }

    const project = window.priceData.projectTypes[projectType];
    if (!project) return;

    let competitorMin = project.competitorMin;
    let competitorMax = project.competitorMax;
    let ourPrice = project.ourPrice;

    let selectedAddons = [];
    checkboxes.forEach(cb => {
        const addon = window.priceData.addons[cb.value];
        if (addon) {
            competitorMin += addon.competitorPrice;
            competitorMax += addon.competitorPrice;
            ourPrice += addon.ourPrice;
            selectedAddons.push(addon.name);
        }
    });

    if (timeline && window.priceData.timelines[timeline]) {
        const mult = window.priceData.timelines[timeline].multiplier;
        competitorMin = Math.round(competitorMin * mult);
        competitorMax = Math.round(competitorMax * mult);
        ourPrice = Math.round(ourPrice * mult);
    }

    const compEl = document.getElementById('competitorPrice');
    const ourEl = document.getElementById('ourPrice');
    const savingsEl = document.getElementById('savingsHighlight');
    const waCta = document.getElementById('calcWhatsappCta') || resultsSection.querySelector('.btn-primary-calc');

    if (compEl) compEl.textContent = `S/ ${competitorMin.toLocaleString()} - S/ ${competitorMax.toLocaleString()}`;
    if (ourEl) ourEl.textContent = `S/ ${ourPrice.toLocaleString()}`;

    const minSavings = Math.max(0, competitorMin - ourPrice);
    const maxSavings = Math.max(0, competitorMax - ourPrice);

    if (savingsEl) {
        const span = savingsEl.querySelector('.savings-badge span');
        if (span) {
            span.textContent = `¡Ahorras entre S/ ${minSavings.toLocaleString()} y S/ ${maxSavings.toLocaleString()}!`;
        }
    }

    if (waCta) {
        const msg = `Hola MontaWeb, usé el Comparador de Precios y quiero cotizar:\n• Proyecto: ${project.name}\n• Extras: ${selectedAddons.join(', ') || 'Estándar'}\n• Precio estimado MontaWeb: S/ ${ourPrice}`;
        waCta.href = `https://wa.me/${MONTAWEB_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    }

    resultsSection.style.display = 'block';
};

window.resetCalculator = function() {
    const projectTypeEl = document.getElementById('projectType');
    const resultsSection = document.getElementById('resultsSection');
    if (projectTypeEl) projectTypeEl.value = '';
    if (resultsSection) resultsSection.style.display = 'none';
};

// ==========================================================================
// 8. Interactive Plan Recommender Quiz (New Feature on Home & Servicios)
// ==========================================================================
function initProjectQuiz() {
    const quizBox = document.getElementById('montaweb-quiz');
    if (!quizBox) return;

    const state = { goal: '', stage: '', content: '' };

    quizBox.querySelectorAll('[data-quiz-step="1"] .quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            state.goal = this.getAttribute('data-value');
            setQuizStep(2);
        });
    });

    quizBox.querySelectorAll('[data-quiz-step="2"] .quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            state.stage = this.getAttribute('data-value');
            setQuizStep(3);
        });
    });

    quizBox.querySelectorAll('[data-quiz-step="3"] .quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            state.content = this.getAttribute('data-value');
            showQuizRecommendation(state);
        });
    });

    const restartBtn = document.getElementById('quizRestartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            setQuizStep(1);
        });
    }

    function setQuizStep(stepNum) {
        quizBox.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
        const target = quizBox.querySelector(`[data-quiz-step="${stepNum}"]`);
        if (target) target.classList.add('active');

        quizBox.querySelectorAll('.quiz-dot').forEach((dot, idx) => {
            dot.classList.toggle('active', idx < stepNum);
        });
    }

    function showQuizRecommendation(st) {
        let planName = 'Web Simple Profesional';
        let basePrice = 99;
        let desc = 'Ideal para presentar tu negocio con hasta 3 secciones modernas, botón directo a WhatsApp, SEO básico y hosting gratis por 6 meses.';

        if (st.goal === 'campaign') {
            planName = 'Landing Page de Conversión';
            basePrice = 50;
            desc = 'Página estratégica de aterrizaje diseñada para campañas de anuncios, promociones o captación rápida de clientes por WhatsApp.';
        } else if (st.goal === 'store') {
            planName = 'Tienda Online E-commerce';
            basePrice = 299;
            desc = 'Catálogo completo de productos, carrito de compras y pagos integrados con Yape, Plin, tarjetas y pedidos por WhatsApp.';
        } else if (st.stage === 'redesign') {
            planName = 'Rediseño Web Moderno';
            basePrice = 199;
            desc = 'Transformamos tu web antigua en una plataforma ultrarrápida, moderna y adaptada a celulares manteniendo tu posicionamiento.';
        }

        let extrasText = [];
        if (st.content === 'need-content') {
            basePrice += 40;
            extrasText.push('Creación de Textos e Imágenes (+S/ 40)');
        }
        if (st.stage === 'maps') {
            basePrice += 79;
            extrasText.push('Ficha Google Mi Negocio (+S/ 79)');
        }

        const titleEl = document.getElementById('quizResultTitle');
        const priceEl = document.getElementById('quizResultPrice');
        const descEl = document.getElementById('quizResultDesc');
        const waEl = document.getElementById('quizResultWhatsapp');

        if (titleEl) titleEl.textContent = planName + (extrasText.length ? ' + Pack Impulso' : '');
        if (priceEl) priceEl.textContent = `S/ ${basePrice} pago único`;
        if (descEl) descEl.textContent = desc + (extrasText.length ? ` Incluye: ${extrasText.join(' + ')}.` : '');

        if (waEl) {
            const msg = `Hola MontaWeb, hice el test en la web y mi plan ideal es: *${planName}* (Presupuesto estimado: S/ ${basePrice}). Quiero empezar mi proyecto.`;
            waEl.href = `https://wa.me/${MONTAWEB_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
        }

        setQuizStep(4);
    }
}

// ==========================================================================
// 9. Contact Form Direct WhatsApp & Fallback Integration
// ==========================================================================
function initContactFormWhatsApp() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = (document.getElementById('nombre')?.value || '').trim();
        const telefono = (document.getElementById('telefono')?.value || '').trim();
        const email = (document.getElementById('email')?.value || '').trim();
        const empresa = (document.getElementById('empresa')?.value || '').trim();
        const servicio = (document.getElementById('servicio')?.value || '').trim();
        const rubro = (document.getElementById('tipo-negocio')?.value || '').trim();
        const presupuesto = (document.getElementById('presupuesto')?.value || '').trim();
        const mensaje = (document.getElementById('mensaje')?.value || '').trim();

        if (!nombre || !telefono || !mensaje) {
            alert('Por favor completa tu nombre, teléfono y detalles del proyecto.');
            return;
        }

        const waMessage = `Hola *MontaWeb*, solicito una cotización web:\n\n` +
            `• *Nombre:* ${nombre}\n` +
            `• *Teléfono:* ${telefono}\n` +
            `• *Email:* ${email}\n` +
            (empresa ? `• *Empresa:* ${empresa}\n` : '') +
            (servicio ? `• *Servicio:* ${servicio}\n` : '') +
            (rubro ? `• *Rubro:* ${rubro}\n` : '') +
            (presupuesto ? `• *Presupuesto:* ${presupuesto}\n` : '') +
            `• *Proyecto:* ${mensaje}`;

        const waUrl = `https://wa.me/${MONTAWEB_CONFIG.whatsappNumber}?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank');
        window.location.href = '/gracias';
    });
}

// ==========================================================================
// 10. Lead Magnet Instant Access
// ==========================================================================
function initLeadMagnetDownload() {
    const leadForm = document.getElementById('mc-embedded-subscribe-form');
    if (!leadForm) return;

    leadForm.addEventListener('submit', function() {
        const dlBox = document.getElementById('download-links');
        if (dlBox) dlBox.style.display = 'block';
        setTimeout(() => {
            window.location.href = '/gracias-descarga';
        }, 900);
    });
}

