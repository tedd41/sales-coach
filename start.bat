@echo off
echo ========================================
echo  Sales Coach Intelligence Platform
echo  Starting Backend API...
echo ========================================
cd backend
start "Backend API" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  Starting Frontend...
echo ========================================
cd ..\frontend
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  Both servers starting!
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
