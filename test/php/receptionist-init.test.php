<?php
// PHP CLI test for api/receptionist-init.php. Run: php test/php/receptionist-init.test.php
// Prints "ok - name" per case; exits 1 if any case fails. Needs no framework.
declare(strict_types=1);
define('MW_RCP_NO_RUN', true);
define('MW_RCP_INIT_NO_RUN', true);
require __DIR__ . '/../../api/receptionist-init.php';

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
const FAKE_NUMBER = '+00000000000';
$config = ['elevenlabs_init_secret' => SECRET, 'receptionist_transfer_number' => FAKE_NUMBER];

// Lima is UTC-5 all year: the offset is written out so the fixtures do not depend on any server setting.
function lima(string $local): int
{
    return (new DateTimeImmutable($local . '-05:00'))->getTimestamp();
}

// --- opening hours (Mon-Sat, 09:00 <= time < 20:00 Lima), whatever the server timezone is
$cases = [
    ['Mon 08:59 closed', '2026-11-23T08:59:00', false],
    ['Mon 08:59:59 closed', '2026-11-23T08:59:59', false],
    ['Mon 09:00 open', '2026-11-23T09:00:00', true],
    ['Sat 19:59 open', '2026-11-28T19:59:00', true],
    ['Sat 20:00 closed', '2026-11-28T20:00:00', false],
    ['Sun 12:00 closed', '2026-11-29T12:00:00', false],
    ['Thu 01:28 closed', '2026-11-26T01:28:00', false],
];
foreach (['UTC', 'Europe/Bratislava', 'Asia/Tokyo', 'Pacific/Honolulu', 'America/Lima'] as $serverTz) {
    date_default_timezone_set($serverTz);
    foreach ($cases as [$name, $local, $open]) {
        [$status, $out] = mw_rcp_init_process('POST', SECRET, $config, lima($local));
        check("$name (server $serverTz)", $status === 200 && $out === [
            'type' => 'conversation_initiation_client_data',
            'dynamic_variables' => [
                'advisors_open' => $open ? 'si' : 'no',
                'transfer_number' => $open ? FAKE_NUMBER : 'closed',
            ],
        ]);
    }
}

$open = lima('2026-11-23T10:00:00');

// --- open but no number to transfer to
foreach (['missing' => [], 'empty' => ['receptionist_transfer_number' => ''], 'blank' => ['receptionist_transfer_number' => '  '],
    'not a string' => ['receptionist_transfer_number' => ['x']]] as $label => $number) {
    [$status, $out] = mw_rcp_init_process('POST', SECRET, ['elevenlabs_init_secret' => SECRET] + $number, $open);
    check("open, number $label -> advisors_open no, number closed", $status === 200
        && $out['dynamic_variables'] === ['advisors_open' => 'no', 'transfer_number' => 'closed']);
}

// --- rejections: nothing about hours or the number leaks
$rejected = [
    ['no secret header -> 401', 'POST', '', $config, 401],
    ['wrong secret -> 401', 'POST', 'wrong', $config, 401],
    ['secret prefix -> 401', 'POST', substr(SECRET, 0, -1), $config, 401],
    ['secret not configured -> 503', 'POST', SECRET, ['receptionist_transfer_number' => FAKE_NUMBER], 503],
    ['empty configured secret, empty header -> 503', 'POST', '', ['elevenlabs_init_secret' => ''] + $config, 503],
    ['non-string configured secret -> 503', 'POST', SECRET, ['elevenlabs_init_secret' => true] + $config, 503],
    ['GET -> 405', 'GET', SECRET, $config, 405],
    ['PUT -> 405', 'PUT', SECRET, $config, 405],
];
foreach ($rejected as [$name, $method, $header, $cfg, $expected]) {
    [$status, $out] = mw_rcp_init_process($method, $header, $cfg, $open);
    check($name, $status === $expected && $out === ['ok' => false]);
}

exit($fails === 0 ? 0 : 1);
