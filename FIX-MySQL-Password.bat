@echo off
title Fix MySQL Password
color 0E

echo.
echo  ==========================================
echo    Fix MySQL Password
echo  ==========================================
echo.
echo  What password did you set when installing MySQL?
echo.
set /p PASS="  Type your MySQL password and press Enter: "

echo.
echo  Saving password to app settings...

(
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USER=root
echo DB_PASSWORD=%PASS%
echo DB_NAME=hotel_db
echo JWT_SECRET=hotel_secret_key_2024
echo PORT=4000
) > "%~dp0backend\.env"

echo.
echo  ✅ Password saved successfully!
echo.
echo  Now run START-BACKEND.bat again.
echo.
pause
