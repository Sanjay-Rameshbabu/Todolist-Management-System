from fastapi import Request,HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from models.config import SECRET_KEY, ALGORITHM
from models.auth_models import TokenData
from logging_config import logger

security = HTTPBearer()

class JWTMiddleware:
    @staticmethod
    def get_current_user(request:Request ,credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
        token = credentials.credentials
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("user_id")
            email: str = payload.get("email")

            if user_id is None or email is None:
                logger.warning("Invalid token from payload: missing user_id or email")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token from payload"
                )
            
            user = TokenData (user_id=user_id, email=email)
            request.state.user = user

            return user

        except (JWTError, Exception) as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )