import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const BreakevenPoint = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [breakevenData, setBreakevenData] = useState([]);
  const [fixedCosts, setFixedCosts] = useState(50000); // Примерные фиксированные затраты в месяц
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Проверка авторизации
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // Проверка роли (только Accountant и Admin могут видеть этот отчет)
    if (user.role !== 'Accountant' && user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadBreakevenData();
  }, [navigate, fixedCosts, selectedCategory]);

  const loadBreakevenData = () => {
    setLoading(true);
    
    // Получаем данные о товарах
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Получаем уникальные категории
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    setCategories(uniqueCategories);
    
    // Фильтрация по категории если выбрана
    const filteredProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    // Получаем данные о продажах
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    
    // Получаем данные о поставках для расчета себестоимости
    const supplies = JSON.parse(localStorage.getItem('supplies') || '[]');
    
    // Расчет средней себестоимости товаров
    const averageCosts = {};
    supplies.forEach(supply => {
      supply.items.forEach(item => {
        if (!averageCosts[item.productId]) {
          averageCosts[item.productId] = { totalCost: 0, quantity: 0 };
        }
        averageCosts[item.productId].totalCost += Number(item.price) * Number(item.quantity);
        averageCosts[item.productId].quantity += Number(item.quantity);
      });
    });
    
    // Расчет объемов продаж для товаров
    const salesVolume = {};
    orders.forEach(order => {
      const items = orderItems.filter(item => item.orderId === order.id);
      items.forEach(item => {
        if (!salesVolume[item.productId]) {
          salesVolume[item.productId] = { revenue: 0, quantity: 0 };
        }
        salesVolume[item.productId].revenue += Number(item.price) * Number(item.quantity);
        salesVolume[item.productId].quantity += Number(item.quantity);
      });
    });
    
    // Расчет точки безубыточности для каждого товара
    const breakevenResults = filteredProducts.map(product => {
      // Средняя закупочная цена (себестоимость)
      const costData = averageCosts[product.id] || { totalCost: 0, quantity: 0 };
      const purchasePrice = costData.quantity > 0 
        ? costData.totalCost / costData.quantity 
        : product.purchasePrice || 0;
      
      // Средняя продажная цена
      const salesData = salesVolume[product.id] || { revenue: 0, quantity: 0 };
      const salePrice = salesData.quantity > 0 
        ? salesData.revenue / salesData.quantity 
        : product.salePrice || 0;
      
      // Маржинальная прибыль на единицу
      const unitMargin = salePrice - purchasePrice;
      
      // Доля товара в общем ассортименте (для распределения фиксированных затрат)
      const productShare = 1 / filteredProducts.length;
      
      // Фиксированные затраты на данный товар
      const productFixedCosts = fixedCosts * productShare;
      
      // Точка безубыточности в единицах (если маржа > 0)
      const breakevenUnits = unitMargin > 0 
        ? Math.ceil(productFixedCosts / unitMargin) 
        : Infinity;
      
      // Точка безубыточности в деньгах
      const breakevenRevenue = breakevenUnits * salePrice;
      
      // Текущая прибыль
      const profit = salesData.revenue - (salesData.quantity * purchasePrice) - productFixedCosts;
      
      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        purchasePrice: purchasePrice,
        salePrice: salePrice,
        unitMargin: unitMargin,
        currentSales: salesData.quantity,
        breakevenUnits: breakevenUnits,
        breakevenRevenue: breakevenRevenue,
        currentProfit: profit,
        isProfitable: salesData.quantity >= breakevenUnits
      };
    });
    
    setBreakevenData(breakevenResults);
    setLoading(false);
  };

  const handleFixedCostsChange = (e) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setFixedCosts(value);
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
          <h1 className="text-2xl font-bold text-gray-900">Точка безубыточного продажи</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Параметры расчета */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="fixedCosts" className="block text-sm font-medium text-gray-700 mb-1">
                Фиксированные затраты в месяц (сом)
              </label>
              <input
                type="number"
                id="fixedCosts"
                value={fixedCosts}
                onChange={handleFixedCostsChange}
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Категория товаров
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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
            <div className="flex items-end">
              <button
                onClick={loadBreakevenData}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Рассчитать
              </button>
            </div>
          </div>
        </div>

        {/* Пояснение к отчету */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">О точке безубыточности</h2>
          <p className="text-sm text-gray-600 mb-2">
            Точка безубыточности — это объём производства и реализации продукции, при котором расходы будут компенсированы доходами, 
            а при производстве и реализации каждой последующей единицы продукции предприятие начинает получать прибыль.
          </p>
          <p className="text-sm text-gray-600">
            Расчёт точки безубыточности показывает минимальное количество товара, которое необходимо продать, 
            чтобы покрыть все затраты и начать получать прибыль.
          </p>
        </div>

        {/* Таблица с данными */}
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
                    Цена покупки
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена продажи
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Маржа
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Продано (шт)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Точка безубыточности (шт)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Точка безубыточности (сом)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breakevenData.length > 0 ? (
                  breakevenData.map((item, index) => (
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
                        {item.purchasePrice.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.salePrice.toFixed(2)} сом
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.unitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.unitMargin.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.currentSales}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.breakevenUnits === Infinity ? '∞' : item.breakevenUnits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.breakevenUnits === Infinity ? '∞' : item.breakevenRevenue.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.unitMargin <= 0 ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Нерентабельно
                          </span>
                        ) : item.isProfitable ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Прибыльно
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Убыточно
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                      Нет данных для расчета
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakevenPoint;