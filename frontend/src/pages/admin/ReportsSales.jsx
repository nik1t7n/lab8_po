import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ReportsSales = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesReports, setSalesReports] = useState([]);

  useEffect(() => {
    // Проверка авторизации
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // Проверка роли (только Admin может просматривать все отчеты)
    if (user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadReports();
    
    // Записываем посещение страницы
    recordFormVisit('/admin/reports/sales', user.id);
  }, [navigate]);

  const loadReports = () => {
    setLoading(true);
    
    // Список отчетов для менеджеров продаж
    const reports = [
      {
        id: 1,
        name: 'Прайс-лист',
        description: 'Список товаров с ценами',
        path: '/sales/price-list',
        fields: 'Номер, Категория товара, Товар, Цена товара',
        icon: '📋'
      },
      {
        id: 2,
        name: 'Продажи по товарам',
        description: 'Отчет о продажах в разрезе товаров',
        path: '/sales/products-sales',
        fields: 'Номер, Тип товара, Товар, Цена, Кол-во',
        icon: '📊'
      },
      {
        id: 3,
        name: 'Заказы',
        description: 'Список всех заказов в системе',
        path: '/sales/orders',
        fields: 'Номер, Дата, Состояние, Тип заказа, К оплате',
        icon: '📦'
      },
      {
        id: 4,
        name: 'Задолженности клиентов',
        description: 'Отчет о задолженностях клиентов по заказам',
        path: '/sales/client-debts',
        fields: '№ заказа, Сумма к оплате, Фактическая сумма оплаты, Дата дедлайна платежа',
        icon: '💰'
      },
      {
        id: 5,
        name: 'Остатки по товарам на складе',
        description: 'Информация о наличии товаров на складах',
        path: '/sales/product-stock',
        fields: 'Номер, Поставщик, Тип товара, Товар, Цена, Кол-во',
        icon: '🏭'
      },
      {
        id: 7,
        name: 'Продажи по клиентам',
        description: 'Отчет о продажах в разрезе клиентов',
        path: '/sales/client-sales',
        fields: 'Номер, ФИО, Оплачено, Скидка клиента, Акция',
        icon: '👥'
      },
      {
        id: 10,
        name: 'Форма редактирования заказа',
        description: 'Интерфейс для редактирования заказов',
        path: '/sales/edit-order',
        fields: 'Данные заказа, список товаров, цены',
        icon: '✏️'
      }
    ];
    
    setSalesReports(reports);
    setLoading(false);
  };

  const recordFormVisit = (formPath, userId) => {
    // Получаем текущего пользователя
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.id === userId);
    
    if (!currentUser) return;
    
    // Получаем текущие записи о посещениях
    const formVisits = JSON.parse(localStorage.getItem('formVisits') || '[]');
    
    // Добавляем новую запись
    const newVisit = {
      id: Date.now(),
      formPath,
      userId,
      userName: currentUser.username,
      timestamp: new Date().toISOString()
    };
    
    formVisits.push(newVisit);
    
    // Сохраняем обновленные данные
    localStorage.setItem('formVisits', JSON.stringify(formVisits));
  };

  const handleReportClick = (path) => {
    // Специальная обработка для редактирования заказа
    if (path === '/sales/edit-order') {
      // Получаем все заказы
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      if (orders.length > 0) {
        // Перенаправляем на страницу редактирования первого заказа
        navigate(`/sales/edit-order/${orders[0].id}`);
      } else {
        navigate('/sales/orders');
      }
    } else {
      navigate(path);
    }
  };

  // Если данные загружаются
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-3 text-gray-700">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Отчеты для менеджеров продаж</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <p className="text-gray-600">
            Здесь представлены все формы и отчеты, доступные менеджерам продаж.
            Вы можете просмотреть любой отчет, кликнув по нему.
          </p>
        </div>

        {/* Список отчетов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesReports.map(report => (
            <div 
              key={report.id}
              onClick={() => handleReportClick(report.path)}
              className="bg-white shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
                <span className="text-2xl mr-2">{report.icon}</span>
                <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-4">{report.description}</p>
                
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Поля отчета:</h4>
                  <p className="text-sm text-gray-500">{report.fields}</p>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Link
                    to={report.path}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    onClick={(e) => {
                      if (report.path === '/sales/edit-order') {
                        e.preventDefault();
                        handleReportClick(report.path);
                      }
                    }}
                  >
                    Открыть отчет →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Демонстрация задания */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Демонстрация задания</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">3. Создать 1 заказ в составе которой 5 разных товаров по 1 шт.</h3>
              <p className="text-gray-600 mb-2">
                Для демонстрации создания заказа перейдите в раздел <Link to="/customer/order-details" className="text-blue-600 hover:underline">Оформление заказа</Link>.
              </p>
              <p className="text-gray-600">
                После создания заказа, его можно просмотреть в разделе <Link to="/sales/orders" className="text-blue-600 hover:underline">Заказы</Link> и отредактировать.
              </p>
            </div>
          </div>
        </div>

        {/* Навигация по категориям отчетов */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link 
            to="/admin/reports/customers" 
            className="bg-gray-200 text-gray-800 rounded-lg p-4 text-center font-medium hover:bg-gray-300 transition-colors"
          >
            Отчеты для клиентов
          </Link>
          <Link 
            to="/admin/reports/sales" 
            className="bg-blue-800 text-white rounded-lg p-4 text-center font-medium hover:bg-blue-700 transition-colors"
          >
            Отчеты для менеджеров продаж
          </Link>
          <Link 
            to="/admin/reports/supplies" 
            className="bg-gray-200 text-gray-800 rounded-lg p-4 text-center font-medium hover:bg-gray-300 transition-colors"
          >
            Отчеты для менеджеров поставок
          </Link>
          <Link 
            to="/admin/reports/accountant" 
            className="bg-gray-200 text-gray-800 rounded-lg p-4 text-center font-medium hover:bg-gray-300 transition-colors"
          >
            Отчеты для бухгалтеров
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReportsSales;