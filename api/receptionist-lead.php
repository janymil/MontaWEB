<?php
/**
 * MontaWeb — Webhook post-llamada de la recepcionista IA (/api/receptionist-lead.php)
 *
 * 1. Verifica la firma HMAC de ElevenLabs (cabecera ElevenLabs-Signature).
 * 2. Evita duplicados por conversation_id.
 * 3. Guarda el lead mínimo en /api/leads/rcp-<conversation_id>.json (no público, ver Caddyfile).
 * 4. Lo envía por correo a la dirección de contacto.
 *
 * Secreto: NUNCA en el repo. Se lee de api/config.php, de montaweb-mail-config.php
 * (clave 'elevenlabs_webhook_secret') o de la variable de entorno ELEVENLABS_WEBHOOK_SECRET.
 * Retención: 90 días (api/retener-leads.php).
 */

declare(strict_types=1);

const MW_RCP_DIR = __DIR__ . '/leads';
const MW_RCP_DEFAULT_TO = 'hola@montaweb.pe';
const MW_RCP_MAX_BODY = 2097152;   // 2 MB: el payload trae la transcripción completa
const MW_RCP_TOLERANCE = 1800;     // 30 min de margen en la marca de tiempo

function mw_rcp_clean($value, int $max = 400): string
{
    if (!is_string($value) && !is_int($value) && !is_float($value)) {
        return '';
    }
    $value = strip_tags((string) $value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $value = preg_replace('/[ \t]+/u', ' ', $value) ?? '';
    $value = trim($value);
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

/** Valida "t=<unix>,v0=<hex>" contra HMAC-SHA256("<t>.<cuerpo>"). */
function mw_rcp_verify_signature(string $body, string $header, string $secret, int $now): bool
{
    if ($secret === '' || $header === '') {
        return false;
    }
    $time = null;
    $sigs = [];
    foreach (explode(',', $header) as $part) {
        $kv = explode('=', trim($part), 2);
        if (count($kv) !== 2) {
            continue;
        }
        if ($kv[0] === 't') {
            $time = ctype_digit($kv[1]) ? (int) $kv[1] : null;
        } elseif ($kv[0] === 'v0') {
            $sigs[] = strtolower($kv[1]);
        }
    }
    if ($time === null || !$sigs || abs($now - $time) > MW_RCP_TOLERANCE) {
        return false;
    }
    $expected = hash_hmac('sha256', $time . '.' . $body, $secret);
    foreach ($sigs as $sig) {
        if (hash_equals($expected, $sig)) {
            return true;
        }
    }
    return false;
}

function mw_rcp_collected(array $results, array $keys): string
{
    foreach ($keys as $key) {
        $item = $results[$key] ?? null;
        $value = is_array($item) ? ($item['value'] ?? null) : null;
        $clean = mw_rcp_clean($value, 200);
        if ($clean !== '' && strtolower($clean) !== 'null') {
            return $clean;
        }
    }
    return '';
}

/** Extrae solo los campos necesarios (minimización, Ley 29733). Devuelve null si no es utilizable. */
function mw_rcp_extract_lead(array $payload, int $now): ?array
{
    $data = $payload['data'] ?? null;
    if (!is_array($data)) {
        return null;
    }
    $id = $data['conversation_id'] ?? '';
    if (!is_string($id) || !preg_match('/^[A-Za-z0-9_-]{1,100}$/', $id)) {
        return null;
    }
    $analysis = is_array($data['analysis'] ?? null) ? $data['analysis'] : [];
    $results = is_array($analysis['data_collection_results'] ?? null) ? $analysis['data_collection_results'] : [];
    $vars = $data['conversation_initiation_client_data']['dynamic_variables'] ?? [];
    $phone = is_array($vars) ? mw_rcp_clean($vars['system__caller_id'] ?? '', 30) : '';

    return [
        'conversation_id' => $id,
        'fecha'           => gmdate('c', $now),
        'nombre'          => mw_rcp_collected($results, ['name', 'nombre']),
        'negocio'         => mw_rcp_collected($results, ['business', 'negocio']),
        'telefono'        => $phone,
        'producto'        => mw_rcp_collected($results, ['producto', 'product']),
        'horario'         => mw_rcp_collected($results, ['preferred_time', 'horario']),
        'resumen'         => mw_rcp_clean($analysis['transcript_summary'] ?? '', 1500),
        'enviado'         => false,
    ];
}

function mw_rcp_lead_path(string $dir, string $conversationId): string
{
    return rtrim($dir, '/\\') . '/rcp-' . $conversationId . '.json';
}

function mw_rcp_render(array $lead): array
{
    $product = $lead['producto'] ?? ''; // los leads guardados antes no tienen la clave
    $rows = [
        'Nombre'           => $lead['nombre'],
        'Negocio'          => $lead['negocio'],
        'Producto'         => $product,
        'Teléfono'         => $lead['telefono'],
        'Horario preferido' => $lead['horario'],
        'Resumen'          => $lead['resumen'],
        'Referencia'       => $lead['conversation_id'],
    ];
    $text = "NUEVO LEAD — Recepcionista IA\n\n";
    $html = '<h2>Nuevo lead — Recepcionista IA</h2><table cellpadding="6">';
    foreach ($rows as $label => $value) {
        $value = $value !== '' ? $value : '(no indicado)';
        $text .= $label . ': ' . $value . "\n";
        $html .= '<tr><td><strong>' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</strong></td><td>'
            . nl2br(htmlspecialchars($value, ENT_QUOTES, 'UTF-8')) . '</td></tr>';
    }
    $html .= '</table>';
    $who = $lead['nombre'] !== '' ? $lead['nombre'] : ($lead['telefono'] !== '' ? $lead['telefono'] : 'sin nombre');
    $business = $lead['negocio'] !== '' ? ' · ' . $lead['negocio'] : '';
    $about = $product !== '' ? ' · ' . $product : '';
    $subject = str_replace(["\r", "\n"], ' ', 'Nuevo lead (llamada) — ' . $who . $business . $about);
    return [$subject, $html, $text];
}

/**
 * Núcleo testeable. $mailer(array $cfg, string $subject, string $html, string $text): bool
 * Devuelve [status HTTP, cuerpo]. Nunca incluye detalles internos.
 */
function mw_rcp_process(string $body, string $sigHeader, array $config, string $dir, callable $mailer, int $now): array
{
    if (strlen($body) > MW_RCP_MAX_BODY) {
        return [413, ['ok' => false]];
    }
    $secret = (string) ($config['elevenlabs_webhook_secret'] ?? '');
    if ($secret === '') {
        error_log('[MontaWeb receptionist] secreto del webhook no configurado');
        return [503, ['ok' => false]];
    }
    if (!mw_rcp_verify_signature($body, $sigHeader, $secret, $now)) {
        return [401, ['ok' => false]];
    }
    $payload = json_decode($body, true);
    if (!is_array($payload)) {
        return [400, ['ok' => false]];
    }
    // Otros tipos de evento (p. ej. audio, fallo de llamada) se confirman sin procesar.
    if (($payload['type'] ?? '') !== 'post_call_transcription') {
        return [200, ['ok' => true, 'ignored' => true]];
    }
    $lead = mw_rcp_extract_lead($payload, $now);
    if ($lead === null) {
        return [400, ['ok' => false]];
    }
    // Llamada sin datos útiles (colgó al instante): no se guarda nada.
    if ($lead['nombre'] === '' && $lead['negocio'] === '' && $lead['resumen'] === '') {
        return [200, ['ok' => true, 'ignored' => true]];
    }

    if (!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) {
        error_log('[MontaWeb receptionist] no se pudo crear el directorio de leads');
        return [500, ['ok' => false]];
    }
    $path = mw_rcp_lead_path($dir, $lead['conversation_id']);
    $json = static fn(array $l): string => json_encode($l, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    // Creación exclusiva ('x'): atómica, así dos entregas simultáneas no duplican.
    $handle = @fopen($path, 'x');
    if ($handle === false) {
        $existing = json_decode((string) @file_get_contents($path), true);
        if (is_array($existing) && ($existing['enviado'] ?? false) === true) {
            return [200, ['ok' => true, 'duplicate' => true]];
        }
        if (!is_array($existing)) {
            return [500, ['ok' => false]];
        }
        $lead = $existing; // reintento de correo de un lead guardado pero no enviado
    } else {
        fwrite($handle, $json($lead));
        fclose($handle);
    }

    [$subject, $html, $text] = mw_rcp_render($lead);
    $sent = false;
    try {
        $sent = $mailer($config, $subject, $html, $text);
    } catch (\Throwable $e) {
        $sent = false;
    }
    if (!$sent) {
        error_log('[MontaWeb receptionist] correo no enviado · conversación ' . $lead['conversation_id']);
        return [502, ['ok' => false]]; // ElevenLabs reintenta; el lead ya está guardado
    }
    $lead['enviado'] = true;
    @file_put_contents($path, $json($lead), LOCK_EX);
    return [200, ['ok' => true]];
}

function mw_rcp_load_config(): array
{
    $paths = [
        __DIR__ . '/config.php',
        dirname(__DIR__, 2) . '/montaweb-mail-config.php',
        dirname(__DIR__) . '/montaweb-mail-config.php',
    ];
    $config = [];
    foreach ($paths as $p) {
        if (is_file($p)) {
            $loaded = require $p;
            if (is_array($loaded)) {
                $config = $loaded;
                break;
            }
        }
    }
    $env = getenv('ELEVENLABS_WEBHOOK_SECRET');
    if (is_string($env) && $env !== '') {
        $config['elevenlabs_webhook_secret'] = $env;
    }
    return $config;
}

function mw_rcp_send_mail(array $config, string $subject, string $html, string $text): bool
{
    $to = (string) ($config['to'] ?? MW_RCP_DEFAULT_TO);
    $from = (string) ($config['from'] ?? MW_RCP_DEFAULT_TO);
    $fromName = (string) ($config['from_name'] ?? 'MontaWeb · Recepcionista');
    $smtp = is_array($config['smtp'] ?? null) ? $config['smtp'] : [];

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
                $mail->Subject = $subject;
                $mail->isHTML(true);
                $mail->Body = $html;
                $mail->AltBody = $text;
                $mail->send();
                return true;
            } catch (\Throwable $e) {
                return false;
            }
        }
    }
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: =?UTF-8?B?' . base64_encode($fromName) . '?= <' . $from . '>',
    ];
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $html, implode("\r\n", $headers), '-f' . $from);
}

function mw_rcp_read_body(): ?string
{
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > MW_RCP_MAX_BODY) {
        return null;
    }
    $body = (string) file_get_contents('php://input', false, null, 0, MW_RCP_MAX_BODY + 1);
    return strlen($body) > MW_RCP_MAX_BODY ? null : $body;
}

function mw_rcp_main(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');

    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        http_response_code(405);
        echo '{"ok":false}';
        return;
    }
    $body = mw_rcp_read_body();
    if ($body === null) {
        http_response_code(413);
        echo '{"ok":false}';
        return;
    }
    try {
        [$status, $out] = mw_rcp_process(
            $body,
            (string) ($_SERVER['HTTP_ELEVENLABS_SIGNATURE'] ?? ''),
            mw_rcp_load_config(),
            MW_RCP_DIR,
            'mw_rcp_send_mail',
            time()
        );
    } catch (\Throwable $e) {
        error_log('[MontaWeb receptionist] error interno');
        $status = 500;
        $out = ['ok' => false];
    }
    http_response_code($status);
    echo json_encode($out);
}

if (!defined('MW_RCP_NO_RUN')) {
    mw_rcp_main();
}
