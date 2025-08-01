import requests
import json

# Replace with your deployed URL
DEPLOYED_URL = "https://gurukul-main.onrender.com"  # or render.com

def test_deployment():
    # Test health endpoint
    try:
        response = requests.get(f"{DEPLOYED_URL}/")
        print(f"✅ Health check: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Test simulation endpoint
    test_data = {
        "user_id": "test123",
        "user_name": "Test User", 
        "income": 5000.0,
        "expenses": [{"name": "rent", "amount": 1500.0}],
        "total_expenses": 1500.0,
        "goal": "Emergency fund",
        "financial_type": "conservative",
        "risk_level": "low"
    }
    
    try:
        response = requests.post(
            f"{DEPLOYED_URL}/start-simulation",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Simulation test: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Simulation test failed: {e}")

if __name__ == "__main__":
    test_deployment()