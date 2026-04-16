"""
Sanity Check for Communication Document Upload Feature

This script verifies that all code components are properly implemented
without requiring running services or database connections.

Run with: python Backend/test_sanity_check_communication.py
"""

import os
import sys
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_header(text):
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")


def print_success(text):
    print(f"{GREEN}✓ {text}{RESET}")


def print_error(text):
    print(f"{RED}✗ {text}{RESET}")


def print_info(text):
    print(f"{YELLOW}ℹ {text}{RESET}")


def check_file_exists(filepath, description):
    """Check if a file exists"""
    # Remove 'Backend/' prefix if running from Backend directory
    if filepath.startswith('Backend/'):
        filepath = filepath.replace('Backend/', '', 1)
    
    if os.path.exists(filepath):
        print_success(f"{description}: {filepath}")
        return True
    else:
        print_error(f"{description} NOT FOUND: {filepath}")
        return False


def check_import(module_path, class_name):
    """Check if a module and class can be imported"""
    try:
        parts = module_path.split('.')
        module = __import__(module_path, fromlist=[class_name])
        cls = getattr(module, class_name)
        print_success(f"Import {class_name} from {module_path}")
        return True
    except ImportError as e:
        print_error(f"Cannot import {class_name} from {module_path}: {e}")
        return False
    except AttributeError as e:
        print_error(f"Class {class_name} not found in {module_path}: {e}")
        return False


def check_method_exists(module_path, class_name, method_name):
    """Check if a method exists in a class"""
    try:
        module = __import__(module_path, fromlist=[class_name])
        cls = getattr(module, class_name)
        method = getattr(cls, method_name)
        print_success(f"  Method {class_name}.{method_name}() exists")
        return True
    except Exception as e:
        print_error(f"  Method {class_name}.{method_name}() NOT FOUND: {e}")
        return False


def check_env_variable(var_name, env_file=".env"):
    """Check if environment variable is configured"""
    env_path = env_file  # Already in Backend directory
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            content = f.read()
            if var_name in content:
                print_success(f"Environment variable {var_name} configured")
                return True
    print_error(f"Environment variable {var_name} NOT configured in {env_file}")
    return False


def main():
    print_header("Communication Document Upload - Sanity Check")
    
    results = {
        'passed': 0,
        'failed': 0
    }
    
    # Check 1: Service Files
    print_header("1. Service Files")
    checks = [
        ("Backend/app/services/token_service.py", "TokenService"),
        ("Backend/app/services/communication_service.py", "CommunicationService"),
        ("Backend/app/services/document_service.py", "DocumentService"),
    ]
    for filepath, desc in checks:
        if check_file_exists(filepath, desc):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Check 2: API Routes
    print_header("2. API Routes")
    checks = [
        ("Backend/app/api/v1/borrower/document_upload_routes.py", "Document Upload Routes"),
        ("Backend/app/api/v1/workflow/role_routes.py", "Workflow Routes"),
    ]
    for filepath, desc in checks:
        if check_file_exists(filepath, desc):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Check 3: Schemas
    print_header("3. Pydantic Schemas")
    if check_file_exists("Backend/app/schemas/communication.py", "Communication Schemas"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Check 4: Migration Script
    print_header("4. Database Migration")
    if check_file_exists("Backend/migrations/add_upload_token_to_communications.sql", "Migration Script"):
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Check 5: Test Files
    print_header("5. Test Files")
    checks = [
        ("Backend/test_communication_upload.py", "Unit Tests"),
        ("Backend/test_e2e_communication_manual.py", "E2E Manual Test"),
        ("Backend/TEST_RESULTS_COMMUNICATION_UPLOAD.md", "Test Results Documentation"),
    ]
    for filepath, desc in checks:
        if check_file_exists(filepath, desc):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Check 6: Service Imports
    print_header("6. Service Class Imports")
    checks = [
        ("app.services.token_service", "TokenService"),
        ("app.services.communication_service", "CommunicationService"),
        ("app.services.document_service", "DocumentService"),
    ]
    for module_path, class_name in checks:
        if check_import(module_path, class_name):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Check 7: Service Methods
    print_header("7. Service Methods")
    
    print_info("TokenService methods:")
    methods = [
        ("app.services.token_service", "TokenService", "generate_upload_token"),
        ("app.services.token_service", "TokenService", "get_token_expiry"),
        ("app.services.token_service", "TokenService", "validate_token"),
    ]
    for module_path, class_name, method_name in methods:
        if check_method_exists(module_path, class_name, method_name):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    print_info("CommunicationService methods:")
    methods = [
        ("app.services.communication_service", "CommunicationService", "send_email"),
        ("app.services.communication_service", "CommunicationService", "send_sms"),
    ]
    for module_path, class_name, method_name in methods:
        if check_method_exists(module_path, class_name, method_name):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    print_info("DocumentService methods:")
    methods = [
        ("app.services.document_service", "DocumentService", "validate_file"),
        ("app.services.document_service", "DocumentService", "validate_document_type"),
        ("app.services.document_service", "DocumentService", "upload_document"),
    ]
    for module_path, class_name, method_name in methods:
        if check_method_exists(module_path, class_name, method_name):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Check 8: Environment Configuration
    print_header("8. Environment Configuration")
    env_vars = [
        "BACKEND_BASE_URL",
        "OTP_SERVICE_URL",
    ]
    for var in env_vars:
        if check_env_variable(var):
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    # Check 9: OTP Service Email Endpoint
    print_header("9. OTP Service Configuration")
    otp_service_path = "../otp-service/index.js"
    if check_file_exists(otp_service_path, "OTP Service"):
        # Check if send-email endpoint exists
        with open(otp_service_path, 'r') as f:
            content = f.read()
            if '/send-email' in content:
                print_success("OTP Service has /send-email endpoint")
                results['passed'] += 1
            else:
                print_error("OTP Service missing /send-email endpoint")
                results['failed'] += 1
    else:
        results['failed'] += 1
    
    # Check 10: HTML Upload Form
    print_header("10. Upload Form Template")
    # Check if upload form is in the routes file
    upload_routes_path = "app/api/v1/borrower/document_upload_routes.py"
    if os.path.exists(upload_routes_path):
        try:
            with open(upload_routes_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'html_content' in content or 'HTMLResponse' in content:
                    print_success("Upload form HTML found in routes")
                    results['passed'] += 1
                else:
                    print_error("Upload form HTML not found")
                    results['failed'] += 1
        except Exception as e:
            print_error(f"Error reading upload routes: {e}")
            results['failed'] += 1
    else:
        results['failed'] += 1
    
    # Summary
    print_header("Sanity Check Summary")
    total = results['passed'] + results['failed']
    percentage = (results['passed'] / total * 100) if total > 0 else 0
    
    print(f"\nTotal Checks: {total}")
    print(f"{GREEN}Passed: {results['passed']}{RESET}")
    print(f"{RED}Failed: {results['failed']}{RESET}")
    print(f"Success Rate: {percentage:.1f}%")
    
    if results['failed'] == 0:
        print(f"\n{GREEN}{'='*80}{RESET}")
        print(f"{GREEN}✓ ALL SANITY CHECKS PASSED!{RESET}")
        print(f"{GREEN}{'='*80}{RESET}")
        print(f"\n{YELLOW}Next Steps:{RESET}")
        print("1. Start OTP service: cd otp-service && npm start")
        print("2. Start Backend: cd Backend && uvicorn app.main:app --reload")
        print("3. Run E2E tests: python Backend/test_e2e_communication_manual.py")
        return 0
    else:
        print(f"\n{RED}{'='*80}{RESET}")
        print(f"{RED}✗ SOME CHECKS FAILED{RESET}")
        print(f"{RED}{'='*80}{RESET}")
        print(f"\n{YELLOW}Please fix the failed checks before proceeding.{RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
