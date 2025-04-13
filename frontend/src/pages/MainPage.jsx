import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const MainPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    // Получаем данные текущего пользователя из localStorage
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    setCurrentUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  // Функция для определения доступных страниц на основе роли
  const getAvailablePages = () => {
    if (!currentUser) return [];

    const commonPages = [
      { name: "Профиль", path: "/profile" },
    ];

    // Страницы для Admin
    if (currentUser.role === 'Admin') {
      return [
        ...commonPages,
        { name: "Статистика использования форм", path: "/admin/form-stats" },
        { name: "Регистрация сотрудников", path: "/admin/register-employee" },
        { name: "Все отчеты (Customers)", path: "/admin/reports/customers" },
        { name: "Все отчеты (Sales Manager)", path: "/admin/reports/sales" },
        { name: "Все отчеты (Supplies Manager)", path: "/admin/reports/supplies" },
        { name: "Все отчеты (Accountant)", path: "/admin/reports/accountant" }
      ];
    }
    
    // Страницы для Customer
    if (currentUser.role === 'Customer') {
      return [
        ...commonPages,
        { name: "Прайс-лист", path: "/customer/price-list" },
        { name: "Состав заказа", path: "/customer/order-details" },
        { name: "Заказы клиента", path: "/customer/orders" },
        { name: "Отмена заказа", path: "/customer/cancel-order" },
        { name: "Оплата заказов", path: "/customer/pay-orders" },
        { name: "Скидки по акциям", path: "/customer/discounts" }
      ];
    }
    
    // Страницы для Sales Manager
    if (currentUser.role === 'Sales Manager') {
      return [
        ...commonPages,
        { name: "Прайс-лист", path: "/sales/price-list" },
        { name: "Продажи по товарам", path: "/sales/products-sales" },
        { name: "Заказы", path: "/sales/orders" },
        { name: "Задолженности клиентов", path: "/sales/client-debts" },
        { name: "Остатки по товарам", path: "/sales/product-stock" },
        { name: "Форма редактирования заказа", path: "/sales/edit-order" },
        { name: "Продажи по клиентам", path: "/sales/client-sales" }
      ];
    }

    // Страницы для Supplies Manager
    if (currentUser.role === 'Supplies Manager') {
      return [
        ...commonPages,
        { name: "Задолженность по поставкам", path: "/supplies/supplier-debts" },
        { name: "Редактирование поставок", path: "/supplies/edit-supply" },
        { name: "Список складов", path: "/supplies/warehouses" },
        { name: "Создание поставки", path: "/supplies/create-supply" },
        { name: "Список товаров на складе", path: "/supplies/warehouse-products" },
        { name: "Оплата поставок", path: "/supplies/pay-supplies" }
      ];
    }

    // Страницы для Accountant
    if (currentUser.role === 'Accountant') {
      return [
        ...commonPages,
        { name: "Товарооборот общий", path: "/accountant/total-turnover" },
        { name: "Точка безубыточного продажи", path: "/accountant/breakeven-point" },
        { name: "Отчет о прибылях и убытках", path: "/accountant/profit-loss" },
        { name: "Товарооборот по категории", path: "/accountant/category-turnover" },
        { name: "Зарплата сотрудников", path: "/accountant/employee-salary" },
        { name: "Налоги", path: "/accountant/taxes" },
        { name: "Продажи по типу оплаты", path: "/accountant/payment-type-sales" }
      ];
    }

    // По умолчанию возвращаем только общие страницы
    return commonPages;
  };

  const availablePages = getAvailablePages();

  // Если пользователь не загружен, показываем загрузку
  if (!currentUser) {
    return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Система учета</h1>
          </div>
          <div className="flex items-center">
            <span className="mr-4 text-sm">
              {currentUser.username} ({currentUser.role})
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Добро пожаловать, {currentUser.username}!</h2>
          <p className="text-gray-600">
            Вы вошли как <span className="font-semibold">{currentUser.role}</span>. 
            Выберите одну из доступных вам форм и отчетов для работы.
          </p>
        </div>

        {/* Сетка страниц */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availablePages.map((page, index) => (
            <Link 
              key={index} 
              to={page.path}
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 flex items-center"
            >
              <div>
                <h3 className="font-medium text-blue-800">{page.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MainPage;