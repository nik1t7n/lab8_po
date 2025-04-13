import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const WarehouseProducts = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [warehouses, setWarehouses] = useState({});
  const [products, setProducts] = useState({});
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');

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
    if (user.role !== 'Supplies Manager' && user.role !== 'Admin' && user.role !== 'Sales Manager' && user.role !== 'Accountant') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadInitialData();
  }, [navigate]);

  const loadInitialData = () => {
    setLoading(true);
    
    // Загрузка складов
    const warehousesData = JSON.parse(localStorage.getItem('warehouses') || '[]');
    const warehousesMap = {};
    warehousesData.forEach(warehouse => {
      warehousesMap[warehouse.id] = warehouse;
    });
    setWarehouses(warehousesMap);
    
    // Загрузка товаров
    const productsData = JSON.parse(localStorage.getItem('products') || '[]');
    const productsMap = {};
    productsData.forEach(product => {
      productsMap[product.id] = product;
    });
    setProducts(productsMap);
    
    // Загрузка данных о наличии товаров на складах
    const stockData = JSON.parse(localStorage.getItem('warehouseStock') || '[]');
    
    // Агрегируем количество товаров по productId и warehouseId
    const aggregatedStock = [];
    const stockMap = {};
    
    stockData.forEach(item => {
      const key = `${item.warehouseId}_${item.productId}`;
      if (!stockMap[key]) {
        stockMap[key] = {
          warehouseId: item.warehouseId,
          productId: item.productId,
          quantity: 0,
          price: item.price,
          supplyIds: new Set()
        };
      }
      stockMap[key].quantity += Number(item.quantity);
      stockMap[key].supplyIds.add(item.supplyId);
    });
    
    Object.values(stockMap).forEach(item => {
      aggregatedStock.push({
        warehouseId: item.warehouseId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        supplyCount: item.supplyIds.size
      });
    });
    
    setWarehouseStock(aggregatedStock);
    setLoading(false);
  };

  // Фильтрация товаров по выбранному складу
  const filteredStock = selectedWarehouse === 'all'
    ? warehouseStock
    : warehouseStock.filter(item => item.warehouseId === selectedWarehouse);

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
          <h1 className="text-2xl font-bold text-gray-900">Список товаров на складе</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтр выбора склада */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <label htmlFor="warehouse-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Выберите склад
          </label>
          <select
            id="warehouse-filter"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все склады</option>
            {Object.values(warehouses).map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.location})
              </option>
            ))}
          </select>
        </div>

        {/* Таблица товаров */}
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
                  Количество
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Склад
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Поставок
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStock.length > 0 ? (
                filteredStock.map((item, index) => {
                  const product = products[item.productId];
                  const warehouse = warehouses[item.warehouseId];
                  
                  if (!product || !warehouse) return null;
                  
                  return (
                    <tr key={`${item.warehouseId}_${item.productId}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(item.price).toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {warehouse.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.supplyCount}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Нет товаров на складе
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WarehouseProducts;