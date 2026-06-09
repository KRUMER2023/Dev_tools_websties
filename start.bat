@echo off
title Tools Dashboard Launcher
echo ==========================================
echo   🚀 Starting Tools Dashboard Servers...
echo ==========================================
echo.

:: Start Node.js backend server in the background
echo [1/3] Starting Local Admin Backend on port 3000...
start /B node server.js

:: Start Frontend HTTP Server on port 8000 in the background (disabling caching)
echo [2/3] Starting Frontend Server on port 8000...
start /B npx http-server -p 8000 -c-1

:: Give the servers a moment to bind to ports
echo [3/3] Waiting for servers to initialize...
timeout /t 2 /nobreak >nul

:: Launch the site in the default browser
echo.
echo Opening http://localhost:8000 in your browser...
start http://localhost:8000

echo.
echo ==========================================
echo   ✅ Both servers are running!
echo   Close this command prompt to stop them.
echo ==========================================
echo.

:: Keep window open to show logs and keep servers running
pause
