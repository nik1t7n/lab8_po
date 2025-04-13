import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const CancelOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedOrderId = queryParams.get('orderId');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    
    // Загрузка заказов пользователя (только ожидающие неоплаченные)
    loadCancellableOrders(user.customerId);
  };

  const loadCancellableOrders = (customerId) => {
    // Получаем заказы клиента
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const cancelableOrders = allOrders.filter(order => 
      order.customerId === customerId && 
      order.status === 'pending' && 
      !order.isPaid
    );
    
    // Сортировка заказов по дате (сначала новые)
    cancelableOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setOrders(cancelableOrders);
    setLoading(false);
  };

  const handleCancelOrder = (e) => {
    e.preventDefault();
    
    // Проверка выбора заказа
    if (!selectedOrderId) {
      setError('Выберите заказ для отмены');
      return;
    }
    
    // Проверка причины отмены
    let finalReason = cancelReason;
    if (cancelReason === 'other' && !customReason.trim()) {
      setError('Укажите причину отмены заказа');
      return;
    } else if (cancelReason === 'other') {
      finalReason = customReason.trim();
    }
    
    // Получаем все заказы
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Находим выбранный заказ
    const orderIndex = allOrders.findIndex(order => order.id === selectedOrderId);
    if (orderIndex === -1) {
      setError('Заказ не найден');
      return;
    }
    
    // Проверяем, что заказ можно отменить (статус pending и не оплачен)
    if (allOrders[orderIndex].status !== 'pending' || allOrders[orderIndex].isPaid) {
      setError('Данный заказ нельзя отменить. Возможно, он уже оплачен или обработан.');
      return;
    }
    
    // Обновляем статус заказа
    allOrders[orderIndex] = {
      ...allOrders[orderIndex],
      status: 'cancelled',
      cancelReason: finalReason,
      cancelDate: new Date().toISOString()
    };
    
    // Сохраняем изменения
    localStorage.setItem('orders', JSON.stringify(allOrders));
    
    // Создаем запись об отмененном заказе (для отчетов)
    const cancelledOrders = JSON.parse(localStorage.getItem('cancelledOrders') || '[]');
    const cancellationRecord = {
      id: Date.now().toString(),
      orderId: selectedOrderId,
      customerId: currentUser.customerId,
      reason: finalReason,
      date: new Date().toISOString(),
      orderTotal: allOrders[orderIndex].total
    };
    localStorage.setItem('cancelledOrders', JSON.stringify([...cancelledOrders, cancellationRecord]));
    
    // Показываем сообщение об успехе
    setSuccess('Заказ успешно отменен!');
    setError('');
    
    // Обновляем список заказов
    loadCancellableOrders(currentUser.customerId);
    
    // Сбрасываем форму
    setSelectedOrderId('');
    setCancelReason('');
    setCustomReason('');
    
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Отмена заказа</h1>
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
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Форма отмены заказа</h2>
            </div>
            
            <form onSubmit={handleCancelOrder} className="px-6 py-4">
              <div className="mb-4">
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите заказ для отмены
                </label>
                <select
                  id="order"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
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
              
              {selectedOrderId && (
                <>
                  <div className="mb-4">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                      Причина отмены
                    </label>
                    <select
                      id="reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Выберите причину</option>
                      <option value="changed_mind">Передумал(а)</option>
                      <option value="found_better_price">Нашел(ла) дешевле</option>
                      <option value="long_delivery">Долгая доставка</option>
                      <option value="wrong_product">Ошибка в выборе товара</option>
                      <option value="other">Другое (укажите причину)</option>
                    </select>
                  </div>
                  
                  {cancelReason === 'other' && (
                    <div className="mb-4">
                      <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                        Укажите причину
                      </label>
                      <textarea
                        id="customReason"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  )}
                </>
              )}
              
              <div className="flex items-center justify-between mt-6">
                <Link
                  to="/customer/orders"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Вернуться к заказам
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                  disabled={!selectedOrderId || (cancelReason === 'other' && !customReason.trim())}
                >
                  Отменить заказ
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">
              У вас нет заказов, доступных для отмены. Отменить можно только неоплаченные заказы в статусе "Ожидает".
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

        {/* Информация для клиента */}
        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Важная информация</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>• Отменить можно только неоплаченные заказы в статусе "Ожидает".</p>
            <p>• После отмены заказ нельзя будет восстановить.</p>
            <p>• Если вы хотите изменить заказ, лучше создать новый.</p>
            <p>• Если возникли вопросы, обратитесь в службу поддержки.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelOrder;