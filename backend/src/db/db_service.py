from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from sqlalchemy import select, update, delete, insert
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from src.db.models import *

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class DBService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Базовый класс сервиса для работы с базой данных
    """

    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: int) -> Optional[ModelType]:
        """
        Получить запись по идентификатору
        """
        query = select(self.model).where(getattr(self.model, f"id_{self.model.__tablename__}") == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_all(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Получить список записей с пагинацией
        """
        query = select(self.model).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj_in: Union[CreateSchemaType, Dict[str, Any]]) -> ModelType:
        """
        Создать новую запись
        """
        obj_in_data = obj_in.dict() if isinstance(obj_in, BaseModel) else obj_in
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, id: int, obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> Optional[ModelType]:
        """
        Обновить запись
        """
        db_obj = await self.get(db, id)
        if not db_obj:
            return None

        obj_data = obj_in.dict(exclude_unset=True) if isinstance(obj_in, BaseModel) else obj_in
        
        # Получаем имя первичного ключа
        primary_key = f"id_{self.model.__tablename__}"
        
        # Формируем запрос на обновление
        query = (
            update(self.model)
            .where(getattr(self.model, primary_key) == id)
            .values(**obj_data)
        )
        
        await db.execute(query)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, id: int) -> bool:
        """
        Удалить запись
        """
        db_obj = await self.get(db, id)
        if not db_obj:
            return False
            
        # Получаем имя первичного ключа
        primary_key = f"id_{self.model.__tablename__}"
        
        # Формируем запрос на удаление
        query = delete(self.model).where(getattr(self.model, primary_key) == id)
        
        await db.execute(query)
        await db.commit()
        return True

    async def query(self, db: AsyncSession, query_func) -> List[Any]:
        """
        Выполнить произвольный запрос
        """
        result = await db.execute(query_func)
        return result.scalars().all()


# Создаем экземпляры сервисов для каждой модели
district_service = DBService(District)
customer_type_service = DBService(CustomerType)
cont_type_service = DBService(ContType)
discount_type_service = DBService(DiscountType)
event_type_service = DBService(EventType)
order_status_service = DBService(OrderStatus)
order_type_service = DBService(OrderType)
payment_type_service = DBService(PaymentType)
employee_positions_service = DBService(EmployeePositions)
reward_type_service = DBService(RewardType)
tax_type_service = DBService(TaxType)
reports_and_froms_service = DBService(ReportsAndFrorms)
warehouse_service = DBService(Warehouse)
supply_type_service = DBService(SupplyType)
supplier_service = DBService(Supplier)
product_category_service = DBService(ProductCategory)
write_offs_type_service = DBService(WriteOffsType)
products_service = DBService(Products)
prise_list_service = DBService(PriseList)
employee_service = DBService(Employee)
empl_salary_service = DBService(EmplSalary)
promo_events_service = DBService(PromoEvents)
discounts_service = DBService(Discounts)
customer_service = DBService(Customer)
cust_conts_service = DBService(CustConts)
supplies_service = DBService(Supplies)
supplies_payment_service = DBService(SuppliesPayment)
supply_list_items_service = DBService(SupplyListItems)
write_offs_list_service = DBService(WriteOffsList)
orders_service = DBService(Orders)
order_list_items_service = DBService(OrderListItems)


# Расширенные сервисы для конкретных моделей с дополнительной логикой

class ProductsService(DBService[Products, CreateSchemaType, UpdateSchemaType]):
    """Сервис для работы с продуктами"""
    
    async def get_by_category(self, db: AsyncSession, category_id: int) -> List[Products]:
        """Получить все продукты по категории"""
        query = select(Products).where(Products.id_product_category == category_id)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_with_price(self, db: AsyncSession, product_id: int) -> Dict[str, Any]:
        """Получить продукт с текущей ценой"""
        query = select(Products, PriseList) \
            .join(PriseList, Products.id_products == PriseList.id_products) \
            .where(Products.id_products == product_id) \
            .order_by(PriseList.date_of_change.desc()) \
            .limit(1)
            
        result = await db.execute(query)
        row = result.first()
        
        if not row:
            return None
            
        product, price = row
        
        return {
            "id_products": product.id_products,
            "products_name": product.products_name,
            "prod_description": product.prod_description,
            "category_id": product.id_product_category,
            "current_price": price.prise_,
            "price_date": price.date_of_change
        }


class OrdersService(DBService[Orders, CreateSchemaType, UpdateSchemaType]):
    """Сервис для работы с заказами"""
    
    async def get_customer_orders(self, db: AsyncSession, customer_id: int) -> List[Orders]:
        """Получить все заказы клиента"""
        query = select(Orders).where(Orders.id_customer == customer_id)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_order_with_items(self, db: AsyncSession, order_id: int) -> Dict[str, Any]:
        """Получить заказ с позициями"""
        # Запрос на получение информации о заказе
        order_query = select(Orders).where(Orders.id_orders == order_id)
        order_result = await db.execute(order_query)
        order = order_result.scalars().first()
        
        if not order:
            return None
            
        # Запрос на получение позиций заказа
        items_query = select(
            OrderListItems, 
            Products.products_name,
            SupplyListItems.price
        ).join(
            SupplyListItems, 
            OrderListItems.id_supply_list_items == SupplyListItems.id_supply_list_items
        ).join(
            Products,
            SupplyListItems.id_products == Products.id_products
        ).where(OrderListItems.id_orders == order_id)
        
        items_result = await db.execute(items_query)
        items = []
        
        for row in items_result:
            item, product_name, original_price = row
            items.append({
                "id": item.id_order_list_items,
                "product_name": product_name,
                "amount": item.amount,
                "original_price": original_price,
                "price_with_discount": item.price_with_discount,
                "discount_amount": original_price - item.price_with_discount if original_price and item.price_with_discount else None
            })
            
        # Получение информации о клиенте
        customer_query = select(
            Customer.first_name,
            Customer.middle_name,
            Customer.last_name,
            Customer.org_office_name
        ).where(Customer.id_customer == order.id_customer)
        
        customer_result = await db.execute(customer_query)
        customer_info = customer_result.first()
        
        # Формирование полного ответа
        return {
            "order_id": order.id_orders,
            "order_date": order.order_date,
            "doc_num": order.doc_num,
            "comments": order.comments,
            "customer": {
                "id": order.id_customer,
                "name": f"{customer_info[0]} {customer_info[1]} {customer_info[2]}".strip() if customer_info else None,
                "org_name": customer_info[3] if customer_info else None
            },
            "status_id": order.id_order_status,
            "type_id": order.id_order_type,
            "discount_id": order.id_discounts,
            "employee_id": order.id_employee,
            "items": items,
            "total_amount": sum(item["amount"] for item in items),
            "total_sum": sum(item["price_with_discount"] * item["amount"] for item in items if item["price_with_discount"])
        }


# Используем расширенные сервисы вместо базовых
products_service = ProductsService(Products)
orders_service = OrdersService(Orders)
