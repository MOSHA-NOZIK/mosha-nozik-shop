# База данных и cервер

## Структура базы данных (взят за основу SQLite)
База данных состоит из трех таблиц, связанных между собой.

### 1. Таблица `users` (Пользователи)
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT) — уникальный ID.
- `username` (TEXT UNIQUE NOT NULL) — логин пользователя.
- `password_hash` (TEXT NOT NULL) — захешированный пароль (bcrypt).
- `created_at` (TIMESTAMP) — дата регистрации.

### 2. Таблица `games` (Игры / Каталог)
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT) — уникальный ID.
- `title` (TEXT NOT NULL) — название игры.
- `genre` (TEXT NOT NULL) — жанр.
- `price` (INTEGER NOT NULL) — цена в рублях.
- `description` (TEXT) — описание.
- `image_url` (TEXT) — путь к картинке (например, `logoOnoMalus.png`).

### 3. Таблица `orders` (Заказы / Корзина)
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT) — уникальный ID заказа.
- `user_id` (INTEGER) — внешний ключ, ссылается на `users.id`.
- `game_id` (INTEGER) — внешний ключ, ссылается на `games.id`.
- `created_at` (TIMESTAMP) — время покупки.

## Связи
* Один пользователь (`users`) может иметь много заказов (`orders`). 
* Один заказ (`orders`) ссылается на конкретную игру (`games`). 
* Связь реализована через `FOREIGN KEY`.

## Адрес приложения
Приложение доступно по адресу: **https://ваш-адрес.onrender.com**

## Запуск через Docker (локально)
1. Установите Docker.
2. В корневой папке проекта выполните:
   docker build -t mosha-shop .
   docker run -p 8000:8000 -e SECRET_KEY=your_secret_key mosha-shop
3. Откройте `http://localhost:8000`.

## Тестовая учетная запись
- **Логин:** `testuser`
- **Пароль:** `testpassword123`

Ограничение бесплатного тарифа Render: База данных SQLite находится на эфемерной файловой системе. При перезапуске контейнера (после простоя) данные сбрасываются, и база создается заново с 15 играми. Для постоянного хранения данных требуется платный план с подключением Persistent Disk.