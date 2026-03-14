from db.altas_connect import users_collection
from models.user_models import UserAuth
from bson.objectid import ObjectId
from datetime import datetime
from logging_config import logger

class UserService:    
    @staticmethod
    def user_exists(email: str):
        try:
            user = users_collection.find_one({"email": email})
            if user:
              return True
        except Exception as e:
            logger.error(f"Error checking if user exists: {str(e)}")
            return False
    
    @staticmethod
    def create_user(email: str, password: str, first_name: str, last_name: str):
        try:
            if UserService.user_exists(email):
                logger.warning(f"User already exists: {email}")
                return {"error": "User already exists in this email"}
            
            hashed_password = UserAuth.get_password_hash(password)
            
            user_data = {
                "email": email,
                "password": hashed_password,
                "first_name": first_name,
                "last_name": last_name,
                "created_at": datetime.now(),
                "is_active": True
            }
            
            result = users_collection.insert_one(user_data)
            logger.info(f"User created successfully: {email}")
            
            return {
                "user_id": str(result.inserted_id),
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "created_at": user_data["created_at"].isoformat()
            }
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return {"error": str(e)}
    
    @staticmethod
    def authenticate_user(email: str, password: str):
        """Authenticate user by email and password"""
        try:
            user = users_collection.find_one({"email": email})
            
            if not user:
                logger.warning(f"User not found: {email}")
                return None
            
            if not user.get("is_active"):
                logger.warning(f"User is inactive: {email}")
                return None
            
            # Verify password
            if not UserAuth.verify_password(password, user["password"]):
                logger.warning( f"Invalid password for user: {email}")
                return None
            
            logger.info(f"User authenticated successfully: {email}")
            
            return {
                "user_id": str(user["_id"]),
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "created_at": user["created_at"].isoformat()
            }
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            return {"error":str(e)}
     
    @staticmethod
    def validate_password(password: str):
     if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 characters or fewer")


    @staticmethod
    def get_user_by_id(user_id: str):
        """Get user details by user_id"""
        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                logger.warning(f"User not found: {user_id}")
                return None
            
            return {
                "user_id": str(user["_id"]),
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "created_at": user["created_at"].isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            return None
    
    @staticmethod
    def get_user_email_by_id(user_id: str):
        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return None
            
            return user.get("email")
        except Exception as e:
            logger.error(f"Error getting user email: {str(e)}")
            return None