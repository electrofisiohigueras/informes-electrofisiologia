@echo off
REM Publica el data.json descargado desde la app (Datos Comunes > Exportar datos compartidos).
REM Doble clic en este archivo: commit + push automaticos.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publicar-datos.ps1"
