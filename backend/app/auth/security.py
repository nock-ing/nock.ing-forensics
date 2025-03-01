from datetime import datetime, timedelta, timezone
import uuid
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends
import jwt

from app.config.config import settings
from app.utils.redis_service import get_redis_service, RedisService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    redis_service = get_redis_service()
    jti = str(uuid.uuid4())
    to_encode = data.copy()
    to_encode.update({"jti": jti})

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)


    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    redis_service.set(jti, jti, expiry=int(expires_delta.total_seconds()))

    return encoded_jwt

def verify_access_token(token: str = Depends(oauth2_scheme), redis_service: RedisService = Depends(get_redis_service)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        if not jti:
            return None
        
        in_redis = redis_service.get(jti)
        if not in_redis:
            return None
    
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_jti(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        return jti
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None