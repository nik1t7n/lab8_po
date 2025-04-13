import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PaymentTypeSales = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [products, setProducts] = useState({});
  const [customers, setCustomers] = useState({});
  const [filterOptions, setFilterOptions] = useState({
    paymentType: 'all', // all, cash, card, transfer
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [totals, setTotals] = useState({
    totalSales: 0,
    totalQuantity: 0,
    totalAmount: 0,
    byPaymentType: {
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      transfer: { count: 0, amount: 0 }
    }
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
    if (user.role !== 'Accountant' && user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadInitialData();
  }, [navigate]);

  const loadInitialData = () => {
    setLoading(true);
    
    // Загрузка товаров
    const productsData = JSON.parse(localStorage.getItem('products') || '[]');
    const productsMap = {};
    productsData.forEach(product => {
      productsMap[product.id] = product;
    });
    setProducts(productsMap);
    
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
    
    // Загрузка данных о продажах
    loadSalesData();
  };

  const loadSalesData = () => {
    // Получаем данные о заказах
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    
    // Подготовка данных для отображения
    const salesDetails = [];
    
    // Фильтруем заказы по дате
    const startDate = new Date(filterOptions.startDate);
    const endDate = new Date(filterOptions.endDate);
    endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    // Фильтруем по типу оплаты
    const paymentTypeFiltered = filterOptions.paymentType === 'all' 
      ? filteredOrders 
      : filteredOrders.filter(order => order.paymentType === filterOptions.paymentType);
    
    // Собираем детали продаж
    paymentTypeFiltered.forEach(order => {
      const items = orderItems.filter(item => item.orderId === order.id);
      
      items.forEach(item => {
        const product = products[item.productId];
        
        if (product) {
          salesDetails.push({
            id: `${order.id}-${item.productId}`,
            orderId: order.id,
            orderDate: order.date,
            paymentType: order.paymentType,
            customerId: order.customerId,
            productId: item.productId,
            productType: product.category,
            productName: product.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            total: Number(item.price) * Number(item.quantity)
          });
        }
      });
    });
    
    // Расчет итогов
    const totalSales = paymentTypeFiltered.length;
    const totalQuantity = salesDetails.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = salesDetails.reduce((sum, item) => sum + item.total, 0);
    
    // Расчет по типам оплаты
    const byPaymentType = {
      cash: { 
        count: paymentTypeFiltered.filter(order => order.paymentType === 'cash').length,
        amount: paymentTypeFiltered
          .filter(order => order.paymentType === 'cash')
          .reduce((sum, order) => sum + Number(order.total), 0)
      },
      card: { 
        count: paymentTypeFiltered.filter(order => order.paymentType === 'card').length,
        amount: paymentTypeFiltered
          .filter(order => order.paymentType === 'card')
          .reduce((sum, order) => sum + Number(order.total), 0)
      },
      transfer: { 
        count: paymentTypeFiltered.filter(order => order.paymentType === 'transfer').length,
        amount: paymentTypeFiltered
          .filter(order => order.paymentType === 'transfer')
          .reduce((sum, order) => sum + Number(order.total), 0)
      }
    };
    
    setSalesData(salesDetails);
    setTotals({
      totalSales,
      totalQuantity,
      totalAmount,
      byPaymentType
    });
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterOptions(prev => ({ ...prev, [name]: value }));
  };

  const applyFilter = () => {
    loadSalesData();
  };

  // Функция для перевода типа оплаты в текст
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
          <h1 className="text-2xl font-bold text-gray-900">Продажи по типу оплаты</h1>
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
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                Тип оплаты
              </label>
              <select
                id="paymentType"
                name="paymentType"
                value={filterOptions.paymentType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все типы</option>
                <option value="cash">Наличные</option>
                <option value="card">Банковская карта</option>
                <option value="transfer">Банковский перевод</option>
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
                onClick={applyFilter}
                className="w-full px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Применить фильтр
              </button>
            </div>
          </div>
        </div>

        {/* Информационные карточки с итогами */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Наличные</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Количество продаж:</span>
              <span className="font-medium">{totals.byPaymentType.cash.count}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Сумма:</span>
              <span className="font-medium">{totals.byPaymentType.cash.amount.toFixed(2)} сом</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Банковская карта</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Количество продаж:</span>
              <span className="font-medium">{totals.byPaymentType.card.count}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Сумма:</span>
              <span className="font-medium">{totals.byPaymentType.card.amount.toFixed(2)} сом</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Банковский перевод</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Количество продаж:</span>
              <span className="font-medium">{totals.byPaymentType.transfer.count}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Сумма:</span>
              <span className="font-medium">{totals.byPaymentType.transfer.amount.toFixed(2)} сом</span>
            </div>
          </div>
        </div>

        {/* Таблица продаж */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Номер
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип товара
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Товар
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Кол-во
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    № Заказа
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип оплаты
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.length > 0 ? (
                  salesData.map((item, index) => {
                    const customer = customers[item.customerId];
                    
                    return (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.productType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.price.toFixed(2)} сом
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.orderDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer ? customer.name : 'Неизвестный клиент'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{item.orderId.substring(0, 6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${item.paymentType === 'cash' ? 'bg-green-100 text-green-800' : 
                              item.paymentType === 'card' ? 'bg-blue-100 text-blue-800' : 
                              'bg-purple-100 text-purple-800'}`}>
                            {getPaymentTypeText(item.paymentType)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                      Нет данных о продажах за выбранный период
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ИТОГО:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {totals.totalQuantity}
                  </td>
                  <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    Общая сумма: {totals.totalAmount.toFixed(2)} сом
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTypeSales;