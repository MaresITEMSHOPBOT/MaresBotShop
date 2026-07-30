@echo off
rem MaresFy - spusti appku na http://127.0.0.1:8080/maresfy/
rem Spotify prijima jen https nebo loopback 127.0.0.1, proto tenhle maly server.
setlocal
cd /d "%~dp0.."
set PORT=8080
set URL=http://127.0.0.1:%PORT%/maresfy/

echo MaresFy bezi na %URL%
echo Tuhle adresu vloz ve Spotify dashboardu do Redirect URIs.
echo Zastavis to klavesami Ctrl+C.
start "" "%URL%"

py -3 -m http.server %PORT% --bind 127.0.0.1
if %errorlevel% neq 0 python -m http.server %PORT% --bind 127.0.0.1
if %errorlevel% neq 0 npx --yes http-server . -p %PORT% -a 127.0.0.1
if %errorlevel% neq 0 (
  echo Nenasel jsem Python ani Node.js - nainstaluj jeden z nich.
  pause
)
