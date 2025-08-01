"""
Combined Gurukul AI Service - All services in one for free tier deployment
This combines Financial Simulator, API Data, Pipeline, and TTS services
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Add all service paths
current_dir = Path(__file__).parent.parent
sys.path.append(str(current_dir / "Financial_simulator" / "Financial_simulator"))
sys.path.append(str(current_dir / "api_data"))
sys.path.append(str(current_dir / "pipline-24-master"))
sys.path.append(str(current_dir / "tts_service"))

app = FastAPI(
    title="Gurukul AI - Combined Service",
    description="All Gurukul AI services combined for free tier deployment",
    version="1.0.0"
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "*")
if cors_origins == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint showing all available services"""
    return {
        "message": "Gurukul AI - Combined Service",
        "version": "1.0.0",
        "services": {
            "financial": "Financial Simulator with LangGraph",
            "api_data": "RAG and OCR functionality",
            "pipeline": "Lesson generation",
            "tts": "Text-to-speech generation"
        },
        "endpoints": {
            "health": "/health",
            "financial": "/financial/*",
            "data": "/data/*", 
            "pipeline": "/pipeline/*",
            "tts": "/tts/*",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Combined health check for all services"""
    health_status = {
        "status": "healthy",
        "services": {
            "financial": "available",
            "api_data": "available", 
            "pipeline": "available",
            "tts": "available"
        }
    }
    
    # Check MongoDB connection if available
    try:
        import pymongo
        mongodb_uri = os.getenv('MONGODB_URI')
        if mongodb_uri:
            client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            client.admin.command('ping')
            health_status["database"] = "connected"
        else:
            health_status["database"] = "not_configured"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
    
    return health_status

# Import and mount service routes
try:
    # Financial Simulator routes
    from langgraph_api import app as financial_app
    app.mount("/financial", financial_app)
    print("✅ Financial Simulator service loaded")
except Exception as e:
    print(f"⚠️ Could not load Financial Simulator: {e}")

try:
    # API Data routes  
    from api import app as api_data_app
    app.mount("/data", api_data_app)
    print("✅ API Data service loaded")
except Exception as e:
    print(f"⚠️ Could not load API Data service: {e}")

try:
    # Pipeline routes
    from app import app as pipeline_app
    app.mount("/pipeline", pipeline_app)
    print("✅ Pipeline service loaded")
except Exception as e:
    print(f"⚠️ Could not load Pipeline service: {e}")

try:
    # TTS routes
    from tts import app as tts_app
    app.mount("/tts", tts_app)
    print("✅ TTS service loaded")
except Exception as e:
    print(f"⚠️ Could not load TTS service: {e}")

def main():
    """Main function for starting the combined service"""
    try:
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", 10000))  # Free tier uses port 10000
        
        print(f"🚀 Starting Combined Gurukul AI Service on {host}:{port}")
        
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=True,
            reload=False
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        raise

if __name__ == "__main__":
    main()
