// /referidos: referral code in the URL (?ref=CODE) and the "arma tu mensaje" share form.
(() => {
    const PHONE = '51965403196';
    const CODE_RE = /^[A-Z0-9]{3,12}$/;
    const clean = value => String(value || '').trim().toUpperCase();
    const pageUrl = code => `https://montaweb.pe/referidos?ref=${encodeURIComponent(code)}`;

    // A visitor who arrives with a code writes to us with that code already in the message.
    const code = clean(new URLSearchParams(location.search).get('ref'));
    if (CODE_RE.test(code)) {
        const welcome = document.getElementById('ref-welcome');
        document.getElementById('ref-code-label').textContent = code;
        const text = `Hola MontaWeb, me pasaron su contacto con el código ${code}. Quiero información para la web de mi negocio.`;
        document.getElementById('ref-welcome-cta').href = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
        welcome.hidden = false;
    }

    // A client types their code and gets a ready message to forward to another business.
    const form = document.getElementById('ref-share-form');
    const input = document.getElementById('ref-share-code');
    const status = document.getElementById('ref-share-status');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const own = clean(input.value);
        if (!CODE_RE.test(own)) {
            input.setAttribute('aria-invalid', 'true');
            status.textContent = 'Revisa tu código: solo letras y números, de 3 a 12.';
            input.focus();
            return;
        }
        input.removeAttribute('aria-invalid');
        status.textContent = '';
        const text = `Hola, yo hice mi web con MontaWeb y me fue bien. Si necesitas una para tu negocio, escríbeles desde este enlace y te arman gratis tu perfil de Google Mi Negocio: ${pageUrl(own)}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
})();
