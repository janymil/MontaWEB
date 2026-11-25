/* Blog article behaviour: table of contents, share, interactive figures (vanilla JS, no libraries).
   All numbers come from the JSON embedded in #study-data (built by scripts/build-blog-data.mjs). */
'use strict';

(function () {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // matches the article's "19 168" style
    const pctStr = n => String(Math.round(n * 10) / 10).replace('.', ',') + ' %';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    // Force a reflow, then run: works even when the page was loaded in a background tab (rAF is paused there).
    const raf2 = fn => { void document.body.offsetWidth; setTimeout(fn, 30); };

    function el(tag, attrs = {}, html) {
        const e = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    /* ---------- Share + copy link ---------- */
    function initShare() {
        const url = $('link[rel="canonical"]').href;
        const title = document.title.replace(/\s*\|.*$/, '');
        const enc = encodeURIComponent;
        const targets = {
            wa: `https://wa.me/?text=${enc(title + ' ' + url)}`,
            li: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
            fb: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
            x: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`
        };
        $$('[data-share]').forEach(a => { a.href = targets[a.dataset.share]; });
        const toast = el('div', { class: 'copied', role: 'status' }, 'Enlace copiado');
        document.body.appendChild(toast);
        $$('[data-copy-link]').forEach(btn => btn.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(url); } catch (e) {
                const t = el('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
            }
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 1800);
        }));
    }

    /* ---------- Table of contents: build + scrollspy ---------- */
    function initToc() {
        const heads = $$('.prose h2[id]').filter(h => !h.closest('.takeaways'));
        const lists = $$('ol[data-toc]');
        lists.forEach(list => heads.forEach(h => {
            const li = el('li'); li.appendChild(el('a', { href: '#' + h.id }, h.dataset.toc || h.textContent));
            list.appendChild(li);
        }));
        const links = $$('.toc a');
        if (!('IntersectionObserver' in window)) return;
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
            });
        }, { rootMargin: '-15% 0px -70% 0px' });
        heads.forEach(h => io.observe(h));
    }

    /* ---------- Hero dots: 100 businesses ---------- */
    function fillDots(root, lit, animate) {
        root.innerHTML = '';
        const cells = Array.from({ length: 100 }, () => el('i'));
        cells.forEach(c => root.appendChild(c));
        const turnOn = () => cells.slice(0, lit).forEach((c, i) => {
            if (animate && !reduce) setTimeout(() => c.classList.add('on'), 18 * i + 250); else c.classList.add('on');
        });
        turnOn();
    }
    function initDots(data) {
        const hero = $('#hero-dots');
        if (hero) fillDots(hero, Math.round(data.stack.active.ok), true);
    }

    /* ---------- Figure 1: bars by rubro ---------- */
    function initRubros(data) {
        const root = $('#fig-rubros'); if (!root) return;
        const list = $('.bars', root);
        const state = { base: 'active', seg: 'all' };
        const segNames = { P: 'Presentación', C: 'Reservas, pedidos o matrícula', T: 'Tienda online' };
        function draw() {
            const rows = data.categories.filter(c => state.seg === 'all' || c.seg === state.seg)
                .map(c => ({ c, v: c[state.base] })).sort((a, b) => a.v.pct - b.v.pct);
            list.innerHTML = '';
            rows.forEach(({ c, v }) => {
                const li = el('li', { class: 'bar', 'data-seg': c.seg });
                li.innerHTML = `<span class="bar__label">${cap(c.label)}</span><span class="bar__track" title="${fmt(v.n)} negocios"><span class="bar__fill"></span></span><span class="bar__val">${Math.round(v.pct)} %</span>`;
                list.appendChild(li);
            });
            raf2((() => rows.forEach(({ v }, i) => {
                list.children[i].querySelector('.bar__fill').style.width = Math.max(v.pct, 0.6) + '%';
            })));
            const n = rows.reduce((s, r) => s + r.v.n, 0);
            $('.js-count', root).textContent = `${fmt(n)} negocios · ${rows.length} rubros`;
        }
        function bind(group, key) {
            $$(`[data-group="${group}"] button`, root).forEach(b => b.addEventListener('click', () => {
                $$(`[data-group="${group}"] button`, root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
                state[key] = b.dataset.value; draw();
            }));
        }
        bind('base', 'base'); bind('seg', 'seg');
        const lg = $('.legend', root);
        lg.innerHTML = Object.entries(segNames).map(([k, v]) => `<li><i style="background:${k === 'P' ? '#476b24' : k === 'C' ? 'var(--orange)' : '#3b5b8c'}"></i>${v}</li>`).join('');
        draw();
    }

    /* ---------- Figure 2: zones ---------- */
    function initZones(data) {
        const root = $('#fig-zonas'); if (!root) return;
        const state = { base: 'active' };
        const hasImg = new Set($$('[data-zone-img]', root).map(i => i.dataset.zoneImg));
        function draw() {
            const body = $('.zone-list', root); body.innerHTML = '';
            const zs = [...data.zones].sort((a, b) => b[state.base].pct - a[state.base].pct);
            zs.forEach(z => {
                const v = z[state.base];
                const row = el('div', { class: 'zone-row' });
                const imgSrc = root.dataset['img' + cap(z.key)];
                row.innerHTML = (imgSrc ? `<img src="${imgSrc}" alt="" width="192" height="128" loading="lazy">` : '<span></span>') +
                    `<div class="bar bar--plain ${v.pct < 20 ? 'bar--hot' : ''}"><span class="bar__label">${z.name} <small>· ${fmt(v.n)} negocios</small></span><span class="bar__track"><span class="bar__fill"></span></span><span class="bar__val">${Math.round(v.pct)} %</span></div>`;
                body.appendChild(row);
            });
            raf2((() => $$('.bar__fill', body).forEach((f, i) => { f.style.width = zs[i][state.base].pct + '%'; })));
        }
        $$('[data-group="base"] button', root).forEach(b => b.addEventListener('click', () => {
            $$('[data-group="base"] button', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
            state.base = b.dataset.value; draw();
        }));
        draw();
    }

    /* ---------- Figure 3: what the customer finds ---------- */
    function initStack(data) {
        const root = $('#fig-stack'); if (!root) return;
        const labels = [
            ['ok', 's-ok', 'Una web propia que funciona'],
            ['none', 's-none', 'Ningún enlace en su ficha'],
            ['social', 's-social', 'Solo Facebook, Instagram o WhatsApp'],
            ['broken', 's-broken', 'Una web caída, vencida o «en construcción»'],
            ['plat', 's-plat', 'Solo un perfil en una plataforma o directorio']
        ];
        const bar = $('.stack', root), list = $('.stack-list', root);
        bar.innerHTML = labels.map(([, c]) => `<span class="${c}"></span>`).join('');
        list.innerHTML = labels.map(([, c, t]) => `<li><i class="${c}"></i>${t}<b></b></li>`).join('');
        function draw(base) {
            const s = data.stack[base];
            labels.forEach(([k], i) => {
                bar.children[i].style.flexBasis = s[k] + '%';
                bar.children[i].textContent = s[k] >= 7 ? Math.round(s[k]) + ' %' : '';
                list.children[i].querySelector('b').textContent = pctStr(s[k]);
            });
            $('.js-n', root).textContent = fmt(base === 'all' ? data.independent : data.active);
        }
        $$('[data-group="base"] button', root).forEach(b => b.addEventListener('click', () => {
            $$('[data-group="base"] button', root).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
            draw(b.dataset.value);
        }));
        bar.setAttribute('role', 'img');
        bar.setAttribute('aria-label', 'Barra apilada con el porcentaje de negocios según lo que encuentra el cliente en su ficha de Google');
        draw('active');
        if (!reduce) { labels.forEach((_, i) => { bar.children[i].style.flexBasis = '0%'; }); raf2((() => draw('active'))); }
    }

    /* ---------- Finder: tu rubro + tu zona ---------- */
    function initFinder(data) {
        const root = $('#finder'); if (!root) return;
        const selR = $('#f-rubro', root), selZ = $('#f-zona', root);
        const cats = [...data.categories].sort((a, b) => a.label.localeCompare(b.label, 'es'));
        selR.innerHTML = cats.map(c => `<option value="${c.k}">${cap(c.label)}</option>`).join('');
        selZ.innerHTML = '<option value="all">Todas las zonas</option>' + data.zones.map(z => `<option value="${z.name}">${z.name}</option>`).join('');
        selR.value = 'restaurante';
        const out = $('.finder__out', root);
        const MIN = 15;
        function calc() {
            const cat = selR.value, zone = selZ.value;
            const row = data.cell[cat];
            let n = 0, f = 0; let note = '', zoneUsed = zone;
            const cellOf = z => row[z] || [0, 0];
            if (zone !== 'all') { [n, f] = cellOf(zone); }
            if (zone === 'all' || n < MIN) {
                if (zone !== 'all') note = `En ${zone} solo hay ${n} negocios activos de este rubro en la muestra: muy pocos para una cifra fiable. Te mostramos el rubro en todas las zonas.`;
                n = 0; f = 0; data.zones.forEach(z => { const [a, b] = cellOf(z.name); n += a; f += b; });
                zoneUsed = 'all';
            }
            const without = n - f;
            const share = n ? without / n * 100 : 0;
            const label = data.cats[cat];
            const where = zoneUsed === 'all' ? 'en las 5 zonas de Lima' : 'en ' + zoneUsed;
            out.innerHTML = `
                <p class="finder__big" aria-live="polite">${Math.round(share)}<small> %</small></p>
                <p class="finder__txt">de los negocios activos de <strong>${label}</strong> ${where} no tiene una web propia que funcione. En nuestra muestra son <strong>${fmt(without)} de ${fmt(n)}</strong>.</p>
                <div class="dots-mini" aria-hidden="true">${Array.from({ length: 100 }, (_, i) => `<i class="${i < Math.round(100 - share) ? 'on' : ''}"></i>`).join('')}</div>
                <p class="finder__note">${note || 'Cada punto es 1 de cada 100 negocios activos del rubro; los encendidos tienen web que funciona.'}</p>
                <a class="btn" href="https://wa.me/51965403196?text=${encodeURIComponent(`Hola MontaWeb, tengo un negocio de ${label}${zoneUsed === 'all' ? '' : ' en ' + zoneUsed} y quiero que revisen mi ficha de Google (vi el estudio).`)}" target="_blank" rel="noopener">Quiero mi diagnóstico gratis <span aria-hidden="true">↗</span></a>`;
        }
        selR.addEventListener('change', calc); selZ.addEventListener('change', calc);
        calc();
    }

    document.addEventListener('DOMContentLoaded', () => {
        initShare(); initToc();
        const node = $('#study-data');
        if (!node) return;
        let data;
        try { data = JSON.parse(node.textContent); } catch (e) { return; }
        initDots(data); initRubros(data); initZones(data); initStack(data); initFinder(data);
    });
})();
