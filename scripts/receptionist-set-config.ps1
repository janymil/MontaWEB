# Creates a new password, saves it with the transfer number in the server config,
# then copies the password to the clipboard (paste it into ElevenLabs).
# Run it yourself; it never shows the password. Running it again makes a new one.
param(
    [string]$Number,
    [string]$Target = '/var/www/montaweb/api/config.php'
)
$ErrorActionPreference = 'Stop'

if (-not $Number) { $Number = Read-Host 'Mobile that should ring, with +51 and no spaces' }
$Number = $Number.Trim()
if ($Number -notmatch '^\+519\d{8}$') {
    Write-Host 'STOP: use a Peruvian mobile: +51 followed by 9 digits starting with 9. Nothing changed.' -ForegroundColor Red
    return
}

$secret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$code = [Convert]::ToBase64String([IO.File]::ReadAllBytes("$PSScriptRoot\receptionist-set-config.py"))
$secret, $Number | ssh washington "python3 -c 'import base64,sys;exec(base64.b64decode(sys.argv.pop(1)))' $code $Target"

if ($LASTEXITCODE -ne 0) {
    Write-Host 'STOP: the server did not save it. Nothing was copied.' -ForegroundColor Red
    return
}
Set-Clipboard $secret
Write-Host 'The password is now copied. Paste it into ElevenLabs before copying anything else.' -ForegroundColor Green
