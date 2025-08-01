#!/usr/bin/env python3
"""
Free tier startup script for Financial Simulator on Render.
Optimized for free tier with Redis disabled and minimal resource usage.
"""

import os
import sys
import time
import uvicorn
from pathlib import Path

# Add the Financial_simulator directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "Financial_simulator"))

def validate_environment():
    """Validate that required environment variables are set."""
    required_vars = [
        'MONGODB_URI',
        'OPENAI_API_KEY',
        'GROQ_API_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your Render dashboard.")
        return False
    
    print("✅ All required environment variables are set")
    return True

def check_database_connections():
    """Check database connections before starting the application."""
    print("🔍 Checking database connections...")
    
    # Check MongoDB
    try:
        import pymongo
        mongodb_uri = os.getenv('MONGODB_URI')
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=10000)
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("Please check your MONGODB_URI environment variable")
        return False
    
    # Skip Redis check for free tier
    print("ℹ️ Redis disabled for free tier - using in-memory cache fallback")
    
    return True

def setup_directories():
    """Create necessary directories for the application."""
    directories = [
        "Financial_simulator/temp_pdfs",
        "Financial_simulator/monthly_output", 
        "Financial_simulator/output",
        "logs"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"📁 Created directory: {directory}")

def optimize_for_free_tier():
    """Set environment variables optimized for free tier."""
    # Disable Redis
    os.environ['USE_REDIS'] = 'false'
    os.environ['REDIS_URL'] = ''
    
    # Optimize for lower resource usage
    os.environ['MAX_WORKERS'] = '1'
    os.environ['TIMEOUT'] = '300'
    
    print("⚡ Optimized configuration for free tier")

def main():
    """Main startup function."""
    print("🚀 Starting Financial Simulator in FREE TIER mode...")
    
    # Optimize for free tier
    optimize_for_free_tier()
    
    # Validate environment
    if not validate_environment():
        sys.exit(1)
    
    # Setup directories
    setup_directories()
    
    # Check database connections
    if not check_database_connections():
        sys.exit(1)
    
    # Get server configuration (free tier uses port 10000)
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 10000))
    workers = 1  # Free tier limitation
    
    print(f"🌐 Starting server on {host}:{port} with {workers} worker")
    print("💡 Free tier limitations: 750 hours/month, sleeps after 15min inactivity")
    
    # Import and start the FastAPI application
    try:
        # Change to the Financial_simulator directory
        os.chdir('Financial_simulator')
        
        # Start the application with uvicorn
        uvicorn.run(
            "langgraph_api:app",
            host=host,
            port=port,
            workers=workers,
            log_level="info",
            access_log=True,
            reload=False  # Never use reload in production
        )
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
