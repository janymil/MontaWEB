/* Article: prefijo 500. Phone demo, compliance checker, fines chart, call calculator (vanilla JS). */
'use strict';

(function () {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const fmt = n => Math.round(n).toLocaleString('es-PE').replace(/,/g, ' ');

    /* ---------- Phone: today vs prefix 500 ---------- */
    function initPhone() {
        const phone = $('#phone'); if (!phone) return;
        const states = {
            hoy: { num: '+51 987 654 321', sub: 'Celular · Lima', ini: '?', cap: 'Hoy: un número cualquiera. Puede ser tu banco, tu cliente o alguien que quiere venderte algo.' },
            500: { num: '<b>500</b> 123 456', sub: 'Número 500', ini: '500', cap: 'Con el prefijo 500 sabes que te quieren vender algo antes de contestar. Tú decides.' }
        };
        const btns = $$('[data-phone]');
        const show = mode => {
            const s = states[mode];
            phone.dataset.mode = mode;
            $('.phone__num', phone).innerHTML = s.num;
            $('.phone__sub', phone).textContent = s.sub;
            $('.phone__avatar', phone).textContent = s.ini;
            $('#phone-cap').textContent = s.cap;
            btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.phone === mode)));
        };
        btns.forEach(b => b.addEventListener('click', () => show(b.dataset.phone)));
        show('500');
    }

    /* ---------- Checker ---------- */
    function initChecker() {
        const form = $('#checker'); if (!form) return;
        const out = $('#verdict');
        const V = {
            info: ['info', 'Es una llamada informativa.', 'Puede salir de tu número de siempre, porque no ofrece nada. Ojo: si en la misma llamada aprovechas para ofrecer un producto o una promoción, pasa a ser comercial y necesitas el permiso previo y el número 500.'],
            stopNo: ['stop', 'No hagas esa llamada.', 'Sin un permiso previo y expreso de la persona, la llamada de venta está prohibida por el artículo 58 del Código de Consumo, salga del número que salga. El Indecopi la trata como infracción muy grave: hasta 450 UIT de multa.'],
            stopClient: ['stop', 'Que sea tu cliente no basta.', 'Haberte comprado antes no equivale a aceptar publicidad. Para ofrecerle algo por teléfono necesitas su autorización previa y expresa para recibir ofertas. Pídesela por escrito (un formulario o un mensaje que él te envíe) y guarda la prueba.'],
            warn: ['warn', 'Tienes el permiso; te falta el número.', 'Pide a tu operadora un número 500 para tus llamadas y SMS de venta. Las operadoras tienen como plazo máximo el 15 de marzo de 2027 para adaptarse, y la norma prohíbe asignar otra numeración para ese fin. Mientras tanto, guarda la prueba de cada autorización.'],
            ok: ['ok', 'Vas por buen camino.', 'Permiso previo y número 500: es lo que piden las normas. Guarda la prueba de cada autorización (fecha, canal y texto aceptado) y deja de llamar en cuanto la persona te lo pida.']
        };
        const render = () => {
            const d = Object.fromEntries(new FormData(form));
            let key = null;
            if (d.fin === 'info') key = 'info';
            else if (d.fin === 'venta' && d.permiso === 'no') key = 'stopNo';
            else if (d.fin === 'venta' && d.permiso === 'cliente') key = 'stopClient';
            else if (d.fin === 'venta' && d.permiso === 'si' && d.numero) key = d.numero === '500' ? 'ok' : 'warn';
            // The other questions do not matter for an informative call or a call without consent.
            $$('[data-needs]', form).forEach(fs => {
                const [name, val] = fs.dataset.needs.split('=');
                const on = d[name] === val;
                fs.hidden = !on;
                if (!on) $$('input', fs).forEach(i => { i.checked = false; });
            });
            if (!key) { out.hidden = true; return; }
            const [tone, title, text] = V[key];
            out.dataset.tone = tone;
            out.innerHTML = `<strong>${title}</strong>${text}`;
            out.hidden = false;
        };
        form.addEventListener('change', render);
        form.addEventListener('reset', () => setTimeout(render, 0));
        render();
    }

    /* ---------- Fines chart: bars grow when visible ---------- */
    function initMoney() {
        const list = $('#money'); if (!list) return;
        const max = Math.max(...$$('li', list).map(li => +li.dataset.soles));
        const grow = () => $$('li', list).forEach(li => li.style.setProperty('--w', (li.dataset.soles / max * 100).toFixed(1) + '%'));
        if (!('IntersectionObserver' in window)) return grow();
        const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { grow(); io.disconnect(); } }, { threshold: .3 });
        io.observe(list);
    }

    /* ---------- Calculator ---------- */
    function initCalc() {
        const form = $('#calc'); if (!form) return;
        const v = n => +form.elements[n].value;
        const draw = () => {
            const calls = v('llamadas') * 22;           // 22 working days a month
            const sales = calls * v('contesta') / 100 * v('compra') / 100;
            const after = sales * (1 - v('baja') / 100);
            $('[for="llamadas"] output', form).textContent = v('llamadas');
            $('[for="contesta"] output', form).textContent = v('contesta') + ' %';
            $('[for="compra"] output', form).textContent = v('compra') + ' %';
            $('[for="baja"] output', form).textContent = v('baja') + ' %';
            $('#c-hoy').textContent = fmt(sales);
            $('#c-500').textContent = fmt(after);
            $('#c-loss').textContent = '−' + fmt(sales - after);
        };
        form.addEventListener('input', draw);
        draw();
    }

    /* ---------- Video: nothing loads from YouTube until the reader presses play ---------- */
    function initVideo() {
        const btn = $('[data-yt]'); if (!btn) return;
        btn.addEventListener('click', () => {
            const frame = document.createElement('iframe');
            frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
            frame.title = btn.dataset.title;
            frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
            frame.referrerPolicy = 'strict-origin-when-cross-origin';  // YouTube refuses to play without a referrer
            $('.pod audio')?.pause();
            btn.replaceWith(frame);
            frame.focus();
        });
    }

    initPhone(); initChecker(); initMoney(); initCalc(); initVideo();
})();
