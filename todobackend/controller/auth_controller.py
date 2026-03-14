from fastapi import APIRouter, HTTPException, status, Depends
from models.user_service import UserService
from models.user_models import UserAuth
from logging_config import logger
from models.auth_models import UserSignup,UserLogin,TokenResponse
from controller.todolistcontroller import todolist

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup")
def signup(user: UserSignup):
    try:
        if UserService.user_exists(user.email):
            logger.warning(f"Signup failed: User already exists - {user.email}")
            return{
                "User already exists with this email"
            }
        
        # Create user
        user_data = UserService.create_user(
            email=user.email,
            password=user.password,
            first_name=user.first_name,
            last_name=user.last_name
        )
        
        todolist.system_tags()

        if "error" in user_data:
            return{"error":str(e)}
        
        # Create JWT token
        input = {
            "user_id": user_data["user_id"],
            "email": user_data["email"]
        }
        access_token = UserAuth.create_access_token(input)
        
        logger.info(f"User signed up successfully: {user.email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
    
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return{"error":"Signup failed"}


@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin):
    try:
        user_data = UserService.authenticate_user(email=user.email, password=user.password)

        if not user_data:
            logger.warning(f"Login failed: Invalid credentials - {user.email}")
            return{"Invalid email or password"}
        
        # Create JWT token
        input = {
            "user_id": user_data["user_id"],
            "email": user_data["email"]
        }
        access_token = UserAuth.create_access_token(input)
        
        logger.info(f"User logged in successfully: {user.email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return{"error:Login failed"}

