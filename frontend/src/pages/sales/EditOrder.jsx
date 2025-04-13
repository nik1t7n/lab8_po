import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const EditOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [initialOrderItems, setInitialOrderItems] = useState([]);
  const [orderData, setOrderData] = useState({
    customerId: '',
    date: '',
    status: 'pending',
    paymentType: 'cash',
    isPaid: false,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, [navigate, orderId]);

  const loadInitialData = async () => {
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
      setCustomers(demoCustomers);
    } else {
      setCustomers(customersData);
    }
    
    // Загрузка товаров
    const productsData = JSON.parse(localStorage.getItem('products') || '[]');
    setProducts(productsData);
    
    // Загрузка заказа по ID
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const foundOrder = orders.find(o => o.id === orderId);
    
    if (!foundOrder) {
      setError('Заказ не найден');
      setLoading(false);
      return;
    }
    
    // Загрузка платежей по заказу
    const payments = JSON.parse(localStorage.getItem('orderPayments') || '[]');
    const orderPayments = payments.filter(payment => payment.orderId === orderId);
    const totalPaid = orderPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    
    // Проверяем, если заказ уже частично оплачен, то ограничиваем возможность изменения
    const isPartiallyPaid = totalPaid > 0 && totalPaid < foundOrder.total;
    
    // Загрузка позиций заказа
    const allOrderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    const orderItemsData = allOrderItems.filter(item => item.orderId === orderId);
    
    // Установка данных заказа
    setOrderData({
      customerId: foundOrder.customerId,
      date: foundOrder.date,
      status: foundOrder.status,
      paymentType: foundOrder.paymentType,
      isPaid: foundOrder.isPaid,
      total: foundOrder.total
    });
    
    // Установка позиций заказа
    setOrderItems(orderItemsData.map(item => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      price: Number(item.price)
    })));
    
    // Сохраняем исходные позиции заказа для отслеживания изменений
    setInitialOrderItems(JSON.parse(JSON.stringify(orderItemsData)));
    
    setLoading(false);
  };

  // Обработчик изменения основных данных заказа
  const handleOrderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrderData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Обработчик изменения позиции заказа
  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    
    if (field === 'productId') {
      const selectedProduct = products.find(p => p.id === value);
      newItems[index] = { 
        ...newItems[index], 
        productId: value,
        price: selectedProduct ? selectedProduct.salePrice : 0
      };
    } else {
      newItems[index][field] = value;
    }
    
    setOrderItems(newItems);
    calculateTotal(newItems);
  };

  // Добавление новой позиции в заказ
  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, price: 0 }]);
  };

  // Удаление позиции из заказа
  const removeOrderItem = (index) => {
    if (orderItems.length > 1) {
      const newItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(newItems);
      calculateTotal(newItems);
    }
  };

  // Расчет общей суммы заказа
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity));
    }, 0);
    
    setOrderData(prev => ({ ...prev, total }));
  };

  // Сохранение изменений заказа
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Проверка на валидность данных
    if (orderItems.some(item => !item.productId)) {
      setError('Выберите товар для каждой позиции');
      return;
    }
    
    // Обновление данных заказа
    const updatedOrder = {
      id: orderId,
      ...orderData,
      employeeId: currentUser.id,
      updatedAt: new Date().toISOString()
    };
    
    // Обновление заказа в localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    // Обновление позиций заказа
    const allOrderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    const otherOrderItems = allOrderItems.filter(item => item.orderId !== orderId);
    
    const newOrderItems = orderItems.map(item => ({
      id: Date.now() + Math.random().toString().substring(2, 8),
      orderId: orderId,
      productId: item.productId,
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));
    
    localStorage.setItem('orderItems', JSON.stringify([...otherOrderItems, ...newOrderItems]));
    
    // Если заказ отмечен как оплаченный, но раньше не был оплачен
    if (updatedOrder.isPaid && !orders.find(o => o.id === orderId).isPaid) {
      registerPayment(updatedOrder);
    }
    
    // Перенаправление на страницу заказов
    navigate('/sales/orders');
    
    // Показываем уведомление об успехе
    alert('Заказ успешно обновлен!');
  };

  // Регистрация оплаты заказа
  const registerPayment = (order) => {
    const payments = JSON.parse(localStorage.getItem('orderPayments') || '[]');
    
    const payment = {
      id: Date.now().toString(),
      orderId: order.id,
      amount: order.total,
      date: new Date().toISOString().split('T')[0],
      paymentType: order.paymentType,
      employeeId: currentUser.id
    };
    
    localStorage.setItem('orderPayments', JSON.stringify([...payments, payment]));
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

  // Если есть ошибка, которая не позволяет редактировать
  if (error && error.includes('Заказ не найден')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Редактирование заказа</h1>
            
            <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-700">
              {error}
            </div>
            
            <div className="flex justify-center">
              <Link
                to="/sales/orders"
                className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Вернуться к списку заказов
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Редактирование заказа</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                  Клиент
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  required
                  value={orderData.customerId}
                  onChange={handleOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите клиента</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Дата заказа
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={orderData.date}
                  onChange={handleOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Статус заказа
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={orderData.status}
                  onChange={handleOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Ожидает</option>
                  <option value="completed">Завершен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип оплаты
                </label>
                <select
                  id="paymentType"
                  name="paymentType"
                  required
                  value={orderData.paymentType}
                  onChange={handleOrderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cash">Наличные</option>
                  <option value="card">Банковская карта</option>
                  <option value="transfer">Банковский перевод</option>
                </select>
              </div>
            </div>
            
            {/* Позиции заказа */}
            <div className="mt-8 mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Товары в заказе</h2>
              
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-center">
                  <div className="col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Выберите товар</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.category} ({product.salePrice} сом)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Кол-во"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Цена"
                    />
                  </div>
                  
                  <div className="col-span-2 text-right">
                    {(Number(item.price) * Number(item.quantity)).toFixed(2)} сом
                  </div>
                  
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={orderItems.length === 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addOrderItem}
                className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Добавить товар
              </button>
            </div>
            
            {/* Итоговая сумма */}
            <div className="mt-8 border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Итого:</span>
                <span>{Number(orderData.total).toFixed(2)} сом</span>
              </div>
              
              <div className="mt-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={orderData.isPaid}
                    onChange={handleOrderChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Отметить как оплаченный</span>
                </label>
              </div>
            </div>
            
            {/* Кнопки действий */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/sales/orders')}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Отмена
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Сохранить изменения
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditOrder;