@echo off
title NA NATURAL AIR CONDITION® CRM Bill Generator
echo ==========================================================
echo       NA NATURAL AIR CONDITION® CRM Bill Generator        
echo               React Native & Expo App                     
echo ==========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in your Windows PATH.
    echo Please install Node.js (https://nodejs.org/) and retry.
    echo.
    pause
    exit /b 1
)

echo ⚡ Starting React Native / Expo application...
echo 🌐 Launching web interface...
npm run web
