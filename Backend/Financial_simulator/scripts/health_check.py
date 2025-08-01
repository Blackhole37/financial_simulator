#!/usr/bin/env python3
"""
Health check script for Financial Simulator
This script checks if all services are running properly
"""

import requests
import sys
import os
import pymongo
import redis
from datetime import datetime

def check_api_health():
    """Check if the FastAPI server is responding"""
    try:
        response = requests.get("http://localhost:8002/health", timeout=10)
        if response.status_code == 200:
            print("✅ API server is healthy")
            return True
        else:
            print(f"❌ API server returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API server health check failed: {e}")
        return False

def check_mongodb_health():
    """Check if MongoDB is accessible"""
    try:
        client = pymongo.MongoClient(os.getenv('MONGODB_URI'), serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ MongoDB is healthy")
        return True
    except Exception as e:
        print(f"❌ MongoDB health check failed: {e}")
        return False

def check_redis_health():
    """Check if Redis is accessible"""
    try:
        r = redis.from_url(os.getenv('REDIS_URL'), socket_timeout=5)
        r.ping()
        print("✅ Redis is healthy")
        return True
    except Exception as e:
        print(f"❌ Redis health check failed: {e}")
        return False

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ['MONGODB_URI', 'REDIS_URL', 'OPENAI_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print("✅ All required environment variables are set")
        return True

def main():
    """Run all health checks"""
    print(f"🏥 Running health checks at {datetime.now()}")
    print("=" * 50)
    
    checks = [
        check_environment,
        check_mongodb_health,
        check_redis_health,
        check_api_health
    ]
    
    all_healthy = True
    for check in checks:
        if not check():
            all_healthy = False
        print()
    
    if all_healthy:
        print("🎉 All health checks passed!")
        sys.exit(0)
    else:
        print("💥 Some health checks failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
