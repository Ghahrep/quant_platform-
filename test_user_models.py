"""
Test script for user models and validation
Verifies that all user models work correctly
"""

def test_user_models():
    """Test user model creation and validation"""
    
    print("🧪 Testing User Models...")
    print("=" * 50)
    
    try:
        # Create models directory if it doesn't exist
        import os
        if not os.path.exists('models'):
            os.makedirs('models')
            
        # Create __init__.py in models directory
        with open('models/__init__.py', 'w') as f:
            f.write('# Models package\n')
        
        # Test imports
        print("✅ Test 1: Model Imports")
        from models.user import (
            UserBase, UserCreate, UserUpdate, UserLogin,
            User, UserInDB, UserResponse, Token, TokenData,
            get_user_by_email, create_user_in_db, user_exists
        )
        print("   All user models imported successfully")
        
        # Test UserBase validation
        print("✅ Test 2: UserBase Model")
        user_base = UserBase(
            email="test@example.com",
            username="testuser",
            full_name="Test User"
        )
        assert user_base.email == "test@example.com"
        assert user_base.username == "testuser"
        print(f"   UserBase created: {user_base.username} ({user_base.email})")
        
        # Test UserCreate validation
        print("✅ Test 3: UserCreate Model & Validation")
        user_create = UserCreate(
            email="newuser@example.com",
            username="NewUser123",
            full_name="New User",
            password="SecurePass123",
            confirm_password="SecurePass123"
        )
        assert user_create.email == "newuser@example.com"
        assert user_create.username == "newuser123"  # Should be lowercased
        print(f"   UserCreate validated: {user_create.username}")
        
        # Test password validation
        print("✅ Test 4: Password Validation")
        try:
            weak_password = UserCreate(
                email="weak@example.com",
                username="weakuser",
                password="weak",
                confirm_password="weak"
            )
            assert False, "Should have rejected weak password"
        except ValueError as e:
            print(f"   Weak password rejected: {str(e)[:50]}...")
        
        try:
            mismatch_password = UserCreate(
                email="mismatch@example.com",
                username="mismatchuser",
                password="GoodPassword123",
                confirm_password="DifferentPassword123"
            )
            assert False, "Should have rejected mismatched passwords"
        except ValueError as e:
            print(f"   Password mismatch rejected: {str(e)}")
        
        # Test UserLogin model
        print("✅ Test 5: UserLogin Model")
        user_login = UserLogin(
            email="login@example.com",
            password="LoginPassword123"
        )
        assert user_login.email == "login@example.com"
        print(f"   UserLogin created: {user_login.email}")
        
        # Test User model with UUID and timestamps
        print("✅ Test 6: User Model with UUID")
        user = User(
            email="uuid@example.com",
            username="uuiduser",
            full_name="UUID User"
        )
        assert user.id is not None
        assert user.created_at is not None
        print(f"   User created with ID: {str(user.id)[:8]}...")
        
        # Test UserInDB model
        print("✅ Test 7: UserInDB Model")
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        user_in_db = UserInDB(
            email="indb@example.com",
            username="indbuser",
            full_name="In DB User",
            hashed_password=pwd_context.hash("HashedPassword123")
        )
        
        # Test password verification
        assert user_in_db.verify_password("HashedPassword123", pwd_context) == True
        assert user_in_db.verify_password("WrongPassword", pwd_context) == False
        print(f"   UserInDB created with password verification working")
        
        # Test Token model
        print("✅ Test 8: Token Model")
        user_response = UserResponse(
            email="token@example.com",
            username="tokenuser",
            full_name="Token User"
        )
        
        token = Token(
            access_token="fake-jwt-token-here",
            token_type="bearer",
            expires_in=1800,
            user=user_response
        )
        assert token.access_token == "fake-jwt-token-here"
        assert token.user.email == "token@example.com"
        print(f"   Token created for user: {token.user.username}")
        
        print("=" * 50)
        print("🎉 All user model tests passed!")
        print("✅ User models are working correctly")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("   Make sure models/user.py is created correctly")
        return False
        
    except AssertionError as e:
        print(f"❌ Model Test Failed: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_user_database_operations():
    """Test mock database operations"""
    
    print("\n🧪 Testing User Database Operations...")
    print("=" * 50)
    
    try:
        from models.user import (
            create_user_in_db, get_user_by_email, get_user_by_username,
            user_exists, UserInDB, create_test_user
        )
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Test user creation
        print("✅ Test 1: Create User in Database")
        test_user = UserInDB(
            email="dbtest@example.com",
            username="dbtestuser",
            full_name="DB Test User",
            hashed_password=pwd_context.hash("DatabaseTest123")
        )
        
        created_user = create_user_in_db(test_user)
        assert created_user.email == "dbtest@example.com"
        print(f"   User created in database: {created_user.username}")
        
        # Test user retrieval by email
        print("✅ Test 2: Get User by Email")
        retrieved_user = get_user_by_email("dbtest@example.com")
        assert retrieved_user is not None
        assert retrieved_user.username == "dbtestuser"
        print(f"   User retrieved by email: {retrieved_user.username}")
        
        # Test user retrieval by username
        print("✅ Test 3: Get User by Username")
        retrieved_user = get_user_by_username("dbtestuser")
        assert retrieved_user is not None
        assert retrieved_user.email == "dbtest@example.com"
        print(f"   User retrieved by username: {retrieved_user.email}")
        
        # Test user existence check
        print("✅ Test 4: User Existence Check")
        assert user_exists("dbtest@example.com") == True
        assert user_exists("nonexistent@example.com") == False
        print("   User existence checks working correctly")
        
        # Test create_test_user function
        print("✅ Test 5: Create Test User")
        test_user = create_test_user()
        assert test_user.email == "test@gertie.ai"
        assert test_user.username == "testuser"
        print(f"   Test user created: {test_user.email}")
        
        print("=" * 50)
        print("🎉 All database operation tests passed!")
        print("✅ Mock database functions are working correctly")
        
        return True
        
    except Exception as e:
        print(f"❌ Database Test Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    """Run all user model tests"""
    
    print("🚀 Gertie.ai User Models Test Suite")
    print("=" * 60)
    
    # Run tests
    models_ok = test_user_models()
    db_ok = test_user_database_operations()
    
    print("\n" + "=" * 60)
    if models_ok and db_ok:
        print("🎉 SUCCESS: User Models & Database Schema setup is complete!")
        print("✅ Ready to proceed to Password Hashing Utilities")
    else:
        print("❌ ISSUES FOUND: Please fix the errors above before proceeding")
    
    print("=" * 60)