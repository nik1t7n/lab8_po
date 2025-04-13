import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const PayOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedOrderId = queryParams.get('orderId');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [paymentData, setPaymentData] = useState({
    paymentType: 'cash',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    comment: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

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
  }, [navigate, preselectedOrderId]);

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
    
    // Загрузка заказов пользователя (только неоплаченные)
    loadUnpaidOrders(user.customerId);
  };

  const loadUnpaidOrders = (customerId) => {
    // Получаем заказы клиента
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const unpaidOrders = allOrders.filter(order => 
      order.customerId === customerId && 
      !order.isPaid &&
      order.status === 'pending'
    );
    
    // Сортировка заказов по дате (сначала новые)
    unpaidOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setOrders(unpaidOrders);
    
    // Если есть предварительно выбранный заказ, загрузим его детали
    if (preselectedOrderId) {
      const selectedOrder = allOrders.find(order => order.id === preselectedOrderId);
      if (selectedOrder) {
        setSelectedOrderId(preselectedOrderId);
        setOrderDetails(selectedOrder);
        setPaymentData(prev => ({
          ...prev,
          amount: Number(selectedOrder.total)
        }));
      }
    }
    
    setLoading(false);
  };

  // Обработчик выбора заказа
  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);
    
    if (orderId) {
      const selectedOrder = orders.find(order => order.id === orderId);
      if (selectedOrder) {
        setOrderDetails(selectedOrder);
        setPaymentData(prev => ({
          ...prev,
          amount: Number(selectedOrder.total)
        }));
      }
    } else {
      setOrderDetails(null);
      setPaymentData(prev => ({
        ...prev,
        amount: 0
      }));
    }
  };

  // Обработчик изменения данных оплаты
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  // Обработчик оплаты заказа
  const handlePayOrder = (e) => {
    e.preventDefault();
    
    // Проверка выбора заказа
    if (!selectedOrderId) {
      setError('Выберите заказ для оплаты');
      return;
    }
    
    // Проверка суммы оплаты
    if (Number(paymentData.amount) <= 0) {
      setError('Сумма оплаты должна быть больше нуля');
      return;
    }
    
    // Проверка, что сумма не превышает сумму заказа
    if (Number(paymentData.amount) > Number(orderDetails.total)) {
      setError('Сумма оплаты не может превышать сумму заказа');
      return;
    }
    
    // Создаем запись об оплате
    const payment = {
      id: Date.now().toString(),
      orderId: selectedOrderId,
      customerId: currentUser.customerId,
      amount: Number(paymentData.amount),
      paymentType: paymentData.paymentType,
      date: paymentData.date,
      comment: paymentData.comment,
      createdAt: new Date().toISOString()
    };
    
    // Сохраняем платеж
    const payments = JSON.parse(localStorage.getItem('orderPayments') || '[]');
    localStorage.setItem('orderPayments', JSON.stringify([...payments, payment]));
    
    // Обновляем статус заказа, если оплачена полная сумма
    if (Number(paymentData.amount) === Number(orderDetails.total)) {
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = allOrders.map(order => {
        if (order.id === selectedOrderId) {
          return {
            ...order,
            isPaid: true,
            paymentType: paymentData.paymentType // Обновляем тип оплаты
          };
        }
        return order;
      });
      
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    }
    
    // Показываем сообщение об успехе
    setSuccess('Оплата прошла успешно!');
    setError('');
    
    // Обновляем список заказов
    loadUnpaidOrders(currentUser.customerId);
    
    // Сбрасываем форму
    setSelectedOrderId('');
    setOrderDetails(null);
    setPaymentData({
      paymentType: 'cash',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      comment: ''
    });
    
    // Перенаправляем на страницу заказов через 2 секунды
    setTimeout(() => {
      navigate('/customer/orders');
    }, 2000);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Оплата заказов</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Выбор заказа */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Выберите заказ для оплаты</h2>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                    Заказ
                  </label>
                  <select
                    id="order"
                    value={selectedOrderId}
                    onChange={handleOrderSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Выберите заказ</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        Заказ №{order.id.substring(0, 6)} от {order.date} - {Number(order.total).toFixed(2)} сом
                      </option>
                    ))}
                  </select>
                </div>
                
                {orderDetails && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Информация о заказе</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-600">Номер заказа:</p>
                        <p className="font-medium">#{orderDetails.id.substring(0, 6)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Дата:</p>
                        <p className="font-medium">{orderDetails.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Статус:</p>
                        <p className="font-medium">
                          {orderDetails.status === 'pending' && 'Ожидает'}
                          {orderDetails.status === 'completed' && 'Завершен'}
                          {orderDetails.status === 'cancelled' && 'Отменен'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Сумма к оплате:</p>
                        <p className="font-medium text-green-600">{Number(orderDetails.total).toFixed(2)} сом</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Форма оплаты */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Форма оплаты</h2>
              </div>
              
              <form onSubmit={handlePayOrder} className="p-6">
                <div className="mb-4">
                  <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-2">
                    Способ оплаты
                  </label>
                  <select
                    id="paymentType"
                    name="paymentType"
                    value={paymentData.paymentType}
                    onChange={handlePaymentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="cash">Наличные</option>
                    <option value="card">Банковская карта</option>
                    <option value="transfer">Банковский перевод</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Сумма оплаты (сом)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handlePaymentChange}
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Дата оплаты
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={paymentData.date}
                    onChange={handlePaymentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Комментарий (необязательно)
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={paymentData.comment}
                    onChange={handlePaymentChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                    disabled={!selectedOrderId || paymentData.amount <= 0}
                  >
                    Оплатить
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">
              У вас нет неоплаченных заказов, ожидающих оплаты.
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                to="/customer/orders" 
                className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Все заказы
              </Link>
              <Link 
                to="/customer/order-details" 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                Создать заказ
              </Link>
            </div>
          </div>
        )}

        {/* Информация об оплате */}
        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Информация об оплате</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>• Для демонстрации работы системы условно считаем, что оплата происходит мгновенно.</p>
            <p>• После оплаты заказ переходит в статус "оплачен" и будет обработан.</p>
            <p>• Возможна полная оплата заказа за один раз.</p>
            <p>• При оплате банковской картой или переводом, укажите номер заказа в комментарии к платежу.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayOrders;