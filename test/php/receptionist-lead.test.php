<?php
// PHP CLI test for api/receptionist-lead.php. Run: php test/php/receptionist-lead.test.php
// Prints "ok - name" per case; exits 1 if any case fails. Needs no framework.
declare(strict_types=1);
define('MW_RCP_NO_RUN', true);
require __DIR__ . '/../../api/receptionist-lead.php';

$fails = 0;
function check(string $name, bool $cond): void
{
    global $fails;
    echo ($cond ? 'ok' : 'not ok') . " - $name\n";
    if (!$cond) {
        $fails++;
    }
}

const SECRET = 'test-secret-not-real';
$now = 1800000000;
$dir = sys_get_temp_dir() . '/mw-rcp-test-' . bin2hex(random_bytes(4));
$config = ['elevenlabs_webhook_secret' => SECRET];
$sent = [];
$mailer = function (array $c, string $s, string $h, string $t) use (&$sent): bool {
    $sent[] = [$s, $h, $t];
    return true;
};
$failMailer = static fn(): bool => false;

function sign(string $body, int $t, string $secret = SECRET): string
{
    return 't=' . $t . ',v0=' . hash_hmac('sha256', $t . '.' . $body, $secret);
}
function payload(array $over = []): string
{
    $base = [
        'type' => 'post_call_transcription',
        'event_timestamp' => 1800000000,
        'data' => [
            'agent_id' => 'agent_x',
            'conversation_id' => 'conv_ABC123',
            'transcript' => [['role' => 'user', 'message' => 'SECRET TRANSCRIPT TEXT']],
            'analysis' => [
                'transcript_summary' => 'Quiere una web para su panadería.',
                'data_collection_results' => [
                    'name' => ['value' => 'Rosa Quispe'],
                    'business' => ['value' => 'Panadería Rosa'],
                    'preferred_time' => ['value' => 'mañana 10am'],
                    'topic' => ['value' => 'web'],
                ],
            ],
            'conversation_initiation_client_data' => ['dynamic_variables' => ['system__caller_id' => '+51999888777']],
        ],
    ];
    return json_encode(array_replace_recursive($base, $over), JSON_UNESCAPED_UNICODE);
}

$body = payload();

// --- signature
check('valid signature verifies', mw_rcp_verify_signature($body, sign($body, $now), SECRET, $now));
check('wrong secret rejected', !mw_rcp_verify_signature($body, sign($body, $now, 'other'), SECRET, $now));
check('tampered body rejected', !mw_rcp_verify_signature($body . ' ', sign($body, $now), SECRET, $now));
check('stale timestamp rejected', !mw_rcp_verify_signature($body, sign($body, $now - 4000), SECRET, $now));
check('empty header rejected', !mw_rcp_verify_signature($body, '', SECRET, $now));
check('empty secret rejected', !mw_rcp_verify_signature($body, sign($body, $now, ''), '', $now));
check('garbage header rejected', !mw_rcp_verify_signature($body, 'nonsense', SECRET, $now));

// --- rejections
[$s] = mw_rcp_process($body, '', $config, $dir, $mailer, $now);
check('missing signature -> 401', $s === 401);
[$s] = mw_rcp_process($body, sign($body, $now), [], $dir, $mailer, $now);
check('no secret configured -> 503', $s === 503);
$big = str_repeat('a', MW_RCP_MAX_BODY + 1);
[$s] = mw_rcp_process($big, sign($big, $now), $config, $dir, $mailer, $now);
check('oversized body -> 413', $s === 413);
$bad = '{not json';
[$s] = mw_rcp_process($bad, sign($bad, $now), $config, $dir, $mailer, $now);
check('malformed JSON (signed) -> 400', $s === 400);
$noId = payload(['data' => ['conversation_id' => '../../etc/passwd']]);
[$s] = mw_rcp_process($noId, sign($noId, $now), $config, $dir, $mailer, $now);
check('path-traversal conversation_id -> 400', $s === 400);
check('rejections wrote nothing', !is_dir($dir) || count(glob($dir . '/*') ?: []) === 0);
check('rejections sent no mail', count($sent) === 0);

// --- ignored events
$other = json_encode(['type' => 'post_call_audio', 'data' => ['conversation_id' => 'conv_1']]);
[$s, $out] = mw_rcp_process($other, sign($other, $now), $config, $dir, $mailer, $now);
check('other event type -> 200 ignored', $s === 200 && !empty($out['ignored']));
$empty = payload(['data' => [
    'conversation_id' => 'conv_EMPTY',
    'analysis' => ['transcript_summary' => '', 'data_collection_results' => ['name' => ['value' => null], 'business' => ['value' => null]]],
]]);
[$s, $out] = mw_rcp_process($empty, sign($empty, $now), $config, $dir, $mailer, $now);
check('hang-up with no data -> 200 ignored, no file', $s === 200 && !empty($out['ignored']) && !is_file($dir . '/rcp-conv_EMPTY.json'));

// --- happy path
[$s, $out] = mw_rcp_process($body, sign($body, $now), $config, $dir, $mailer, $now);
check('valid lead -> 200', $s === 200 && $out['ok'] === true);
check('one mail sent', count($sent) === 1);
$raw = (string) file_get_contents($dir . '/rcp-conv_ABC123.json');
$stored = json_decode($raw, true);
check('stored fields', $stored['nombre'] === 'Rosa Quispe' && $stored['negocio'] === 'Panadería Rosa'
    && $stored['telefono'] === '+51999888777' && $stored['horario'] === 'mañana 10am'
    && str_contains($stored['resumen'], 'panadería'));
check('marked as emailed', $stored['enviado'] === true);
check('data minimisation: no transcript, no topic, no agent id',
    !str_contains($raw, 'SECRET TRANSCRIPT') && !str_contains($raw, 'agent_x') && !str_contains($raw, '"topic"'));
check('mail has name, phone and summary',
    str_contains($sent[0][2], 'Rosa Quispe') && str_contains($sent[0][2], '+51999888777') && str_contains($sent[0][2], 'panadería'));
check('mail subject has no line breaks', preg_match('/[\r\n]/', $sent[0][0]) === 0);

// --- dedupe
[$s, $out] = mw_rcp_process($body, sign($body, $now), $config, $dir, $mailer, $now);
check('duplicate -> 200 duplicate', $s === 200 && !empty($out['duplicate']));
check('duplicate sends no second mail', count($sent) === 1);

// --- mail failure then redelivery
$retry = payload(['data' => ['conversation_id' => 'conv_RETRY']]);
[$s] = mw_rcp_process($retry, sign($retry, $now), $config, $dir, $failMailer, $now);
check('mail failure -> 502', $s === 502);
check('lead kept after mail failure', is_file($dir . '/rcp-conv_RETRY.json'));
$before = count($sent);
[$s] = mw_rcp_process($retry, sign($retry, $now), $config, $dir, $mailer, $now);
check('redelivery retries the mail -> 200', $s === 200 && count($sent) === $before + 1);

// --- HTML escaping
$xss = payload(['data' => ['conversation_id' => 'conv_XSS', 'analysis' => ['transcript_summary' => 'hola <script>alert(1)</script> & co']]]);
mw_rcp_process($xss, sign($xss, $now), $config, $dir, $mailer, $now);
check('no raw script tag in mail html', !str_contains(end($sent)[1], '<script>'));

foreach (glob($dir . '/*') ?: [] as $f) {
    unlink($f);
}
@rmdir($dir);

exit($fails === 0 ? 0 : 1);
