from dotenv import load_dotenv 
import os
import asyncio
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from src.core.config import database_url
from src.db.models import Base

logger = logging.getLogger(__name__)


async def check_database_exists(engine: AsyncEngine, database_name: str) -> bool:
    """Проверяет существование базы данных"""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text(f"SELECT DB_ID('{database_name}') as db_id")
            )
            row = result.fetchone()
            return row.db_id is not None if row else False
    except Exception as e:
        logger.error(f"Ошибка при проверке существования базы данных: {e}")
        return False


async def create_database(engine: AsyncEngine, database_name: str) -> None:
    """Создаёт базу данных, если она не существует"""
    try:
        async with engine.connect() as conn:
            await conn.execute(text(f"CREATE DATABASE {database_name}"))
            logger.info(f"База данных {database_name} создана")
    except Exception as e:
        logger.error(f"Ошибка при создании базы данных: {e}")
        raise


async def execute_sql_script(engine: AsyncEngine, sql_script: str) -> None:
    """Выполняет SQL-скрипт"""
    try:
        async with engine.connect() as conn:
            # Разделяем скрипт на отдельные команды 'GO'
            commands = sql_script.split("go")

            for command in commands:
                command = command.strip()
                if command:
                    await conn.execute(text(command))
                    await conn.commit()
    except Exception as e:
        logger.error(f"Ошибка при выполнении SQL-скрипта: {e}")
        raise


async def create_tables_with_sqlalchemy(engine: AsyncEngine) -> None:
    """Создает таблицы с использованием SQLAlchemy моделей"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Таблицы созданы с помощью SQLAlchemy моделей")
    except Exception as e:
        logger.error(f"Ошибка при создании таблиц с помощью SQLAlchemy: {e}")
        raise


async def init_db() -> None:
    """Инициализирует базу данных, создавая все таблицы по схеме"""
    # Используем чистый SQL URL для начальной проверки (без указания базы данных)
    load_dotenv()

    DB_HOST = os.getenv("DB_HOST", "db")
    DB_USER = os.getenv("DB_USER", "sa")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "SQLConnect1$")
    DB_NAME = os.getenv("DB_NAME", "flowers_db_2025")
    DB_PORT = os.getenv("DB_PORT", "1433")

    # Создаем URL без указания базы данных для первоначального подключения
    master_url = f"mssql+aioodbc:///?odbc_connect=DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={DB_HOST};DATABASE={DB_NAME};UID={DB_USER};PWD={DB_PASSWORD};TrustServerCertificate=yes;Encrypt=no"
    master_engine = create_async_engine(master_url, echo=True)

    try:
        # Проверяем существование базы данных
        exists = await check_database_exists(master_engine, DB_NAME)

        if not exists:
            # Создаем базу данных
            await create_database(master_engine, DB_NAME)
            logger.info(f"База данных { DB_NAME} успешно создана")

            # Получаем полный SQL-скрипт для создания таблиц (точное соответствие DDL)
            sql_script = """
-- flowers_db_2025 DDL
go
use flowers_db_2025;
go

go
create table district(
id_district int not null primary key identity(1,1),
district nvarchar(50)
)

create table customer_type(
id_customer_type int not null primary key identity(1,1),
customer_type  nvarchar(50)
)

create table cont_type(
id_cont_type int not null primary key identity(1,1),
cont_type  nvarchar(50)
)

create table discount_type(
id_discount_type int not null primary key identity(1,1),
discount_type  nvarchar(50)
)

create table event_type(
id_event_type int not null primary key identity(1,1),
event_type  nvarchar(50)
)

create table order_status(
id_order_status int not null primary key identity(1,1),
order_status nvarchar(50)
)

create table order_type(
id_order_type int not null primary key identity(1,1),
order_type nvarchar(50)
)

create table payment_type(
id_payment_type int not null primary key identity(1,1),
payment_type  nvarchar(50)
)

create table employee_positions(
id_employee_positions int not null primary key identity(1,1),
employee_positions  nvarchar(50)
)

create table reward_type(
id_reward_type int not null primary key identity(1,1),
reward_type  nvarchar(50)
)

create table tax_type(
id_tax_type int not null primary key identity(1,1),
tax_type  nvarchar(250),
tax_rate float,
comments nvarchar(500)
)

create table reports_and_froms(
id_reports_and_froms int not null primary key identity(1,1),
date_time datetime,
reports_and_froms_name nvarchar(500),
reports_and_froms_type int,
reports_and_froms_id int
)

create table warehouse(
id_warehous int not null primary key identity(1,1),
warehous  nvarchar(50)
)

create table supply_type(
id_supply_type int not null primary key identity(1,1),
supply_type  nvarchar(50)
)

create table supplier(
id_supplier int not null primary key identity(1,1),
supplier_org_name  nvarchar(250),
reg_date date,
comments nvarchar(450)
)

create table product_category(
id_product_category int not null primary key identity(1,1),
product_category  nvarchar(50)
)

create table write_offs_type(
id_write_offs_type int not null primary key identity(1,1),
write_offs_type nvarchar(50)
)

create table products(
id_products int not null primary key identity(1,1),
products_name  nvarchar(450),
reg_date date,
prod_description nvarchar(500),
id_product_category int foreign key references product_category(id_product_category)
)

create table prise_list(
id_prise_list int not null primary key identity(1,1),
prise_ money,
date_of_change date,
descriptions nvarchar(500), 
id_products int foreign key references products(id_products)
)

create table employee(
id_employee int not null primary key identity(1,1),
first_name nvarchar(50),
middle_name nvarchar(50),
last_name nvarchar(50),
salary_size money,
reg_date date,
phone nvarchar(15),
id_employee_positions int foreign key references employee_positions(id_employee_positions)
)

create table empl_salary(
id_empl_salary int not null primary key identity(1,1),
sal_date date,
salary money,
comments nvarchar(500),
id_employee int  foreign key references employee(id_employee),
id_reward_type int foreign key references  reward_type(id_reward_type)
)

create table promo_events(
id_promo_events int not null primary key identity(1,1),
event_name nvarchar(150),
evnt_comments nvarchar(500),
id_event_type int foreign key references event_type(id_event_type)
)

create table discounts(
id_discounts int not null primary key identity(1,1),
discount money,
id_promo_events int foreign key references promo_events(id_promo_events),
id_event_type int foreign key references event_type(id_event_type)
)

create table customer(
id_customer int not null primary key identity(1,1),
first_name nvarchar(50),
middle_name nvarchar(50),
last_name nvarchar(50),
reg_date date,
org_office_name nvarchar(500),
position nvarchar(150),
pasp_num nvarchar(50),
login_ nvarchar(50),
passwrd nvarchar(50),
id_district int foreign key references district(id_district),
id_customer_type int foreign key references customer_type(id_customer_type)
)

create table cust_conts(
id_cust_conts int not null primary key identity(1,1),
cust_conts nvarchar(450),
id_customer int foreign key references customer(id_customer),
id_cont_type int foreign key references cont_type(id_cont_type)
)

create table supplies(
id_supplies int not null primary key identity(1,1),
supp_date date,
doc_num	nvarchar(20),
commenst nvarchar(500),
id_supply_type int foreign key references supply_type(id_supply_type),
id_supplier int foreign key references supplier(id_supplier)
)

create table supplies_payment(
id_supplies_payment int not null primary key identity(1,1),
payment_amount money,
payment_date date,
payment_commnets nvarchar(500),
id_supplies int foreign key references supplies(id_supplies),
id_payment_type int foreign key references payment_type(id_payment_type)
)

create table supply_list_items(
id_supply_list_items int not null primary key identity(1,1),
price money,
amount int,
comment nvarchar(500),
id_supplies int foreign key references supplies(id_supplies),
id_warehous int foreign key references warehouse(id_warehous),
id_products int foreign key references products(id_products)
)

create table write_offs_list(
id_write_offs_list int not null primary key identity(1,1), 
write_off_date date,
amount int,
comments nvarchar(500),
id_supply_list_items int  foreign key references supply_list_items(id_supply_list_items),
id_write_offs_type int foreign key references write_offs_type(id_write_offs_type)
)

create table orders(
id_orders int not null primary key identity(1,1), 
order_date date,
doc_num nvarchar(50),
comments nvarchar(500),
id_customer int foreign key references customer(id_customer),
id_discounts int foreign key references discounts(id_discounts),
id_employee int foreign key references employee(id_employee), 
id_order_type int foreign key references order_type(id_order_type),
id_order_status int foreign key references order_status(id_order_status)
)

create table order_list_items(
id_order_list_items int not null primary key identity(1,1), 
amount int,
price_with_discount money,
id_orders int foreign key references orders(id_orders),
id_supply_list_items int foreign key references supply_list_items(id_supply_list_items)
)
go
            """

            # Подключаемся к созданной базе данных
            db_engine = create_async_engine(database_url, echo=True)

            # Выполняем SQL-скрипт для создания таблиц
            await execute_sql_script(db_engine, sql_script)
            logger.info("Таблицы успешно созданы с помощью DDL-скрипта")
        else:
            logger.info(f"База данных { DB_NAME} уже существует")

    except Exception as e:
        logger.error(f"Ошибка при инициализации базы данных: {e}")
        raise
    finally:
        await master_engine.dispose()


# Функция для вызова из FastAPI при запуске приложения
async def initialize_database():
    try:
        await init_db()
        logger.info("Инициализация базы данных успешно завершена")
    except Exception as e:
        logger.error(f"Ошибка при инициализации базы данных: {e}")
        raise
