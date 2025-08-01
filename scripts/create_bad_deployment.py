#!/usr/bin/env python3
"""
Script to create bad deployment scenarios for rollback demonstration.
This script modifies the application to introduce various types of failures.
"""

import os
import sys
import shutil
from pathlib import Path

def backup_original_files():
    """Create backups of original files before modification."""
    files_to_backup = [
        "Backend/Financial_simulator/Financial_simulator/langgraph_api.py",
        "Backend/Financial_simulator/Financial_simulator/langgraph_implementation.py",
        "Backend/Financial_simulator/requirements.txt"
    ]
    
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    
    for file_path in files_to_backup:
        if Path(file_path).exists():
            backup_path = backup_dir / Path(file_path).name
            shutil.copy2(file_path, backup_path)
            print(f"✅ Backed up {file_path} to {backup_path}")

def create_import_error_scenario():
    """Scenario 1: Add import error to langgraph_api.py"""
    api_file = Path("Backend/Financial_simulator/Financial_simulator/langgraph_api.py")
    
    if not api_file.exists():
        print(f"❌ File not found: {api_file}")
        return False
    
    # Read the original file
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add problematic import at the top
    bad_import = """
# BAD DEPLOYMENT: This import will cause deployment failure
import non_existent_module_for_rollback_demo
from missing_package import missing_function
"""
    
    # Insert after the first import
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('import ') or line.startswith('from '):
            lines.insert(i + 1, bad_import)
            break
    
    # Write the modified file
    with open(api_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"💥 Added import error to {api_file}")
    return True

def create_syntax_error_scenario():
    """Scenario 2: Add syntax error to langgraph_implementation.py"""
    impl_file = Path("Backend/Financial_simulator/Financial_simulator/langgraph_implementation.py")
    
    if not impl_file.exists():
        print(f"❌ File not found: {impl_file}")
        return False
    
    # Read the original file
    with open(impl_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add syntax error
    syntax_error = """
# BAD DEPLOYMENT: This syntax error will break the deployment
def broken_function():
    invalid_syntax = this is not valid python syntax at all!!!
    return "This will never work"
"""
    
    # Append the syntax error
    content += syntax_error
    
    # Write the modified file
    with open(impl_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"💥 Added syntax error to {impl_file}")
    return True

def create_dependency_error_scenario():
    """Scenario 3: Add invalid dependency to requirements.txt"""
    req_file = Path("Backend/Financial_simulator/requirements.txt")
    
    if not req_file.exists():
        print(f"❌ File not found: {req_file}")
        return False
    
    # Read the original file
    with open(req_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add problematic dependencies
    bad_deps = """
# BAD DEPLOYMENT: These dependencies will cause installation failure
non-existent-package==999.999.999
conflicting-package>=1.0.0,<0.5.0
broken-dependency-for-rollback-demo==1.0.0
"""
    
    # Append the bad dependencies
    content += bad_deps
    
    # Write the modified file
    with open(req_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"💥 Added bad dependencies to {req_file}")
    return True

def create_runtime_error_scenario():
    """Scenario 4: Add runtime error that crashes on startup"""
    api_file = Path("Backend/Financial_simulator/Financial_simulator/langgraph_api.py")
    
    if not api_file.exists():
        print(f"❌ File not found: {api_file}")
        return False
    
    # Read the original file
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add runtime error that will crash the app
    runtime_error = """
# BAD DEPLOYMENT: This will cause runtime error on startup
def crash_on_startup():
    print("💥 Intentionally crashing the application for rollback demo")
    result = 1 / 0  # Division by zero error
    return result

# Execute the crash function immediately
crash_on_startup()
"""
    
    # Insert before the main function
    if 'if __name__ == "__main__":' in content:
        content = content.replace('if __name__ == "__main__":', runtime_error + '\nif __name__ == "__main__":')
    else:
        content += runtime_error
    
    # Write the modified file
    with open(api_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"💥 Added runtime error to {api_file}")
    return True

def create_environment_error_scenario():
    """Scenario 5: Add missing environment variable requirement"""
    api_file = Path("Backend/Financial_simulator/Financial_simulator/langgraph_api.py")
    
    if not api_file.exists():
        print(f"❌ File not found: {api_file}")
        return False
    
    # Read the original file
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add environment variable check that will fail
    env_error = """
# BAD DEPLOYMENT: This will fail due to missing environment variable
import os
REQUIRED_SECRET_KEY = os.environ["SUPER_SECRET_KEY_THAT_DOES_NOT_EXIST"]
ANOTHER_REQUIRED_VAR = os.environ["MISSING_DEPLOYMENT_VAR"]
print(f"Using secret key: {REQUIRED_SECRET_KEY}")
"""
    
    # Insert after imports
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'from fastapi' in line:
            lines.insert(i + 1, env_error)
            break
    
    # Write the modified file
    with open(api_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"💥 Added environment variable error to {api_file}")
    return True

def restore_from_backup():
    """Restore original files from backup."""
    backup_dir = Path("backups")
    
    if not backup_dir.exists():
        print("❌ No backup directory found")
        return False
    
    files_to_restore = [
        ("langgraph_api.py", "Backend/Financial_simulator/Financial_simulator/langgraph_api.py"),
        ("langgraph_implementation.py", "Backend/Financial_simulator/Financial_simulator/langgraph_implementation.py"),
        ("requirements.txt", "Backend/Financial_simulator/requirements.txt")
    ]
    
    for backup_name, original_path in files_to_restore:
        backup_path = backup_dir / backup_name
        if backup_path.exists():
            shutil.copy2(backup_path, original_path)
            print(f"✅ Restored {original_path} from backup")
    
    return True

def main():
    """Main function to create bad deployment scenarios."""
    if len(sys.argv) < 2:
        print("Usage: python create_bad_deployment.py <scenario>")
        print("Scenarios:")
        print("  backup          - Create backup of original files")
        print("  import_error    - Add import error")
        print("  syntax_error    - Add syntax error")
        print("  dependency_error - Add bad dependencies")
        print("  runtime_error   - Add runtime error")
        print("  env_error       - Add environment variable error")
        print("  restore         - Restore from backup")
        return
    
    scenario = sys.argv[1].lower()
    
    if scenario == "backup":
        backup_original_files()
    elif scenario == "import_error":
        backup_original_files()
        create_import_error_scenario()
    elif scenario == "syntax_error":
        backup_original_files()
        create_syntax_error_scenario()
    elif scenario == "dependency_error":
        backup_original_files()
        create_dependency_error_scenario()
    elif scenario == "runtime_error":
        backup_original_files()
        create_runtime_error_scenario()
    elif scenario == "env_error":
        backup_original_files()
        create_environment_error_scenario()
    elif scenario == "restore":
        restore_from_backup()
    else:
        print(f"❌ Unknown scenario: {scenario}")
        return
    
    print(f"🎯 Scenario '{scenario}' applied successfully!")
    print("💡 Commit and push these changes to trigger deployment failure and rollback")

if __name__ == "__main__":
    main()
