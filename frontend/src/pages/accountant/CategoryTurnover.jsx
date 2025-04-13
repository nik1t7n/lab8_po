import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CategoryTurnover = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [turnoverData, setTurnoverData] = useState([]);
  const [totalValues, setTotalValues] = useState({
    totalSupply: 0,
    totalSales: 0,
    totalRemaining: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalTaxes: 0,
    totalNetProfit: 0
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
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
    
    // Загрузка категорий товаров
    loadCategories();
    
    // Загрузка данных о товарообороте
    loadTurnoverData();
  }, [navigate, selectedCategory, dateRange]);

  const loadCategories = () => {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    setCategories(uniqueCategories);
  };

  const loadTurnoverData = () => {
    setLoading(true);
    
    // Получаем данные о товарах
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Фильтруем по категории если выбрана
    const filteredProducts = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    // Получаем данные о поставках
    const supplies = JSON.parse(localStorage.getItem('supplies') || '[]');
    const warehouseStock = JSON.parse(localStorage.getItem('warehouseStock') || '[]');
    
    // Получаем данные о продажах
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    
    // Фильтруем по дате
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
    
    const filteredSupplies = supplies.filter(supply => {
      const supplyDate = new Date(supply.date);
      return supplyDate >= startDate && supplyDate <= endDate;
    });
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    // Получаем ID отфильтрованных заказов
    const filteredOrderIds = filteredOrders.map(order => order.id);
    
    // Группируем данные о поставках по товарам
    const productSupplies = {};
    filteredSupplies.forEach(supply => {
      supply.items.forEach(item => {
        if (!productSupplies[item.productId]) {
          productSupplies[item.productId] = {
            quantity: 0,
            cost: 0
          };
        }
        productSupplies[item.productId].quantity += Number(item.quantity);
        productSupplies[item.productId].cost += Number(item.quantity) * Number(item.price);
      });
    });
    
    // Группируем данные о продажах по товарам
    const productSales = {};
    filteredOrderIds.forEach(orderId => {
      const items = orderItems.filter(item => item.orderId === orderId);
      items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += Number(item.quantity);
        productSales[item.productId].revenue += Number(item.price) * Number(item.quantity);
      });
    });
    
    // Расчет остатков товаров
    const productStock = {};
    warehouseStock.forEach(item => {
      if (!productStock[item.productId]) {
        productStock[item.productId] = 0;
      }
      productStock[item.productId] += Number(item.quantity);
    });
    
    // Формируем данные для отчета
    const turnoverResults = filteredProducts.map(product => {
      const supply = productSupplies[product.id] || { quantity: 0, cost: 0 };
      const sale = productSales[product.id] || { quantity: 0, revenue: 0 };
      const stock = productStock[product.id] || 0;
      
      // Средняя закупочная цена
      const avgPurchasePrice = supply.quantity > 0 
        ? supply.cost / supply.quantity 
        : product.purchasePrice || 0;
      
      // Расчет прибыли
      const profit = sale.revenue - (sale.quantity * avgPurchasePrice);
      
      // Налог (допустим 10%)
      const taxRate = 0.1;
      const taxes = profit > 0 ? profit * taxRate : 0;
      
      // Чистая прибыль
      const netProfit = profit - taxes;
      
      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        supplyQuantity: supply.quantity,
        salesQuantity: sale.quantity,
        remaining: stock,
        revenue: sale.revenue,
        profit: profit,
        taxes: taxes,
        netProfit: netProfit
      };
    });
    
    // Расчет итоговых значений
    const totals = turnoverResults.reduce((acc, item) => {
      return {
        totalSupply: acc.totalSupply + item.supplyQuantity,
        totalSales: acc.totalSales + item.salesQuantity,
        totalRemaining: acc.totalRemaining + item.remaining,
        totalRevenue: acc.totalRevenue + item.revenue,
        totalProfit: acc.totalProfit + item.profit,
        totalTaxes: acc.totalTaxes + item.taxes,
        totalNetProfit: acc.totalNetProfit + item.netProfit
      };
    }, {
      totalSupply: 0,
      totalSales: 0,
      totalRemaining: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalTaxes: 0,
      totalNetProfit: 0
    });
    
    setTurnoverData(turnoverResults);
    setTotalValues(totals);
    setLoading(false);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
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
          <h1 className="text-2xl font-bold text-gray-900">Товарооборот по категории товаров</h1>
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
                onClick={loadTurnoverData}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Применить фильтр
              </button>
            </div>
          </div>
        </div>

        {/* Информационная панель с итогами */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Итоговые показатели</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Общий объем поставок</p>
              <p className="text-xl font-bold">{totalValues.totalSupply} шт.</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Общий объем продаж</p>
              <p className="text-xl font-bold">{totalValues.totalSales} шт.</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Общая выручка</p>
              <p className="text-xl font-bold">{totalValues.totalRevenue.toFixed(2)} сом</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Чистая прибыль</p>
              <p className="text-xl font-bold">{totalValues.totalNetProfit.toFixed(2)} сом</p>
            </div>
          </div>
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
                    Кол-во поставки
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Кол-во продаж
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Остаток
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Выручка
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Прибыль/убыток
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Налоги
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Чистая прибыль
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {turnoverData.length > 0 ? (
                  turnoverData.map((item, index) => (
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
                        {item.supplyQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.salesQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.remaining}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.revenue.toFixed(2)} сом
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profit.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.taxes.toFixed(2)} сом
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.netProfit.toFixed(2)} сом
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                      Нет данных за выбранный период
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ИТОГО:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {totalValues.totalSupply}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {totalValues.totalSales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {totalValues.totalRemaining}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {totalValues.totalRevenue.toFixed(2)} сом
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${totalValues.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalValues.totalProfit.toFixed(2)} сом
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {totalValues.totalTaxes.toFixed(2)} сом
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${totalValues.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalValues.totalNetProfit.toFixed(2)} сом
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

export default CategoryTurnover;