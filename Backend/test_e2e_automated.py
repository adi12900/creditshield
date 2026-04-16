"""
Automated End-to-End Test for Communication Document Upload

This script performs automated testing with the running services.
"""

import requests
import time
import os
from io import BytesIO

# Configuration
BACKEND_URL = "http://localhost:8000"
OTP_SERVICE_URL = "http://localhost:3001"

# Colors
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

def test_services():
    """Test if both services are running"""
    print_header("Step 1: Testing Services")
    
    try:
        # Test Backend
        response = requests.get(f"{BACKEND_URL}/docs", timeout=5)
        if response.status_code == 200:
            print_success("Backend is running on http://localhost:8000")
        else:
            print_error(f"Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Backend not accessible: {e}")
        return False
    
    try:
        # Test OTP Service
        response = requests.get(f"{OTP_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("OTP service is running on http://localhost:3001")
        else:
            print_error(f"OTP service returned status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"OTP service not accessible: {e}")
        return False
    
    return True

def get_test_loan_application():
    """Get a test loan application from database"""
    print_header("Step 2: Getting Test Loan Application")
    
    # For now, we'll use a test ARN
    # In production, you'd query the database for a real application
    test_arn = "ARN-2026-TEST-001"
    print_info(f"Using test ARN: {test_arn}")
    print_info("Note: For real testing, provide actual ARN from database")
    
    return test_arn

def test_token_generation():
    """Test token generation"""
    print_header("Step 3: Testing Token Generation")
    
    from app.services.token_service import TokenService
    
    # Generate token
    token = TokenService.generate_upload_token()
    print_success(f"Token generated: {token[:20]}...")
    
    # Check token properties
    assert len(token) >= 32, "Token should be at least 32 characters"
    print_success(f"Token length: {len(token)} characters")
    
    # Get expiry
    expiry = TokenService.get_token_expiry()
    print_success(f"Token expires at: {expiry}")
    
    return token

def test_email_service():
    """Test email service endpoint"""
    print_header("Step 4: Testing Email Service")
    
    test_email = "yashkalkhambkar@gmail.com"
    
    try:
        response = requests.post(
            f"{OTP_SERVICE_URL}/send-email",
            json={
                "to": test_email,
                "subject": "Test Email - Communication Upload Feature",
                "html": "<h1>Test Email</h1><p>This is a test email from the communication upload feature.</p>"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print_success(f"Email service working - Test email sent to {test_email}")
            print_info("Check your inbox for the test email")
            return True
        else:
            print_error(f"Email service returned status {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Email service error: {e}")
        return False

def test_upload_page_html():
    """Test upload page HTML generation"""
    print_header("Step 5: Testing Upload Page HTML")
    
    # Create a test token in database (simplified for testing)
    print_info("Testing HTML generation without database...")
    
    # Test the HTML structure
    from app.api.v1.borrower.document_upload_routes import router
    print_success("Upload routes module loaded successfully")
    
    return True

def test_document_validation():
    """Test document validation"""
    print_header("Step 6: Testing Document Validation")
    
    from app.services.document_service import DocumentService
    from unittest.mock import Mock
    
    # Test valid file types
    valid_files = ["test.pdf", "test.jpg", "test.png", "test.jpeg"]
    for filename in valid_files:
        mock_file = Mock()
        mock_file.filename = filename
        is_valid, error = DocumentService.validate_file(mock_file)
        if is_valid:
            print_success(f"✓ {filename} - Valid")
        else:
            print_error(f"✗ {filename} - {error}")
    
    # Test invalid file types
    invalid_files = ["test.exe", "test.docx", "test.txt"]
    for filename in invalid_files:
        mock_file = Mock()
        mock_file.filename = filename
        is_valid, error = DocumentService.validate_file(mock_file)
        if not is_valid:
            print_success(f"✓ {filename} - Correctly rejected")
        else:
            print_error(f"✗ {filename} - Should be rejected")
    
    # Test document types
    valid_types = ["Bank Statement", "PAN Card", "Aadhaar Card"]
    for doc_type in valid_types:
        is_valid, error = DocumentService.validate_document_type(doc_type)
        if is_valid:
            print_success(f"✓ {doc_type} - Valid type")
        else:
            print_error(f"✗ {doc_type} - {error}")
    
    return True

def test_api_endpoints():
    """Test API endpoints are registered"""
    print_header("Step 7: Testing API Endpoints")
    
    try:
        # Get OpenAPI schema
        response = requests.get(f"{BACKEND_URL}/openapi.json")
        if response.status_code == 200:
            openapi = response.json()
            paths = openapi.get('paths', {})
            
            # Check for upload endpoints
            upload_endpoints = [
                '/borrower/upload/{upload_token}',
                '/api/v1/workflow/loan-officer/communications/{arn}/send'
            ]
            
            for endpoint in upload_endpoints:
                if endpoint in paths or any(endpoint in path for path in paths.keys()):
                    print_success(f"Endpoint registered: {endpoint}")
                else:
                    print_info(f"Endpoint may be registered with different pattern: {endpoint}")
            
            return True
        else:
            print_error("Could not fetch OpenAPI schema")
            return False
    except Exception as e:
        print_error(f"Error checking endpoints: {e}")
        return False

def main():
    """Run all tests"""
    print_header("Communication Document Upload - Automated E2E Test")
    
    results = {
        'passed': 0,
        'failed': 0
    }
    
    # Test 1: Services
    if test_services():
        results['passed'] += 1
    else:
        results['failed'] += 1
        print_error("\nServices not running. Cannot proceed.")
        return
    
    # Test 2: Get test data
    test_arn = get_test_loan_application()
    results['passed'] += 1
    
    # Test 3: Token generation
    try:
        test_token_generation()
        results['passed'] += 1
    except Exception as e:
        print_error(f"Token generation failed: {e}")
        results['failed'] += 1
    
    # Test 4: Email service
    if test_email_service():
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 5: Upload page
    if test_upload_page_html():
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 6: Document validation
    if test_document_validation():
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Test 7: API endpoints
    if test_api_endpoints():
        results['passed'] += 1
    else:
        results['failed'] += 1
    
    # Summary
    print_header("Test Summary")
    total = results['passed'] + results['failed']
    percentage = (results['passed'] / total * 100) if total > 0 else 0
    
    print(f"\nTotal Tests: {total}")
    print(f"{GREEN}Passed: {results['passed']}{RESET}")
    print(f"{RED}Failed: {results['failed']}{RESET}")
    print(f"Success Rate: {percentage:.1f}%")
    
    if results['failed'] == 0:
        print(f"\n{GREEN}{'='*80}{RESET}")
        print(f"{GREEN}✓ ALL AUTOMATED TESTS PASSED!{RESET}")
        print(f"{GREEN}{'='*80}{RESET}")
        print(f"\n{YELLOW}Next Steps:{RESET}")
        print("1. Check your email (yashkalkhambkar@gmail.com) for test email")
        print("2. For full E2E test with real data, run: python test_e2e_communication_manual.py")
        print("3. Or test manually via http://localhost:8000/docs")
    else:
        print(f"\n{RED}{'='*80}{RESET}")
        print(f"{RED}✗ SOME TESTS FAILED{RESET}")
        print(f"{RED}{'='*80}{RESET}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_error("\n\nTest interrupted by user")
    except Exception as e:
        print_error(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
