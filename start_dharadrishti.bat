@echo off
echo ===============================================================================
echo DHARADRISHTI - TERRAIN-AWARE HYPERLOCAL FLASH FLOOD DECISION SUPPORT SYSTEM
echo Smart India Hackathon PS 26192 (NDRF / Ministry of Home Affairs)
echo Primary Corridor: Upper Beas Basin (Kullu-Manali, Himachal Pradesh)
echo ===============================================================================
echo.
echo Launching DharaDrishti Tactical Dashboard...
cd /d "%~dp0frontend"
call npm.cmd run dev -- --host --port 5173
pause
