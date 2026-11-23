from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List
from jose import JWTError, jwt
import sqlite3
from datetime import datetime

from database import get_db, init_db
from auth import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(title="MOSHA_NOZIK API")

# Разрешаем запросы с фронтенда (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Для локальной разработки
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

class UserCreate(BaseModel):
    username: str
    password: str

class GameResponse(BaseModel):
    id: int
    title: str
    genre: str
    price: int
    description: str
    image_url: str

# Вспомогательные функции
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    if user is None:
        raise credentials_exception
    return dict(user)

@app.on_event("startup")
def startup():
    init_db()

# Обработчики

# Список всех игр
@app.get("/api/games", response_model=List[GameResponse])
def get_games():
    conn = get_db()
    games = conn.execute("SELECT * FROM games").fetchall()
    conn.close()
    return [dict(game) for game in games]

# Одна игра по ID
@app.get("/api/games/{game_id}", response_model=GameResponse)
def get_game(game_id: int):
    conn = get_db()
    game = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()
    if not game:
        raise HTTPException(status_code=404, detail="Игра не найдена")
    return dict(game)

# Регистрация
@app.post("/api/register", status_code=201)
def register(user: UserCreate):
    conn = get_db()
    # Проверка существования
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (user.username,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    
    hashed_pw = get_password_hash(user.password)
    
    # Параметризованный запрос
    conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        (user.username, hashed_pw)
    )
    conn.commit()
    conn.close()
    return {"message": "Пользователь успешно зарегистрирован"}

# Вход (получение токена)
@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (form_data.username,)).fetchone()
    conn.close()

    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

# Создание заказа (только для авторизованных)
@app.post("/api/orders/{game_id}")
def create_order(game_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    
    # Проверяем, есть ли игра
    game = conn.execute("SELECT id FROM games WHERE id = ?", (game_id,)).fetchone()
    if not game:
        conn.close()
        raise HTTPException(status_code=404, detail="Игра не найдена")
        
    conn.execute(
        "INSERT INTO orders (user_id, game_id) VALUES (?, ?)",
        (current_user["id"], game_id)
    )
    conn.commit()
    conn.close()
    return {"message": "Игра добавлена в заказы"}

# Получение своих заказов (только для авторизованных)
@app.get("/api/my-orders")
def get_my_orders(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    # Параметризованный запрос с JOIN
    orders = conn.execute('''
        SELECT o.id, g.title, g.price, g.image_url, o.created_at 
        FROM orders o
        JOIN games g ON o.game_id = g.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    ''', (current_user["id"],)).fetchall()
    conn.close()
    return [dict(order) for order in orders]

# Путь к корневой папке (на уровень выше папки backend)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app.mount("/", StaticFiles(directory=BASE_DIR, html=True), name="static")

# Главная страница
@app.get("/")
def read_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

# Остальные HTML страницы
@app.get("/{page_name}.html")
def read_page(page_name: str):
    file_path = os.path.join(BASE_DIR, f"{page_name}.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Страница не найдена"}