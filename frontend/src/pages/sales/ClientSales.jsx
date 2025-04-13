import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ClientSales = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientSales, setClientSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [sortField, setSortField] = useState('totalAmount');
  const [sortDirection, setSortDirection] = useState('desc');
  const [totals, setTotals] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalDiscount: 0
  });

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
        { id: '1', name: 'Иванов Иван', phone: '+111222333', email: 'ivanov@example.com', discount: 5 },
        { id: '2', name: 'Петрова Мария', phone: '+444555666', email: 'petrova@example.com', discount: 10 },
        { id: '3', name: 'Сидоров Алексей', phone: '+777888999', email: 'sidorov@example.com', discount: 0 }
      ];
      localStorage.setItem('customers', JSON.stringify(demoCustomers));
      setCustomers(demoCustomers);
    } else {
      // Если нет поля discount у клиентов, добавляем его
      const updatedCustomers = customersData.map(customer => {
        if (!customer.hasOwnProperty('discount')) {
          return { ...customer, discount: Math.floor(Math.random() * 10) }; // Случайная скидка от 0 до 9%
        }
        return customer;
      });
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);
    }
    
    // Загрузка данных о продажах по клиентам
    loadClientSalesData();
  };

  const loadClientSalesData = () => {
    // Получаем данные о заказах, позициях и акциях
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    const payments = JSON.parse(localStorage.getItem('orderPayments') || '[]');
    const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    
    // Если нет данных о акциях, создаем демо-данные
    if (promotions.length === 0) {
      const demoPromotions = [
        { 
          id: '1', 
          name: 'Летняя распродажа', 
          discount: 15, 
          startDate: '2023-06-01', 
          endDate: '2023-08-31' 
        },
        { 
          id: '2', 
          name: 'Черная пятница', 
          discount: 30, 
          startDate: '2023-11-24', 
          endDate: '2023-11-27' 
        },
        { 
          id: '3', 
          name: 'Новогодние скидки', 
          discount: 20, 
          startDate: '2023-12-15', 
          endDate: '2023-12-31' 
        }
      ];
      localStorage.setItem('promotions', JSON.stringify(demoPromotions));
    }
    
    // Фильтруем заказы по дате
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    // Фильтруем по выбранному клиенту
    const customerFilteredOrders = selectedCustomer === 'all' 
      ? filteredOrders 
      : filteredOrders.filter(order => order.customerId === selectedCustomer);
    
    // Группируем данные по клиентам
    const clientSalesData = {};
    
    customerFilteredOrders.forEach(order => {
      const customerId = order.customerId;
      const customer = customers.find(c => c.id === customerId);
      
      if (!customer) return;
      
      if (!clientSalesData[customerId]) {
        clientSalesData[customerId] = {
          customerId: customerId,
          customerName: customer.name,
          customerDiscount: customer.discount || 0,
          totalOrders: 0,
          totalAmount: 0,
          paidAmount: 0,
          activePromotion: null, // Будет установлено, если есть активная акция
          orders: []
        };
      }
      
      // Находим все платежи по заказу
      const orderPayments = payments.filter(payment => payment.orderId === order.id);
      const paidAmount = orderPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Проверяем наличие активной акции на дату заказа
      const orderDate = new Date(order.date);
      const activePromotion = promotions.find(promo => {
        const promoStart = new Date(promo.startDate);
        const promoEnd = new Date(promo.endDate);
        return orderDate >= promoStart && orderDate <= promoEnd;
      });
      
      // Добавляем информацию о заказе
      clientSalesData[customerId].totalOrders += 1;
      clientSalesData[customerId].totalAmount += Number(order.total);
      clientSalesData[customerId].paidAmount += paidAmount;
      
      if (activePromotion && !clientSalesData[customerId].activePromotion) {
        clientSalesData[customerId].activePromotion = activePromotion;
      }
      
      clientSalesData[customerId].orders.push({
        id: order.id,
        date: order.date,
        total: Number(order.total),
        isPaid: order.isPaid,
        status: order.status
      });
    });
    
    // Преобразуем в массив и сортируем
    let clientsArray = Object.values(clientSalesData);
    
    // Сортировка
    clientsArray.sort((a, b) => {
      if (sortField === 'customerName') {
        return sortDirection === 'asc' 
          ? a.customerName.localeCompare(b.customerName)
          : b.customerName.localeCompare(a.customerName);
      } else if (sortField === 'totalOrders') {
        return sortDirection === 'asc' 
          ? a.totalOrders - b.totalOrders
          : b.totalOrders - a.totalOrders;
      } else if (sortField === 'totalAmount') {
        return sortDirection === 'asc' 
          ? a.totalAmount - b.totalAmount
          : b.totalAmount - a.totalAmount;
      } else if (sortField === 'paidAmount') {
        return sortDirection === 'asc' 
          ? a.paidAmount - b.paidAmount
          : b.paidAmount - a.paidAmount;
      }
      return 0;
    });
    
    // Расчет общих итогов
    const allTotals = clientsArray.reduce((acc, client) => {
      return {
        totalOrders: acc.totalOrders + client.totalOrders,
        totalRevenue: acc.totalRevenue + client.totalAmount,
        totalPaid: acc.totalPaid + client.paidAmount,
        totalDiscount: acc.totalDiscount + (client.totalAmount * (client.customerDiscount / 100))
      };
    }, {
      totalOrders: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalDiscount: 0
    });
    
    setClientSales(clientsArray);
    setTotals(allTotals);
    setLoading(false);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerChange = (e) => {
    setSelectedCustomer(e.target.value);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const applyFilters = () => {
    loadClientSalesData();
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
          <h1 className="text-2xl font-bold text-gray-900">Продажи по клиентам</h1>
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
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                Клиент
              </label>
              <select
                id="customer"
                value={selectedCustomer}
                onChange={handleCustomerChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все клиенты</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
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
                value={dateRange.startDate}
                onChange={handleDateChange}
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
                value={dateRange.endDate}
                onChange={handleDateChange}
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

        {/* Информационные карточки с итогами */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Общие данные</h3>
            <div>
              <p className="text-sm text-gray-500">Всего клиентов в отчете</p>
              <p className="text-xl font-bold">{clientSales.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Кол-во заказов</h3>
            <div>
              <p className="text-sm text-gray-500">Всего заказов</p>
              <p className="text-xl font-bold">{totals.totalOrders}</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Общая выручка</h3>
            <div>
              <p className="text-sm text-gray-500">Сумма продаж</p>
              <p className="text-xl font-bold">{totals.totalRevenue.toFixed(2)} сом</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Скидки клиентам</h3>
            <div>
              <p className="text-sm text-gray-500">Сумма скидок</p>
              <p className="text-xl font-bold">{totals.totalDiscount.toFixed(2)} сом</p>
            </div>
          </div>
        </div>

        {/* Таблица клиентов */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('customerName')}
                >
                  <div className="flex items-center">
                    ФИО
                    {sortField === 'customerName' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('totalOrders')}
                >
                  <div className="flex items-center">
                    Оплачено
                    {sortField === 'totalOrders' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Скидка клиента
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Акция
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientSales.length > 0 ? (
                clientSales.map((client, index) => (
                  <tr key={client.customerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.paidAmount.toFixed(2)} сом
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {client.customerDiscount}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.activePromotion ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {client.activePromotion.name} ({client.activePromotion.discount}%)
                        </span>
                      ) : 'Нет активных акций'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Нет данных о продажах по клиентам за выбранный период
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Детализация заказов по клиентам */}
        {clientSales.length > 0 && clientSales.map(client => (
          <div key={client.customerId} className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Клиент: {client.customerName}
              </h2>
              <div className="mt-1 text-sm text-gray-500">
                Всего заказов: {client.totalOrders} | 
                Сумма заказов: {client.totalAmount.toFixed(2)} сом | 
                Оплачено: {client.paidAmount.toFixed(2)} сом | 
                Скидка клиента: {client.customerDiscount}%
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер заказа
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
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
                  {client.orders.map((order, index) => (
                    <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{order.id.substring(0, 6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.total.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
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
                        <Link
                          to={`/sales/edit-order/${order.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Редактировать
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientSales;