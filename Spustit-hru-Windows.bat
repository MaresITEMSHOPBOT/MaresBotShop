@echo off
chcp 65001 >nul
title Francais 3D
rem === Spousti hru jako samostatne okno (rezim "aplikace") ===
setlocal
set "HTML=%~dp0francouzstina.html"
set "URL=file:///%HTML:\=/%"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME%" (
  start "" "%CHROME%" --app="%URL%" --start-maximized
) else if exist "%EDGE%" (
  start "" "%EDGE%" --app="%URL%" --start-maximized
) else (
  start "" "%HTML%"
)
endlocal
