@echo off
set JAVA_HOME=C:\Users\L13X16W02\.jdks\ms-17.0.18
cd /d C:\Users\L13X16W02\Documents\IT342_QuickQueue_G4_Reyes\backend

if exist .env (
	for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
		if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
	)
)

call mvnw.cmd spring-boot:run
