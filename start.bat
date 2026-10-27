@echo off
title NA NATURAL AIR CONDITION® Bill Generator
echo ==========================================================
echo       NA NATURAL AIR CONDITION® Bill Generator            
echo ==========================================================
echo.

:: Check if PHP is available
where php >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: PHP is not installed or not added to your Windows PATH.
    echo Please download and install PHP, add it to your System PATH variables,
    echo and then try running this script again.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

set PORT=8000
set URL=http://127.0.0.1:%PORT%

echo ⚡ Starting local web server on %URL%...
echo 🖥️  Opening dashboard in your web browser...
start %URL%

:: Start PHP server
php -S 127.0.0.1:%PORT%
