@echo off
echo ========================================
echo   Rotten - Doc to PPT Converter
echo   Building Windows Application...
echo ========================================
echo.
echo This will create a Windows installer in the 'dist' folder.
echo Please wait, this may take a few minutes...
echo.
npm run electron:build:win
echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo Your Windows installer is ready in the 'dist' folder.
echo You can now distribute the .exe file to users.
echo.
pause
