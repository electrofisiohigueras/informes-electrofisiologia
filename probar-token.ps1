# ===================================================================
# DIAGNÓSTICO DEL TOKEN DE GITHUB (para respaldos en la nube)
# ===================================================================
# El token NUNCA se escribe en el chat ni se envía a nadie: se tipea aquí,
# en tu pantalla, y solo se usa contra la API de GitHub.
#
# Uso: doble clic en este archivo, o desde PowerShell:
#   .\probar-token.ps1
#
# Resultado esperado: cada línea dice OK o el código de error de GitHub.
# ===================================================================

$repo = 'electrofisiohigueras/informes-electrofisiologia'

Write-Host ""
Write-Host "=== Diagnostico del token de GitHub ===" -ForegroundColor Cyan
$token = Read-Host "Pega tu token (NO se mostrara mientras escribes)"
if (-not $token) { Write-Host "No se ingeso token." -ForegroundColor Red; Read-Host "Presione Enter"; exit 1 }

$headers = @{
    'Authorization' = "Bearer $token"
    'Accept'        = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
    'User-Agent'    = 'informes-electrofisiologia-diagnostico'
}

function Invoke-GitHubTest {
    param([string]$Url, [string]$Label, [string]$Method = 'GET', $Body = $null)
    try {
        $params = @{ Uri = $Url; Headers = $headers; Method = $Method; UseBasicParsing = $true }
        if ($Body) { $params.Body = $Body; $params.ContentType = 'application/json' }
        $response = Invoke-WebRequest @params
        Write-Host ("[OK]   {0} (HTTP {1})" -f $Label, $response.StatusCode) -ForegroundColor Green
        return $response.Content
    } catch {
        $status = 'sin respuesta'
        $detail = $_.Exception.Message
        try {
            $status = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $detail = $reader.ReadToEnd()
        } catch { }
        Write-Host ("[FALLA] {0} (HTTP {1})" -f $Label, $status) -ForegroundColor Red
        Write-Host ("       " + $detail) -ForegroundColor DarkGray
        return $null
    }
}

Write-Host ""
Write-Host "1) El token es valido (GET /user)"
$user = Invoke-GitHubTest -Url 'https://api.github.com/user' -Label 'GET /user'
if ($user) {
    try { Write-Host ("       usuario: " + (($user | ConvertFrom-Json).login)) -ForegroundColor DarkGray } catch { }
}

Write-Host ""
Write-Host "2) El token tiene acceso al repo (GET /repos/$repo)"
Invoke-GitHubTest -Url "https://api.github.com/repos/$repo" -Label 'GET /repos/... ' | Out-Null

Write-Host ""
Write-Host "3) El token puede LEER la carpeta backups/ (GET contents/backups)"
Invoke-GitHubTest -Url "https://api.github.com/repos/$repo/contents/backups?ref=main" -Label 'GET contents/backups' | Out-Null

Write-Host ""
Write-Host "4) El token puede ESCRIBIR (prueba real: crea y borra un archivo)"
$testPath = 'backups/_test_token.json'
$content = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"test":true}'))
$body = "{`"message`":`"prueba de token`",`"branch`":`"main`",`"content`":`"$content`"}"
$write = Invoke-GitHubTest -Url "https://api.github.com/repos/$repo/contents/$testPath" -Label 'PUT archivo de prueba' -Method 'PUT' -Body $body
if ($write) {
    try {
        $sha = ($write | ConvertFrom-Json).content.sha
        $delBody = "{`"message`":`"borra prueba de token`",`"branch`":`"main`",`"sha`":`"$sha`"}"
        Invoke-GitHubTest -Url "https://api.github.com/repos/$repo/contents/$testPath" -Label 'DELETE archivo de prueba' -Method 'DELETE' -Body $delBody | Out-Null
    } catch { }
}

Write-Host ""
Write-Host "Diagnostico terminado. Copia estas lineas y enviamelas (NO el token)." -ForegroundColor Cyan
Write-Host "Si todo dice [OK], el token sirve: pegalo en la app (Opciones > Respaldos en la nube)." -ForegroundColor Green
Read-Host "Presione Enter para salir"
