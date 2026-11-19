@echo off
chcp 65001 >nul
title RDR2 - Progress Map
cd /d "%~dp0"
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"

echo.
echo Keep this window open while you use the map.
echo To close the map, press Ctrl+C or close this window.

where py >nul 2>nul
if %errorlevel%==0 (
  set "PY=py -3"
) else (
  set "PY=python"
)

%PY% --version >nul 2>nul
if errorlevel 1 (
  echo.
  echo Python 3 was not found. Install it from python.org
  echo and run this file again.
  pause
  exit /b 1
)

if not exist "assets\tiles\detailed\2" (
  echo.
  echo Downloading map tiles ^(one time only, about 120 MB^)...
  %PY% tools\fetch_tiles.py
)

if not exist "data\markers.json" (
  echo Generating map markers...
  %PY% tools\build_markers.py
)

if not exist "data\i18n_en.json" (
  echo Generating the English translation layer...
  %PY% tools\build_i18n.py
)

if not exist "data\images.json" (
  echo.
  echo Downloading legendary animal and fish photos ^(one time only^)...
  %PY% tools\fetch_images.py
  if errorlevel 1 del "data\images.json" 2>nul
)

%PY% app\server.py
pause
