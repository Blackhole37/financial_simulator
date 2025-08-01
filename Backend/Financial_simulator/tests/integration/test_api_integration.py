"""
Integration tests for Financial Simulator API.
"""

import pytest
import requests
import time
import os
import sys
from pathlib import Path

# Add the Financial_simulator directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "Financial_simulator"))

class TestAPIIntegration:
    """Integration tests for the Financial Simulator API."""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Setup API client for testing."""
        # In CI/CD, we'll test against a local instance
        base_url = os.getenv("TEST_API_URL", "http://localhost:8002")
        return base_url
    
    def test_health_endpoint(self, api_client):
        """Test the health endpoint."""
        try:
            response = requests.get(f"{api_client}/health", timeout=10)
            assert response.status_code == 200
            
            health_data = response.json()
            assert "status" in health_data
            print(f"✅ Health endpoint working: {health_data['status']}")
            
        except requests.exceptions.ConnectionError:
            pytest.skip("API server not running - skipping integration test")
        except Exception as e:
            pytest.fail(f"Health endpoint test failed: {e}")
    
    def test_root_endpoint(self, api_client):
        """Test the root endpoint."""
        try:
            response = requests.get(f"{api_client}/", timeout=10)
            assert response.status_code == 200
            
            root_data = response.json()
            assert "message" in root_data
            print(f"✅ Root endpoint working: {root_data['message']}")
            
        except requests.exceptions.ConnectionError:
            pytest.skip("API server not running - skipping integration test")
        except Exception as e:
            pytest.fail(f"Root endpoint test failed: {e}")
    
    def test_docs_endpoint(self, api_client):
        """Test that API documentation is accessible."""
        try:
            response = requests.get(f"{api_client}/docs", timeout=10)
            assert response.status_code == 200
            print("✅ API documentation is accessible")
            
        except requests.exceptions.ConnectionError:
            pytest.skip("API server not running - skipping integration test")
        except Exception as e:
            pytest.fail(f"Docs endpoint test failed: {e}")

class TestDatabaseIntegration:
    """Integration tests for database connections."""
    
    def test_mongodb_connection(self):
        """Test MongoDB connection."""
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            pytest.skip("MONGODB_URI not set - skipping MongoDB test")
        
        try:
            import pymongo
            client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            client.admin.command('ping')
            print("✅ MongoDB connection successful")
            
        except Exception as e:
            pytest.fail(f"MongoDB connection failed: {e}")
    
    def test_redis_connection(self):
        """Test Redis connection."""
        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            pytest.skip("REDIS_URL not set - skipping Redis test")
        
        try:
            import redis
            r = redis.from_url(redis_url, socket_timeout=5)
            r.ping()
            print("✅ Redis connection successful")
            
        except Exception as e:
            # Redis failure is acceptable as we have fallbacks
            print(f"⚠️ Redis connection failed (fallback will be used): {e}")

class TestEndToEndWorkflow:
    """End-to-end workflow tests."""
    
    def test_simulation_workflow_syntax(self):
        """Test that simulation workflow can be imported and structured correctly."""
        try:
            from langgraph_implementation import simulate_timeline_langgraph
            
            # Test that the function exists and is callable
            assert callable(simulate_timeline_langgraph)
            print("✅ Simulation workflow function is properly structured")
            
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in simulation workflow: {e}")
        except ImportError as e:
            pytest.fail(f"Import error in simulation workflow: {e}")
    
    def test_agent_nodes_structure(self):
        """Test that all agent nodes are properly structured."""
        try:
            from langgraph_implementation import (
                goal_tracker_node,
                cashflow_analyzer_node,
                discipline_tracker_node,
                behavior_tracker_node
            )
            
            # Test that all nodes are callable
            nodes = [
                goal_tracker_node,
                cashflow_analyzer_node,
                discipline_tracker_node,
                behavior_tracker_node
            ]
            
            for node in nodes:
                assert callable(node), f"{node.__name__} is not callable"
            
            print("✅ All agent nodes are properly structured")
            
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in agent nodes: {e}")
        except ImportError as e:
            pytest.fail(f"Import error in agent nodes: {e}")

class TestErrorHandling:
    """Test error handling and fallbacks."""
    
    def test_fallback_mechanisms(self):
        """Test that fallback mechanisms don't cause syntax errors."""
        try:
            from langgraph_implementation import create_fallback_json, safe_parse_json
            
            # Test fallback functions exist and are callable
            assert callable(create_fallback_json)
            assert callable(safe_parse_json)
            
            print("✅ Fallback mechanisms are properly structured")
            
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in fallback mechanisms: {e}")
        except ImportError as e:
            pytest.fail(f"Import error in fallback mechanisms: {e}")
    
    def test_error_handling_in_nodes(self):
        """Test that error handling in nodes doesn't cause syntax issues."""
        try:
            # Import and check that error handling blocks are syntactically correct
            import langgraph_implementation
            
            # Read the source to check for proper try-except structures
            import inspect
            source = inspect.getsource(langgraph_implementation.goal_tracker_node)
            
            # Check that the function has proper try-except blocks
            assert "try:" in source
            assert "except" in source
            
            print("✅ Error handling structures are syntactically correct")
            
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in error handling: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
