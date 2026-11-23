FROM python:3.11-slim

# Рабочая директория
WORKDIR /app

# Копируем зависимости
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем ВЕСЬ проект (и фронтенд, и бэкенд)
COPY . .

# Переходим в папку с бэкендом
WORKDIR /app/backend

# Render использует переменную PORT
ENV PORT=8000

# Запускаем uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]