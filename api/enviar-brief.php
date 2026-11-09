<?php
/**
 * MontaWeb — Receptor del cuestionario de inicio (/api/enviar-brief.php)
 *
 * Qué hace:
 *  1. Valida y limpia las respuestas del formulario /brief
 *  2. Guarda una copia JSON en /api/leads (protegida por .htaccess)
 *  3. Envía el brief por correo a la dirección configurada (hola@montaweb.pe)
 *
 * IMPORTANTE — credenciales:
 *  Este archivo NO contiene contraseñas. Busca la configuración en:
 *    a) /api/config.php                       (bloqueado por .htaccess, en .gitignore)
 *    b) /montaweb-mail-config.php             (recomendado: UN NIVEL ARRIBA de public_html)
 *  Si hay SMTP configurado y PHPMailer instalado en /api/vendor, usa SMTP;
 *  si no, cae en mail() del hosting.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const MW_LEAD_DIR = __DIR__ . '/leads';
const MW_DEFAULT_TO = 'hola@montaweb.pe';
const MW_MAX_PER_HOUR = 5;

function mw_respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function mw_clean($value, int $max = 400): string
{
    if (is_array($value)) {
        $value = implode(', ', array_map('strval', $value));
    }
    $value = str_replace(["\r\n", "\r"], "\n", (string) $value);
    $value = strip_tags($value);
    $value = preg_replace('/[ \t]+/u', ' ', (string) $value);
    $value = trim((string) $value);
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $max, 'UTF-8');
    }
    return substr($value, 0, $max);
}

function mw_list($value): string
{
    if (is_array($value)) {
        $items = array_filter(array_map(static fn($v) => mw_clean($v, 200), $value), static fn($v) => $v !== '');
        return implode(', ', $items);
    }
    return mw_clean($value, 600);
}

function mw_encode_header(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    mw_respond(405, ['ok' => false, 'error' => 'Método no permitido.']);
}

$data = $_POST;
if (!$data) {
    $decoded = json_decode((string) file_get_contents('php://input'), true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}
if (!$data) {
    mw_respond(400, ['ok' => false, 'error' => 'No recibimos datos del formulario.']);
}

/* ---------- 1. Anti-spam ---------- */
$honey = isset($data['_honey']) ? trim((string) $data['_honey']) : '';
$ts = isset($data['_ts']) ? (int) $data['_ts'] : 0;
if ($honey !== '' || ($ts > 0 && (time() - $ts) < 4)) {
    mw_respond(200, ['ok' => true, 'id' => 'ok']);
}

$ip = (string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$bucket = MW_LEAD_DIR . '/rl-' . hash('sha256', $ip) . '.json';
if (!is_dir(MW_LEAD_DIR)) {
    @mkdir(MW_LEAD_DIR, 0750, true);
}
$hits = [];
if (is_file($bucket)) {
    $decodedHits = json_decode((string) @file_get_contents($bucket), true);
    if (is_array($decodedHits)) {
        $hits = array_values(array_filter($decodedHits, static fn($t) => is_int($t) && $t > time() - 3600));
    }
}
if (count($hits) >= MW_MAX_PER_HOUR) {
    mw_respond(429, ['ok' => false, 'error' => 'Recibimos varios envíos desde tu conexión. Escríbenos por WhatsApp y lo resolvemos al toque.']);
}
$hits[] = time();
@file_put_contents($bucket, json_encode($hits), LOCK_EX);

/* ---------- 2. Validación ---------- */
$required = [
    'nombre_contacto' => 'Tu nombre',
    'email'           => 'Correo electrónico',
    'whatsapp'        => 'WhatsApp',
    'negocio'         => 'Nombre del negocio',
    'rubro'           => 'Rubro',
    'ciudad'          => 'Ciudad y distrito',
    'acepto'          => 'Autorización de privacidad',
];
$missing = [];
foreach ($required as $key => $label) {
    if (mw_clean($data[$key] ?? '', 300) === '') {
        $missing[] = $label;
    }
}
if (($data['acepto'] ?? '') !== 'on') {
    mw_respond(422, ['ok' => false, 'error' => 'Debes aceptar la Política de privacidad para enviar el brief.']);
}
if ($missing) {
    mw_respond(422, ['ok' => false, 'error' => 'Faltan datos obligatorios: ' . implode(', ', $missing) . '.']);
}

$email = mw_clean($data['email'] ?? '', 190);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    mw_respond(422, ['ok' => false, 'error' => 'El correo electrónico no parece válido.']);
}

/* ---------- 3. Datos del brief ---------- */
$sections = [
    'Tu negocio' => [
        'nombre_contacto' => 'Nombre y apellido',
        'cargo'           => 'Cargo',
        'whatsapp'        => 'WhatsApp',
        'email'           => 'Correo',
        'negocio'         => 'Negocio',
        'rubro'           => 'Rubro',
        'ciudad'          => 'Ciudad y distrito',
        'atencion'        => 'Atención',
        'razon_ruc'       => 'Razón social / RUC',
        'antiguedad'      => 'Antigüedad',
        'web_actual'      => 'Web o redes actuales',
    ],
    'Objetivos y clientes' => [
        'objetivos'   => 'Objetivos',
        'meta'        => 'Meta a 3-6 meses',
        'publico'     => 'Cliente ideal',
        'problema'    => 'Duda o miedo del cliente',
        'diferencial' => 'Diferencial',
        'competencia' => 'Competencia',
        'temporada'   => 'Temporadas / promociones',
    ],
    'Contenido y marca' => [
        'textos'       => 'Textos',
        'logo'         => 'Logo',
        'fotos'        => 'Fotos y videos',
        'colores'      => 'Colores de marca',
        'catalogo'     => 'Catálogo y precios',
        'datos_clave'  => 'Datos para la web',
        'secciones'    => 'Secciones',
        'testimonios'  => 'Testimonios',
    ],
    'Diseño y funciones' => [
        'estilo'          => 'Estilo visual',
        'referencias'     => 'Webs de referencia',
        'funcionalidades' => 'Funcionalidades',
        'dominio'         => 'Dominio',
        'dominio_deseado' => 'Dominio deseado',
        'hosting'         => 'Hosting',
        'accesos'         => 'Accesos',
        'accesos_nota'    => 'Nota de accesos',
    ],
    'Proyecto y presupuesto' => [
        'plan'             => 'Plan de interés',
        'presupuesto'      => 'Presupuesto',
        'plazo'            => 'Plazo',
        'aprueba'          => 'Quién aprueba',
        'pago'             => 'Forma de pago',
        'canal'            => 'Canal preferido',
        'como_nos_conocio' => 'Cómo nos encontró',
        'extra'            => 'Notas extra',
        'promos'           => 'Acepta promociones',
    ],
];

$raw = [];
$ready = [];
foreach ($sections as $title => $fields) {
    $rows = [];
    foreach ($fields as $key => $label) {
        $value = isset($data[$key]) ? mw_list($data[$key]) : '';
        if ($value === '') {
            continue;
        }
        $rows[$label] = $value;
        $raw[$key] = $value;
    }
    if ($rows) {
        $ready[$title] = $rows;
    }
}

$negocio = mw_clean($data['negocio'] ?? '', 160);
$plan = mw_clean($data['plan'] ?? '', 120);
$who = mw_clean($data['nombre_contacto'] ?? '', 120);
$channel = mw_clean($data['canal'] ?? '', 40) ?: 'WhatsApp';

$lead = [
    'id'       => '',
    'fecha'    => gmdate('c'),
    'contratado' => false,
    'fecha_cierre' => null,
    'privacidad_aceptada' => true,
    'privacidad_version'  => '2026',
    'ip'       => substr(hash('sha256', $ip), 0, 12),
    'pagina'   => mw_clean($data['pagina'] ?? '', 300),
    'referrer' => mw_clean($data['referrer'] ?? '', 300),
    'campos'   => $raw,
];
$leadId = gmdate('Ymd-His') . '-' . substr(hash('sha256', $email . microtime(true)), 0, 6);
$lead['id'] = $leadId;

@file_put_contents(
    MW_LEAD_DIR . '/brief-' . $leadId . '.json',
    json_encode($lead, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    LOCK_EX
);


/* ---------- 4. Configuración (sin secretos en el repo) ---------- */
$config = [];
$configPaths = [
    __DIR__ . '/config.php',                        // bloqueado por .htaccess + .gitignore
    dirname(__DIR__, 2) . '/montaweb-mail-config.php', // recomendado: fuera de public_html
    dirname(__DIR__) . '/montaweb-mail-config.php',
];
foreach ($configPaths as $configPath) {
    if (is_file($configPath)) {
        $loaded = require $configPath;
        if (is_array($loaded)) {
            $config = $loaded;
            break;
        }
    }
}

$to = (string) ($config['to'] ?? MW_DEFAULT_TO);
$from = (string) ($config['from'] ?? MW_DEFAULT_TO);
$fromName = (string) ($config['from_name'] ?? 'MontaWeb · Brief');
$replyTo = $email;

/* ---------- 5. Correo ---------- */
$subject = 'Nuevo brief web — ' . $negocio . ($plan !== '' ? ' · ' . $plan : '');
$html = mw_render_email($ready, $who, $leadId, $channel);
$text = mw_render_text($ready, $who, $leadId, $channel);

$sent = mw_send_mail([
    'to'        => $to,
    'from'      => $from,
    'from_name' => $fromName,
    'smtp'      => is_array($config['smtp'] ?? null) ? $config['smtp'] : [],
], $subject, $html, $text, $replyTo);

if (empty($sent['ok'])) {
    error_log('[MontaWeb brief] Envío fallido (' . ($sent['via'] ?? 'desconocido') . '): ' . ($sent['error'] ?? 'sin detalle') . ' · lead ' . $leadId);
    mw_respond(502, [
        'ok'    => false,
        'id'    => $leadId,
        'error' => 'No pudimos enviar el correo automático. Tus respuestas quedaron guardadas: envíalas por WhatsApp o descárgalas.',
    ]);
}

mw_respond(200, ['ok' => true, 'id' => $leadId, 'via' => $sent['via'] ?? 'mail']);

/* ==========================================================================
   Funciones auxiliares
   ========================================================================== */

function mw_render_email(array $ready, string $who, string $leadId, string $channel): string
{
    $rows = '';
    foreach ($ready as $title => $fields) {
        $rows .= '<tr><td colspan="2" style="padding:18px 22px 8px;background:#0B1120;color:#22D3EE;'
            . 'font:700 12px/1.4 Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;">'
            . htmlspecialchars((string) $title, ENT_QUOTES, 'UTF-8') . '</td></tr>';
        foreach ($fields as $label => $value) {
            $rows .= '<tr>'
                . '<td style="padding:10px 22px;border-bottom:1px solid #E6EBF3;color:#53617A;'
                . 'font:600 12px/1.5 Arial,sans-serif;width:32%;vertical-align:top;">'
                . htmlspecialchars((string) $label, ENT_QUOTES, 'UTF-8') . '</td>'
                . '<td style="padding:10px 22px;border-bottom:1px solid #E6EBF3;color:#0E1526;'
                . 'font:400 14px/1.6 Arial,sans-serif;">'
                . nl2br(htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8')) . '</td>'
                . '</tr>';
        }
    }

    $safeWho = htmlspecialchars($who !== '' ? $who : 'Cliente', ENT_QUOTES, 'UTF-8');
    $safeChannel = htmlspecialchars($channel, ENT_QUOTES, 'UTF-8');
    $safeId = htmlspecialchars($leadId, ENT_QUOTES, 'UTF-8');

    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">'
        . '<title>Nuevo brief web</title></head>'
        . '<body style="margin:0;padding:0;background:#F5F8FC;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F8FC;padding:24px 12px;">'
        . '<tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        . 'style="max-width:680px;background:#FFFFFF;border:1px solid #DCE4F0;border-radius:14px;overflow:hidden;">'
        . '<tr><td style="background:linear-gradient(120deg,#6366F1,#22D3EE 55%,#34D399);padding:24px 22px;color:#FFFFFF;'
        . 'font:700 20px/1.3 Arial,sans-serif;">Nuevo brief web · MontaWeb'
        . '<div style="font:400 13px/1.5 Arial,sans-serif;opacity:.92;margin-top:6px;">'
        . 'Enviado por ' . $safeWho . ' · Responder por ' . $safeChannel . '</div></td></tr>'
        . '<tr><td style="padding:0;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">'
        . $rows
        . '</table></td></tr>'
        . '<tr><td style="padding:16px 22px;color:#53617A;font:400 12px/1.6 Arial,sans-serif;">'
        . 'Referencia: <strong style="color:#0E1526;">' . $safeId . '</strong> · Enviado desde montaweb.pe/brief<br>'
        . 'Responde este correo para escribirle directo al cliente.'
        . '</td></tr></table></td></tr></table></body></html>';
}

function mw_render_text(array $ready, string $who, string $leadId, string $channel): string
{
    $lines = ['NUEVO BRIEF WEB — MontaWeb', 'Contacto: ' . ($who !== '' ? $who : 'Cliente') . ' · Canal: ' . $channel, ''];
    foreach ($ready as $title => $fields) {
        $lines[] = '== ' . $title . ' ==';
        foreach ($fields as $label => $value) {
            $lines[] = $label . ': ' . $value;
        }
        $lines[] = '';
    }
    $lines[] = 'Referencia: ' . $leadId;
    return implode("\n", $lines);
}


/**
 * Envía el correo. Prioridad:
 *  1. SMTP autenticado con PHPMailer (recomendado para Zoho: smtp.zoho.com:465 ssl)
 *  2. mail() del hosting (Hostinger) como respaldo
 */
function mw_send_mail(array $cfg, string $subject, string $html, string $text, string $replyTo): array
{
    $to = (string) ($cfg['to'] ?? MW_DEFAULT_TO);
    $from = (string) ($cfg['from'] ?? MW_DEFAULT_TO);
    $fromName = (string) ($cfg['from_name'] ?? 'MontaWeb · Brief');
    $smtp = is_array($cfg['smtp'] ?? null) ? $cfg['smtp'] : [];

    $autoload = __DIR__ . '/vendor/autoload.php';
    if (!empty($smtp['host']) && is_file($autoload)) {
        require_once $autoload;
        if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
            try {
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = (string) $smtp['host'];
                $mail->Port = (int) ($smtp['port'] ?? 465);
                $mail->SMTPAuth = true;
                $mail->Username = (string) ($smtp['user'] ?? $from);
                $mail->Password = (string) ($smtp['pass'] ?? '');
                $mail->SMTPSecure = strtolower((string) ($smtp['secure'] ?? 'ssl')) === 'tls' ? 'tls' : 'ssl';
                $mail->CharSet = 'UTF-8';
                $mail->setFrom($from, $fromName);
                $mail->addAddress($to);
                if ($replyTo !== '') {
                    $mail->addReplyTo($replyTo);
                }
                $mail->Subject = $subject;
                $mail->isHTML(true);
                $mail->Body = $html;
                $mail->AltBody = $text;
                $mail->send();
                return ['ok' => true, 'via' => 'smtp'];
            } catch (\Throwable $e) {
                return ['ok' => false, 'via' => 'smtp', 'error' => $e->getMessage()];
            }
        }
        error_log('[MontaWeb brief] Hay SMTP configurado pero PHPMailer no está instalado en /api/vendor.');
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . mw_encode_header($fromName) . ' <' . $from . '>',
    ];
    if ($replyTo !== '') {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    $ok = @mail($to, mw_encode_header($subject), $html, implode("\r\n", $headers), '-f' . $from);

    return $ok
        ? ['ok' => true, 'via' => 'mail']
        : ['ok' => false, 'via' => 'mail', 'error' => 'mail() rechazó el envío'];
}

