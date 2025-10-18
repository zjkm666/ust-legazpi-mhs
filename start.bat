@echo off
echo Starting UST-Legazpi Mental Health Support Portal...
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found. Installing dependencies...
npm install

if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    echo.
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo Starting the server...
echo.
echo The application will be available at:
echo - Frontend: http://localhost:3000
echo - API: http://localhost:3000/api
echo.
echo Default Admin Credentials:
echo - Email: admin@ust-legazpi.edu.ph
echo - Password: admin123
echo.
echo Press Ctrl+C to stop the server
echo.

npm start