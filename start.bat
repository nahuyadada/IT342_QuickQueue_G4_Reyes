@echo off
setlocal

echo Starting QuickQueue (backend + web frontend with local backend)...

REM --- Backend (Spring Boot) ---
start "QuickQueue Backend" cmd /k "cd /d "%~dp0backend" && call mvnw.cmd spring-boot:run"

REM --- Web frontend (Vite) pointing to localhost:8080 ---
start "QuickQueue Web" cmd /k "cd /d "%~dp0web" && (if not exist node_modules call npm install) && call npm run dev:local"

echo Both windows are launching. Backend on :8080, web on :5173.
endlocal
