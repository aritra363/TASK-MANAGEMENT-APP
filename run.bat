@echo off
title Task Management App Launcher

cd /d "%~dp0"

echo.
echo Starting Task Management Application...
echo.

REM Start backend
echo Starting Backend Server on port 4000...
start "Backend - TaskMGT" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak

REM Start frontend
echo Starting Frontend Server on port 5173...
start "Frontend - TaskMGT" cmd /k "cd frontend && npm run dev"

REM Wait a bit for frontend to start
timeout /t 4 /nobreak

REM Open browser
echo Opening application in browser...
start "" "http://localhost:5173"

echo.
echo Application is starting!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:4000
echo.
