#!/usr/bin/env python3
"""
Production startup script for Pipeline Service on Render.
"""

import os
import sys
import asyncio
import uvicorn
from pathlib import Path

def validate_environment():
    """Validate environment variables."""
    required_vars = ['OPENAI_API_KEY']
    optional_vars = ['HUGGINGFACE_API_TOKEN', 'EXTERNAL_SERVER_URL']
    
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

def setup_directories():
    """Create necessary directories."""
    directories = [
        "storage",
        "temp_audio_cache", 
        "downloaded_audio",
        "knowledge_store",
        "wikipedia_cache",
        "texts"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"📁 Created directory: {directory}")

def check_dependencies():
    """Check if critical dependencies are available."""
    try:
        import fastapi
        import uvicorn
        import requests
        print("✅ Core dependencies available")
        return True
    except ImportError as e:
        print(f"❌ Missing critical dependency: {e}")
        return False

def main():
    """Main startup function."""
    print("🚀 Starting Pipeline Service...")
    
    # Validate environment
    if not validate_environment():
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Setup directories
    setup_directories()
    
    # Get server configuration
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8000))
    
    print(f"🌐 Starting server on {host}:{port}")
    
    try:
        # Import the app after environment setup
        from app import app
        
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=True,
            reload=False
        )
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
