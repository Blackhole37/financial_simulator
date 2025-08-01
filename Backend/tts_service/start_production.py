#!/usr/bin/env python3
"""
Production startup script for TTS Service on Render.
"""

import os
import sys
import uvicorn
from pathlib import Path

def validate_environment():
    """Validate environment variables."""
    print("✅ Environment validation passed (no required external APIs)")
    return True

def check_tts_engine():
    """Check if TTS engine is available."""
    try:
        import pyttsx3
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')
        print(f"✅ TTS engine available with {len(voices) if voices else 0} voices")
        return True
    except Exception as e:
        print(f"❌ TTS engine check failed: {e}")
        return False

def setup_directories():
    """Create necessary directories."""
    output_dir = os.getenv('OUTPUT_DIR', 'tts_outputs')
    os.makedirs(output_dir, exist_ok=True)
    print(f"📁 Created output directory: {output_dir}")

def main():
    """Main startup function."""
    print("🚀 Starting TTS Service...")
    
    # Validate environment
    if not validate_environment():
        sys.exit(1)
    
    # Check TTS engine
    if not check_tts_engine():
        print("⚠️ TTS engine check failed, but continuing...")
    
    # Setup directories
    setup_directories()
    
    # Get server configuration
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8002))
    
    print(f"🌐 Starting server on {host}:{port}")
    
    try:
        uvicorn.run(
            "tts:app",
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
