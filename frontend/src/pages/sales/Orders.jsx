import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Orders = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [employees, setEmployees] = useState({});
  const [filterOptions, setFilterOptions] = useState({
    status: 'all', // all, pending, completed, cancelled
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    // Проверка авторизации
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // Проверка роли
    if (user.role !== 'Sales Manager' && user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadInitialData();
  }, [navigate]);

  const loadInitialData = () => {
    setLoading(true);
    
    // Загрузка клиентов
    const customersData = JSON.parse(localStorage.getItem('customers') || '[]');
    if (customersData.length === 0) {
      // Демо данные если нет клиентов
      const demoCustomers = [
        { id: '1', name: 'Иванов Иван', phone: '+111222333', email: 'ivanov@example.com' },
        { id: '2', name: 'Петрова Мария', phone: '+444555666', email: 'petrova@example.com' },
        { id: '3', name: 'Сидоров Алексей', phone: '+777888999', email: 'sidorov@example.com' }
      ];
      localStorage.setItem('customers', JSON.stringify(demoCustomers));
      
      const customersMap = {};
      demoCustomers.forEach(customer => {
        customersMap[customer.id] = customer;
      });
      setCustomers(customersMap);
    } else {
      const customersMap = {};
      customersData.forEach(customer => {
        customersMap[customer.id] = customer;
      });
      setCustomers(customersMap);
    }
    
    // Загрузка сотрудников
    const employeesData = JSON.parse(localStorage.getItem('employees') || '[]');
    if (employeesData.length === 0) {
      // Демо данные если нет сотрудников
      const demoEmployees = [
        { id: '1', name: 'Иванов Иван', position: 'Менеджер по поставкам', dailyRate: 1000 },
        { id: '2', name: 'Петров Петр', position: 'Бухгалтер', dailyRate: 1200 },
        { id: '3', name: 'Сидорова Анна', position: 'Администратор', dailyRate: 1100 },
        { id: '4', name: 'Козлов Андрей', position: 'Менеджер по продажам', dailyRate: 1000 },
        { id: '5', name: 'Морозова Елена', position: 'Кладовщик', dailyRate: 800 }
      ];
      localStorage.setItem('employees', JSON.stringify(demoEmployees));
      
      const employeesMap = {};
      demoEmployees.forEach(employee => {
        employeesMap[employee.id] = employee;
      });
      setEmployees(employeesMap);
    } else {
      const employeesMap = {};
      employeesData.forEach(employee => {
        employeesMap[employee.id] = employee;
      });
      setEmployees(employeesMap);
    }
    
    // Загрузка заказов
    loadOrders();
  };

  const loadOrders = () => {
    const ordersData = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Если нет заказов, создаем демо-заказы
    if (ordersData.length === 0) {
      createDemoOrders();
      return;
    }
    
    // Фильтрация заказов
    const filteredOrders = ordersData.filter(order => {
      // Фильтрация по статусу
      if (filterOptions.status !== 'all' && order.status !== filterOptions.status) {
        return false;
      }
      
      // Фильтрация по дате
      const orderDate = new Date(order.date);
      const startDate = new Date(filterOptions.startDate);
      const endDate = new Date(filterOptions.endDate);
      endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
      
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    // Сортировка заказов
    const sortedOrders = [...filteredOrders].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'total') {
        const totalA = Number(a.total);
        const totalB = Number(b.total);
        return sortDirection === 'asc' ? totalA - totalB : totalB - totalA;
      }
      
      return 0;
    });
    
    setOrders(sortedOrders);
    setLoading(false);
  };

  const createDemoOrders = () => {
    // Получаем товары
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    if (products.length === 0) {
      setLoading(false);
      return;
    }
    
    // Создаем демо-заказы
    const demoOrders = [];
    const demoOrderItems = [];
    
    // Заказ 1: Завершенный, оплаченный
    const order1Id = '1' + Date.now().toString();
    const order1 = {
      id: order1Id,
      customerId: '1',
      date: new Date().toISOString().split('T')[0],
      total: 0,
      status: 'completed',
      paymentType: 'card',
      isPaid: true,
      employeeId: '4', // ID менеджера по продажам
      createdAt: new Date().toISOString()
    };
    
    // Берем 5 товаров для заказа
    const order1Products = products.slice(0, 5);
    const order1Items = order1Products.map(product => ({
      id: Date.now() + Math.random().toString().substring(2, 8),
      orderId: order1Id,
      productId: product.id,
      quantity: 1,
      price: product.salePrice
    }));
    
    // Рассчитываем общую сумму заказа
    const order1Total = order1Items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    order1.total = order1Total;
    
    demoOrders.push(order1);
    demoOrderItems.push(...order1Items);
    
    // Заказ 2: Ожидающий оплаты
    const order2Id = '2' + Date.now().toString();
    const order2 = {
      id: order2Id,
      customerId: '2',
      date: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 дня назад
      total: 0,
      status: 'pending',
      paymentType: 'transfer',
      isPaid: false,
      employeeId: '4', // ID менеджера по продажам
      createdAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Берем другие товары для заказа
    const order2Products = products.slice(2, 5);
    const order2Items = order2Products.map(product => ({
      id: Date.now() + Math.random().toString().substring(2, 8),
      orderId: order2Id,
      productId: product.id,
      quantity: 2,
      price: product.salePrice
    }));
    
    // Рассчитываем общую сумму заказа
    const order2Total = order2Items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    order2.total = order2Total;
    
    demoOrders.push(order2);
    demoOrderItems.push(...order2Items);
    
    // Заказ 3: Отмененный
    const order3Id = '3' + Date.now().toString();
    const order3 = {
      id: order3Id,
      customerId: '3',
      date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 дней назад
      total: 0,
      status: 'cancelled',
      paymentType: 'cash',
      isPaid: false,
      employeeId: '4', // ID менеджера по продажам
      createdAt: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      cancelReason: 'Клиент отказался от заказа'
    };
    
    // Берем еще товары для заказа
    const order3Products = products.slice(3, 6);
    const order3Items = order3Products.map(product => ({
      id: Date.now() + Math.random().toString().substring(2, 8),
      orderId: order3Id,
      productId: product.id,
      quantity: 1,
      price: product.salePrice
    }));
    
    // Рассчитываем общую сумму заказа
    const order3Total = order3Items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    order3.total = order3Total;
    
    demoOrders.push(order3);
    demoOrderItems.push(...order3Items);
    
    // Сохраняем в localStorage
    localStorage.setItem('orders', JSON.stringify(demoOrders));
    localStorage.setItem('orderItems', JSON.stringify(demoOrderItems));
    
    // Создаем платеж для оплаченного заказа
    const payment = {
      id: Date.now().toString(),
      orderId: order1Id,
      amount: order1Total,
      date: new Date().toISOString().split('T')[0],
      paymentType: 'card',
      employeeId: '4' // ID менеджера по продажам
    };
    
    const payments = JSON.parse(localStorage.getItem('orderPayments') || '[]');
    localStorage.setItem('orderPayments', JSON.stringify([...payments, payment]));
    
    setOrders(demoOrders);
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterOptions(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    loadOrders();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Применяем сортировку
    loadOrders();
  };

  const handleEditOrder = (orderId) => {
    navigate(`/sales/edit-order/${orderId}`);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeText = (type) => {
    switch (type) {
      case 'cash': return 'Наличные';
      case 'card': return 'Банковская карта';
      case 'transfer': return 'Банковский перевод';
      default: return 'Неизвестно';
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
          <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтры */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Статус заказа
              </label>
              <select
                id="status"
                name="status"
                value={filterOptions.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все статусы</option>
                <option value="pending">Ожидает</option>
                <option value="completed">Завершен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Дата начала
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filterOptions.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Дата окончания
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filterOptions.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Применить фильтр
              </button>
            </div>
          </div>
        </div>

        {/* Таблица заказов */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Дата
                    {sortField === 'date' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Состояние
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип заказа
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">
                    К оплате
                    {sortField === 'total' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Оплачен
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order, index) => {
                  const customer = customers[order.customerId];
                  
                  return (
                    <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{order.id.substring(0, 6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPaymentTypeText(order.paymentType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {Number(order.total).toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer ? customer.name : 'Неизвестный клиент'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.isPaid ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Да
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Нет
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditOrder(order.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Нет заказов соответствующих критериям поиска
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

export default Orders;