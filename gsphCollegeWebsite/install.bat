@echo off
echo ========================================
echo GSPG College Management System
echo MySQL Backend Installation
echo ========================================
echo.

cd backend

echo [1/3] Installing Node.js dependencies...
call npm install

echo.
echo [2/3] Installation complete!
echo.
echo [3/3] Next steps:
echo.
echo 1. Install MySQL from: https://dev.mysql.com/downloads/installer/
echo 2. Run database.sql in MySQL Workbench
echo 3. Update backend\.env with your MySQL password
echo 4. Run: start-server.bat
echo.
echo ========================================
echo Installation Complete!
echo ========================================
pause
