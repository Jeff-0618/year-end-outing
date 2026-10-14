@echo off
rem Double-click to open the presentation on Windows.
rem Starts a tiny local web server (needed so the map tiles load correctly), then opens the browser.
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. You can still double-click index.html instead.
  pause
  exit /b 1
)
echo.
echo  Countdown 2026 is running at http://localhost:8000/index.html
echo  Keep this window open while presenting. Press Ctrl+C to stop.
echo.
start "" "http://localhost:8000/index.html"
python -m http.server 8000
