@echo off
chcp 65001 >nul
title ارس زنجان - سیستم هوشمند انتخاب پرس
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js پیدا نشد. لطفا ابتدا Node.js را از nodejs.org نصب کنید.
  pause
  exit /b 1
)

if not exist "out\index.html" (
  echo نسخه آماده اجرا پیدا نشد؛ در حال ساخت نسخه آفلاین... این فقط بار اول لازم است.
  call npm install
  call npm run build
)

node scripts\serve.js
