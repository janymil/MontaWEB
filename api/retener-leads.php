<?php
/**
 * Política de retención MontaWeb.
 * Ejecutar solo desde cron/CLI: elimina briefs sin contrato tras 12 meses
 * desde su envío y briefs de clientes 12 meses después del cierre del proyecto.
 * Los registros antiguos sin estado se conservan para revisión.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$leadDir = __DIR__ . '/leads';
if (!is_dir($leadDir)) {
    exit("No existe el directorio de leads.\n");
}

$now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
$leadCutoff = $now->modify('-12 months')->getTimestamp();
$rateLimitCutoff = $now->modify('-1 day')->getTimestamp();
$deletedLeads = 0;
$deletedRateLimits = 0;
$retainedForReview = 0;

foreach (glob($leadDir . '/brief-*.json') ?: [] as $path) {
    $record = json_decode((string) @file_get_contents($path), true);
    if (!is_array($record) || !array_key_exists('contratado', $record)) {
        // Older records have no status; never delete them without review.
        $retainedForReview++;
        continue;
    }
    if ($record['contratado'] === false) {
        $retentionAnchor = strtotime((string) ($record['fecha'] ?? ''));
    } elseif ($record['contratado'] === true && !empty($record['fecha_cierre'])) {
        $retentionAnchor = strtotime((string) $record['fecha_cierre']);
    } else {
        // Active projects, and contracted records without a closure date, stay.
        continue;
    }

    if ($retentionAnchor === false) {
        $retainedForReview++;
        continue;
    }

    if ($retentionAnchor <= $leadCutoff && @unlink($path)) {
        $deletedLeads++;
    }
}

foreach (glob($leadDir . '/rl-*.json') ?: [] as $path) {
    $modified = @filemtime($path);
    if ($modified !== false && $modified <= $rateLimitCutoff && @unlink($path)) {
        $deletedRateLimits++;
    }
}

echo sprintf(
    "Deleted %d expired brief(s) and %d stale rate-limit file(s); %d legacy brief(s) retained for review.\n",
    $deletedLeads,
    $deletedRateLimits,
    $retainedForReview
);
