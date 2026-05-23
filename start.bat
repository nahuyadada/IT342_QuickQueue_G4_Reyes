@echo off
setlocal

echo Starting QuickQueue (backend + web)...

REM --- Backend (Spring Boot) ---
start "QuickQueue Backend" cmd /k "cd /d "%~dp0backend" && (if exist .env (for /f "usebackq tokens=1,* delims==" %%A in (".env") do (if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"))) && call mvnw.cmd spring-boot:run"

REM --- Web frontend (Vite) ---
start "QuickQueue Web" cmd /k "cd /d "%~dp0web" && (if not exist node_modules call npm install) && call npm run dev"

echo Backend and web are launching in separate windows.
endlocal
