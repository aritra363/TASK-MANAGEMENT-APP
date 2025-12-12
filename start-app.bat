@echo off
REM Task Management App - Start Frontend & Backend
REM This script starts both servers and opens the app in browser

setlocal enabledelayedexpansion

REM Colors and formatting
for /F %%A in ('echo prompt $H ^| cmd') do set "BS=%%A"

REM Get the directory of this batch file
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║    Task Management Application - Auto Launcher         ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if backend is already running on port 4000
echo [*] Checking if backend is running on port 4000...
netstat -ano | findstr ":4000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Backend is already running on port 4000
    set "backend_running=1"
) else (
    echo [X] Backend not running - starting backend...
    set "backend_running=0"
)

REM Check if frontend is already running on port 5173
echo [*] Checking if frontend is running on port 5173...
netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Frontend is already running on port 5173
    set "frontend_running=1"
) else (
    echo [X] Frontend not running - starting frontend...
    set "frontend_running=0"
)

echo.

REM Start backend if not running
if %backend_running% equ 0 (
    echo [→] Starting backend server...
    start "Task Management - Backend" cmd /k "cd backend && npm run dev"
    echo [✓] Backend started in new window
    timeout /t 3 /nobreak
)

REM Start frontend if not running
if %frontend_running% equ 0 (
    echo [→] Starting frontend server...
    start "Task Management - Frontend" cmd /k "cd frontend && npm run dev"
    echo [✓] Frontend started in new window
    timeout /t 3 /nobreak
)

echo.
echo [*] Opening application in browser...
timeout /t 2 /nobreak

REM Open the application in default browser
start "" "http://localhost:5173"

echo [✓] Application launched!
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Frontend: http://localhost:5173                       ║
echo ║  Backend:  http://localhost:4000                       ║
echo ║                                                        ║
echo ║  Servers are running in separate windows               ║
echo ║  Close the window to stop each server                  ║
echo ╚════════════════════════════════════════════════════════╝
echo.

pause
