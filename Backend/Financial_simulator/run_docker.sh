#!/bin/bash
# Linux/Mac script to run Financial Simulator with Docker

set -e

echo "========================================"
echo "Financial Simulator - Docker Setup"
echo "========================================"

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is running"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from template..."
    cp .env.docker .env
    echo ""
    echo "📝 Please edit the .env file and add your API keys:"
    echo "   - OPENAI_API_KEY"
    echo "   - GROQ_API_KEY"
    echo "   - AGENTOPS_API_KEY"
    echo ""
    echo "Press Enter after updating the .env file..."
    read
fi

echo "🚀 Starting Financial Simulator services..."

# Stop any existing containers
docker-compose down

# Build and start services
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

echo ""
echo "🎉 Financial Simulator is starting up!"
echo ""
echo "📊 Access points:"
echo "   - API Documentation: http://localhost:8002/docs"
echo "   - Health Check: http://localhost:8002/health"
echo "   - Database UI: http://localhost:8081"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo ""

# Try to open browser (works on most Linux distributions and macOS)
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:8002/docs
elif command -v open >/dev/null 2>&1; then
    open http://localhost:8002/docs
fi

echo "Setup complete! 🎉"
