<?php
/**
 * Plantilla de configuración de correo para /api/enviar-brief.php
 *
 * CÓMO USARLA (no guardes contraseñas dentro del repositorio):
 *   1. Copia este archivo como:
 *        /home/TU_USUARIO/montaweb-mail-config.php     <-- UN NIVEL ARRIBA de public_html (recomendado)
 *      o, si tu hosting no permite salir del webroot:
 *        /api/config.php                               <-- ya está en .gitignore y bloqueado por .htaccess
 *   2. Rellena los datos de tu buzón Zoho.
 *   3. Verifica que /api/vendor/autoload.php exista (PHPMailer). Sin PHPMailer el script
 *      cae en mail() del hosting, que puede acabar en spam.
 *
 * Zoho Mail:
 *   - host: smtp.zoho.com | puerto: 465 | secure: ssl   (o puerto 587 con secure: tls)
 *   - user: el correo completo, ej. hola@montaweb.pe
 *   - pass: CONTRASEÑA DE APLICACIÓN (Zoho > Configuración > Seguridad > Contraseñas de aplicación),
 *           nunca la contraseña normal de la cuenta, sobre todo si tienes 2FA.
 */

return [
    // Destinatario interno que recibe cada brief
    'to' => 'hola@montaweb.pe',

    // Remitente (debe ser un buzón real de tu dominio para no fallar SPF/DKIM)
    'from' => 'hola@montaweb.pe',
    'from_name' => 'MontaWeb · Brief',

    // Secreto del webhook post-llamada de ElevenLabs (/api/receptionist-lead.php).
    // Cópialo desde ElevenLabs al crear el webhook. También vale la variable de entorno
    // ELEVENLABS_WEBHOOK_SECRET. Sin secreto el endpoint rechaza todo (503).
    'elevenlabs_webhook_secret' => 'PON_AQUI_EL_SECRETO_DEL_WEBHOOK',

    // Webhook de inicio de llamada (/api/receptionist-init.php). Los valores reales van solo
    // en el servidor: el secreto que ElevenLabs envía en la cabecera X-Init-Secret (si queda
    // vacío, el endpoint responde 503) y el número al que se transfieren las llamadas en
    // horario de atención (si queda vacío, no se transfiere).
    'elevenlabs_init_secret' => '',
    'receptionist_transfer_number' => '',

    'smtp' => [
        'host' => 'smtp.zoho.com',
        'port' => 465,
        'secure' => 'ssl',
        'user' => 'hola@montaweb.pe',
        'pass' => 'PON_AQUI_LA_CONTRASENA_DE_APLICACION',
    ],
];
