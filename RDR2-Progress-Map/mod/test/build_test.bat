@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "VCVARS=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
if not exist "%VCVARS%" set "VCVARS=C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
if not exist "%VCVARS%" set "VCVARS=C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat"
if not exist "%VCVARS%" (
  echo Could not find vcvars64.bat. Install Visual Studio Build Tools with the C++ workload.
  pause
  exit /b 1
)

call "%VCVARS%" >nul
if errorlevel 1 exit /b 1

if not exist obj mkdir obj

cl /nologo /LD /O2 /MT /EHsc /utf-8 /Fo:obj\ stub.cpp /Fe:ScriptHookRDR2.dll ^
  /link /IMPLIB:ScriptHookRDR2.lib
if errorlevel 1 exit /b 1

cl /nologo /O2 /MT /EHsc /utf-8 /Fo:obj\ harness.cpp /Fe:harness.exe
if errorlevel 1 exit /b 1

echo.
echo == Plugin test with the ScriptHook stub ==
"%~dp0harness.exe" "%~dp0ScriptHookRDR2.dll" "%~dp0..\dist\RDR2MapTracker.asi"
echo Exit code: %errorlevel%

if /i not "%~1"=="-nopause" pause
