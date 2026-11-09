// Contact form handler. EmailJS sends the request to MontaWeb's configured inbox.
(function () {
    'use strict';

    const CONFIG = {
        publicKey: '11U-5AJNZGlStMGgr',
        serviceID: 'service_40mjh1h',
        requestTemplateID: 'template_lhk5jbm',
        confirmationTemplateID: 'template_qkzlags'
    };

    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('contact-form');
        if (!form || form.dataset.handler !== 'emailjs') return;

        const button = form.querySelector('button[type="submit"]');
        const status = document.getElementById('contact-status');

        if (typeof emailjs === 'undefined') {
            showError('El envío por correo no está disponible en este momento. Escríbenos a hola@montaweb.pe.');
            return;
        }

        try {
            emailjs.init({ publicKey: CONFIG.publicKey });
        } catch (error) {
            showError('El envío por correo no está disponible en este momento. Escríbenos a hola@montaweb.pe.');
            return;
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            clearStatus();

            if (!form.reportValidity()) return;

            const consent = document.getElementById('acepto');
            if (!consent || !consent.checked) {
                showError('Marca la casilla de autorización para enviar tu solicitud.');
                consent?.focus();
                return;
            }

            const data = Object.fromEntries(new FormData(form));
            if (data._honey) return;

            // Preserve friendly aliases used by the existing EmailJS templates.
            data.tipo_servicio = data.servicio || '';
            data.tipo_negocio = data['tipo-negocio'] || '';
            data.acepto = 'Sí. Política de privacidad, versión 2026.';
            data.privacidad_aceptada = true;
            data.privacidad_version = '2026';
            data.privacidad_aceptada_en = new Date().toISOString();
            data.fecha_envio = new Date().toLocaleString('es-PE');

            setBusy(true);
            try {
                await emailjs.send(CONFIG.serviceID, CONFIG.requestTemplateID, data);

                // A confirmation is useful, but its failure must not undo the request.
                if (data.email && CONFIG.confirmationTemplateID) {
                    emailjs.send(CONFIG.serviceID, CONFIG.confirmationTemplateID, data).catch(function () {});
                }

                showSuccess('Recibimos tu solicitud. Te enviaremos una confirmación por correo.');
                window.setTimeout(function () {
                    window.location.href = '/gracias';
                }, 1800);
            } catch (error) {
                setBusy(false);
                showError('No pudimos enviar tu solicitud por correo. Inténtalo otra vez o escríbenos a hola@montaweb.pe.');
            }
        });

        function setBusy(busy) {
            if (!button) return;
            button.disabled = busy;
            button.innerHTML = busy
                ? '<i class="fas fa-spinner fa-spin"></i> Enviando…'
                : '<i class="fas fa-paper-plane"></i> Enviar solicitud por correo';
        }

        function clearStatus() {
            if (!status) return;
            status.hidden = true;
            status.textContent = '';
            status.className = 'form-status';
        }

        function showError(message) {
            showStatus(message, 'form-status form-status--error');
        }

        function showSuccess(message) {
            showStatus(message, 'form-status form-status--success');
        }

        function showStatus(message, className) {
            if (!status) return;
            status.textContent = message;
            status.className = className;
            status.hidden = false;
        }
    });
})();
