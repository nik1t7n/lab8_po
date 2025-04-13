import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const OrderDetails = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 1, price: 0, discountedPrice: 0 }]);
  const [loading, setLoading] = useState(true);
  const [customerDiscount, setCustomerDiscount] = useState(0);
  const [activePromotion, setActivePromotion] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
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
  }, [navigate]);

  const loadInitialData = (user) => {
    setLoading(true);
    
    // Загрузка товаров
    const productsData = JSON.parse(localStorage.getItem('products') || '[]');
    setProducts(productsData);
    
    // Загрузка данных о клиенте
    loadCustomerData(user);
    
    // Загрузка активных акций
    loadActivePromotions();
    
    setLoading(false);
  };

  const loadCustomerData = (user) => {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    
    // Если нет данных о клиентах, создаем демо-данные
    if (customers.length === 0) {
      const demoCustomers = [
        { id: '1', name: 'Иванов Иван', phone: '+111222333', email: 'ivanov@example.com', discount: 5 },
        { id: '2', name: 'Петрова Мария', phone: '+444555666', email: 'petrova@example.com', discount: 10 },
        { id: '3', name: 'Сидоров Алексей', phone: '+777888999', email: 'sidorov@example.com', discount: 0 }
      ];
      localStorage.setItem('customers', JSON.stringify(demoCustomers));
      
      // Присваиваем текущему пользователю customerID если его нет
      if (!user.customerId) {
        user.customerId = '1';
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
      }
      
      // Находим данные о клиенте
      const customer = demoCustomers.find(c => c.id === user.customerId);
      if (customer) {
        setCustomerDiscount(customer.discount || 0);
      }
    } else {
      // Если пользователю не назначен клиент, назначаем
      if (!user.customerId && customers.length > 0) {
        user.customerId = customers[0].id;
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
      }
      
      // Находим данные о клиенте
      const customer = customers.find(c => c.id === user.customerId);
      if (customer) {
        setCustomerDiscount(customer.discount || 0);
      }
    }
  };

  const loadActivePromotions = () => {
    const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    
    // Если нет данных о акциях, создаем демо-данные
    if (promotions.length === 0) {
      const demoPromotions = [
        { 
          id: '1', 
          name: 'Летняя распродажа', 
          discount: 15, 
          startDate: '2023-06-01', 
          endDate: '2025-08-31' 
        },
        { 
          id: '2', 
          name: 'Черная пятница', 
          discount: 30, 
          startDate: '2023-11-24', 
          endDate: '2025-11-27' 
        },
        { 
          id: '3', 
          name: 'Новогодние скидки', 
          discount: 20, 
          startDate: '2023-12-15', 
          endDate: '2025-12-31' 
        }
      ];
      localStorage.setItem('promotions', JSON.stringify(demoPromotions));
      
      // Проверяем активные акции
      const currentDate = new Date();
      const active = demoPromotions.find(promo => {
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);
        return currentDate >= startDate && currentDate <= endDate;
      });
      
      if (active) {
        setActivePromotion(active);
      }
    } else {
      // Проверяем активные акции
      const currentDate = new Date();
      const active = promotions.find(promo => {
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);
        return currentDate >= startDate && currentDate <= endDate;
      });
      
      if (active) {
        setActivePromotion(active);
      }
    }
  };

  // Расчет скидки для товара
  const calculateDiscount = (price) => {
    // Применяем максимальную скидку (из персональной скидки или акции)
    let maxDiscount = customerDiscount;
    
    if (activePromotion && activePromotion.discount > maxDiscount) {
      maxDiscount = activePromotion.discount;
    }
    
    const discountAmount = price * (maxDiscount / 100);
    return price - discountAmount;
  };

  // Обработчик изменения товара в заказе
  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    
    if (field === 'productId') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        const discountedPrice = calculateDiscount(selectedProduct.salePrice);
        newItems[index] = { 
          ...newItems[index], 
          productId: value,
          price: selectedProduct.salePrice,
          discountedPrice: discountedPrice
        };
      } else {
        newItems[index] = { 
          ...newItems[index], 
          productId: value,
          price: 0,
          discountedPrice: 0
        };
      }
    } else if (field === 'quantity') {
      newItems[index].quantity = Math.max(1, parseInt(value) || 1);
    }
    
    setOrderItems(newItems);
    calculateTotal(newItems);
  };

  // Добавление нового товара в заказ
  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, price: 0, discountedPrice: 0 }]);
  };

  // Удаление товара из заказа
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
      return sum + (item.discountedPrice * item.quantity);
    }, 0);
    
    setTotalAmount(total);
  };

  // Создание заказа
  const createOrder = () => {
    // Проверка наличия товаров
    if (orderItems.length === 0 || orderItems.some(item => !item.productId)) {
      setError('Пожалуйста, выберите товары для заказа');
      return;
    }
    
    // Проверка на демонстрацию заказа (минимум 5 разных товаров)
    const uniqueProducts = new Set(orderItems.map(item => item.productId).filter(id => id));
    if (uniqueProducts.size < 5) {
      setError('Для демонстрации требуется выбрать минимум 5 разных товаров');
      return;
    }
    
    // Генерация ID заказа
    const orderId = Date.now().toString();
    
    // Создание объекта заказа
    const newOrder = {
      id: orderId,
      customerId: currentUser.customerId,
      date: new Date().toISOString().split('T')[0],
      total: totalAmount,
      status: 'pending',
      paymentType: 'cash', // По умолчанию
      isPaid: false,
      createdAt: new Date().toISOString()
    };
    
    // Создание позиций заказа
    const newOrderItems = orderItems
      .filter(item => item.productId) // Убираем пустые позиции
      .map(item => ({
        id: Date.now() + Math.random().toString().substring(2, 8),
        orderId: orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.discountedPrice // Сохраняем цену со скидкой
      }));
    
    // Сохраняем в localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    localStorage.setItem('orders', JSON.stringify([...orders, newOrder]));
    
    const existingOrderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    localStorage.setItem('orderItems', JSON.stringify([...existingOrderItems, ...newOrderItems]));
    
    // Показываем сообщение об успехе
    setSuccess('Заказ успешно создан! Теперь вы можете перейти к его оплате.');
    setError('');
    
    // Сбрасываем форму
    setOrderItems([{ productId: '', quantity: 1, price: 0, discountedPrice: 0 }]);
    setTotalAmount(0);
    
    // Перенаправляем на страницу оплаты заказа через 2 секунды
    setTimeout(() => {
      navigate(`/customer/pay-orders`);
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Оформление заказа</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Информация о скидках */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Информация о скидках</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ваша персональная скидка:</p>
              <p className="font-medium">{customerDiscount}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Активная акция:</p>
              {activePromotion ? (
                <p className="font-medium">{activePromotion.name} ({activePromotion.discount}%)</p>
              ) : (
                <p className="font-medium text-gray-500">Нет активных акций</p>
              )}
            </div>
          </div>
        </div>

        {/* Сообщения об ошибках и успехе */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Форма заказа */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Состав заказа</h2>
          </div>
          
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left pb-3 text-sm font-medium text-gray-500">№ строки</th>
                  <th className="text-left pb-3 text-sm font-medium text-gray-500">Товар</th>
                  <th className="text-right pb-3 text-sm font-medium text-gray-500">Цена со скидкой</th>
                  <th className="text-right pb-3 text-sm font-medium text-gray-500">Количество</th>
                  <th className="text-right pb-3 text-sm font-medium text-gray-500">Стоимость</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  const itemTotal = item.discountedPrice * item.quantity;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="py-4">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Выберите товар</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {product.category}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-medium text-green-600">
                          {item.discountedPrice.toFixed(2)} сом
                        </span>
                      </td>
                      <td className="py-4">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-16 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right"
                        />
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-medium">
                          {itemTotal.toFixed(2)} сом
                        </span>
                      </td>
                      <td className="py-4 text-right">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <button
              type="button"
              onClick={addOrderItem}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Добавить товар
            </button>
            
            <div className="mt-8 border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Итого к оплате:</span>
                <span className="text-lg font-bold">{totalAmount.toFixed(2)} сом</span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={createOrder}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                Оформить заказ
              </button>
            </div>
          </div>
        </div>

        {/* Пояснения клиенту */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Как оформить заказ</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Выберите товары из выпадающего списка</li>
            <li>Укажите количество для каждого товара</li>
            <li>При необходимости добавьте дополнительные товары</li>
            <li>Нажмите "Оформить заказ" для создания заказа</li>
            <li>После оформления заказа, вы можете перейти к его оплате</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            Примечание: В вашем заказе автоматически учитываются персональные скидки и действующие акции.
            Для демонстрации необходимо выбрать минимум 5 разных товаров.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;