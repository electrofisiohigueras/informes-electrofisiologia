# ===================================================================
# PUBLICAR DATOS COMPARTIDOS (data.json)
# ===================================================================
# Uso (desde la app): Opciones > Datos Comunes > "Exportar datos compartidos"
#   -> descarga el archivo data.json en la carpeta Descargas.
# Después ejecuta este script (doble clic o desde PowerShell):
#
#   .\publicar-datos.ps1
#
# El script reemplaza el data.json del repositorio, hace commit y publica.
# Los colleagues no necesitan hacer nada: al entrar a la app scarcan los
# datos universales publicados (o pulsan "Restaurar datos compartidos").
# ===================================================================

param(
    [string]$Archivo = "$env:USERPROFILE\Downloads\data.json"
)

$ErrorActionPreference = 'Stop'
$repo = $PSScriptRoot

if (-not (Test-Path -LiteralPath $repo)) {
    Write-Host "No se encontró la carpeta del repositorio: $repo" -ForegroundColor Red
    Read-Host "Presione Enter para salir"
    exit 1
}

if (-not (Test-Path -LiteralPath $Archivo)) {
    Write-Host "No existe el archivo: $Archivo" -ForegroundColor Red
    Write-Host "Descargue primero 'data.json' desde la app (Datos Comunes > Exportar datos compartidos)." -ForegroundColor Yellow
    Read-Host "Presione Enter para salir"
    exit 1
}

try {
    $contenido = Get-Content -LiteralPath $Archivo -Raw
    $null = $contenido | ConvertFrom-Json
} catch {
    Write-Host "El archivo no es un JSON válido: $Archivo" -ForegroundColor Red
    Read-Host "Presione Enter para salir"
    exit 1
}

Copy-Item -LiteralPath $Archivo -Destination (Join-Path $repo 'data.json') -Force
Write-Host "data.json actualizado en el repositorio local." -ForegroundColor Green

git -C $repo add data.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al preparar los cambios (git add)." -ForegroundColor Red
    Read-Host "Presione Enter para salir"
    exit 1
}

git -C $repo commit -m "Actualiza datos compartidos (data.json)"
if ($LASTEXITCODE -eq 0) {
    git -C $repo -c credential.helper=manager push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Publicado. GitHub Pages sirve los cambios en 1-2 minutos." -ForegroundColor Green
    } else {
        Write-Host "No se pudo publicar (push). Revise su conexión a GitHub." -ForegroundColor Yellow
    }
} else {
    Write-Host "No había cambios para publicar (data.json ya estaba actualizado)." -ForegroundColor Yellow
}

Read-Host "Presione Enter para salir"
