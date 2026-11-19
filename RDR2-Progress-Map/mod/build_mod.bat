@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

rem Builds the plugin without the SDK: main.cpp resolves ScriptHookRDR2.dll at
rem load time, so only the Visual Studio C++ compiler is required.
set "VCVARS=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
if not exist "%VCVARS%" set "VCVARS=C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
if not exist "%VCVARS%" set "VCVARS=C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat"
if not exist "%VCVARS%" (
  echo Could not find vcvars64.bat. Install Visual Studio Build Tools with the C++ workload.
  pause
  exit /b 1
)

call "%VCVARS%" >nul
if errorlevel 1 (
  echo Could not set up the build environment.
  pause
  exit /b 1
)

if not exist dist mkdir dist

cl /nologo /LD /O2 /MT /EHsc /utf-8 /D_CRT_SECURE_NO_WARNINGS ^
  /Fo:dist\ ^
  /Fe:"dist\RDR2MapTracker.asi" ^
  src\main.cpp ^
  /link user32.lib

if errorlevel 1 (
  echo.
  echo Build failed.
  pause
  exit /b 1
)

echo.
echo Built: mod\dist\RDR2MapTracker.asi
echo Copy it to the game folder, next to RDR2.exe.
echo.
if /i "%~1"=="-i" (
  if exist "..\..\RDR2.exe" (
    copy /y "dist\RDR2MapTracker.asi" "..\..\RDR2MapTracker.asi" >nul
    echo Installed next to RDR2.exe.
  ) else (
    echo RDR2.exe was not found two folders up. Copy the .asi manually.
  )
)
if /i not "%~1"=="-nopause" pause
