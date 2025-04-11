# src/core/config.py
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "db")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "12345678bIba$")
DB_NAME = os.getenv("DB_NAME", "flowers_db_2025")
DB_PORT = os.getenv("DB_PORT", "1433")

# Формат для асинхронного подключения к MSSQL через aioodbc+pyodbc
database_url = f"mssql+aioodbc:///?odbc_connect=DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={DB_HOST};DATABASE={DB_NAME};UID={DB_USER};PWD={DB_PASSWORD};TrustServerCertificate=yes"


# Настройки приложения
API_V1_STR = "/api/v1"
PROJECT_NAME = "Flowers DB API"
