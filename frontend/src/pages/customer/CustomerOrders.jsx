import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [products, setProducts] = useState({});
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed, cancelled

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
    if (user.role !== 'Customer' && user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadInitialData(user);
  }, [navigate]);

  const loadInitialData = (user) => {
    setLoading(true);
    
    // Проверяем, есть ли у пользователя customerId
    if (!user.customerId) {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Если есть клиенты, назначаем первого из них
      if (customers.length > 0) {
        user.customerId = customers[0].id;
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
      } else {
        // Создаем демо-клиента и назначаем его
        const demoCustomer = { 
          id: '1', 
          name: 'Иванов Иван', 
          phone: '+111222333', 
          email: 'ivanov@example.com', 
          discount: 5 
        };
        localStorage.setItem('customers', JSON.stringify([demoCustomer]));
        
        user.customerId = demoCustomer.id;
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
      }
    }
    
    // Загрузка данных о товарах
    const productsData = JSON.parse(localStorage.getItem('products') || '[]');
    const productsMap = {};
    productsData.forEach(product => {
      productsMap[product.id] = product;
    });
    setProducts(productsMap);
    
    // Загрузка заказов пользователя
    loadUserOrders(user.customerId);
  };

  const loadUserOrders = (customerId) => {
    // Получаем заказы клиента
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = allOrders.filter(order => order.customerId === customerId);
    
    // Если заказов нет, создаем демо-заказ
    if (userOrders.length === 0) {
      createDemoOrder(customerId);
      return;
    }
    
    // Сортировка заказов по дате (сначала новые)
    userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Загрузка позиций всех заказов
    const allOrderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    const orderItemsMap = {};
    
    userOrders.forEach(order => {
      const items = allOrderItems.filter(item => item.orderId === order.id);
      orderItemsMap[order.id] = items;
    });
    
    setOrders(userOrders);
    setOrderItems(orderItemsMap);
    setLoading(false);
  };

  const createDemoOrder = (customerId) => {
    // Создаем демо-заказ для демонстрации
    const productsData = JSON.parse(localStorage.getItem('products') || '[]');
    
    if (productsData.length === 0) {
      setLoading(false);
      return;
    }
    
    // Создаем заказ
    const orderId = Date.now().toString();
    const demoOrder = {
      id: orderId,
      customerId: customerId,
      date: new Date().toISOString().split('T')[0],
      total: 0, // Будет рассчитано позже
      status: 'pending',
      paymentType: 'cash',
      isPaid: false,
      createdAt: new Date().toISOString()
    };
    
    // Добавляем 5 случайных товаров
    const selectedProducts = productsData.slice(0, 5);
    const demoOrderItems = selectedProducts.map(product => ({
      id: Date.now() + Math.random().toString().substring(2, 8),
      orderId: orderId,
      productId: product.id,
      quantity: 1,
      price: product.salePrice * 0.9 // Небольшая скидка для демонстрации
    }));
    
    // Расчет общей суммы
    const total = demoOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    demoOrder.total = total;
    
    // Сохраняем данные
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    localStorage.setItem('orders', JSON.stringify([...orders, demoOrder]));
    
    const existingOrderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    localStorage.setItem('orderItems', JSON.stringify([...existingOrderItems, ...demoOrderItems]));
    
    // Обновляем данные на странице
    const orderItemsMap = {};
    orderItemsMap[orderId] = demoOrderItems;
    
    setOrders([demoOrder]);
    setOrderItems(orderItemsMap);
    setLoading(false);
  };

  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
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

  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };

  // Фильтрация заказов по статусу
  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

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
          <h1 className="text-2xl font-bold text-gray-900">Заказы клиента</h1>
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
              onClick={() => handleFilterChange('all')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                filterStatus === 'all' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Все заказы
            </button>
            <button
              onClick={() => handleFilterChange('pending')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                filterStatus === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Ожидающие
            </button>
            <button
              onClick={() => handleFilterChange('completed')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                filterStatus === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Завершенные
            </button>
            <button
              onClick={() => handleFilterChange('cancelled')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                filterStatus === 'cancelled' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Отмененные
            </button>
          </div>
        </div>

        {/* Кнопка создания нового заказа */}
        <div className="mb-6">
          <Link 
            to="/customer/order-details" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Создать новый заказ
          </Link>
        </div>

        {/* Список заказов */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div 
                  className="px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Заказ №{order.id.substring(0, 6)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      от {order.date}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-lg font-medium">
                      {Number(order.total).toFixed(2)} сом
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transition-transform ${expandedOrder === order.id ? 'transform rotate-180' : ''}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {expandedOrder === order.id && (
                  <div className="px-6 py-4">
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Детали заказа</h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Статус оплаты:</p>
                          <p className="font-medium">
                            {order.isPaid ? (
                              <span className="text-green-600">Оплачен</span>
                            ) : (
                              <span className="text-red-600">Не оплачен</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Способ оплаты:</p>
                          <p className="font-medium">
                            {order.paymentType === 'cash' && 'Наличные'}
                            {order.paymentType === 'card' && 'Банковская карта'}
                            {order.paymentType === 'transfer' && 'Банковский перевод'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="text-md font-medium text-gray-900 mb-2">Товары в заказе</h4>
                    <table className="min-w-full divide-y divide-gray-200 mb-4">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            №
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Товар
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Цена
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Количество
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Сумма
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderItems[order.id] && orderItems[order.id].map((item, index) => {
                          const product = products[item.productId];
                          return (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product ? product.name : 'Неизвестный товар'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {Number(item.price).toFixed(2)} сом
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {(Number(item.price) * Number(item.quantity)).toFixed(2)} сом
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    <div className="flex justify-end mt-4 space-x-3">
                      {order.status === 'pending' && !order.isPaid && (
                        <>
                          <Link
                            to={`/customer/pay-orders?orderId=${order.id}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                          >
                            Оплатить
                          </Link>
                          <Link
                            to={`/customer/cancel-order?orderId=${order.id}`}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                          >
                            Отменить
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">У вас пока нет заказов</p>
            <Link 
              to="/customer/order-details" 
              className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Создать заказ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;