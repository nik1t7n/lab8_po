import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db_config import get_db, create_all
from src.db.init_db import initialize_database
# from src.api.routes import v1

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Flowers DB API",
    description="API для работы с базой данных цветочного магазина",
    version="1.0.0",
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

# Событие запуска приложения
@app.on_event("startup")
async def startup_event():
    logger.info("Запуск приложения")
    try:
        # Инициализация базы данных
        await initialize_database()
        logger.info("База данных успешно инициализирована")
    except Exception as e:
        logger.error(f"Ошибка при инициализации базы данных: {e}")
        raise

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
