/* ==========================================================================
   MontaWeb — Client onboarding questionnaire (/brief)
   Multi-step wizard: validation, autosave, review, email submit + fallback
   ========================================================================== */
'use strict';

(function () {
    const form = document.getElementById('brief-form');
    if (!form) return;

    const ENDPOINT = '/api/enviar-brief.php';
    const STORAGE_KEY = 'mw-brief-draft-v1';
    const WA_NUMBER = '51965403196';
    const TO_EMAIL = 'hola@montaweb.pe';

    const steps = Array.from(form.querySelectorAll('.brief-step'));
    const LAST = steps.length - 1;

    const card = form.querySelector('.brief-card');
    const dotsWrap = document.getElementById('brief-steps');
    const fill = document.getElementById('brief-progress-fill');
    const stepLabel = document.getElementById('brief-step-label');
    const saveState = document.getElementById('brief-save-state');
    const alertBox = document.getElementById('brief-alert');
    const btnPrev = document.getElementById('brief-prev');
    const btnNext = document.getElementById('brief-next');
    const btnSubmit = document.getElementById('brief-submit');
    const summaryEl = document.getElementById('brief-summary');
    const fallbackBox = document.getElementById('brief-fallback');
    const fallbackMsg = document.getElementById('brief-fallback-msg');
    const waLink = document.getElementById('brief-wa');
    const mailLink = document.getElementById('brief-mailto');
    const downloadBtn = document.getElementById('brief-download');
    const tsInput = document.getElementById('brief-ts');

    let current = 0;
    let maxVisited = 0;
    let saveTimer = null;
    let submitted = false;

    /* ---------- Boot ---------- */
    tsInput.value = String(Math.floor(Date.now() / 1000));
    buildDots();
    restoreDraft();
    prefillFromQuery();
    syncAllChoices();
    updateUI(false);
    renderSummary();

    form.addEventListener('input', onFieldChange);
    form.addEventListener('change', onFieldChange);
    form.addEventListener('submit', onSubmit);
    form.addEventListener('keydown', onKeydown);
    btnNext.addEventListener('click', goNext);
    btnPrev.addEventListener('click', goPrev);
    downloadBtn.addEventListener('click', downloadAnswers);

    /* ---------- Step dots ---------- */
    function buildDots() {
        dotsWrap.innerHTML = '';
        steps.forEach((step, index) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'brief-step-dot';
            btn.dataset.index = String(index);
            btn.innerHTML = '<span class="num">' + (index + 1) + '</span>' +
                '<span class="label">' + (step.dataset.title || 'Paso ' + (index + 1)) + '</span>';
            btn.addEventListener('click', () => jumpTo(index));
            li.appendChild(btn);
            dotsWrap.appendChild(li);
        });
    }

    /* ---------- Navigation ---------- */
    function goNext() {
        if (!validateStep(current)) return;
        hideAlert();
        if (current < LAST) {
            current += 1;
            maxVisited = Math.max(maxVisited, current);
            if (current === LAST) renderSummary();
            updateUI();
        }
    }

    function goPrev() {
        hideAlert();
        if (current > 0) {
            current -= 1;
            updateUI();
        }
    }

    function jumpTo(index) {
        if (index === current) return;
        if (index > current) {
            for (let i = current; i < index; i += 1) {
                if (!validateStep(i)) return;
            }
        }
        hideAlert();
        current = index;
        maxVisited = Math.max(maxVisited, index);
        if (index === LAST) renderSummary();
        updateUI();
    }

    function updateUI(scroll = true) {
        steps.forEach((step, index) => step.classList.toggle('active', index === current));
        Array.from(dotsWrap.querySelectorAll('.brief-step-dot')).forEach((dot, index) => {
            dot.classList.toggle('active', index === current);
            dot.classList.toggle('done', index < current);
            dot.setAttribute('aria-current', index === current ? 'step' : 'false');
        });
        fill.style.width = (((current + 1) / steps.length) * 100).toFixed(2) + '%';
        stepLabel.textContent = 'Paso ' + (current + 1) + ' de ' + steps.length + ' · ' +
            (steps[current].dataset.title || '');
        btnPrev.hidden = current === 0;
        btnNext.hidden = current === LAST;
        btnSubmit.hidden = current !== LAST;
        if (scroll) scrollToCard();
    }

    function scrollToCard() {
        const top = card.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function onKeydown(event) {
        if (event.key !== 'Enter' || event.shiftKey) return;
        const target = event.target;
        if (!target.matches('input')) return;
        if (target.type === 'checkbox' || target.type === 'radio') return;
        if (current === LAST) return;
        event.preventDefault();
        goNext();
    }

    /* ---------- Validation ---------- */
    function validateStep(index) {
        const step = steps[index];
        if (!step) return true;

        const required = step.querySelectorAll('[required]');
        for (const el of required) {
            if (el.type === 'checkbox' && !el.checked) {
                return showError('Marca la casilla de autorización para continuar.', el);
            }
            if (el.type !== 'checkbox' && !String(el.value || '').trim()) {
                return showError('Completa el campo: ' + labelOf(el), el);
            }
        }

        const email = step.querySelector('input[type="email"]');
        if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value)) {
            return showError('Revisa tu correo electrónico: parece incompleto.', email);
        }

        const phone = step.querySelector('input[type="tel"]');
        if (phone && phone.value && phone.value.replace(/\D/g, '').length < 6) {
            return showError('Revisa tu número de WhatsApp: parece incompleto.', phone);
        }

        const groups = step.querySelectorAll('[data-required-group]');
        for (const group of groups) {
            const name = group.getAttribute('data-required-group');
            if (!group.querySelector('[name="' + name + '[]"]:checked')) {
                const legend = group.querySelector('legend');
                return showError('Elige al menos una opción en “' + clean(legend ? legend.textContent : name) + '”.', group);
            }
        }

        return true;
    }

    function showError(message, el) {
        alertBox.textContent = message;
        alertBox.hidden = false;
        if (el && typeof el.focus === 'function') {
            el.focus({ preventScroll: false });
            if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
    }

    function hideAlert() {
        alertBox.hidden = true;
        alertBox.textContent = '';
    }

    /* ---------- Field changes & choice chips ---------- */
    function onFieldChange(event) {
        const el = event.target;
        if (!el || el.type === 'hidden') return;
        if (el.name === '_honey') return;
        syncChoiceStyles(el);
        scheduleSave();
        if (!alertBox.hidden) hideAlert();
    }

    function syncChoiceStyles(scope) {
        const label = scope && scope.closest ? scope.closest('.choice') : null;
        if (label) {
            const input = label.querySelector('input');
            if (input) label.classList.toggle('is-checked', input.checked);
            if (input && input.type === 'radio') syncAllChoices();
            return;
        }
        syncAllChoices();
    }

    function syncAllChoices() {
        form.querySelectorAll('.choice').forEach(label => {
            const input = label.querySelector('input');
            if (input) label.classList.toggle('is-checked', input.checked);
        });
    }

    /* ---------- Draft autosave ---------- */
    function scheduleSave() {
        saveState.textContent = 'Guardando...';
        saveState.classList.add('is-dirty');
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveDraft, 500);
    }

    function saveDraft() {
        try {
            const data = {};
            new FormData(form).forEach((value, key) => {
                if (key === '_honey' || key === '_ts') return;
                if (key.slice(-2) === '[]') {
                    (data[key] = data[key] || []).push(value);
                } else {
                    data[key] = value;
                }
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), fields: data }));
            saveState.textContent = 'Borrador guardado ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
            saveState.classList.remove('is-dirty');
        } catch (err) {
            saveState.textContent = 'No se pudo guardar el borrador';
        }
    }

    function restoreDraft() {
        let draft = null;
        try { draft = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (err) { draft = null; }
        if (!draft || !draft.fields) return;

        Object.keys(draft.fields).forEach(name => {
            const value = draft.fields[name];
            const els = form.querySelectorAll('[name="' + name.replace(/"/g, '\\"') + '"]');
            els.forEach(el => {
                if (el.type === 'checkbox') {
                    el.checked = Array.isArray(value) ? value.indexOf(el.value) !== -1 : Boolean(value);
                } else if (el.type === 'radio') {
                    el.checked = el.value === value;
                } else if (!Array.isArray(value)) {
                    el.value = value;
                }
            });
        });

        if (draft.savedAt) {
            saveState.textContent = 'Borrador guardado ' + new Date(draft.savedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
            saveState.classList.remove('is-dirty');
        }
    }

    function prefillFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const map = {
            plan: 'plan', servicio: 'plan', negocio: 'negocio',
            nombre: 'nombre_contacto', email: 'email', whatsapp: 'whatsapp'
        };
        Object.keys(map).forEach(param => {
            const value = params.get(param);
            if (!value) return;
            const field = form.elements[map[param]];
            if (!field) return;
            if (field.tagName === 'SELECT') {
                const match = Array.from(field.options).find(o => o.value === value || o.textContent.trim() === value);
                if (match) field.value = match.value;
            } else if (!field.value) {
                field.value = value;
            }
        });
    }

    /* ---------- Review summary ---------- */
    function stepEntries(step) {
        const entries = [];
        step.querySelectorAll('fieldset.brief-fieldset, .form-field').forEach(node => {
            if (node.tagName === 'FIELDSET') {
                const legend = node.querySelector('legend');
                const values = Array.from(node.querySelectorAll('input:checked')).map(input => {
                    const label = input.closest('label');
                    return label ? clean(label.textContent) : input.value;
                });
                if (values.length) entries.push({ label: clean(legend ? legend.textContent : ''), value: values.join(', ') });
                return;
            }
            const field = node.querySelector('input, select, textarea');
            if (!field || !field.id) return;
            if (field.type === 'checkbox' || field.type === 'radio' || field.type === 'hidden') return;
            const value = String(field.value || '').trim();
            if (!value) return;
            entries.push({ label: labelOf(field), value: value });
        });
        return entries;
    }

    function renderSummary() {
        if (!summaryEl) return;
        summaryEl.innerHTML = '';
        steps.forEach((step, index) => {
            if (index === LAST) return;
            const entries = stepEntries(step);
            const group = document.createElement('div');
            group.className = 'brief-summary__group';
            let html = '<h3><i class="fas fa-folder-open"></i> ' + escapeHtml(step.dataset.title || '') + '</h3>';
            if (!entries.length) {
                html += '<dl><dt>Sin datos</dt><dd>—</dd></dl>';
            } else {
                html += '<dl>' + entries.map(e =>
                    '<dt>' + escapeHtml(e.label) + '</dt><dd>' + escapeHtml(e.value) + '</dd>'
                ).join('') + '</dl>';
            }
            html += '<button type="button" class="brief-summary__edit" data-goto="' + index + '">' +
                '<i class="fas fa-pen"></i> Editar este paso</button>';
            group.innerHTML = html;
            summaryEl.appendChild(group);
        });

        summaryEl.querySelectorAll('[data-goto]').forEach(btn => {
            btn.addEventListener('click', () => jumpTo(Number(btn.dataset.goto)));
        });

        updateFallbackLinks();
    }


    /* ---------- WhatsApp / email fallback ---------- */
    function buildText() {
        const lines = [];
        const negocio = fieldValue('negocio') || 'Sin nombre';
        lines.push('BRIEF WEB — ' + negocio);
        lines.push('Fecha: ' + new Date().toLocaleString('es-PE'));
        lines.push('Contacto: ' + (fieldValue('nombre_contacto') || '—') +
            ' · WhatsApp: ' + (fieldValue('whatsapp') || '—') +
            ' · Email: ' + (fieldValue('email') || '—'));
        lines.push('');
        steps.forEach((step, index) => {
            if (index === LAST) return;
            const entries = stepEntries(step);
            if (!entries.length) return;
            lines.push('== ' + (step.dataset.title || '') + ' ==');
            entries.forEach(entry => lines.push(entry.label + ': ' + entry.value));
            lines.push('');
        });
        return lines.join('\n').trim();
    }

    function updateFallbackLinks() {
        const text = buildText();
        const subject = 'Brief web — ' + (fieldValue('negocio') || 'MontaWeb');
        if (waLink) {
            waLink.href = 'https://wa.me/' + WA_NUMBER + '?text=' +
                encodeURIComponent('Hola MontaWeb, envío mi brief:\n\n' + text.slice(0, 1800));
        }
        if (mailLink) {
            mailLink.href = 'mailto:' + TO_EMAIL + '?subject=' + encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(text.slice(0, 1500));
        }
    }

    function downloadAnswers() {
        const blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'brief-' + slug(fieldValue('negocio') || 'montaweb') + '.txt';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function showFallback(message) {
        fallbackBox.hidden = false;
        fallbackMsg.textContent = (message || 'No pudimos enviar el correo.') +
            ' Tus respuestas siguen guardadas en este navegador: envíalas por WhatsApp, descárgalas o escríbenos a ' + TO_EMAIL + '.';
        updateFallbackLinks();
        if (fallbackBox.scrollIntoView) fallbackBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* ---------- Submit ---------- */
    async function onSubmit(event) {
        event.preventDefault();
        if (submitted) return;

        for (let i = 0; i < LAST; i += 1) {
            if (!validateStep(i)) {
                current = i;
                updateUI();
                return;
            }
        }

        hideAlert();
        fallbackBox.hidden = true;
        setBusy(true);

        try {
            const payload = new FormData(form);
            payload.set('pagina', window.location.href);
            payload.set('referrer', document.referrer || '');

            const response = await fetch(ENDPOINT, { method: 'POST', body: payload });
            let json = {};
            try { json = await response.json(); } catch (err) { json = {}; }

            if (!response.ok || !json.ok) {
                throw new Error(json.error || 'No pudimos enviar tu brief.');
            }
            showSuccess(json.id || '');
        } catch (err) {
            showFallback(err && err.message ? err.message : 'Error de conexión.');
        } finally {
            setBusy(false);
        }
    }

    function setBusy(busy) {
        btnSubmit.disabled = busy;
        btnPrev.disabled = busy;
        btnNext.disabled = busy;
        btnSubmit.innerHTML = busy
            ? '<i class="fas fa-spinner fa-spin"></i> Enviando...'
            : '<i class="fas fa-paper-plane"></i> Enviar mi brief';
    }


    function showSuccess(id) {
        submitted = true;
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }

        const nombre = fieldValue('nombre_contacto');
        const canal = fieldValue('canal') || 'WhatsApp';
        const waText = 'Hola MontaWeb, acabo de enviar mi brief web' +
            (nombre ? ' (' + nombre + ')' : '') + '. Quedo atento a mi propuesta.';

        const node = document.createElement('div');
        node.className = 'brief-success';
        node.innerHTML =
            '<div class="big-icon"><i class="fas fa-check"></i></div>' +
            '<h2>¡Brief enviado!</h2>' +
            '<p>Gracias' + (nombre ? ', ' + escapeHtml(nombre) : '') + '. Recibimos tus respuestas y te escribimos por ' +
            escapeHtml(canal) + ' en menos de 24 horas hábiles con tu propuesta.</p>' +
            '<div class="btn-group">' +
            '<a class="btn btn--whatsapp" href="https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waText) + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Avisar por WhatsApp</a>' +
            '<a class="btn btn--ghost" href="/servicios"><i class="fas fa-layer-group"></i> Ver planes y precios</a>' +
            '</div>' +
            (id ? '<span class="brief-id">Referencia: ' + escapeHtml(id) + '</span>' : '');

        form.parentNode.replaceChild(node, form);
        const top = node.getBoundingClientRect().top + window.pageYOffset - 110;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    /* ---------- Helpers ---------- */
    function clean(text) {
        return String(text || '')
            .replace(/\*/g, '')
            .replace(/[ \t\r\n]+/g, ' ')
            .trim();
    }

    function labelOf(el) {
        if (el.id) {
            const label = form.querySelector('label[for="' + el.id + '"]');
            if (label) return clean(label.textContent);
        }
        const wrap = el.closest('label');
        if (wrap) return clean(wrap.textContent);
        const fieldset = el.closest('fieldset');
        if (fieldset) {
            const legend = fieldset.querySelector('legend');
            if (legend) return clean(legend.textContent);
        }
        return el.name || 'Campo';
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    function fieldValue(name) {
        const field = form.elements[name];
        if (!field || (field instanceof RadioNodeList)) {
            const checked = form.querySelector('[name="' + name + '"]:checked');
            return checked ? String(checked.value || '').trim() : '';
        }
        return String(field.value || '').trim();
    }

    function slug(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40) || 'montaweb';
    }
})();

