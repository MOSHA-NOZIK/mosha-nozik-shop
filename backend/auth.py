import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Настройки безопасности
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_mosha_1234567890")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)