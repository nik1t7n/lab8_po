import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ReportsAccountant = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountantReports, setAccountantReports] = useState([]);

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
    recordFormVisit('/admin/reports/accountant', user.id);
  }, [navigate]);

  const loadReports = () => {
    setLoading(true);
    
    // Список отчетов для бухгалтеров
    const reports = [
      {
        id: 3,
        name: 'Товарооборот общий',
        description: 'Отчет об общем товарообороте компании',
        path: '/accountant/total-turnover',
        fields: 'Номер, Тип товара, Товар, Кол-во поставки, Кол-во продаж, Остаток, Выручка, Прибыль/убыток, Налоги, Чистая прибыль',
        icon: '📊',
        special: true
      },
      {
        id: 5,
        name: 'Товарооборот по категории товаров',
        description: 'Отчет о товарообороте с группировкой по категориям',
        path: '/accountant/category-turnover',
        fields: 'Номер, Тип товара, Товар, Кол-во поставки, Кол-во продаж, Остаток, Выручка, Прибыль/убыток, Налоги, Чистая прибыль',
        icon: '📁'
      },
      {
        id: 14,
        name: 'Продажи по типу оплаты',
        description: 'Отчет о продажах с группировкой по типу оплаты',
        path: '/accountant/payment-type-sales',
        fields: 'Номер, Тип товара, Товар, Цена, Кол-во, Дата, Клиент, № Заказа',
        icon: '💳'
      },
      {
        id: 22,
        name: 'Точка безубыточного продажи товара',
        description: 'Анализ точки безубыточности для товаров',
        path: '/accountant/breakeven-point',
        fields: 'Номер, Тип товара, Товар, Цена покупки, Цена продажи, Прибыль',
        icon: '📈',
        special: true
      },
      {
        id: 24,
        name: 'Налоги',
        description: 'Отчет по налогам компании',
        path: '/accountant/taxes',
        fields: 'Номер, Название налога, Сумма, Дата начала, Дата окончания',
        icon: '💸'
      },
      {
        id: 25,
        name: 'Зарплата сотрудников',
        description: 'Отчет по зарплатам сотрудников и начислениям',
        path: '/accountant/employee-salary',
        fields: 'Номер, Дата, Начислено, Оплачено, Должность, Сотрудник',
        icon: '👨‍💼'
      },
      {
        id: 28,
        name: 'Отчет о прибылях и убытках',
        description: 'Финансовый отчет о прибылях и убытках компании',
        path: '/accountant/profit-loss',
        fields: 'Номер, Расход, Доходы, Налоги, Прибыль',
        icon: '💰',
        special: true
      }
    ];
    
    setAccountantReports(reports);
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
          <h1 className="text-2xl font-bold text-gray-900">Отчеты для бухгалтеров</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <p className="text-gray-600">
            Здесь представлены все формы и отчеты, доступные бухгалтерам.
            Обратите особое внимание на специальные отчеты, отмеченные значком ⭐.
          </p>
        </div>

        {/* Список отчетов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accountantReports.map(report => (
            <div 
              key={report.id}
              onClick={() => handleReportClick(report.path)}
              className={`bg-white shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${report.special ? 'border-2 border-yellow-400' : ''}`}
            >
              <div className={`px-6 py-4 ${report.special ? 'bg-yellow-50' : 'bg-gray-50'} border-b border-gray-200 flex items-center`}>
                <span className="text-2xl mr-2">{report.icon}</span>
                <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                {report.special && <span className="ml-2 text-xl text-yellow-500">⭐</span>}
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

        {/* Демонстрация задания */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Демонстрация задания</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">4. Выдать зарплату сотруднику за 0.5 дня работы – 500 сом</h3>
              <p className="text-gray-600 mb-2">
                Для демонстрации выдачи зарплаты перейдите в раздел <Link to="/accountant/employee-salary" className="text-blue-600 hover:underline">Зарплата сотрудников</Link>.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">5. Продемонстрировать работу отчетов по ролям</h3>
              <p className="text-gray-600 mb-2">
                Особое внимание следует обратить на отчеты, отмеченные звездочкой ⭐:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><Link to="/accountant/total-turnover" className="text-blue-600 hover:underline">Товарооборот общий (3)</Link> - обязательный отчет</li>
                <li><Link to="/accountant/breakeven-point" className="text-blue-600 hover:underline">Точка безубыточного продажи товара (22)</Link> - обязательный отчет</li>
                <li><Link to="/accountant/profit-loss" className="text-blue-600 hover:underline">Отчет о прибылях и убытках (28)</Link> - обязательный отчет</li>
              </ul>
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
            className="bg-blue-800 text-white rounded-lg p-4 text-center font-medium hover:bg-blue-700 transition-colors"
          >
            Отчеты для бухгалтеров
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReportsAccountant;