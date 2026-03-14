from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from models.config import SECRET_KEY,ALGORITHM
# SECRET_KEY = "eed1b0b16db6331254ce7617173764fd39b0731a531b8d4c0605886b4ed1758e" 
# ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserAuth:

    @staticmethod
    def get_password_hash(password):
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(data: dict):
        to_encode = data.copy()
        expire = datetime.now() + timedelta(minutes=60)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    
    