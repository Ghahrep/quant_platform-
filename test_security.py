"""
Test script for authentication security utilities
Verifies password hashing and JWT token functionality
"""

import time
from datetime import datetime, timedelta

def test_password_hashing():
    """Test password hashing functionality"""
    
    print("🧪 Testing Password Hashing...")
    print("=" * 50)
    
    try:
        # Create auth directory if it doesn't exist
        import os
        if not os.path.exists('auth'):
            os.makedirs('auth')
            
        # Create __init__.py in auth directory
        with open('auth/__init__.py', 'w') as f:
            f.write('# Auth package\n')
        
        # Test imports
        print("✅ Test 1: Security Imports")
        from auth.security import (
            get_password_hash, verify_password, 
            validate_password_strength
        )
        print("   Security utilities imported successfully")
        
        # Test password hashing
        print("✅ Test 2: Password Hashing")
        test_password = "TestPassword123"
        hashed_password = get_password_hash(test_password)
        
        assert hashed_password != test_password  # Should be different
        assert len(hashed_password) > 50  # Bcrypt hashes are long
        assert hashed_password.startswith("$2b$")  # Bcrypt format
        print(f"   Password hashed: {hashed_password[:20]}...")
        
        # Test password verification
        print("✅ Test 3: Password Verification")
        # Correct password should verify
        assert verify_password(test_password, hashed_password) == True
        print("   Correct password verified successfully")
        
        # Wrong password should fail
        assert verify_password("WrongPassword", hashed_password) == False
        print("   Wrong password rejected successfully")
        
        # Test password strength validation
        print("✅ Test 4: Password Strength Validation")
        
        # Test weak password
        weak_result = validate_password_strength("weak")
        assert weak_result["is_valid"] == False
        assert len(weak_result["errors"]) > 0
        print(f"   Weak password rejected: {len(weak_result['errors'])} errors")
        
        # Test strong password
        strong_result = validate_password_strength("StrongPassword123!")
        assert strong_result["is_valid"] == True
        assert strong_result["strength_score"] >= 5
        print(f"   Strong password accepted: score {strong_result['strength_score']}")
        
        print("=" * 50)
        print("🎉 All password hashing tests passed!")
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        return False
    except AssertionError as e:
        print(f"❌ Password Test Failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_jwt_tokens():
    """Test JWT token functionality"""
    
    print("\n🧪 Testing JWT Tokens...")
    print("=" * 50)
    
    try:
        from auth.security import (
            create_access_token, create_refresh_token, verify_token,
            extract_token_data, is_token_expired, create_user_tokens,
            refresh_access_token, debug_token
        )
        
        # Test access token creation
        print("✅ Test 1: Access Token Creation")
        user_data = {
            "sub": "test@example.com",
            "user_id": "123",
            "username": "testuser"
        }
        
        access_token = create_access_token(user_data)
        assert access_token is not None
        assert len(access_token) > 100  # JWT tokens are long
        print(f"   Access token created: {access_token[:20]}...")
        
        # Test token verification
        print("✅ Test 2: Token Verification")
        payload = verify_token(access_token)
        
        # Debug if token verification fails
        if payload is None:
            print("   DEBUG: Token verification failed, checking token...")
            from auth.security import debug_token
            debug_info = debug_token(access_token)
            print(f"   DEBUG Info: {debug_info}")
            
            # Try to decode without verification to see the payload
            from auth.security import decode_token
            raw_payload = decode_token(access_token)
            print(f"   Raw payload: {raw_payload}")
        
        assert payload is not None, f"Token verification failed. Debug info available above."
        assert payload["sub"] == "test@example.com"
        assert payload["user_id"] == "123"
        print(f"   Token verified: user {payload['sub']}")
        
        # Test token data extraction
        print("✅ Test 3: Token Data Extraction")
        token_data = extract_token_data(access_token)
        assert token_data is not None
        assert token_data["email"] == "test@example.com"
        assert token_data["username"] == "testuser"
        print(f"   Token data extracted: {token_data['email']}")
        
        # Test refresh token
        print("✅ Test 4: Refresh Token")
        refresh_token = create_refresh_token(user_data)
        assert refresh_token is not None
        assert refresh_token != access_token  # Should be different
        
        refresh_payload = verify_token(refresh_token)
        assert refresh_payload is not None
        assert refresh_payload["type"] == "refresh"
        print(f"   Refresh token created and verified")
        
        # Test user token creation
        print("✅ Test 5: User Token Creation")
        full_user_data = {
            "id": "user-123",
            "email": "fulluser@example.com",
            "username": "fulluser",
            "full_name": "Full User"
        }
        
        tokens = create_user_tokens(full_user_data)
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert "token_type" in tokens
        assert tokens["token_type"] == "bearer"
        print(f"   User tokens created: access + refresh")
        
        # Test token refresh
        print("✅ Test 6: Token Refresh")
        # Add a small delay to ensure different timestamps
        time.sleep(1)
        new_access_token = refresh_access_token(tokens["refresh_token"])
        assert new_access_token is not None
        # Tokens might be the same if created too quickly, so just check it's valid
        
        new_payload = verify_token(new_access_token)
        assert new_payload["sub"] == "fulluser@example.com"
        print(f"   Access token refreshed successfully")
        
        # Test token expiration check
        print("✅ Test 7: Token Expiration")
        assert is_token_expired(access_token) == False
        print(f"   Fresh token is not expired")
        
        # Test expired token (create one with past expiration)
        expired_data = user_data.copy()
        expired_token = create_access_token(
            expired_data, 
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        time.sleep(1)  # Wait a moment
        assert is_token_expired(expired_token) == True
        print(f"   Expired token detected correctly")
        
        # Test debug functionality
        print("✅ Test 8: Token Debugging")
        debug_info = debug_token(access_token)
        assert debug_info["token_valid"] == True
        assert "payload" in debug_info
        print(f"   Token debug info: valid={debug_info['token_valid']}")
        
        print("=" * 50)
        print("🎉 All JWT token tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ JWT Test Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_security_features():
    """Test additional security features"""
    
    print("\n🧪 Testing Security Features...")
    print("=" * 50)
    
    try:
        from auth.security import (
            generate_reset_token, verify_reset_token,
            hash_sensitive_data, verify_sensitive_data
        )
        
        # Test password reset tokens
        print("✅ Test 1: Password Reset Tokens")
        reset_email = "reset@example.com"
        reset_token = generate_reset_token(reset_email)
        
        assert reset_token is not None
        verified_email = verify_reset_token(reset_token)
        assert verified_email == reset_email
        print(f"   Reset token created and verified for {verified_email}")
        
        # Test sensitive data hashing
        print("✅ Test 2: Sensitive Data Hashing")
        sensitive_data = "api-key-12345"
        hashed_data = hash_sensitive_data(sensitive_data)
        
        assert hashed_data != sensitive_data
        assert verify_sensitive_data(sensitive_data, hashed_data) == True
        assert verify_sensitive_data("wrong-key", hashed_data) == False
        print(f"   Sensitive data hashed and verified")
        
        print("=" * 50)
        print("🎉 All security feature tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Security Feature Test Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    """Run all security tests"""
    
    print("🚀 Gertie.ai Security Utilities Test Suite")
    print("=" * 60)
    
    # Run tests
    password_ok = test_password_hashing()
    jwt_ok = test_jwt_tokens()
    security_ok = test_security_features()
    
    print("\n" + "=" * 60)
    if password_ok and jwt_ok and security_ok:
        print("🎉 SUCCESS: Password Hashing Utilities are complete!")
        print("✅ Password hashing working correctly")
        print("✅ JWT token creation and verification working")
        print("✅ Security features implemented")
        print("✅ Ready to proceed to Authentication Endpoints")
    else:
        print("❌ ISSUES FOUND: Please fix the errors above before proceeding")
    
    print("=" * 60)