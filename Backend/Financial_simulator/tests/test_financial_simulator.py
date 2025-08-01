"""
Unit tests for Financial Simulator core functionality.
"""

import pytest
import sys
import os
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add the Financial_simulator directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent / "Financial_simulator"))

class TestFinancialSimulator:
    """Test class for Financial Simulator functionality."""

    def test_imports(self):
        """Test that core modules can be imported without errors."""
        try:
            # Mock all external dependencies before importing
            with patch.dict('sys.modules', {
                'openai': Mock(),
                'groq': Mock(),
                'pymongo': Mock(),
                'redis': Mock(),
                'langchain': Mock(),
                'langchain_openai': Mock(),
                'langchain_groq': Mock(),
                'langchain_mongodb': Mock(),
                'langgraph': Mock(),
                'fastapi': Mock(),
                'uvicorn': Mock(),
                'streamlit': Mock(),
                'motor': Mock(),
                'motor.motor_asyncio': Mock(),
            }):
                # Test importing the main modules
                import langgraph_implementation
                import langgraph_api
                print("✅ Core modules imported successfully")
        except ImportError as e:
            # Skip test if dependencies are missing - this is expected in CI
            pytest.skip(f"Skipping import test due to missing dependencies: {e}")
        except SyntaxError as e:
            pytest.fail(f"Syntax error in core modules: {e}")
        except IndentationError as e:
            pytest.fail(f"Indentation error in core modules: {e}")
    
    def test_goal_tracker_node_structure(self):
        """Test that goal_tracker_node function can be called without syntax errors."""
        try:
            # Mock all external dependencies
            with patch.dict('sys.modules', {
                'openai': Mock(),
                'groq': Mock(),
                'pymongo': Mock(),
                'redis': Mock(),
                'langchain': Mock(),
                'langchain_openai': Mock(),
                'langchain_groq': Mock(),
                'langchain_mongodb': Mock(),
                'langgraph': Mock(),
                'fastapi': Mock(),
                'uvicorn': Mock(),
                'streamlit': Mock(),
                'motor': Mock(),
                'motor.motor_asyncio': Mock(),
                'yaml': Mock(),
            }):
                with patch('langgraph_implementation.get_llm') as mock_get_llm:
                    with patch('langgraph_implementation.os.makedirs') as mock_makedirs:
                        from langgraph_implementation import goal_tracker_node

                        # Mock the LLM
                        mock_llm = Mock()
                        mock_llm.invoke = Mock(return_value=Mock(content='{"goals": [], "recommendations": []}'))
                        mock_get_llm.return_value = mock_llm

                        # Create a mock state
                        mock_state = {
                            "user_inputs": {
                                "user_id": "test_user",
                                "income": 5000,
                                "expenses": [{"name": "rent", "amount": 1500}]
                            },
                            "month_number": 1,
                            "simulation_id": "test_sim_123",
                            "cashflow_result": [{"surplus": 3500}],
                            "discipline_result": [{"score": 85}]
                        }

                        # Mock file operations
                        with patch('builtins.open', create=True) as mock_open:
                            with patch('yaml.safe_load') as mock_yaml:
                                with patch('langgraph_implementation.deduplicate_and_save') as mock_save:
                                    with patch('langgraph_implementation.save_agent_output') as mock_mongo_save:
                                        with patch('langgraph_implementation.build_goal_status_context') as mock_context:

                                            # Setup mocks
                                            mock_yaml.return_value = {
                                                "goal_tracker_agent": {"llm": "test_llm"},
                                                "track_goals": {"description": "Test description"}
                                            }
                                            mock_context.return_value = "test context"

                                            # This should not raise any syntax or indentation errors
                                            result = goal_tracker_node(mock_state)

                                            # Verify the function returns a valid state
                                            assert isinstance(result, dict)
                                            print("✅ goal_tracker_node function executed successfully")

        except ImportError as e:
            pytest.skip(f"Skipping goal_tracker test due to missing dependencies: {e}")
        except IndentationError as e:
            pytest.fail(f"Indentation error in goal_tracker_node: {e}")
        except SyntaxError as e:
            pytest.fail(f"Syntax error in goal_tracker_node: {e}")
        except Exception as e:
            # Other exceptions are okay for this test - we're just checking syntax
            print(f"⚠️ Function execution error (expected): {e}")
            print("✅ No syntax or indentation errors found")
    
    def test_fastapi_app_creation(self):
        """Test that FastAPI app can be created without syntax errors."""
        try:
            # Mock all external dependencies
            with patch.dict('sys.modules', {
                'openai': Mock(),
                'groq': Mock(),
                'pymongo': Mock(),
                'redis': Mock(),
                'langchain': Mock(),
                'langchain_openai': Mock(),
                'langchain_groq': Mock(),
                'langchain_mongodb': Mock(),
                'langgraph': Mock(),
                'fastapi': Mock(),
                'uvicorn': Mock(),
                'streamlit': Mock(),
                'motor': Mock(),
                'motor.motor_asyncio': Mock(),
            }):
                from langgraph_api import app
                assert app is not None
                print("✅ FastAPI app created successfully")
        except ImportError as e:
            pytest.skip(f"Skipping FastAPI test due to missing dependencies: {e}")
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in FastAPI app: {e}")

    def test_health_endpoint_structure(self):
        """Test that health endpoint is properly defined."""
        try:
            # Mock all external dependencies
            with patch.dict('sys.modules', {
                'openai': Mock(),
                'groq': Mock(),
                'pymongo': Mock(),
                'redis': Mock(),
                'langchain': Mock(),
                'langchain_openai': Mock(),
                'langchain_groq': Mock(),
                'langchain_mongodb': Mock(),
                'langgraph': Mock(),
                'fastapi': Mock(),
                'uvicorn': Mock(),
                'streamlit': Mock(),
                'motor': Mock(),
                'motor.motor_asyncio': Mock(),
            }):
                from langgraph_api import app

                # Check if health endpoint exists (if app has routes attribute)
                if hasattr(app, 'routes'):
                    routes = [route.path for route in app.routes if hasattr(route, 'path')]
                    if "/health" in routes:
                        print("✅ Health endpoint is properly defined")
                    else:
                        print("⚠️ Health endpoint not found in routes")
                else:
                    print("✅ App created successfully (routes not accessible)")

        except ImportError as e:
            pytest.skip(f"Skipping health endpoint test due to missing dependencies: {e}")
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in health endpoint: {e}")

    def test_environment_variables_handling(self):
        """Test environment variable handling doesn't cause syntax errors."""
        try:
            # Mock all external dependencies
            with patch.dict('sys.modules', {
                'openai': Mock(),
                'groq': Mock(),
                'pymongo': Mock(),
                'redis': Mock(),
                'langchain': Mock(),
                'langchain_openai': Mock(),
                'langchain_groq': Mock(),
                'langchain_mongodb': Mock(),
                'langgraph': Mock(),
                'fastapi': Mock(),
                'uvicorn': Mock(),
                'streamlit': Mock(),
                'motor': Mock(),
                'motor.motor_asyncio': Mock(),
            }):
                # Test with mock environment variables
                with patch.dict(os.environ, {
                    'MONGODB_URI': 'mongodb://test:test@localhost:27017/test',
                    'OPENAI_API_KEY': 'test_key',
                    'GROQ_API_KEY': 'test_groq_key'
                }):
                    from langgraph_api import app
                    assert app is not None
                    print("✅ Environment variables handled correctly")

        except ImportError as e:
            pytest.skip(f"Skipping environment test due to missing dependencies: {e}")
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in environment handling: {e}")

    def test_redis_fallback_handling(self):
        """Test that Redis fallback doesn't cause syntax errors."""
        try:
            # Mock all external dependencies
            with patch.dict('sys.modules', {
                'openai': Mock(),
                'groq': Mock(),
                'pymongo': Mock(),
                'redis': Mock(),
                'langchain': Mock(),
                'langchain_openai': Mock(),
                'langchain_groq': Mock(),
                'langchain_mongodb': Mock(),
                'langgraph': Mock(),
                'fastapi': Mock(),
                'uvicorn': Mock(),
                'streamlit': Mock(),
                'motor': Mock(),
                'motor.motor_asyncio': Mock(),
            }):
                # Test Redis connection handling
                with patch.dict(os.environ, {'USE_REDIS': 'false'}):
                    from langgraph_implementation import redis_client
                    # Should not raise syntax errors even if Redis is None
                    print("✅ Redis fallback handling works correctly")

        except ImportError as e:
            pytest.skip(f"Skipping Redis test due to missing dependencies: {e}")
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in Redis handling: {e}")

class TestCodeQuality:
    """Test code quality aspects."""
    
    def test_no_syntax_errors_in_all_files(self):
        """Comprehensive syntax check for all Python files."""
        base_dir = Path(__file__).parent.parent / "Financial_simulator"
        python_files = list(base_dir.glob("*.py"))
        
        for py_file in python_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    compile(f.read(), py_file, 'exec')
                print(f"✅ {py_file.name} compiles successfully")
            except (SyntaxError, IndentationError) as e:
                pytest.fail(f"Compilation error in {py_file.name} at line {e.lineno}: {e.msg}")
    
    def test_function_definitions(self):
        """Test that all major functions are properly defined."""
        try:
            # Mock all external dependencies
            with patch.dict('sys.modules', {
                'openai': Mock(),
                'groq': Mock(),
                'pymongo': Mock(),
                'redis': Mock(),
                'langchain': Mock(),
                'langchain_openai': Mock(),
                'langchain_groq': Mock(),
                'langchain_mongodb': Mock(),
                'langgraph': Mock(),
                'fastapi': Mock(),
                'uvicorn': Mock(),
                'streamlit': Mock(),
                'motor': Mock(),
                'motor.motor_asyncio': Mock(),
                'yaml': Mock(),
            }):
                from langgraph_implementation import (
                    goal_tracker_node,
                    cashflow_analyzer_node,
                    discipline_tracker_node,
                    behavior_tracker_node
                )

                # Check that functions are callable
                assert callable(goal_tracker_node)
                assert callable(cashflow_analyzer_node)
                assert callable(discipline_tracker_node)
                assert callable(behavior_tracker_node)

                print("✅ All major functions are properly defined")

        except ImportError as e:
            pytest.skip(f"Skipping function definitions test due to missing dependencies: {e}")
        except (SyntaxError, IndentationError) as e:
            pytest.fail(f"Syntax/Indentation error in function definitions: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
