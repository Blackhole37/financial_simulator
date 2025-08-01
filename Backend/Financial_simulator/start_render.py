#!/usr/bin/env python3
"""
Render deployment startup script for Financial Simulator API.
This script handles the startup process for Render deployment with proper error handling.
"""

import os
import sys
import time
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_environment():
    """Check if required environment variables are set."""
    logger.info("🔍 Checking environment configuration...")
    
    # Required environment variables for production
    required_vars = []
    optional_vars = [
        'MONGODB_URI',
        'REDIS_URL', 
        'OPENAI_API_KEY',
        'GROQ_API_KEY',
        'AGENTOPS_API_KEY'
    ]
    
    missing_required = []
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
    
    if missing_required:
        logger.error(f"❌ Missing required environment variables: {missing_required}")
        return False
    
    missing_optional = []
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)
    
    if missing_optional:
        logger.warning(f"⚠️ Missing optional environment variables: {missing_optional}")
        logger.warning("⚠️ Some features may not work without these variables")
    
    logger.info("✅ Environment check completed")
    return True

def install_dependencies():
    """Install required dependencies."""
    logger.info("📦 Installing dependencies...")
    
    try:
        import subprocess
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], check=True, capture_output=True, text=True)
        logger.info("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to install dependencies: {e}")
        logger.error(f"❌ Error output: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error installing dependencies: {e}")
        return False

def test_imports():
    """Test if critical imports work."""
    logger.info("🧪 Testing critical imports...")
    
    try:
        # Test FastAPI
        import fastapi
        logger.info("✅ FastAPI import: OK")
        
        # Test uvicorn
        import uvicorn
        logger.info("✅ Uvicorn import: OK")
        
        # Test other critical imports
        import asyncio
        import json
        import os
        logger.info("✅ Standard library imports: OK")
        
        return True
    except ImportError as e:
        logger.error(f"❌ Import error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected import error: {e}")
        return False

def start_server():
    """Start the FastAPI server with uvicorn."""
    logger.info("🚀 Starting Financial Simulator API server...")
    
    try:
        # Change to the correct directory
        os.chdir(Path(__file__).parent / "Financial_simulator")
        
        # Import and start the server
        import uvicorn
        
        # Get port from environment (Render sets this)
        port = int(os.getenv("PORT", 8000))
        host = "0.0.0.0"
        
        logger.info(f"🌐 Starting server on {host}:{port}")
        
        # Start the server
        uvicorn.run(
            "langgraph_api:app",
            host=host,
            port=port,
            log_level="info",
            access_log=True
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        sys.exit(1)

def main():
    """Main startup function."""
    logger.info("🎬 Starting Financial Simulator API for Render deployment")
    logger.info("=" * 60)
    
    # Step 1: Check environment
    if not check_environment():
        logger.error("❌ Environment check failed")
        sys.exit(1)
    
    # Step 2: Test imports
    if not test_imports():
        logger.error("❌ Import test failed")
        sys.exit(1)
    
    # Step 3: Start server
    logger.info("🎯 All checks passed, starting server...")
    start_server()

if __name__ == "__main__":
    main()
