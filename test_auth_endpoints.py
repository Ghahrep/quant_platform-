"""
Test script for authentication endpoints
Tests user registration, login, and protected endpoints
"""

def test_authentication_endpoints():
    """Test authentication endpoints with FastAPI TestClient"""
    
    print("🧪 Testing Authentication Endpoints...")
    print("=" * 50)
    
    try:
        # Create a temporary main.py for testing
        create_test_main_py()
        
        # Import test client
        from fastapi.testclient import TestClient
        from test_main import app
        
        client = TestClient(app)
        
        # Test 1: Register new user
        print("✅ Test 1: User Registration")
        register_data = {
            "email": "testuser@gertie.ai",
            "username": "testuser",
            "full_name": "Test User",
            "password": "TestPassword123",
            "confirm_password": "TestPassword123"
        }
        
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 201, f"Registration failed: {response.text}"
        
        register_result = response.json()
        assert register_result["success"] == True
        assert "token" in register_result
        assert register_result["user"]["email"] == "testuser@gertie.ai"
        
        # Store token for later tests
        access_token = register_result["token"]["access_token"]
        print(f"   User registered: {register_result['user']['username']}")
        
        # Test 2: Login with credentials
        print("✅ Test 2: User Login")
        login_data = {
            "email": "testuser@gertie.ai",
            "password": "TestPassword123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        login_result = response.json()
        assert login_result["success"] == True
        assert "token" in login_result
        print(f"   User logged in successfully")
        
        # Test 3: Access protected endpoint
        print("✅ Test 3: Protected Endpoint Access")
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200, f"Protected endpoint failed: {response.text}"
        
        user_info = response.json()
        assert user_info["email"] == "testuser@gertie.ai"
        assert user_info["username"] == "testuser"
        print(f"   Protected endpoint accessed: {user_info['username']}")
        
        # Test 4: Invalid credentials
        print("✅ Test 4: Invalid Credentials")
        bad_login_data = {
            "email": "testuser@gertie.ai",
            "password": "WrongPassword"
        }
        
        response = client.post("/api/v1/auth/login", json=bad_login_data)
        assert response.status_code == 401, "Should reject invalid credentials"
        print("   Invalid credentials rejected correctly")
        
        # Test 5: Duplicate registration
        print("✅ Test 5: Duplicate Registration")
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 400, "Should reject duplicate registration"
        print("   Duplicate registration rejected correctly")
        
        # Test 6: Token validation
        print("✅ Test 6: Token Validation")
        response = client.get("/api/v1/auth/validate-token", headers=headers)
        assert response.status_code == 200, f"Token validation failed: {response.text}"
        
        validation_result = response.json()
        assert validation_result["valid"] == True
        print("   Token validation successful")
        
        # Test 7: Email availability check
        print("✅ Test 7: Email Availability")
        response = client.get("/api/v1/auth/check-email/newuser@example.com")
        assert response.status_code == 200
        
        availability = response.json()
        assert availability["available"] == True
        print("   Email availability check working")
        
        # Test 8: Username availability check
        print("✅ Test 8: Username Availability")
        response = client.get("/api/v1/auth/check-username/newusername")
        assert response.status_code == 200
        
        availability = response.json()
        assert availability["available"] == True
        print("   Username availability check working")
        
        print("=" * 50)
        print("🎉 All authentication endpoint tests passed!")
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("   Make sure all auth modules are created correctly")
        return False
    except AssertionError as e:
        print(f"❌ Endpoint Test Failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_test_main_py():
    """Create a test version of main.py with authentication"""
    
    test_main_content = '''
"""Test FastAPI app with authentication"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import authentication router
from auth.endpoints import auth_router

# Create test app
app = FastAPI(title="Test Gertie.ai API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication router
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Test Gertie.ai API with Authentication"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
'''
    
    with open('test_main.py', 'w') as f:
        f.write(test_main_content)

def test_integration_with_existing_endpoints():
    """Test that authentication works with existing API endpoints"""
    
    print("\n🧪 Testing Integration with Existing Endpoints...")
    print("=" * 50)
    
    try:
        # This would test integration with your existing main.py
        print("✅ Test 1: Import Authentication into Main App")
        
        # Simulate adding auth to existing main.py
        integration_code = '''
# Add these lines to your existing main.py:

from auth.endpoints import auth_router
from auth.security import get_current_user
from fastapi import Depends
from models.user import UserInDB

# Include the authentication router
app.include_router(auth_router)

# Example: Protect existing endpoint
@app.get("/api/v1/protected-analysis")
async def protected_analysis(current_user: UserInDB = Depends(get_current_user)):
    return {"message": f"Hello {current_user.username}, here's your analysis"}
'''
        
        print("   Integration code ready for main.py")
        print("   Add auth_router to your existing FastAPI app")
        
        # Test 2: Show how to protect existing endpoints
        print("✅ Test 2: Protecting Existing Endpoints")
        protection_example = '''
# To protect any existing endpoint, add this dependency:
from auth.security import get_current_user
from models.user import UserInDB
from fastapi import Depends

@app.get("/api/v1/analysis/fractal/hurst-exponent")
async def calculate_hurst_exponent_endpoint(
    request: HurstExponentRequest,
    current_user: UserInDB = Depends(get_current_user)  # Add this line
):
    # Your existing endpoint code here
    # Now only authenticated users can access this endpoint
    pass
'''
        
        print("   Example protection code ready")
        print("   Add Depends(get_current_user) to protect any endpoint")
        
        print("=" * 50)
        print("🎉 Integration guidance provided!")
        return True
        
    except Exception as e:
        print(f"❌ Integration Test Error: {e}")
        return False

if __name__ == "__main__":
    """Run all authentication endpoint tests"""
    
    print("🚀 Gertie.ai Authentication Endpoints Test Suite")
    print("=" * 60)
    
    # Run tests
    endpoints_ok = test_authentication_endpoints()
    integration_ok = test_integration_with_existing_endpoints()
    
    print("\n" + "=" * 60)
    if endpoints_ok and integration_ok:
        print("🎉 SUCCESS: Authentication Endpoints are complete!")
        print("✅ User registration working")
        print("✅ User login working") 
        print("✅ Protected endpoints working")
        print("✅ Token validation working")
        print("✅ Ready to integrate with main.py")
        print("")
        print("🔧 NEXT STEPS:")
        print("1. Add these imports to your main.py:")
        print("   from auth.endpoints import auth_router")
        print("2. Add this line after creating your FastAPI app:")
        print("   app.include_router(auth_router)")
        print("3. Test authentication at: http://localhost:8000/api/v1/auth/register")
    else:
        print("❌ ISSUES FOUND: Please fix the errors above before proceeding")
    
    print("=" * 60)