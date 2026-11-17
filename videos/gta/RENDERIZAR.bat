@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Render del short de GTA 6 ===
where node >nul 2>nul || (echo Falta Node.js: instalalo desde https://nodejs.org y vuelve a abrir este archivo. & pause & exit /b 1)
if not exist node_modules (
  echo Instalando dependencias, tarda 1-2 minutos...
  call npm install || (echo Fallo la instalacion. & pause & exit /b 1)
)
if not exist out mkdir out
echo Renderizando con la placa de video...
call npx remotion render GTA out\gta-6.mp4 --gl=angle --concurrency=50%% --crf=18
if errorlevel 1 (echo El render fallo, mira el error de arriba. & pause & exit /b 1)
echo.
echo LISTO: %~dp0out\gta-6.mp4
pause
