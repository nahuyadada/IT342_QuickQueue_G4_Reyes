@echo off
cd /d "%~dp0backend"

if exist .env (
	for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
		if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
	)
)

call mvnw.cmd spring-boot:run
