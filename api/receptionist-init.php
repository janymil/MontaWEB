<?php
/**
 * MontaWeb — Webhook de inicio de llamada de la recepcionista IA (/api/receptionist-init.php)
 *
 * ElevenLabs lo llama al empezar la llamada ("conversation initiation client data").
 * El servidor decide si hay asesores disponibles; fuera de horario no entrega el número,
 * así el agente no puede transferir aunque se equivoque.
 *
 * No lee, guarda ni registra nada del cuerpo de la petición (Ley 29733).
 * Secreto y número: NUNCA en el repo. Claves 'elevenlabs_init_secret' y
 * 'receptionist_transfer_number' de la configuración del servidor.
 */

declare(strict_types=1);

// Se reutiliza mw_rcp_load_config() del webhook post-llamada sin ejecutar ese endpoint.
defined('MW_RCP_NO_RUN') || define('MW_RCP_NO_RUN', true);
require_once __DIR__ . '/receptionist-lead.php';

/** Lunes a sábado, de 09:00 a 19:59, hora de Lima. */
function mw_rcp_init_is_open(int $now): bool
{
    $lima = (new DateTimeImmutable('@' . $now))->setTimezone(new DateTimeZone('America/Lima'));
    $weekday = (int) $lima->format('N'); // 1 = lunes, 7 = domingo
    $hour = (int) $lima->format('G');
    return $weekday <= 6 && $hour >= 9 && $hour < 20;
}

/** Núcleo testeable. Devuelve [status HTTP, cuerpo]. Nunca incluye detalles internos. */
function mw_rcp_init_process(string $method, string $secretHeader, array $config, int $now): array
{
    if ($method !== 'POST') {
        return [405, ['ok' => false]];
    }
    $secret = $config['elevenlabs_init_secret'] ?? '';
    if (!is_string($secret) || $secret === '') {
        error_log('[MontaWeb receptionist] secreto del webhook de inicio no configurado');
        return [503, ['ok' => false]];
    }
    if (!hash_equals($secret, $secretHeader)) {
        return [401, ['ok' => false]];
    }
    $number = $config['receptionist_transfer_number'] ?? '';
    $number = is_string($number) ? trim($number) : '';
    $open = $number !== '' && mw_rcp_init_is_open($now);

    return [200, [
        'type' => 'conversation_initiation_client_data',
        'dynamic_variables' => [
            'advisors_open' => $open ? 'si' : 'no',
            'transfer_number' => $open ? $number : '',
        ],
    ]];
}

function mw_rcp_init_main(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');

    try {
        [$status, $out] = mw_rcp_init_process(
            (string) ($_SERVER['REQUEST_METHOD'] ?? ''),
            (string) ($_SERVER['HTTP_X_INIT_SECRET'] ?? ''),
            mw_rcp_load_config(),
            time()
        );
    } catch (\Throwable $e) {
        error_log('[MontaWeb receptionist] error interno en el webhook de inicio');
        $status = 500;
        $out = ['ok' => false];
    }
    http_response_code($status);
    echo json_encode($out);
}

if (!defined('MW_RCP_INIT_NO_RUN')) {
    mw_rcp_init_main();
}
