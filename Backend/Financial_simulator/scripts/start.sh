#!/bin/bash
# Startup script for Financial Simulator

set -e

echo "🚀 Starting Financial Simulator..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
while ! python -c "
import pymongo
import os
import sys
try:
    client = pymongo.MongoClient(os.getenv('MONGODB_URI'), serverSelectionTimeoutMS=2000)
    client.admin.command('ping')
    sys.exit(0)
except:
    sys.exit(1)
" 2>/dev/null; do
    echo "MongoDB is not ready yet. Waiting..."
    sleep 2
done
echo "✅ MongoDB is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
while ! python -c "
import redis
import os
import sys
try:
    r = redis.from_url(os.getenv('REDIS_URL'), socket_timeout=2)
    r.ping()
    sys.exit(0)
except:
    sys.exit(1)
" 2>/dev/null; do
    echo "Redis is not ready yet. Waiting..."
    sleep 2
done
echo "✅ Redis is ready!"

# Test database connection
echo "🔍 Testing database connections..."
python -c "
import pymongo
import redis
import os

# Test MongoDB
try:
    client = pymongo.MongoClient(os.getenv('MONGODB_URI'), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print('✅ MongoDB connection successful')
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
    exit(1)

# Test Redis
try:
    r = redis.from_url(os.getenv('REDIS_URL'), socket_timeout=5)
    r.ping()
    print('✅ Redis connection successful')
except Exception as e:
    print(f'❌ Redis connection failed: {e}')
    exit(1)
"

# Initialize knowledge base if needed
echo "📚 Initializing knowledge base..."
if [ -f "initialize_knowledge_base.py" ]; then
    python initialize_knowledge_base.py || echo "⚠️ Knowledge base initialization failed, continuing..."
fi

# Start the application
echo "🎯 Starting Financial Simulator API..."
exec python langgraph_api.py
