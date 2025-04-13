import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ReportsCustomers = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerReports, setCustomerReports] = useState([]);

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
    recordFormVisit('/admin/reports/customers', user.id);
  }, [navigate]);

  const loadReports = () => {
    setLoading(true);
    
    // Список отчетов для клиентов
    const reports = [
      {
        id: 1,
        name: 'Прайс-лист',
        description: 'Список товаров с ценами',
        path: '/customer/price-list',
        fields: 'Номер, Категория товара, Товар, Цена товара',
        icon: '📋'
      },
      {
        id: 2,
        name: 'Состав заказа (чек)',
        description: 'Детальная информация о заказе',
        path: '/customer/order-details',
        fields: '№ строки, Товар, Цена со скидкой, Количество, Стоимость',
        icon: '🧾'
      },
      {
        id: 3,
        name: 'Заказы клиента',
        description: 'Список заказов клиента',
        path: '/customer/orders',
        fields: '№ заказа, Дата, Стоимость, № накладной, Статус',
        icon: '📦'
      },
      {
        id: 4,
        name: 'Форма отмены заказа',
        description: 'Позволяет клиенту отменить заказ',
        path: '/customer/cancel-order',
        fields: 'Номер заказа, Причина отмены',
        icon: '❌'
      },
      {
        id: 5,
        name: 'Оплата заказов за период',
        description: 'Форма оплаты заказов',
        path: '/customer/pay-orders',
        fields: 'Номер, Дата заказа, Сумма к оплате, Сумма оплаты',
        icon: '💰'
      },
      {
        id: 10,
        name: 'Скидки по акциям (текущим)',
        description: 'Информация о действующих скидках и акциях',
        path: '/customer/discounts',
        fields: 'Номер, Название акции, Скидка, Дата начала, Дата окончания',
        icon: '🏷️'
      },
      {
        id: 12,
        name: 'Задолженности клиентов',
        description: 'Отчет о задолженностях клиентов по заказам',
        path: '/sales/client-debts',
        fields: '№ заказа, Сумма к оплате, Фактическая сумма оплаты, Дата дедлайна платежа',
        icon: '📊'
      },
      {
        id: 13,
        name: 'Отмененные заказы',
        description: 'Список отмененных заказов и причины отмены',
        path: '/customer/orders?status=cancelled',
        fields: 'Номер заказа, Дата заказа, Причина отмены, Сотрудник, Тип оплаты',
        icon: '🚫'
      }
    ];
    
    setCustomerReports(reports);
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
    navigate(path);
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
          <h1 className="text-2xl font-bold text-gray-900">Отчеты для клиентов</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <p className="text-gray-600">
            Здесь представлены все формы и отчеты, доступные клиентам системы.
            Вы можете просмотреть любой отчет, кликнув по нему.
          </p>
        </div>

        {/* Список отчетов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customerReports.map(report => (
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
                  >
                    Открыть отчет →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Навигация по категориям отчетов */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link 
            to="/admin/reports/customers" 
            className="bg-blue-800 text-white rounded-lg p-4 text-center font-medium hover:bg-blue-700 transition-colors"
          >
            Отчеты для клиентов
          </Link>
          <Link 
            to="/admin/reports/sales" 
            className="bg-gray-200 text-gray-800 rounded-lg p-4 text-center font-medium hover:bg-gray-300 transition-colors"
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

export default ReportsCustomers;