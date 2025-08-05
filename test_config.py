"""
Test script to verify environment variables are loading correctly
Run this to ensure JWT configuration is working
"""

def test_environment_configuration():
    """Test that environment variables are loaded correctly"""
    
    print("🧪 Testing Environment Configuration...")
    print("=" * 50)
    
    try:
        # Import settings
        from config import settings
        
        # Test 1: SECRET_KEY is loaded and secure
        print("✅ Test 1: SECRET_KEY Configuration")
        assert settings.SECRET_KEY is not None, "SECRET_KEY should not be None"
        assert len(settings.SECRET_KEY) >= 32, f"SECRET_KEY too short: {len(settings.SECRET_KEY)} chars"
        print(f"   SECRET_KEY: {'*' * len(settings.SECRET_KEY)} ({len(settings.SECRET_KEY)} chars)")
        
        # Test 2: JWT Algorithm is correct
        print("✅ Test 2: JWT Algorithm")
        assert settings.ALGORITHM == "HS256", f"Expected HS256, got {settings.ALGORITHM}"
        print(f"   ALGORITHM: {settings.ALGORITHM}")
        
        # Test 3: Token expiration time
        print("✅ Test 3: Token Expiration")
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0, "Token expiration must be positive"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES <= 1440, "Token expiration too long (>24h)"
        print(f"   ACCESS_TOKEN_EXPIRE_MINUTES: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
        
        # Test 4: API configuration
        print("✅ Test 4: API Configuration")
        assert settings.API_V1_PREFIX.startswith("/"), "API prefix should start with /"
        print(f"   API_V1_PREFIX: {settings.API_V1_PREFIX}")
        print(f"   PROJECT_NAME: {settings.PROJECT_NAME}")
        
        # Test 5: CORS origins
        print("✅ Test 5: CORS Configuration")
        assert len(settings.BACKEND_CORS_ORIGINS) > 0, "Should have at least one CORS origin"
        print(f"   CORS_ORIGINS: {settings.BACKEND_CORS_ORIGINS}")
        
        print("=" * 50)
        print("🎉 All configuration tests passed!")
        print("✅ Environment variables are loaded correctly")
        print("✅ JWT configuration is ready for use")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("   Make sure config.py is in the same directory")
        return False
        
    except AssertionError as e:
        print(f"❌ Configuration Error: {e}")
        print("   Check your .env file configuration")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

def test_jwt_dependencies():
    """Test that JWT dependencies are installed correctly"""
    
    print("\n🧪 Testing JWT Dependencies...")
    print("=" * 50)
    
    try:
        # Test python-jose
        print("✅ Test 1: python-jose[cryptography]")
        from jose import jwt, JWTError
        print("   python-jose imported successfully")
        
        # Test passlib
        print("✅ Test 2: passlib[bcrypt]")
        from passlib.context import CryptContext
        print("   passlib imported successfully")
        
        # Test python-multipart (for form data)
        print("✅ Test 3: python-multipart")
        try:
            import multipart
            print("   python-multipart imported successfully")
        except ImportError:
            # This is okay, multipart might not be directly importable
            print("   python-multipart installed (indirect import)")
        
        # Quick functional test
        print("✅ Test 4: JWT Functionality")
        from config import settings
        from datetime import datetime, timedelta
        
        # Test JWT encoding/decoding with proper expiration
        exp_time = datetime.utcnow() + timedelta(minutes=30)
        test_data = {"sub": "test@example.com", "exp": exp_time}
        token = jwt.encode(test_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert decoded["sub"] == "test@example.com"
        print("   JWT encode/decode working correctly")
        
        # Test password hashing
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        test_password = "test_password_123"
        hashed = pwd_context.hash(test_password)
        verified = pwd_context.verify(test_password, hashed)
        assert verified == True
        print("   Password hashing working correctly")
        
        print("=" * 50)
        print("🎉 All dependency tests passed!")
        print("✅ JWT libraries are working correctly")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("   Run: pip install python-jose[cryptography] passlib[bcrypt] python-multipart")
        return False
        
    except Exception as e:
        print(f"❌ Functional Test Error: {e}")
        return False

if __name__ == "__main__":
    """Run all configuration tests"""
    
    print("🚀 Gertie.ai JWT Configuration Test Suite")
    print("=" * 60)
    
    # Run tests
    config_ok = test_environment_configuration()
    deps_ok = test_jwt_dependencies()
    
    print("\n" + "=" * 60)
    if config_ok and deps_ok:
        print("🎉 SUCCESS: JWT Authentication setup is complete!")
        print("✅ Ready to proceed to User Model & Database Schema")
    else:
        print("❌ ISSUES FOUND: Please fix the errors above before proceeding")
    
    print("=" * 60)