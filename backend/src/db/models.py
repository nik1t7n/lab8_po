from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import DECIMAL
from src.core.db_config import Base

# Справочные таблицы
class District(Base):
    __tablename__ = "district"
    
    id_district = Column(Integer, primary_key=True, autoincrement=True)
    district = Column(String(50))
    
    customers = relationship("Customer", back_populates="district")


class CustomerType(Base):
    __tablename__ = "customer_type"
    
    id_customer_type = Column(Integer, primary_key=True, autoincrement=True)
    customer_type = Column(String(50))
    
    customers = relationship("Customer", back_populates="customer_type")


class ContType(Base):
    __tablename__ = "cont_type"
    
    id_cont_type = Column(Integer, primary_key=True, autoincrement=True)
    cont_type = Column(String(50))
    
    customer_contacts = relationship("CustConts", back_populates="cont_type")


class DiscountType(Base):
    __tablename__ = "discount_type"
    
    id_discount_type = Column(Integer, primary_key=True, autoincrement=True)
    discount_type = Column(String(50))


class EventType(Base):
    __tablename__ = "event_type"
    
    id_event_type = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(50))
    
    promo_events = relationship("PromoEvents", back_populates="event_type")
    discounts = relationship("Discounts", back_populates="event_type")


class OrderStatus(Base):
    __tablename__ = "order_status"
    
    id_order_status = Column(Integer, primary_key=True, autoincrement=True)
    order_status = Column(String(50))
    
    orders = relationship("Orders", back_populates="order_status")


class OrderType(Base):
    __tablename__ = "order_type"
    
    id_order_type = Column(Integer, primary_key=True, autoincrement=True)
    order_type = Column(String(50))
    
    orders = relationship("Orders", back_populates="order_type")


class PaymentType(Base):
    __tablename__ = "payment_type"
    
    id_payment_type = Column(Integer, primary_key=True, autoincrement=True)
    payment_type = Column(String(50))
    
    supplies_payments = relationship("SuppliesPayment", back_populates="payment_type")


class EmployeePositions(Base):
    __tablename__ = "employee_positions"
    
    id_employee_positions = Column(Integer, primary_key=True, autoincrement=True)
    employee_positions = Column(String(50))
    
    employees = relationship("Employee", back_populates="position")


class RewardType(Base):
    __tablename__ = "reward_type"
    
    id_reward_type = Column(Integer, primary_key=True, autoincrement=True)
    reward_type = Column(String(50))
    
    employee_salaries = relationship("EmplSalary", back_populates="reward_type")


class TaxType(Base):
    __tablename__ = "tax_type"
    
    id_tax_type = Column(Integer, primary_key=True, autoincrement=True)
    tax_type = Column(String(250))
    tax_rate = Column(Float)
    comments = Column(String(500))


class ReportsAndFrorms(Base):
    __tablename__ = "reports_and_froms"
    
    id_reports_and_froms = Column(Integer, primary_key=True, autoincrement=True)
    date_time = Column(DateTime)
    reports_and_froms_name = Column(String(500))
    reports_and_froms_type = Column(Integer)
    reports_and_froms_id = Column(Integer)


class Warehouse(Base):
    __tablename__ = "warehouse"
    
    id_warehous = Column(Integer, primary_key=True, autoincrement=True)
    warehous = Column(String(50))
    
    supply_list_items = relationship("SupplyListItems", back_populates="warehouse")


class SupplyType(Base):
    __tablename__ = "supply_type"
    
    id_supply_type = Column(Integer, primary_key=True, autoincrement=True)
    supply_type = Column(String(50))
    
    supplies = relationship("Supplies", back_populates="supply_type")


class Supplier(Base):
    __tablename__ = "supplier"
    
    id_supplier = Column(Integer, primary_key=True, autoincrement=True)
    supplier_org_name = Column(String(250))
    reg_date = Column(Date)
    comments = Column(String(450))
    
    supplies = relationship("Supplies", back_populates="supplier")


class ProductCategory(Base):
    __tablename__ = "product_category"
    
    id_product_category = Column(Integer, primary_key=True, autoincrement=True)
    product_category = Column(String(50))
    
    products = relationship("Products", back_populates="category")


class WriteOffsType(Base):
    __tablename__ = "write_offs_type"
    
    id_write_offs_type = Column(Integer, primary_key=True, autoincrement=True)
    write_offs_type = Column(String(50))
    
    write_offs = relationship("WriteOffsList", back_populates="write_offs_type")


# Основные таблицы
class Products(Base):
    __tablename__ = "products"
    
    id_products = Column(Integer, primary_key=True, autoincrement=True)
    products_name = Column(String(450))
    reg_date = Column(Date)
    prod_description = Column(String(500))
    id_product_category = Column(Integer, ForeignKey("product_category.id_product_category"))
    
    category = relationship("ProductCategory", back_populates="products")
    price_list = relationship("PriseList", back_populates="product")
    supply_list_items = relationship("SupplyListItems", back_populates="product")


class PriseList(Base):
    __tablename__ = "prise_list"
    
    id_prise_list = Column(Integer, primary_key=True, autoincrement=True)
    prise_ = Column(DECIMAL(19, 4))  # Money type equivalent
    date_of_change = Column(Date)
    descriptions = Column(String(500))
    id_products = Column(Integer, ForeignKey("products.id_products"))
    
    product = relationship("Products", back_populates="price_list")


class Employee(Base):
    __tablename__ = "employee"
    
    id_employee = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(50))
    middle_name = Column(String(50))
    last_name = Column(String(50))
    salary_size = Column(DECIMAL(19, 4))  # Money type equivalent
    reg_date = Column(Date)
    phone = Column(String(15))
    id_employee_positions = Column(Integer, ForeignKey("employee_positions.id_employee_positions"))
    
    position = relationship("EmployeePositions", back_populates="employees")
    salaries = relationship("EmplSalary", back_populates="employee")
    orders = relationship("Orders", back_populates="employee")


class EmplSalary(Base):
    __tablename__ = "empl_salary"
    
    id_empl_salary = Column(Integer, primary_key=True, autoincrement=True)
    sal_date = Column(Date)
    salary = Column(DECIMAL(19, 4))  # Money type equivalent
    comments = Column(String(500))
    id_employee = Column(Integer, ForeignKey("employee.id_employee"))
    id_reward_type = Column(Integer, ForeignKey("reward_type.id_reward_type"))
    
    employee = relationship("Employee", back_populates="salaries")
    reward_type = relationship("RewardType", back_populates="employee_salaries")


class PromoEvents(Base):
    __tablename__ = "promo_events"
    
    id_promo_events = Column(Integer, primary_key=True, autoincrement=True)
    event_name = Column(String(150))
    evnt_comments = Column(String(500))
    id_event_type = Column(Integer, ForeignKey("event_type.id_event_type"))
    
    event_type = relationship("EventType", back_populates="promo_events")
    discounts = relationship("Discounts", back_populates="promo_event")


class Discounts(Base):
    __tablename__ = "discounts"
    
    id_discounts = Column(Integer, primary_key=True, autoincrement=True)
    discount = Column(DECIMAL(19, 4))  # Money type equivalent
    id_promo_events = Column(Integer, ForeignKey("promo_events.id_promo_events"))
    id_event_type = Column(Integer, ForeignKey("event_type.id_event_type"))
    
    promo_event = relationship("PromoEvents", back_populates="discounts")
    event_type = relationship("EventType", back_populates="discounts")
    orders = relationship("Orders", back_populates="discount")


class Customer(Base):
    __tablename__ = "customer"
    
    id_customer = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(50))
    middle_name = Column(String(50))
    last_name = Column(String(50))
    reg_date = Column(Date)
    org_office_name = Column(String(500))
    position = Column(String(150))
    pasp_num = Column(String(50))
    login_ = Column(String(50))
    passwrd = Column(String(50))
    id_district = Column(Integer, ForeignKey("district.id_district"))
    id_customer_type = Column(Integer, ForeignKey("customer_type.id_customer_type"))
    
    district = relationship("District", back_populates="customers")
    customer_type = relationship("CustomerType", back_populates="customers")
    contacts = relationship("CustConts", back_populates="customer")
    orders = relationship("Orders", back_populates="customer")


class CustConts(Base):
    __tablename__ = "cust_conts"
    
    id_cust_conts = Column(Integer, primary_key=True, autoincrement=True)
    cust_conts = Column(String(450))
    id_customer = Column(Integer, ForeignKey("customer.id_customer"))
    id_cont_type = Column(Integer, ForeignKey("cont_type.id_cont_type"))
    
    customer = relationship("Customer", back_populates="contacts")
    cont_type = relationship("ContType", back_populates="customer_contacts")


class Supplies(Base):
    __tablename__ = "supplies"
    
    id_supplies = Column(Integer, primary_key=True, autoincrement=True)
    supp_date = Column(Date)
    doc_num = Column(String(20))
    commenst = Column(String(500))
    id_supply_type = Column(Integer, ForeignKey("supply_type.id_supply_type"))
    id_supplier = Column(Integer, ForeignKey("supplier.id_supplier"))
    
    supply_type = relationship("SupplyType", back_populates="supplies")
    supplier = relationship("Supplier", back_populates="supplies")
    payments = relationship("SuppliesPayment", back_populates="supply")
    supply_items = relationship("SupplyListItems", back_populates="supply")


class SuppliesPayment(Base):
    __tablename__ = "supplies_payment"
    
    id_supplies_payment = Column(Integer, primary_key=True, autoincrement=True)
    payment_amount = Column(DECIMAL(19, 4))  # Money type equivalent
    payment_date = Column(Date)
    payment_commnets = Column(String(500))
    id_supplies = Column(Integer, ForeignKey("supplies.id_supplies"))
    id_payment_type = Column(Integer, ForeignKey("payment_type.id_payment_type"))
    
    supply = relationship("Supplies", back_populates="payments")
    payment_type = relationship("PaymentType", back_populates="supplies_payments")


class SupplyListItems(Base):
    __tablename__ = "supply_list_items"
    
    id_supply_list_items = Column(Integer, primary_key=True, autoincrement=True)
    price = Column(DECIMAL(19, 4))  # Money type equivalent
    amount = Column(Integer)
    comment = Column(String(500))
    id_supplies = Column(Integer, ForeignKey("supplies.id_supplies"))
    id_warehous = Column(Integer, ForeignKey("warehouse.id_warehous"))
    id_products = Column(Integer, ForeignKey("products.id_products"))
    
    supply = relationship("Supplies", back_populates="supply_items")
    warehouse = relationship("Warehouse", back_populates="supply_list_items")
    product = relationship("Products", back_populates="supply_list_items")
    write_offs = relationship("WriteOffsList", back_populates="supply_item")
    order_items = relationship("OrderListItems", back_populates="supply_item")


class WriteOffsList(Base):
    __tablename__ = "write_offs_list"
    
    id_write_offs_list = Column(Integer, primary_key=True, autoincrement=True)
    write_off_date = Column(Date)
    amount = Column(Integer)
    comments = Column(String(500))
    id_supply_list_items = Column(Integer, ForeignKey("supply_list_items.id_supply_list_items"))
    id_write_offs_type = Column(Integer, ForeignKey("write_offs_type.id_write_offs_type"))
    
    supply_item = relationship("SupplyListItems", back_populates="write_offs")
    write_offs_type = relationship("WriteOffsType", back_populates="write_offs")


class Orders(Base):
    __tablename__ = "orders"
    
    id_orders = Column(Integer, primary_key=True, autoincrement=True)
    order_date = Column(Date)
    doc_num = Column(String(50))
    comments = Column(String(500))
    id_customer = Column(Integer, ForeignKey("customer.id_customer"))
    id_discounts = Column(Integer, ForeignKey("discounts.id_discounts"))
    id_employee = Column(Integer, ForeignKey("employee.id_employee"))
    id_order_type = Column(Integer, ForeignKey("order_type.id_order_type"))
    id_order_status = Column(Integer, ForeignKey("order_status.id_order_status"))
    
    customer = relationship("Customer", back_populates="orders")
    discount = relationship("Discounts", back_populates="orders")
    employee = relationship("Employee", back_populates="orders")
    order_type = relationship("OrderType", back_populates="orders")
    order_status = relationship("OrderStatus", back_populates="orders")
    order_items = relationship("OrderListItems", back_populates="order")


class OrderListItems(Base):
    __tablename__ = "order_list_items"
    
    id_order_list_items = Column(Integer, primary_key=True, autoincrement=True)
    amount = Column(Integer)
    price_with_discount = Column(DECIMAL(19, 4))  # Money type equivalent
    id_orders = Column(Integer, ForeignKey("orders.id_orders"))
    id_supply_list_items = Column(Integer, ForeignKey("supply_list_items.id_supply_list_items"))
    
    order = relationship("Orders", back_populates="order_items")
    supply_item = relationship("SupplyListItems", back_populates="order_items")
