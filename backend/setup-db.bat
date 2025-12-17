@echo off
REM MySQL Database Setup Script for Task Manager
echo === Task Manager Database Setup ===
echo.

REM Prompt for MySQL username
set /p username="Enter MySQL username (default: root): "
if "%username%"=="" set username=root

REM Prompt for MySQL password
set /p password="Enter MySQL password: "

echo.
echo Creating database 'taskmanager'...

REM Create database
mysql -u %username% -p%password% -e "CREATE DATABASE IF NOT EXISTS taskmanager;"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Database 'taskmanager' created successfully!
    echo.
    echo Next steps:
    echo 1. Update backend\.env file with:
    echo    DATABASE_URL="mysql://%username%:%password%@localhost:3306/taskmanager"
    echo.
    echo 2. Run Prisma migrations:
    echo    cd backend
    echo    npm run prisma:generate
    echo    npm run prisma:migrate
) else (
    echo.
    echo [ERROR] Failed to create database. Please check:
    echo   - MySQL is running
    echo   - Username and password are correct
    echo   - MySQL is in your PATH
    echo.
    echo You can also create the database manually:
    echo   mysql -u %username% -p
    echo   CREATE DATABASE taskmanager;
)

pause

