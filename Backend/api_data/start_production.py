#!/usr/bin/env python3
"""
Production startup script for API Data Service on Render.
"""

import os
import sys
import uvicorn
from pathlib import Path

def validate_environment():
    """Validate environment variables."""
    required_vars = ['MONGODB_URI']
    optional_vars = ['HUGGINGFACE_API_TOKEN', 'OPENAI_API_KEY']
    
    missing_required = []
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
    
    if missing_required:
        print(f"❌ Missing required environment variables: {', '.join(missing_required)}")
        return False
    
    # Check optional variables
    for var in optional_vars:
        if not os.getenv(var):
            print(f"⚠️ Optional environment variable not set: {var}")
    
    print("✅ Environment validation passed")
    return True

def check_database_connection():
    """Check MongoDB connection."""
    try:
        import pymongo
        mongodb_uri = os.getenv('MONGODB_URI')
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=10000)
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

def setup_directories():
    """Create necessary directories."""
    directories = ["temp_audio", "uploads", "outputs"]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"📁 Created directory: {directory}")

def main():
    """Main startup function."""
    print("🚀 Starting API Data Service...")
    
    # Validate environment
    if not validate_environment():
        sys.exit(1)
    
    # Setup directories
    setup_directories()
    
    # Check database connection
    if not check_database_connection():
        print("⚠️ Database connection failed, but continuing...")
    
    # Get server configuration
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8001))
    
    print(f"🌐 Starting server on {host}:{port}")
    
    try:
        uvicorn.run(
            "api:app",
            host=host,
            port=port,
            log_level="info",
            access_log=True,
            reload=False
        )
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
