#!/usr/bin/env python3
"""
Rollback Demo Script - Demonstrates bad deployment → rollback → fix cycle
"""

import os
import sys
import time
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Optional


class RollbackDemo:
    """Demonstrates the complete rollback process"""
    
    def __init__(self):
        self.demo_branch = "demo-rollback"
        self.bad_commit = None
        self.good_commit = None
        self.deployment_log = []
        
    def log_action(self, action: str, status: str = "INFO", details: str = ""):
        """Log demo actions"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "action": action,
            "status": status,
            "details": details
        }
        self.deployment_log.append(log_entry)
        print(f"[{timestamp}] {status}: {action}")
        if details:
            print(f"    Details: {details}")
    
    def run_command(self, command: str, capture_output: bool = True) -> tuple:
        """Run shell command and return result"""
        try:
            if capture_output:
                result = subprocess.run(
                    command, shell=True, capture_output=True, text=True
                )
                return result.returncode, result.stdout, result.stderr
            else:
                result = subprocess.run(command, shell=True)
                return result.returncode, "", ""
        except Exception as e:
            return 1, "", str(e)
    
    def create_bad_deployment(self):
        """Create a deployment that will fail"""
        self.log_action("Creating bad deployment scenario", "DEMO")
        
        # Create a Python file with syntax errors
        bad_code = '''
# This file contains intentional errors for rollback demo
import os
import sys

def broken_function():
    # Syntax error: missing closing parenthesis
    print("This will cause a syntax error"
    
    # Indentation error
  return "broken"

# Import error
from nonexistent_module import something

# Runtime error
def divide_by_zero():
    return 10 / 0

if __name__ == "__main__":
    broken_function()
    divide_by_zero()
'''
        
        with open("demo_broken_app.py", "w") as f:
            f.write(bad_code)
        
        # Create a broken requirements.txt
        broken_requirements = '''
# Broken requirements for demo
nonexistent-package==999.999.999
another-fake-package>=1.0.0
broken-dependency==0.0.0
'''
        
        with open("requirements_broken.txt", "w") as f:
            f.write(broken_requirements)
        
        self.log_action("Bad deployment files created", "SUCCESS")
    
    def simulate_deployment_failure(self):
        """Simulate a deployment that fails health checks"""
        self.log_action("Simulating deployment failure", "DEMO")
        
        # Simulate deployment steps
        steps = [
            ("Building application", True),
            ("Running tests", True),
            ("Deploying to server", True),
            ("Health check: Basic connectivity", True),
            ("Health check: Database connection", False),
            ("Health check: API endpoints", False),
            ("Health check: Performance metrics", False)
        ]
        
        for step, success in steps:
            time.sleep(1)  # Simulate processing time
            if success:
                self.log_action(step, "SUCCESS")
            else:
                self.log_action(step, "FAILED", "Health check failed - triggering rollback")
                break
        
        return False  # Deployment failed
    
    def perform_rollback(self):
        """Perform automatic rollback"""
        self.log_action("INITIATING AUTOMATIC ROLLBACK", "CRITICAL")
        
        # Get current commit
        returncode, current_commit, _ = self.run_command("git rev-parse HEAD")
        if returncode == 0:
            self.bad_commit = current_commit.strip()
            self.log_action(f"Bad commit identified: {self.bad_commit[:8]}", "INFO")
        
        # Get previous commit
        returncode, prev_commit, _ = self.run_command("git rev-parse HEAD~1")
        if returncode == 0:
            self.good_commit = prev_commit.strip()
            self.log_action(f"Rolling back to: {self.good_commit[:8]}", "INFO")
        
        # Simulate rollback steps
        rollback_steps = [
            "Stopping current deployment",
            "Reverting to previous version",
            "Restarting services",
            "Validating rollback",
            "Running health checks",
            "Confirming service restoration"
        ]
        
        for step in rollback_steps:
            time.sleep(1)
            self.log_action(step, "ROLLBACK")
        
        # Simulate post-rollback health checks
        health_checks = [
            ("Basic connectivity", True),
            ("Database connection", True),
            ("API endpoints", True),
            ("Performance metrics", True),
            ("User authentication", True),
            ("Data integrity", True)
        ]
        
        self.log_action("Running post-rollback health checks", "VALIDATION")
        for check, success in health_checks:
            time.sleep(0.5)
            status = "SUCCESS" if success else "FAILED"
            self.log_action(f"Health check: {check}", status)
        
        self.log_action("ROLLBACK COMPLETED SUCCESSFULLY", "SUCCESS")
        return True
    
    def create_fix(self):
        """Create a fix for the deployment issue"""
        self.log_action("Creating fix for deployment issue", "FIX")
        
        # Create fixed version of the broken file
        fixed_code = '''
# Fixed version of the application
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def working_function():
    """A properly working function"""
    logger.info("Function executing successfully")
    return "working"

def safe_division(a: float, b: float) -> float:
    """Safe division with error handling"""
    try:
        if b == 0:
            logger.warning("Division by zero attempted, returning 0")
            return 0
        return a / b
    except Exception as e:
        logger.error(f"Division error: {e}")
        return 0

def health_check() -> dict:
    """Application health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.1-fixed",
        "checks": {
            "syntax": "pass",
            "imports": "pass",
            "runtime": "pass"
        }
    }

if __name__ == "__main__":
    logger.info("Application starting...")
    result = working_function()
    logger.info(f"Function result: {result}")
    
    division_result = safe_division(10, 2)
    logger.info(f"Division result: {division_result}")
    
    health = health_check()
    logger.info(f"Health check: {health}")
    
    logger.info("Application completed successfully")
'''
        
        with open("demo_fixed_app.py", "w") as f:
            f.write(fixed_code)
        
        # Create fixed requirements
        fixed_requirements = '''
# Fixed requirements
requests>=2.25.0
fastapi>=0.68.0
uvicorn>=0.15.0
pydantic>=1.8.0
'''
        
        with open("requirements_fixed.txt", "w") as f:
            f.write(fixed_requirements)
        
        self.log_action("Fix created successfully", "SUCCESS")
    
    def simulate_fixed_deployment(self):
        """Simulate successful deployment after fix"""
        self.log_action("Deploying fixed version", "DEPLOY")
        
        # Simulate deployment steps
        steps = [
            ("Code quality checks", True),
            ("Unit tests", True),
            ("Integration tests", True),
            ("Security scan", True),
            ("Building application", True),
            ("Deploying to server", True),
            ("Health check: Basic connectivity", True),
            ("Health check: Database connection", True),
            ("Health check: API endpoints", True),
            ("Health check: Performance metrics", True),
            ("Health check: User authentication", True),
            ("Health check: Data integrity", True)
        ]
        
        for step, success in steps:
            time.sleep(0.8)
            status = "SUCCESS" if success else "FAILED"
            self.log_action(step, status)
        
        self.log_action("DEPLOYMENT SUCCESSFUL", "SUCCESS")
        return True
    
    def generate_report(self):
        """Generate rollback demo report"""
        self.log_action("Generating rollback demo report", "REPORT")
        
        report = {
            "demo_summary": {
                "title": "Rollback Demo - Bad Deployment → Fix Cycle",
                "timestamp": datetime.now().isoformat(),
                "total_actions": len(self.deployment_log),
                "bad_commit": self.bad_commit,
                "good_commit": self.good_commit
            },
            "phases": {
                "1_bad_deployment": "Created intentionally broken deployment",
                "2_failure_detection": "Health checks detected deployment failure",
                "3_automatic_rollback": "System automatically rolled back to previous version",
                "4_fix_creation": "Developer created fix for the issue",
                "5_successful_deployment": "Fixed version deployed successfully"
            },
            "metrics": {
                "rollback_time": "< 2 minutes",
                "downtime": "< 30 seconds",
                "recovery_success": "100%",
                "health_checks_passed": "6/6"
            },
            "lessons_learned": [
                "Automatic rollback prevented extended downtime",
                "Health checks successfully detected deployment issues",
                "Recovery process was fast and reliable",
                "System maintained data integrity during rollback",
                "Fixed deployment passed all validation checks"
            ],
            "deployment_log": self.deployment_log
        }
        
        with open("rollback_demo_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        self.log_action("Report generated: rollback_demo_report.json", "SUCCESS")
        return report
    
    def run_complete_demo(self):
        """Run the complete rollback demonstration"""
        print("=" * 60)
        print("🚀 ROLLBACK DEMO - BAD DEPLOYMENT → FIX CYCLE")
        print("=" * 60)
        
        try:
            # Phase 1: Create bad deployment
            print("\n📋 PHASE 1: Creating Bad Deployment")
            print("-" * 40)
            self.create_bad_deployment()
            
            # Phase 2: Simulate deployment failure
            print("\n⚠️ PHASE 2: Deployment Failure")
            print("-" * 40)
            deployment_success = self.simulate_deployment_failure()
            
            if not deployment_success:
                # Phase 3: Perform rollback
                print("\n🔄 PHASE 3: Automatic Rollback")
                print("-" * 40)
                rollback_success = self.perform_rollback()
                
                if rollback_success:
                    # Phase 4: Create fix
                    print("\n🔧 PHASE 4: Creating Fix")
                    print("-" * 40)
                    self.create_fix()
                    
                    # Phase 5: Deploy fix
                    print("\n✅ PHASE 5: Deploying Fix")
                    print("-" * 40)
                    fix_success = self.simulate_fixed_deployment()
                    
                    if fix_success:
                        # Phase 6: Generate report
                        print("\n📊 PHASE 6: Generating Report")
                        print("-" * 40)
                        report = self.generate_report()
                        
                        print("\n🎉 DEMO COMPLETED SUCCESSFULLY!")
                        print("=" * 60)
                        print(f"📋 Total actions logged: {len(self.deployment_log)}")
                        print(f"📄 Report saved: rollback_demo_report.json")
                        print("=" * 60)
                        
                        return True
            
            return False
            
        except Exception as e:
            self.log_action(f"Demo failed with error: {str(e)}", "ERROR")
            return False


if __name__ == "__main__":
    demo = RollbackDemo()
    success = demo.run_complete_demo()
    
    if success:
        print("\n✅ Rollback demo completed successfully!")
        print("📄 Check rollback_demo_report.json for detailed results")
    else:
        print("\n❌ Rollback demo failed!")
    
    sys.exit(0 if success else 1)
