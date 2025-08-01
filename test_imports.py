#!/usr/bin/env python3
"""
Test script to verify that all imports work correctly in the deployment environment.
This script tests the same imports that were causing issues in langgraph_implementation.py.
"""

import sys
import os

def test_imports():
    """Test all the imports that were causing issues."""
    print("🧪 Testing imports for deployment...")
    
    # Test 1: utils.json_fix import
    try:
        from utils.json_fix import safe_parse_json, create_fallback_json
        print("✅ utils.json_fix import successful")
    except ImportError as e:
        print(f"❌ utils.json_fix import failed: {e}")
        return False
    
    # Test 2: functions imports
    try:
        from functions.economic_context import EconomicEnvironment, simulate_monthly_market
        from functions.monthly_simulation import deduplicate_and_save, assign_persona, generate_monthly_reflection_report
        from functions.task_functions import (
            build_discipline_report_context,
            build_goal_status_context,
            build_behavior_tracker_context,
            build_karmic_tracker_context,
            build_financial_strategy_context
        )
        from functions.task_functions_fixed import build_simulated_cashflow_context
        print("✅ functions imports successful")
    except ImportError as e:
        print(f"❌ functions imports failed: {e}")
        return False
    
    # Test 3: database imports
    try:
        from database.mongodb_client import (
            save_user_input,
            save_agent_output,
            get_previous_month_outputs,
            get_agent_outputs_for_month,
            generate_simulation_id
        )
        print("✅ database imports successful")
    except ImportError as e:
        print(f"❌ database imports failed: {e}")
        return False
    
    # Test 4: enhanced functions import
    try:
        from functions.enhanced_task_functions import generate_enhanced_cashflow_simulation, generate_enhanced_financial_strategy, generate_enhanced_goal_tracking
        print("✅ enhanced functions imports successful")
    except ImportError as e:
        print(f"❌ enhanced functions imports failed: {e}")
        return False
    
    # Test 5: Test the actual functions
    try:
        # Test safe_parse_json function
        test_json = '{"test": "value"}'
        result = safe_parse_json(test_json)
        if result and result.get("test") == "value":
            print("✅ safe_parse_json function works correctly")
        else:
            print("❌ safe_parse_json function test failed")
            return False
            
        # Test create_fallback_json function
        fallback = create_fallback_json(1, "cashflow", {"user_name": "Test User", "income": 5000})
        if fallback and "month" in fallback and fallback["month"] == 1:
            print("✅ create_fallback_json function works correctly")
        else:
            print("❌ create_fallback_json function test failed")
            return False
            
    except Exception as e:
        print(f"❌ Function testing failed: {e}")
        return False
    
    print("🎉 All import tests passed!")
    return True

if __name__ == "__main__":
    print(f"Python path: {sys.path}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Script directory: {os.path.dirname(os.path.abspath(__file__))}")
    print("=" * 50)
    
    success = test_imports()
    if success:
        print("\n🚀 Ready for deployment!")
        sys.exit(0)
    else:
        print("\n💥 Import issues detected. Please fix before deployment.")
        sys.exit(1)
