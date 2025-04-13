import asyncio
import logging
import contextlib
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.db_config import get_db, create_all
from src.db.init_db import initialize_database
from uvicorn import Config, Server

# from src.api.routes import v1

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Создаем контекстный менеджер для жизненного цикла приложения
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Код, выполняемый при запуске приложения
    logger.info("Запуск приложения")
    try:
        # Инициализация базы данных
        await initialize_database()
        logger.info("База данных успешно инициализирована")
    except Exception as e:
        logger.error(f"Ошибка при инициализации базы данных: {e}")
        raise
    yield
    # Код, выполняемый при завершении приложения
    logger.info("Завершение работы приложения")

app = FastAPI(
    title="Flowers DB API",
    description="API для работы с базой данных цветочного магазина",
    version="1.0.0",
    lifespan=lifespan
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшн здесь должны быть конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
# app.include_router(v1.router, prefix="/api/v1")

# Проверка соединения с базой данных
@app.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Пробуем выполнить запрос к базе данных
        await db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Ошибка подключения к базе данных: {e}")
        return {"status": "error", "database": "disconnected", "error": str(e)}


async def start_fastapi():
    print("Запуск FastAPI сервера...")
    config = Config(app=app, host="0.0.0.0", port=8000, log_level="info", reload=True)
    server = Server(config)
    return server

async def main():
    server = await start_fastapi()
    await server.serve()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nForced stop")
    except Exception as e:
        print(f"Error: {e}")

