@echo off
title Find My IP Address
color 0D

echo.
echo  ==========================================
echo    Your Laptop IP (share with phones)
echo  ==========================================
echo.
ipconfig | findstr /i "IPv4"
echo.
echo  Use the IP shown above.
echo  On each phone browser type:
echo  http://THAT-IP:5173
echo.
pause
