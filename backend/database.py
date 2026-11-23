import sqlite3
import os

DB_NAME = os.getenv("DATABASE_PATH", "shop.db")

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Создание таблиц
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            genre TEXT NOT NULL,
            price INTEGER NOT NULL,
            description TEXT,
            image_url TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            game_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (game_id) REFERENCES games(id)
        )
    ''')

    # Наполнение каталога играми (3 последние игры добавил для задания, у меня не так много игр)
    cursor.execute('SELECT COUNT(*) FROM games')
    if cursor.fetchone()[0] == 0:
        games_data = [
            ("Ono Malus", "RPG / ХОРРОР", 1000, "Ono Malus - RPG игра в жутком мистическом сеттинге, где повсюду обитают страшные аномалии, с которыми предстоит встретиться главному герою, чтобы разгадать их тайны и выбраться из заточения. Мы играем за персонажа по имени Эсту Ари. Он жрец одной из местных церквей, но однажды он попадает в другое измерение, где вокруг ходят очень странные существа. Он решил называть их аномалиями.", "logoOnoMalus.png"),
            ("Is it real?", "ХОРРОР", 1500, "Странные события...", "logoIsItReal.png"),
            ("What is fear?", "ХОРРОР", 2000, "Испытай свой страх...", "logoWhatIsFear.png"),
            ("Life in boxes", "ГОЛОВОЛОМКА", 1200, "Жизнь в коробках...", "logoLifeInBoxes.png"),
            ("Fair Tale", "ПРИКЛЮЧЕНИЕ", 2500, "Сказочный мир...", "logoFairTale.png"),
            ("Save him, be careful", "ХОРРОР", 1800, "Спаси его...", "logoSaveHimBeCareful.png"),
            ("Light In The Dark", "ГОЛОВОЛОМКА", 3000, "Свет во тьме...", "logoLightInTheDark.png"),
            ("The Worst New Year", "ПРИКЛЮЧЕНИЕ", 800, "Худший новый год...", "logoTheWorstNewYear.png"),
            ("Grass Desert", "ПРИКЛЮЧЕНИЕ", 2200, "Пустыня травы...", "logoGrassDesert.png"),
            ("Drinking Santa", "АРКАДА", 1900, "Веселый Санта...", "logoDrinkingSanta.png"),
            ("AutoGnom", "АРКАДА", 3500, "Гномы на колесах...", "logoAutoGnom.png"),
            ("BeatEmUpStairs", "ЭКШЕН", 2100, "Драки на лестнице...", "logoBeatEmUpStairs.png"),
            ("Shadow of the Past", "ХОРРОР", 1300, "Тени прошлого...", "logoShadowOfThePast.png"),
            ("Pixel Dungeon", "RPG", 900, "Пиксельное подземелье...", "logoPixelDungeon.png"),
            ("Cyber Runner", "ЭКШЕН", 2700, "Киберпанк раннер...", "logoCyberRunner.png")
        ]
        cursor.executemany('''
            INSERT INTO games (title, genre, price, description, image_url) 
            VALUES (?, ?, ?, ?, ?)
        ''', games_data)

    conn.commit()
    conn.close()