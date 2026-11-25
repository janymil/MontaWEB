/* Consent-gated analytics: GA4 + Meta Pixel load only after the visitor accepts.
 * Counts WhatsApp and phone clicks as leads (GA4 `generate_lead`, Pixel `Contact`).
 * With both IDs empty this file does nothing (no banner, no requests). */
(function () {
    'use strict';
    var GA4_ID = 'G-L8EY4JE7DQ';   // GA4 property "MontaWeb" (account Semantika TECH)
    var META_PIXEL_ID = '';   // e.g. '123456789012345'
    var KEY = 'mw-consent-v1';
    if (!GA4_ID && !META_PIXEL_ID) return;

    var loaded = false;

    function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function save(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }

    function addScript(src) {
        var s = document.createElement('script');
        s.async = true; s.src = src;
        document.head.appendChild(s);
    }

    function loadTrackers() {
        if (loaded) return; loaded = true;
        if (GA4_ID) {
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', GA4_ID);
            addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID));
        }
        if (META_PIXEL_ID && !window.fbq) {
            var f = window.fbq = function () {
                f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments);
            };
            if (!window._fbq) window._fbq = f;
            f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
            addScript('https://connect.facebook.net/en_US/fbevents.js');
            window.fbq('init', META_PIXEL_ID);
            window.fbq('track', 'PageView');
        }
    }

    // Lead clicks: one delegated listener, cheap for INP (no work unless a contact link is hit).
    document.addEventListener('click', function (event) {
        if (!loaded) return;
        var link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href') || '';
        var method = /(^|\/\/)(wa\.me|api\.whatsapp\.com)\//.test(href) ? 'whatsapp'
            : href.indexOf('tel:') === 0 ? 'phone' : null;
        if (!method) return;
        var where = link.className && typeof link.className === 'string' ? link.className.split(' ')[0] : 'link';
        if (window.gtag) window.gtag('event', 'generate_lead', { method: method, link_location: where, page_path: location.pathname, transport_type: 'beacon' });
        if (window.fbq) window.fbq('track', 'Contact', { content_name: method });
    }, { capture: true, passive: true });

    var CSS = '.mw-consent{position:fixed;inset:auto 16px 16px 16px;z-index:9999;max-width:560px;margin-inline:auto;' +
        'background:#16150f;color:#f3f0e7;border-radius:16px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.25);' +
        'font:15px/1.5 Manrope,system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:12px;align-items:center}' +
        '.mw-consent p{margin:0;flex:1 1 260px}.mw-consent a{color:inherit;text-decoration:underline;text-underline-offset:3px}' +
        '.mw-consent div{display:flex;gap:8px}.mw-consent button{font:inherit;font-weight:700;border-radius:999px;padding:9px 18px;cursor:pointer;' +
        'border:1px solid #f3f0e7;background:transparent;color:#f3f0e7}.mw-consent button[data-v=granted]{background:#f3f0e7;color:#16150f}' +
        '.mw-consent button:focus-visible{outline:3px solid #ff5a36;outline-offset:2px}' +
        '@media print{.mw-consent{display:none}}';

    function showBanner() {
        if (document.querySelector('.mw-consent')) return;
        var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
        var box = document.createElement('section');
        box.className = 'mw-consent';
        box.setAttribute('aria-label', 'Aviso de cookies');
        var tools = META_PIXEL_ID && GA4_ID ? 'Google Analytics y Meta' : (GA4_ID ? 'Google Analytics' : 'Meta');
        box.innerHTML = '<p>Usamos cookies de ' + tools + ' para saber qué páginas se visitan y cuántas personas nos escriben por WhatsApp. Solo se activan si aceptas. <a href="/privacidad#cookies">Más información</a></p>' +
            '<div><button type="button" data-v="denied">Rechazar</button><button type="button" data-v="granted">Aceptar</button></div>';
        box.addEventListener('click', function (e) {
            var v = e.target.getAttribute && e.target.getAttribute('data-v');
            if (!v) return;
            save(v); box.remove();
            if (v === 'granted') loadTrackers();
        });
        document.body.appendChild(box);
    }

    // Public hook for the "change my choice" button on /privacidad.
    window.mwConsent = {
        reset: function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } location.reload(); }
    };

    function start() {
        var v = read();
        if (v === 'granted') loadTrackers();
        else if (v !== 'denied') showBanner();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
