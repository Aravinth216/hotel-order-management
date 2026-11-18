@echo off
title Hotel Manager - Frontend App
color 0B

echo.
echo  ==========================================
echo    HOTEL MANAGER - Frontend App
echo  ==========================================
echo.

echo  [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js is NOT installed!
    echo  Go to https://nodejs.org and install LTS version.
    echo.
    pause
    exit /b
)
for /f "tokens=*" %%i in ('node --version') do set VER=%%i
echo  Node.js found: %VER%

echo.
echo  [2/3] Installing packages (1-2 mins first time)...
cd /d "%~dp0frontend"
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
echo  [3/3] Starting app...
echo.
echo  ==========================================
echo   Watch for these two links:
echo.
echo   Local:   http://localhost:5173
echo   Network: http://192.168.x.x:5173
echo.
echo   Open Local link on this laptop
echo   Share Network link with phones
echo  ==========================================
echo.
call npx vite --host

echo.
echo  App stopped.
pause
