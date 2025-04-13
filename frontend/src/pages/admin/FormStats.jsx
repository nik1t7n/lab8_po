import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FormStats = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formStats, setFormStats] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, today, week, month
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    // Проверка авторизации
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // Проверка роли (только Admin может просматривать статистику)
    if (user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadStats();
    
    // Добавляем запись о просмотре текущей формы
    recordFormVisit('/admin/form-stats', user.id);
  }, [navigate, selectedPeriod]);

  const loadStats = () => {
    setLoading(true);
    
    // Получаем данные о посещениях форм
    const formVisits = JSON.parse(localStorage.getItem('formVisits') || '[]');
    
    // Если нет данных, создаем демо-данные
    if (formVisits.length === 0) {
      createDemoStats();
      return;
    }
    
    // Фильтрация по периоду
    const filteredVisits = filterVisitsByPeriod(formVisits);
    
    // Группировка данных по форме
    const groupedStats = groupVisitsByForm(filteredVisits);
    
    setFormStats(groupedStats);
    setTotalVisits(filteredVisits.length);
    setLoading(false);
  };

  const createDemoStats = () => {
    // Создаем демо-данные о посещении форм
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) return;
    
    const forms = [
      '/mainpage',
      '/customer/price-list',
      '/customer/order-details',
      '/customer/orders',
      '/sales/orders',
      '/sales/client-debts',
      '/supplies/supplier-debts',
      '/supplies/create-supply',
      '/accountant/total-turnover',
      '/accountant/employee-salary',
      '/admin/form-stats'
    ];
    
    const demoVisits = [];
    
    // Текущая дата для расчета относительных дат
    const now = new Date();
    
    // Создаем записи за последний месяц
    for (let i = 0; i < 100; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomForm = forms[Math.floor(Math.random() * forms.length)];
      
      // Случайная дата в пределах последнего месяца
      const randomDate = new Date(now);
      randomDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
      
      demoVisits.push({
        id: Date.now() + i,
        formPath: randomForm,
        userId: randomUser.id,
        userName: randomUser.username,
        timestamp: randomDate.toISOString()
      });
    }
    
    localStorage.setItem('formVisits', JSON.stringify(demoVisits));
    
    // Фильтрация по периоду
    const filteredVisits = filterVisitsByPeriod(demoVisits);
    
    // Группировка данных по форме
    const groupedStats = groupVisitsByForm(filteredVisits);
    
    setFormStats(groupedStats);
    setTotalVisits(filteredVisits.length);
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

  const filterVisitsByPeriod = (visits) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Начало текущей недели (воскресенье)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return visits.filter(visit => {
      const visitDate = new Date(visit.timestamp);
      
      if (selectedPeriod === 'today') {
        return visitDate >= today;
      } else if (selectedPeriod === 'week') {
        return visitDate >= startOfWeek;
      } else if (selectedPeriod === 'month') {
        return visitDate >= startOfMonth;
      }
      
      return true; // all
    });
  };

  const groupVisitsByForm = (visits) => {
    // Группируем посещения по форме
    const groupedByForm = {};
    
    visits.forEach(visit => {
      if (!groupedByForm[visit.formPath]) {
        groupedByForm[visit.formPath] = {
          formPath: visit.formPath,
          visits: 0,
          lastVisit: null,
          uniqueUsers: new Set()
        };
      }
      
      groupedByForm[visit.formPath].visits += 1;
      groupedByForm[visit.formPath].uniqueUsers.add(visit.userId);
      
      const visitDate = new Date(visit.timestamp);
      if (!groupedByForm[visit.formPath].lastVisit || visitDate > new Date(groupedByForm[visit.formPath].lastVisit)) {
        groupedByForm[visit.formPath].lastVisit = visit.timestamp;
      }
    });
    
    // Преобразуем в массив и сортируем по количеству посещений (по убыванию)
    return Object.values(groupedByForm)
      .map(formStat => ({
        ...formStat,
        uniqueUsers: formStat.uniqueUsers.size
      }))
      .sort((a, b) => b.visits - a.visits);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const getFormName = (path) => {
    // Преобразование пути в более понятное название
    const pathMap = {
      '/mainpage': 'Главная страница',
      '/customer/price-list': 'Прайс-лист (Клиент)',
      '/customer/order-details': 'Оформление заказа',
      '/customer/orders': 'Заказы клиента',
      '/customer/cancel-order': 'Отмена заказа',
      '/customer/pay-orders': 'Оплата заказов',
      '/customer/discounts': 'Скидки по акциям',
      '/sales/price-list': 'Прайс-лист (Продажи)',
      '/sales/products-sales': 'Продажи по товарам',
      '/sales/orders': 'Заказы (Продажи)',
      '/sales/client-debts': 'Задолженности клиентов',
      '/sales/product-stock': 'Остатки по товарам',
      '/sales/edit-order': 'Редактирование заказа',
      '/sales/client-sales': 'Продажи по клиентам',
      '/supplies/supplier-debts': 'Задолженность по поставкам',
      '/supplies/edit-supply': 'Редактирование поставок',
      '/supplies/warehouses': 'Список складов',
      '/supplies/create-supply': 'Создание поставки',
      '/supplies/warehouse-products': 'Товары на складе',
      '/supplies/pay-supplies': 'Оплата поставок',
      '/accountant/total-turnover': 'Товарооборот общий',
      '/accountant/breakeven-point': 'Точка безубыточного продажи',
      '/accountant/profit-loss': 'Отчет о прибылях и убытках',
      '/accountant/category-turnover': 'Товарооборот по категории',
      '/accountant/employee-salary': 'Зарплата сотрудников',
      '/accountant/taxes': 'Налоги',
      '/accountant/payment-type-sales': 'Продажи по типу оплаты',
      '/admin/form-stats': 'Статистика использования форм',
      '/admin/register-employee': 'Регистрация сотрудников',
      '/admin/reports/customers': 'Отчеты по клиентам',
      '/admin/reports/sales': 'Отчеты по продажам',
      '/admin/reports/supplies': 'Отчеты по поставкам',
      '/admin/reports/accountant': 'Отчеты бухгалтера'
    };
    
    return pathMap[path] || path;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
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
          <h1 className="text-2xl font-bold text-gray-900">Статистика использования форм</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтры */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap space-x-2">
            <button
              onClick={() => handlePeriodChange('all')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                selectedPeriod === 'all' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Все время
            </button>
            <button
              onClick={() => handlePeriodChange('today')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                selectedPeriod === 'today' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Сегодня
            </button>
            <button
              onClick={() => handlePeriodChange('week')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                selectedPeriod === 'week' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              За неделю
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                selectedPeriod === 'month' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              За месяц
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Общая статистика</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Всего просмотров</p>
              <p className="text-2xl font-bold">{totalVisits}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Уникальных форм</p>
              <p className="text-2xl font-bold">{formStats.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Средне посещений на форму</p>
              <p className="text-2xl font-bold">
                {formStats.length > 0 
                  ? (totalVisits / formStats.length).toFixed(1) 
                  : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Таблица статистики */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название формы
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Путь
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Просмотров
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Уникальных пользователей
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Последний просмотр
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formStats.length > 0 ? (
                formStats.map((stat, index) => (
                  <tr key={stat.formPath} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getFormName(stat.formPath)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.formPath}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.visits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.uniqueUsers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(stat.lastVisit)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Нет данных о посещениях форм за выбранный период
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormStats;