# Financial Simulator - Docker Setup

This guide will help you run the Financial Simulator using Docker containers.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- Your API keys (OpenAI, Groq, AgentOps)

## Quick Start

### 1. Clone and Navigate
```bash
cd Backend/Financial_simulator
```

### 2. Set Up Environment Variables
Copy the environment template and add your API keys:
```bash
cp .env.docker .env
```

Edit the `.env` file and replace the placeholder values:
```env
OPENAI_API_KEY=your_actual_openai_api_key
GROQ_API_KEY=your_actual_groq_api_key
AGENTOPS_API_KEY=your_actual_agentops_api_key
```

### 3. Start All Services
```bash
docker-compose up -d
```

This will start:
- **MongoDB** (port 27017) - Database
- **Redis** (port 6379) - Cache
- **Financial Simulator API** (port 8002) - Main application
- **Mongo Express** (port 8081) - Database management UI (optional)

### 4. Verify Services
Check if all services are running:
```bash
docker-compose ps
```

Check application health:
```bash
docker-compose exec financial_simulator python scripts/health_check.py
```

### 5. Access the Application
- **API Documentation**: http://localhost:8002/docs
- **Health Check**: http://localhost:8002/health
- **Database UI**: http://localhost:8081 (optional)

## Usage

### Start a Financial Simulation
```bash
curl -X POST "http://localhost:8002/start-simulation" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo_user",
    "initial_capital": 100000,
    "simulation_months": 12,
    "risk_tolerance": "moderate"
  }'
```

### Upload PDF for RAG
```bash
curl -X POST "http://localhost:8002/pdf/upload" \
  -F "file=@your_document.pdf" \
  -F "user_id=demo_user"
```

### Chat with Financial Assistant
```bash
curl -X POST "http://localhost:8002/learning" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo_user",
    "message": "What are the best investment strategies for beginners?"
  }'
```

## Docker Commands

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs financial_simulator
docker-compose logs mongodb
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f financial_simulator
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart financial_simulator
```

### Update Application
```bash
# Rebuild and restart the application
docker-compose up -d --build financial_simulator
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :8002
   
   # Change port in docker-compose.yml if needed
   ```

2. **API Keys Not Working**
   - Verify your `.env` file has the correct API keys
   - Restart the container after updating environment variables:
     ```bash
     docker-compose restart financial_simulator
     ```

3. **Database Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Test connection manually
   docker-compose exec financial_simulator python -c "
   import pymongo, os
   client = pymongo.MongoClient(os.getenv('MONGODB_URI'))
   print(client.admin.command('ping'))
   "
   ```

4. **Out of Memory**
   - Increase Docker Desktop memory allocation
   - Or reduce the number of workers in the application

### Health Checks
```bash
# Run comprehensive health check
docker-compose exec financial_simulator python scripts/health_check.py

# Check individual service health
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
docker-compose exec redis redis-cli ping
```

## Data Persistence

Data is persisted in Docker volumes:
- `mongodb_data`: Database files
- `redis_data`: Cache data
- Local directories are mounted for:
  - `temp_pdfs/`: Uploaded PDF files
  - `output/`: Simulation results
  - `monthly_output/`: Monthly reports

## Security Notes

- Default MongoDB credentials are set in docker-compose.yml
- Change these for production use
- API keys are passed as environment variables
- The application runs as a non-root user inside the container

## Development

### Access Container Shell
```bash
# Access the application container
docker-compose exec financial_simulator bash

# Access MongoDB shell
docker-compose exec mongodb mongosh

# Access Redis CLI
docker-compose exec redis redis-cli
```

### Development Mode
For development with auto-reload:
```bash
# Override the command in docker-compose.yml
command: ["uvicorn", "langgraph_api:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]
```

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Run health checks: `docker-compose exec financial_simulator python scripts/health_check.py`
3. Verify your API keys in the `.env` file
4. Ensure Docker Desktop has sufficient resources allocated
