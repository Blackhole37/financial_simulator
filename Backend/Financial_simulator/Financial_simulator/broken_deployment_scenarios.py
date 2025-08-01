"""
Bad deployment scenarios for rollback demonstration.
This file contains various ways to break the deployment to test rollback functionality.
"""

# SCENARIO 1: Import Error - Missing Module
def scenario_1_import_error():
    """Scenario 1: Import a non-existent module to cause ImportError"""
    try:
        import non_existent_module_that_will_break_deployment
        return "This will never execute"
    except ImportError:
        raise ImportError("Intentional import error for rollback demo")

# SCENARIO 2: Syntax Error - Invalid Python
def scenario_2_syntax_error():
    """Scenario 2: Introduce syntax error"""
    # This will be uncommented to break deployment:
    # invalid_syntax = this is not valid python syntax!!!
    pass

# SCENARIO 3: Runtime Error - Division by Zero
def scenario_3_runtime_error():
    """Scenario 3: Runtime error that crashes the application"""
    result = 1 / 0  # This will cause ZeroDivisionError
    return result

# SCENARIO 4: Environment Variable Error
def scenario_4_env_error():
    """Scenario 4: Missing required environment variable"""
    import os
    required_var = os.environ["REQUIRED_VAR_THAT_DOES_NOT_EXIST"]
    return required_var

# SCENARIO 5: Database Connection Error
def scenario_5_database_error():
    """Scenario 5: Invalid database connection"""
    import pymongo
    # Invalid connection string that will fail
    client = pymongo.MongoClient("mongodb://invalid:invalid@nonexistent:27017/")
    client.admin.command('ping')  # This will fail
    return client

# SCENARIO 6: Port Binding Error
def scenario_6_port_error():
    """Scenario 6: Try to bind to an invalid port"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('0.0.0.0', 99999))  # Invalid port number
    return sock

# SCENARIO 7: Memory Error - Infinite Loop
def scenario_7_memory_error():
    """Scenario 7: Consume excessive memory"""
    memory_hog = []
    while True:
        memory_hog.append([0] * 1000000)  # This will consume all memory
    return memory_hog

# SCENARIO 8: File System Error
def scenario_8_filesystem_error():
    """Scenario 8: Try to write to read-only location"""
    with open('/root/readonly_file.txt', 'w') as f:
        f.write("This will fail on most systems")
    return "File written"

# SCENARIO 9: Network Error
def scenario_9_network_error():
    """Scenario 9: Try to connect to unreachable service"""
    import requests
    response = requests.get("http://unreachable-service:9999/api", timeout=1)
    return response.json()

# SCENARIO 10: Dependency Version Conflict
def scenario_10_dependency_error():
    """Scenario 10: Import with version conflict"""
    try:
        # This will work in some environments but fail in others
        from some_package_with_version_conflict import incompatible_function
        return incompatible_function()
    except ImportError:
        raise ImportError("Package version conflict detected")

# Deployment breaking functions that can be activated
DEPLOYMENT_BREAKERS = {
    "import_error": scenario_1_import_error,
    "syntax_error": scenario_2_syntax_error,
    "runtime_error": scenario_3_runtime_error,
    "env_error": scenario_4_env_error,
    "database_error": scenario_5_database_error,
    "port_error": scenario_6_port_error,
    "memory_error": scenario_7_memory_error,
    "filesystem_error": scenario_8_filesystem_error,
    "network_error": scenario_9_network_error,
    "dependency_error": scenario_10_dependency_error,
}

def activate_deployment_breaker(scenario_name="import_error"):
    """
    Activate a specific deployment breaking scenario.
    This function is called to intentionally break the deployment.
    """
    if scenario_name in DEPLOYMENT_BREAKERS:
        print(f"🚨 Activating deployment breaker: {scenario_name}")
        return DEPLOYMENT_BREAKERS[scenario_name]()
    else:
        print(f"❌ Unknown scenario: {scenario_name}")
        return None

# This will be uncommented to break the deployment
# BREAK_DEPLOYMENT = True
# if BREAK_DEPLOYMENT:
#     activate_deployment_breaker("import_error")
