import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ProductsSales = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [totals, setTotals] = useState({
    totalQuantity: 0,
    totalRevenue: 0
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
    loadInitialData(user); // Передаем пользователя в функцию
  }, [navigate]);

  const loadInitialData = (user) => {
    setLoading(true);
    
    // Загрузка товаров
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Получаем уникальные категории
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    setCategories(uniqueCategories);
    
    // Загрузка данных о продажах
    loadSalesData(user); // Передаем пользователя в функцию
  };

  const loadSalesData = (user) => {
    // Используем переданного пользователя вместо currentUser из состояния
    const currentUserData = user || currentUser;

    // Получаем данные о заказах
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Проверяем, есть ли данные о заказах и позициях
    if (orders.length === 0 || orderItems.length === 0) {
      // Если нет данных, создаем демо-заказ с 5 товарами
      createDemoData(currentUserData); // Передаем пользователя
      return;
    }
    
    // Фильтруем заказы по дате
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    // Получаем ID отфильтрованных заказов
    const filteredOrderIds = filteredOrders.map(order => order.id);
    
    // Группируем данные о продажах по товарам
    const productSales = {};
    
    filteredOrderIds.forEach(orderId => {
      const items = orderItems.filter(item => item.orderId === orderId);
      items.forEach(item => {
        if (!productSales[item.productId]) {
          const product = products.find(p => p.id === item.productId);
          
          if (product) {
            productSales[item.productId] = {
              productId: item.productId,
              productName: product.name,
              category: product.category,
              price: Number(item.price),
              quantity: 0,
              revenue: 0
            };
          }
        }
        
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += Number(item.quantity);
          productSales[item.productId].revenue += Number(item.price) * Number(item.quantity);
        }
      });
    });
    
    // Преобразуем в массив и фильтруем по категории если выбрана
    let salesArray = Object.values(productSales);
    
    if (selectedCategory !== 'all') {
      salesArray = salesArray.filter(item => item.category === selectedCategory);
    }
    
    // Расчет итогов
    const totalQuantity = salesArray.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = salesArray.reduce((sum, item) => sum + item.revenue, 0);
    
    setSalesData(salesArray);
    setTotals({
      totalQuantity,
      totalRevenue
    });
    setLoading(false);
  };

  const createDemoData = (user) => {
    // Проверяем, есть ли пользователь
    if (!user) {
      console.error("Пользователь не определен");
      setLoading(false);
      return;
    }

    // Получаем товары
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    if (products.length === 0) {
      setLoading(false);
      return;
    }
    
    // Создаем демо-заказ
    const demoOrderId = Date.now().toString();
    const demoOrder = {
      id: demoOrderId,
      customerId: '1', // Предполагаем, что клиент с ID 1 существует
      date: new Date().toISOString().split('T')[0],
      total: 0,
      status: 'completed',
      paymentType: 'cash',
      isPaid: true,
      employeeId: user.id, // Используем ID переданного пользователя
      createdAt: new Date().toISOString()
    };
    
    // Берем 5 первых товаров для заказа или все, если их меньше 5
    const orderProducts = products.slice(0, Math.min(5, products.length));
    
    // Создаем позиции заказа
    const orderItems = orderProducts.map(product => ({
      id: Date.now() + Math.random().toString().substring(2, 8),
      orderId: demoOrderId,
      productId: product.id,
      quantity: 1,
      price: product.salePrice
    }));
    
    // Рассчитываем общую сумму заказа
    const orderTotal = orderItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    demoOrder.total = orderTotal;
    
    // Сохраняем в localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    localStorage.setItem('orders', JSON.stringify([...orders, demoOrder]));
    
    const existingOrderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    localStorage.setItem('orderItems', JSON.stringify([...existingOrderItems, ...orderItems]));
    
    // Создаем платеж для заказа
    const payment = {
      id: Date.now().toString(),
      orderId: demoOrderId,
      amount: orderTotal,
      date: new Date().toISOString().split('T')[0],
      paymentType: 'cash',
      employeeId: user.id // Используем ID переданного пользователя
    };
    
    const payments = JSON.parse(localStorage.getItem('orderPayments') || '[]');
    localStorage.setItem('orderPayments', JSON.stringify([...payments, payment]));
    
    // Обновляем демо-клиентов если их нет
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    if (customers.length === 0) {
      const demoCustomers = [
        { id: '1', name: 'Иванов Иван', phone: '+111222333', email: 'ivanov@example.com' },
        { id: '2', name: 'Петрова Мария', phone: '+444555666', email: 'petrova@example.com' },
        { id: '3', name: 'Сидоров Алексей', phone: '+777888999', email: 'sidorov@example.com' }
      ];
      localStorage.setItem('customers', JSON.stringify(demoCustomers));
    }
    
    // Загружаем данные о продажах снова
    loadSalesData(user);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const applyFilters = () => {
    loadSalesData(currentUser);
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
          <h1 className="text-2xl font-bold text-gray-900">Продажи по товарам</h1>
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
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Категория товаров
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все категории</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Общие данные за период</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Общее количество</p>
                <p className="text-xl font-bold">{totals.totalQuantity} шт.</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Общая выручка</p>
                <p className="text-xl font-bold">{totals.totalRevenue.toFixed(2)} сом</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Товары в отчете</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Всего товаров</p>
                <p className="text-xl font-bold">{salesData.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Категория</p>
                <p className="text-xl font-bold">{selectedCategory === 'all' ? 'Все' : selectedCategory}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Таблица продаж по товарам */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.length > 0 ? (
                salesData.map((item, index) => (
                  <tr key={item.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.revenue.toFixed(2)} сом
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {totals.totalRevenue.toFixed(2)} сом
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsSales;