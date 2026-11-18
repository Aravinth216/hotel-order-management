@echo off
title Hotel Manager - Backend Server
color 0A

echo.
echo  ==========================================
echo    HOTEL MANAGER - Backend Server
echo  ==========================================
echo.

echo  [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js is NOT installed!
    echo.
    echo  Please install it:
    echo  1. Open browser
    echo  2. Go to: https://nodejs.org
    echo  3. Click the green LTS button
    echo  4. Install it, then run this file again
    echo.
    pause
    exit /b
)
for /f "tokens=*" %%i in ('node --version') do set VER=%%i
echo  Node.js found: %VER%

echo.
echo  [2/3] Installing packages (1-2 mins first time)...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm install failed!
    echo  Check internet connection and try again.
    echo.
    pause
    exit /b
)
echo  Packages ready!

echo.
echo  [3/3] Starting backend server...
echo.
echo  ==========================================
echo   Watch for these lines:
echo   ^> MySQL connected!
echo   ^> Hotel Manager Backend
echo   ^> http://localhost:4000
echo  ==========================================
echo.
node src/server.js

echo.
echo  ==========================================
echo   SERVER STOPPED. Common fixes:
echo.
echo   MySQL error   - Run FIX-MySQL-Password.bat
echo   Port in use   - Restart laptop and retry
echo  ==========================================
echo.
pause
