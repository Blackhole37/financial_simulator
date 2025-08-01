@echo off
REM Windows batch script to run Financial Simulator with Docker

echo ========================================
echo Financial Simulator - Docker Setup
echo ========================================

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check if .env file exists
if not exist .env (
    echo ⚠️ .env file not found. Creating from template...
    copy .env.docker .env
    echo.
    echo 📝 Please edit the .env file and add your API keys:
    echo    - OPENAI_API_KEY
    echo    - GROQ_API_KEY
    echo    - AGENTOPS_API_KEY
    echo.
    echo Press any key after updating the .env file...
    pause
)

echo 🚀 Starting Financial Simulator services...

REM Stop any existing containers
docker-compose down

REM Build and start services
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
docker-compose ps

echo.
echo 🎉 Financial Simulator is starting up!
echo.
echo 📊 Access points:
echo    - API Documentation: http://localhost:8002/docs
echo    - Health Check: http://localhost:8002/health
echo    - Database UI: http://localhost:8081
echo.
echo 📝 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
echo.

REM Open browser to API docs
start http://localhost:8002/docs

echo Press any key to exit...
pause
