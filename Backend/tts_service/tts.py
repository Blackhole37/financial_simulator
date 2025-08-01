# TTS Service for Gurukul AI
from fastapi import FastAPI, Form, Request, HTTPException
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pyttsx3
import uuid
import os
from pathlib import Path

app = FastAPI(title="Gurukul TTS Service", description="Text-to-Speech service for lesson content")

# Get CORS origins from environment variable
import os
cors_origins = os.getenv("CORS_ORIGINS", "*")
if cors_origins == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in cors_origins.split(",")]

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

OUTPUT_DIR = os.getenv("OUTPUT_DIR", "tts_outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {
        "message": "Gurukul TTS Service is running",
        "service": "Text-to-Speech",
        "version": "1.0.0",
        "endpoints": {
            "generate": "POST /api/generate - Generate TTS audio from text",
            "get_audio": "GET /api/audio/{filename} - Retrieve audio file",
            "list_files": "GET /api/list-audio-files - List all audio files"
        }
    }

@app.get("/api/audio/{filename}")
async def get_audio_file(filename: str):
    """Get audio file by filename"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path=filepath, filename=filename, media_type='audio/mpeg')

@app.get("/api/list-audio-files")
async def list_audio_files():
    """List all available audio files"""
    try:
        files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith('.mp3')]
        return {"audio_files": files, "count": len(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")

@app.post("/api/generate")
async def text_to_speech(text: str = Form(...)):
    """Generate TTS audio from text"""
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    if len(text) > 10000:  # Limit text length
        raise HTTPException(status_code=400, detail="Text too long (max 10000 characters)")

    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        print(f"Generating TTS for text: {text[:100]}...")

        # Initialize TTS engine
        engine = pyttsx3.init()

        # Configure TTS settings for better quality
        voices = engine.getProperty('voices')
        if voices:
            # Try to use a female voice if available
            for voice in voices:
                if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                    engine.setProperty('voice', voice.id)
                    break

        # Set speech rate (words per minute)
        engine.setProperty('rate', 180)  # Slightly slower for clarity

        # Set volume (0.0 to 1.0)
        engine.setProperty('volume', 0.9)

        # Generate audio file
        engine.save_to_file(text, filepath)
        engine.runAndWait()

        # Verify file was created
        if not os.path.exists(filepath):
            raise HTTPException(status_code=500, detail="Audio generation failed - file not created")

        # Check file size
        file_size = os.path.getsize(filepath)
        if file_size == 0:
            os.remove(filepath)  # Remove empty file
            raise HTTPException(status_code=500, detail="Audio generation failed - empty file")

        print(f"TTS generated successfully: {filename} ({file_size} bytes)")

        return JSONResponse({
            "status": "success",
            "message": "Audio generated successfully",
            "audio_url": f"/api/audio/{filename}",
            "filename": filename,
            "file_size": file_size,
            "text_length": len(text)
        })

    except Exception as e:
        # Clean up failed file
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass

        print(f"TTS generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test TTS engine
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')

        return {
            "status": "healthy",
            "service": "TTS",
            "tts_engine": "pyttsx3",
            "voices_available": len(voices) if voices else 0,
            "output_directory": OUTPUT_DIR,
            "audio_files_count": len([f for f in os.listdir(OUTPUT_DIR) if f.endswith('.mp3')])
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def main():
    """Main function for starting the application."""
    try:
        # Get configuration from environment
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", 8002))
        log_level = os.getenv("LOG_LEVEL", "info").lower()

        print(f"🚀 Starting TTS Service on {host}:{port}")
        print(f"📁 Output directory: {os.path.abspath(OUTPUT_DIR)}")

        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level=log_level,
            access_log=True,
            reload=False
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        raise

if __name__ == "__main__":
    main()
